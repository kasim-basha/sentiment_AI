import { db } from "../database";
import { hashPassword, comparePassword } from "../auth/password";
import { generateToken, verifyToken } from "../auth/token";
import { validators, ValidationError } from "../validators";

export async function runBackendVerificationTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`✅ [PASS] ${testName}`);
    } else {
      failed++;
      results.push(`❌ [FAIL] ${testName}`);
      console.error(`Assertion failed for: ${testName}`);
    }
  }

  console.log("[Backend Tests] Running SentimentAI Backend Test Suite...");

  try {
    // 1. Password Hashing & Bcrypt Verification
    const rawPass = "superSecret123";
    const hashed = await hashPassword(rawPass);
    assert(hashed !== rawPass, "Password is never stored in plain text");
    assert(hashed.startsWith("$2"), "Password is encrypted using bcrypt");
    const validMatch = await comparePassword(rawPass, hashed);
    assert(validMatch, "Bcrypt verifies valid password successfully");
    const invalidMatch = await comparePassword("wrongPassword", hashed);
    assert(!invalidMatch, "Bcrypt rejects incorrect password");

    // 2. JWT Token Generation & Verification
    const testUser = db.findUserByEmail("admin@sentimentai.com");
    assert(Boolean(testUser), "Development admin seed user exists");
    if (testUser) {
      const safe = db.toSafeUser(testUser);
      assert(!("passwordHash" in safe), "SafeUser strips passwordHash before transmission");
      const token = generateToken(safe);
      assert(typeof token === "string" && token.split(".").length === 3, "Generates valid 3-part JWT token");
      const verified = verifyToken(token);
      assert(verified?.userId === testUser.id, "JWT token verification decodes user ID accurately");
      assert(verified?.role === "admin", "JWT token preserves role correctly");
    }

    // 3. User Registration Validation
    let caughtValidation = false;
    try {
      validators.validateRegistration({ email: "not-an-email", password: "123" });
    } catch (e) {
      if (e instanceof ValidationError) {
        caughtValidation = true;
      }
    }
    assert(caughtValidation, "Validator rejects invalid email and short password");

    // 4. Database Seeding & Models Check
    const stats = db.getSystemStatistics();
    assert(stats.totalUsers >= 2, "Database contains seeded users");
    assert(stats.totalAnalyses >= 1, "Database contains seeded analyses");
    assert(stats.totalPosts >= 1, "Database contains seeded community posts");

    // 5. Analysis Creation & Ownership
    const testAnalysisId = "test_an_" + Date.now();
    const testSession = {
      analysisId: testAnalysisId,
      userId: "usr_dev_01",
      title: "Automated Backend Test Analysis",
      inputSummary: { textCount: 1, imageCount: 0, videoCount: 0, totalFiles: 0, hasDirectText: true },
      overallSentiment: { label: "Positive" as const, confidence: "High" as const, score: 0.95 },
      confidence: "High" as const,
      score: 0.95,
      emotions: {
        dominant: { name: "Joy", intensity: "High", reason: "Test reason" },
        secondary: []
      },
      meaning: "Test verification meaning",
      emotionalContext: "Test context",
      keyInsights: ["Insight 1"],
      positiveSignals: ["Signal 1"],
      concerns: [],
      voiceSummary: "Test voice summary",
      status: "completed" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.createAnalysisSession(testSession, [], {
      resultId: "res_test_01",
      analysisId: testAnalysisId,
      fullResultJson: { test: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const retrieved = db.getAnalysisSession(testAnalysisId);
    assert(Boolean(retrieved && retrieved.score === 0.95), "AnalysisSession created and indexed correctly");

    // 6. User-Owned Resource Isolation (IDOR Protection)
    const userAnalyses = db.listAnalysesByUser("usr_dev_01");
    assert(userAnalyses.records.some(r => r.analysisId === testAnalysisId), "User can see their own analysis");
    const otherUserAnalyses = db.listAnalysesByUser("usr_dev_02");
    assert(!otherUserAnalyses.records.some(r => r.analysisId === testAnalysisId), "Other user cannot see private analysis");

    // 7. Analysis Deletion & Cascade
    let deleteForbidden = false;
    try {
      db.deleteAnalysisSession(testAnalysisId, "usr_dev_02"); // wrong user
    } catch {
      deleteForbidden = true;
    }
    assert(deleteForbidden, "Unauthorized user cannot delete another user's analysis");

    const deleteSuccess = db.deleteAnalysisSession(testAnalysisId, "usr_dev_01");
    assert(deleteSuccess, "Author can delete their own analysis");
    assert(!db.getAnalysisSession(testAnalysisId), "Analysis session removed from database");

    // 8. Unique Likes Constraint
    const testPost = db.listPosts().posts[0];
    assert(Boolean(testPost), "Found community post for like testing");
    if (testPost) {
      const initialLiked = db.isPostLikedByUser(testPost.postId, "usr_test_liker");
      assert(!initialLiked, "Post initially not liked by test user");

      const like1 = db.toggleLike(testPost.postId, "usr_test_liker");
      assert(like1.liked === true, "First like toggles on");
      assert(db.isPostLikedByUser(testPost.postId, "usr_test_liker") === true, "Post is now liked");

      const like2 = db.toggleLike(testPost.postId, "usr_test_liker");
      assert(like2.liked === false, "Second like toggles off (no duplicate likes)");
      assert(db.isPostLikedByUser(testPost.postId, "usr_test_liker") === false, "Post like removed");
    }

    // 9. Community Visibility Rules
    const publicPosts = db.listPosts(undefined); // unauthenticated
    const hasOnlyPublic = publicPosts.posts.every(p => p.privacy === "public");
    assert(hasOnlyPublic, "Unauthenticated visitors can only view public community posts");

    // 10. Audit Log Integrity
    const auditLogs = db.listAuditLogs({ limit: 10 });
    assert(auditLogs.length > 0, "Audit logs recorded in system");
    const noPasswordLeaks = auditLogs.every(l => !l.metadata?.password && !l.metadata?.passwordHash && !l.metadata?.token);
    assert(noPasswordLeaks, "Audit logs never store passwords or tokens");

  } catch (err: any) {
    failed++;
    results.push(`❌ [FATAL EXCEPTION] ${err?.message || err}`);
  }

  console.log(`[Backend Tests Completed] Passed: ${passed}, Failed: ${failed}`);
  return { passed, failed, results };
}

// Auto-run when executed directly
if (process.argv[1] && process.argv[1].includes("backendTests")) {
  runBackendVerificationTests().then(res => {
    console.log(res.results.join("\n"));
  });
}
