import fs from "fs";
import path from "path";
import { config } from "../config";
import {
  DatabaseSchema,
  UserTable,
  AnalysisSessionTable,
  AnalysisInputTable,
  AnalysisResultTable,
  ReportTable,
  VoiceSessionTable,
  UserSettingsTable,
  UserProfileTable,
  PostTable,
  CommentTable,
  LikeTable,
  CommunityReportTable,
  AuditLogTable,
  SafeUser,
  FriendRequestTable,
  FriendshipTable,
  ConversationTable,
  ConversationMemberTable,
  MessageTable,
  CallSessionTable,
  CallParticipantTable,
  NotificationTable,
  BlockTable,
  CallStatus,
  CallType,
  NotificationType,
  SearchHistoryTable,
  ClarityConversationTable,
  ClarityMessageTable,
  ClarityMessageReference,
  ClarityStructuredResponse,
  AIInsightSnapshotTable,
  AIInsightItem,
  AIRecommendationItem,
  GoalTable,
  GoalCategory,
  GoalMeasurementType,
  GoalStatus,
  GoalProgressCalculation,
  GoalWithProgress,
  GoalProgressHistoryTable,
  UserSessionTable
} from "./types";
import { runMigrations } from "./migrations";
import { getDevelopmentSeedData } from "./seed";

class Database {
  private schema: DatabaseSchema;
  private filePath: string;
  private isSaving: boolean = false;
  private pendingSave: boolean = false;

  // In-Memory Indexes
  private userEmailIndex: Map<string, string> = new Map(); // email.toLowerCase() -> userId
  private userIdIndex: Map<string, UserTable> = new Map();
  private sessionIndex: Map<string, AnalysisSessionTable> = new Map();
  private userSessionsIndex: Map<string, Set<string>> = new Map(); // userId -> Set<analysisId>
  private postIndex: Map<string, PostTable> = new Map();
  private likeUniqueIndex: Set<string> = new Set(); // `${postId}_${userId}`
  private friendshipUniqueIndex: Set<string> = new Set(); // `${userId}_${friendId}`
  private blockUniqueIndex: Set<string> = new Set(); // `${blockerId}_${blockedId}`
  private conversationIndex: Map<string, ConversationTable> = new Map();

  constructor() {
    this.filePath = config.dbFilePath;
    this.schema = this.loadDatabase();
    this.rebuildIndexes();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed: DatabaseSchema = JSON.parse(raw);
        console.log(`[Database] Loaded existing database from ${this.filePath} (v${parsed.version || 1})`);
        const migrated = runMigrations(parsed);
        this.saveImmediately(migrated);
        return migrated;
      }
    } catch (err) {
      console.error("[Database] Error loading database, initializing fresh seed:", err);
    }

    console.log("[Database] Initializing new database with development seed data...");
    const initial = getDevelopmentSeedData();
    const migrated = runMigrations(initial);
    this.saveImmediately(migrated);
    return migrated;
  }

  private saveImmediately(data: DatabaseSchema) {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      console.error("[Database] Failed to write database to disk:", err);
    }
  }

  public save() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;
    try {
      this.saveImmediately(this.schema);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.save();
      }
    }
  }

  private rebuildIndexes() {
    this.userEmailIndex.clear();
    this.userIdIndex.clear();
    this.sessionIndex.clear();
    this.userSessionsIndex.clear();
    this.postIndex.clear();
    this.likeUniqueIndex.clear();

    // Users
    for (const u of this.schema.users) {
      this.userEmailIndex.set(u.email.toLowerCase(), u.id);
      this.userIdIndex.set(u.id, u);
    }

    // Sessions
    for (const s of this.schema.analysisSessions) {
      this.sessionIndex.set(s.analysisId, s);
      if (!this.userSessionsIndex.has(s.userId)) {
        this.userSessionsIndex.set(s.userId, new Set());
      }
      this.userSessionsIndex.get(s.userId)!.add(s.analysisId);
    }

    // Posts
    for (const p of this.schema.posts) {
      this.postIndex.set(p.postId, p);
    }

    // Likes (postId_userId unique constraint)
    for (const l of this.schema.likes) {
      this.likeUniqueIndex.add(`${l.postId}_${l.userId}`);
    }

    // Friendships & Blocks
    this.friendshipUniqueIndex.clear();
    for (const f of this.schema.friendships || []) {
      this.friendshipUniqueIndex.add(`${f.userId}_${f.friendId}`);
    }

    this.blockUniqueIndex.clear();
    for (const b of this.schema.blocks || []) {
      this.blockUniqueIndex.add(`${b.blockerId}_${b.blockedId}`);
    }

    this.conversationIndex.clear();
    for (const c of this.schema.conversations || []) {
      this.conversationIndex.set(c._id, c);
    }
  }

  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  public findUserById(id: string): UserTable | undefined {
    return this.userIdIndex.get(id);
  }

  public findUserByEmail(email: string): UserTable | undefined {
    if (!email) return undefined;
    const lower = email.toLowerCase().trim();
    const id = this.userEmailIndex.get(lower);
    if (id && this.userIdIndex.has(id)) {
      return this.userIdIndex.get(id);
    }
    const found = this.schema.users.find(u => u.email.toLowerCase() === lower);
    if (found) {
      this.userIdIndex.set(found.id, found);
      this.userEmailIndex.set(lower, found.id);
      return found;
    }
    return undefined;
  }

  public createUser(user: UserTable): SafeUser {
    const existing = this.findUserByEmail(user.email);
    if (existing) {
      throw new Error("A user with this email already exists.");
    }
    this.schema.users.push(user);
    this.userIdIndex.set(user.id, user);
    this.userEmailIndex.set(user.email.toLowerCase().trim(), user.id);

    // Also initialize default user settings and profile
    this.createUserSettings({
      userId: user.id,
      appearance: { theme: "dark", nightLight: false, compactView: false },
      notifications: { emailAlerts: true, weeklyDigest: false, sentimentAnomalies: true, communityUpdates: true },
      privacy: { allowAnalytics: true, dataRetentionDays: 30, profilePublic: true },
      language: "English",
      updatedAt: user.createdAt
    });

    this.createUserProfile({
      userId: user.id,
      name: user.name,
      email: user.email,
      updatedAt: user.createdAt
    });

    this.save();
    return this.toSafeUser(user);
  }

  public updateUser(id: string, updates: Partial<UserTable>): SafeUser {
    const user = this.findUserById(id);
    if (!user) throw new Error("User not found.");

    if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      if (this.userEmailIndex.has(updates.email.toLowerCase())) {
        throw new Error("Email already in use.");
      }
      this.userEmailIndex.delete(user.email.toLowerCase());
      this.userEmailIndex.set(updates.email.toLowerCase(), user.id);
    }

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return this.toSafeUser(user);
  }

  public listUsers(): SafeUser[] {
    return this.schema.users.map(u => this.toSafeUser(u));
  }

  public toSafeUser(user: UserTable): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // -------------------------------------------------------------
  // USER PROFILES & SETTINGS
  // -------------------------------------------------------------
  public getUserProfile(userId: string): UserProfileTable | undefined {
    return this.schema.userProfiles.find(p => p.userId === userId);
  }

  public createUserProfile(profile: UserProfileTable): UserProfileTable {
    const existingIndex = this.schema.userProfiles.findIndex(p => p.userId === profile.userId);
    if (existingIndex >= 0) {
      this.schema.userProfiles[existingIndex] = profile;
    } else {
      this.schema.userProfiles.push(profile);
    }
    this.save();
    return profile;
  }

  public updateUserProfile(userId: string, updates: Partial<UserProfileTable>): UserProfileTable {
    let profile = this.getUserProfile(userId);
    if (!profile) {
      const user = this.findUserById(userId);
      profile = {
        userId,
        name: user ? user.name : "User",
        email: user ? user.email : "",
        updatedAt: new Date().toISOString()
      };
      this.schema.userProfiles.push(profile);
    }
    Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return profile;
  }

  public getUserSettings(userId: string): UserSettingsTable {
    let settings = this.schema.userSettings.find(s => s.userId === userId);
    if (!settings) {
      settings = {
        userId,
        appearance: { theme: "dark", nightLight: false, compactView: false },
        notifications: {
          emailAlerts: true,
          weeklyDigest: false,
          sentimentAnomalies: true,
          communityUpdates: true,
          analysisComplete: true,
          reportGenerated: true,
          voiceAssistant: true,
          system: true
        },
        privacy: {
          saveAnalysisHistory: true,
          autoDeleteHistory: "never",
          saveReports: true,
          personalizedExperience: true,
          saveClarityConversations: true,
          saveGoalTracking: true,
          saveSearchHistory: true,
          communityVisibility: "private",
          allowAnalytics: true,
          dataRetentionDays: 30,
          profilePublic: false
        },
        language: "English",
        updatedAt: new Date().toISOString()
      };
      this.schema.userSettings.push(settings);
      this.save();
    } else {
      // Ensure missing privacy properties are populated safely
      if (!settings.privacy) {
        settings.privacy = {
          saveAnalysisHistory: true,
          autoDeleteHistory: "never",
          saveReports: true,
          personalizedExperience: true,
          saveClarityConversations: true,
          saveGoalTracking: true,
          saveSearchHistory: true,
          communityVisibility: "private"
        };
      } else {
        if (settings.privacy.saveAnalysisHistory === undefined) settings.privacy.saveAnalysisHistory = true;
        if (settings.privacy.autoDeleteHistory === undefined) settings.privacy.autoDeleteHistory = "never";
        if (settings.privacy.saveReports === undefined) settings.privacy.saveReports = true;
        if (settings.privacy.personalizedExperience === undefined) settings.privacy.personalizedExperience = true;
        if (settings.privacy.saveClarityConversations === undefined) settings.privacy.saveClarityConversations = true;
        if (settings.privacy.saveGoalTracking === undefined) settings.privacy.saveGoalTracking = true;
        if (settings.privacy.saveSearchHistory === undefined) settings.privacy.saveSearchHistory = true;
        if (settings.privacy.communityVisibility === undefined) settings.privacy.communityVisibility = "private";
      }
    }
    return settings;
  }

  public createUserSettings(settings: UserSettingsTable): UserSettingsTable {
    const idx = this.schema.userSettings.findIndex(s => s.userId === settings.userId);
    if (idx >= 0) {
      this.schema.userSettings[idx] = settings;
    } else {
      this.schema.userSettings.push(settings);
    }
    this.save();
    return settings;
  }

  public updateUserSettings(userId: string, updates: Partial<UserSettingsTable>): UserSettingsTable {
    const settings = this.getUserSettings(userId);
    if (updates.appearance) settings.appearance = { ...settings.appearance, ...updates.appearance };
    if (updates.notifications) settings.notifications = { ...settings.notifications, ...updates.notifications };
    if (updates.privacy) settings.privacy = { ...settings.privacy, ...updates.privacy };
    if (updates.language) settings.language = updates.language;
    settings.updatedAt = new Date().toISOString();
    this.save();
    return settings;
  }

  // -------------------------------------------------------------
  // ANALYSIS SESSIONS, INPUTS & RESULTS
  // -------------------------------------------------------------
  public createAnalysisSession(
    session: AnalysisSessionTable,
    inputs: AnalysisInputTable[],
    result: AnalysisResultTable
  ): { session: AnalysisSessionTable; inputs: AnalysisInputTable[]; result: AnalysisResultTable } {
    this.schema.analysisSessions.push(session);
    this.sessionIndex.set(session.analysisId, session);

    if (!this.userSessionsIndex.has(session.userId)) {
      this.userSessionsIndex.set(session.userId, new Set());
    }
    this.userSessionsIndex.get(session.userId)!.add(session.analysisId);

    for (const inp of inputs) {
      this.schema.analysisInputs.push(inp);
    }

    this.schema.analysisResults.push(result);
    this.save();

    return { session, inputs, result };
  }

  public getAnalysisSession(analysisId: string): AnalysisSessionTable | undefined {
    return this.sessionIndex.get(analysisId);
  }

  public getAnalysisInputs(analysisId: string): AnalysisInputTable[] {
    return this.schema.analysisInputs.filter(i => i.analysisId === analysisId);
  }

  public getAnalysisResult(analysisId: string): AnalysisResultTable | undefined {
    return this.schema.analysisResults.find(r => r.analysisId === analysisId);
  }

  public listAnalysesByUser(
    userId: string,
    options: {
      search?: string;
      sentiment?: string;
      status?: string;
      sortBy?: "date" | "sentiment" | "score" | "title";
      sortOrder?: "asc" | "desc";
      page?: number;
      limit?: number;
    } = {}
  ): { records: AnalysisSessionTable[]; total: number; page: number; limit: number } {
    const sessionIds = this.userSessionsIndex.get(userId) || new Set();
    let records = Array.from(sessionIds)
      .map(id => this.sessionIndex.get(id)!)
      .filter(Boolean);

    // Filter by search
    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      records = records.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.meaning && r.meaning.toLowerCase().includes(q)) ||
        (r.overallSentiment.label.toLowerCase().includes(q)) ||
        (r.emotions?.dominant?.name && r.emotions.dominant.name.toLowerCase().includes(q))
      );
    }

    // Filter by sentiment
    if (options.sentiment && options.sentiment !== "all") {
      records = records.filter(r => r.overallSentiment.label.toLowerCase() === options.sentiment!.toLowerCase());
    }

    // Filter by status
    if (options.status && options.status !== "all") {
      records = records.filter(r => r.status.toLowerCase() === options.status!.toLowerCase());
    }

    // Sorting
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;
    records.sort((a, b) => {
      if (options.sortBy === "score") {
        return (a.score - b.score) * sortOrder;
      }
      if (options.sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "") * sortOrder;
      }
      if (options.sortBy === "sentiment") {
        return a.overallSentiment.label.localeCompare(b.overallSentiment.label) * sortOrder;
      }
      // default: date
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortOrder;
    });

    const total = records.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    const pagedRecords = records.slice(offset, offset + limit);

    return { records: pagedRecords, total, page, limit };
  }

  public deleteAnalysisSession(analysisId: string, userId: string): boolean {
    const session = this.getAnalysisSession(analysisId);
    if (!session) return false;
    if (session.userId !== userId) {
      throw new Error("Forbidden: You do not own this analysis.");
    }

    // Cascade delete session, inputs, results, and associated reports
    this.schema.analysisSessions = this.schema.analysisSessions.filter(s => s.analysisId !== analysisId);
    this.schema.analysisInputs = this.schema.analysisInputs.filter(i => i.analysisId !== analysisId);
    this.schema.analysisResults = this.schema.analysisResults.filter(r => r.analysisId !== analysisId);
    this.schema.reports = this.schema.reports.filter(rep => rep.analysisId !== analysisId);

    this.sessionIndex.delete(analysisId);
    const userSet = this.userSessionsIndex.get(userId);
    if (userSet) userSet.delete(analysisId);

    this.save();
    return true;
  }

  // -------------------------------------------------------------
  // REPORTS
  // -------------------------------------------------------------
  public createReport(report: ReportTable): ReportTable {
    const existing = this.schema.reports.find(r => r.reportId === report.reportId);
    if (existing) {
      Object.assign(existing, report, { updatedAt: new Date().toISOString() });
    } else {
      this.schema.reports.push(report);
    }
    this.save();
    return report;
  }

  public getReport(reportId: string): ReportTable | undefined {
    return this.schema.reports.find(r => r.reportId === reportId);
  }

  public listReportsByUser(userId: string): ReportTable[] {
    return this.schema.reports
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public deleteReport(reportId: string, userId: string): boolean {
    const report = this.getReport(reportId);
    if (!report) return false;
    if (report.userId !== userId) {
      throw new Error("Forbidden: You do not own this report.");
    }
    this.schema.reports = this.schema.reports.filter(r => r.reportId !== reportId);
    this.save();
    return true;
  }

  // -------------------------------------------------------------
  // VOICE SESSIONS
  // -------------------------------------------------------------
  public createVoiceSession(session: VoiceSessionTable): VoiceSessionTable {
    this.schema.voiceSessions.push(session);
    this.save();
    return session;
  }

  public listVoiceSessionsByUser(userId: string): VoiceSessionTable[] {
    return this.schema.voiceSessions
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // -------------------------------------------------------------
  // COMMUNITY POSTS, COMMENTS, LIKES & REPORTS
  // -------------------------------------------------------------
  public createPost(post: PostTable): PostTable {
    this.schema.posts.push(post);
    this.postIndex.set(post.postId, post);
    this.save();
    return post;
  }

  public getPost(postId: string): PostTable | undefined {
    return this.postIndex.get(postId);
  }

  public updatePost(postId: string, authorId: string, updates: Partial<PostTable>): PostTable {
    const post = this.getPost(postId);
    if (!post) throw new Error("Post not found.");
    if (post.authorId !== authorId) {
      throw new Error("Forbidden: You can only edit your own posts.");
    }
    Object.assign(post, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return post;
  }

  public deletePost(postId: string, authorId: string, isAdmin: boolean = false): boolean {
    const post = this.getPost(postId);
    if (!post) return false;
    if (post.authorId !== authorId && !isAdmin) {
      throw new Error("Forbidden: You can only delete your own posts.");
    }

    this.schema.posts = this.schema.posts.filter(p => p.postId !== postId);
    this.postIndex.delete(postId);

    // Cascade delete comments and likes for this post
    this.schema.comments = this.schema.comments.filter(c => c.postId !== postId);
    this.schema.likes = this.schema.likes.filter(l => l.postId !== postId);

    // Rebuild like unique index
    this.likeUniqueIndex.clear();
    for (const l of this.schema.likes) {
      this.likeUniqueIndex.add(`${l.postId}_${l.userId}`);
    }

    this.save();
    return true;
  }

  public listPosts(
    currentUserId?: string,
    options: { search?: string; tag?: string; page?: number; limit?: number } = {}
  ): { posts: PostTable[]; total: number } {
    let posts = this.schema.posts.filter(p => {
      // Visibility rule:
      // If author is current user, always visible
      if (currentUserId && p.authorId === currentUserId) return true;
      // If public, visible to everyone
      if (p.privacy === "public") return true;
      // If community, visible to authenticated users
      if (p.privacy === "community" && currentUserId) return true;
      // Otherwise hidden
      return false;
    });

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      posts = posts.filter(p =>
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (options.tag && options.tag.trim()) {
      const t = options.tag.toLowerCase().trim();
      posts = posts.filter(p => p.tags && p.tags.some(tag => tag.toLowerCase() === t));
    }

    // Sort newest first
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = posts.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    return { posts: posts.slice(offset, offset + limit), total };
  }

  // Comments
  public createComment(comment: CommentTable): CommentTable {
    const post = this.getPost(comment.postId);
    if (!post) throw new Error("Post not found.");

    this.schema.comments.push(comment);
    post.commentsCount = (post.commentsCount || 0) + 1;
    this.save();
    return comment;
  }

  public listComments(postId: string): CommentTable[] {
    return this.schema.comments
      .filter(c => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public updateComment(commentId: string, authorId: string, content: string): CommentTable {
    const comment = this.schema.comments.find(c => c.commentId === commentId);
    if (!comment) throw new Error("Comment not found.");
    if (comment.authorId !== authorId) {
      throw new Error("Forbidden: You can only edit your own comment.");
    }
    comment.content = content;
    comment.updatedAt = new Date().toISOString();
    this.save();
    return comment;
  }

  public deleteComment(commentId: string, authorId: string, isAdmin: boolean = false): boolean {
    const comment = this.schema.comments.find(c => c.commentId === commentId);
    if (!comment) return false;
    if (comment.authorId !== authorId && !isAdmin) {
      throw new Error("Forbidden: You can only delete your own comment.");
    }

    const post = this.getPost(comment.postId);
    if (post && post.commentsCount > 0) {
      post.commentsCount -= 1;
    }

    this.schema.comments = this.schema.comments.filter(c => c.commentId !== commentId);
    this.save();
    return true;
  }

  // Likes (Enforced Unique Constraint: postId + userId)
  public toggleLike(postId: string, userId: string): { liked: boolean; likesCount: number } {
    const post = this.getPost(postId);
    if (!post) throw new Error("Post not found.");

    const key = `${postId}_${userId}`;
    const alreadyLiked = this.likeUniqueIndex.has(key);

    if (alreadyLiked) {
      // Remove like
      this.schema.likes = this.schema.likes.filter(l => !(l.postId === postId && l.userId === userId));
      this.likeUniqueIndex.delete(key);
      post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
      this.save();
      return { liked: false, likesCount: post.likesCount };
    } else {
      // Add like
      const newLike: LikeTable = {
        likeId: "lk_" + Math.random().toString(36).substring(2, 11),
        postId,
        userId,
        createdAt: new Date().toISOString()
      };
      this.schema.likes.push(newLike);
      this.likeUniqueIndex.add(key);
      post.likesCount = (post.likesCount || 0) + 1;
      this.save();
      return { liked: true, likesCount: post.likesCount };
    }
  }

  public isPostLikedByUser(postId: string, userId: string): boolean {
    return this.likeUniqueIndex.has(`${postId}_${userId}`);
  }

  // Community Reports (Trust & Safety Moderation Queue)
  public createCommunityReport(report: CommunityReportTable): CommunityReportTable {
    this.schema.communityReports.push(report);
    this.save();
    return report;
  }

  public listCommunityReports(status?: string): CommunityReportTable[] {
    let reports = this.schema.communityReports;
    if (status && status !== "all") {
      reports = reports.filter(r => r.status === status);
    }
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public updateCommunityReportStatus(
    reportId: string,
    status: CommunityReportTable["status"],
    actionTaken?: string
  ): CommunityReportTable {
    const report = this.schema.communityReports.find(r => r.reportId === reportId);
    if (!report) throw new Error("Report not found.");
    report.status = status;
    if (actionTaken) report.actionTaken = actionTaken;
    report.reviewedAt = new Date().toISOString();
    this.save();
    return report;
  }

  // -------------------------------------------------------------
  // AUDIT LOGS
  // -------------------------------------------------------------
  public createAuditLog(log: Omit<AuditLogTable, "id" | "timestamp">): AuditLogTable {
    const fullLog: AuditLogTable = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      ...log,
      timestamp: new Date().toISOString()
    };
    this.schema.auditLogs.unshift(fullLog); // prepend newest
    // Cap audit logs at 2000 entries
    if (this.schema.auditLogs.length > 2000) {
      this.schema.auditLogs = this.schema.auditLogs.slice(0, 2000);
    }
    this.save();
    return fullLog;
  }

  public listAuditLogs(options: { limit?: number; action?: string; userId?: string } = {}): AuditLogTable[] {
    let logs = this.schema.auditLogs;
    if (options.action) {
      logs = logs.filter(l => l.action.toLowerCase() === options.action!.toLowerCase());
    }
    if (options.userId) {
      logs = logs.filter(l => l.userId === options.userId);
    }
    return logs.slice(0, options.limit || 50);
  }

  // -------------------------------------------------------------
  // ADMIN & SYSTEM STATISTICS
  // -------------------------------------------------------------
  public getSystemStatistics() {
    const totalUsers = this.schema.users.length;
    const activeUsers = this.schema.users.filter(u => u.status === "active").length;
    const totalAnalyses = this.schema.analysisSessions.length;
    const totalReports = this.schema.reports.length;
    const totalPosts = this.schema.posts.length;
    const totalComments = this.schema.comments.length;
    const pendingModeration = this.schema.communityReports.filter(r => r.status === "pending").length;

    // Sentiment breakdown
    const sentimentCounts = {
      Positive: 0,
      Negative: 0,
      Neutral: 0,
      Mixed: 0
    };
    for (const s of this.schema.analysisSessions) {
      const l = s.overallSentiment.label;
      if (l in sentimentCounts) {
        sentimentCounts[l as keyof typeof sentimentCounts]++;
      }
    }

    return {
      totalUsers,
      activeUsers,
      suspendedUsers: totalUsers - activeUsers,
      totalAnalyses,
      totalReports,
      totalPosts,
      totalComments,
      pendingModeration,
      sentimentCounts,
      uptimeSeconds: Math.floor(process.uptime()),
      databaseVersion: this.schema.version
    };
  }

  public listAllAnalysesAdmin(options: { page?: number; limit?: number; search?: string } = {}) {
    let records = [...this.schema.analysisSessions];
    if (options.search) {
      const q = options.search.toLowerCase();
      records = records.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.userId && r.userId.toLowerCase().includes(q))
      );
    }
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = records.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    return { records: records.slice(offset, offset + limit), total, page, limit };
  }

  // -------------------------------------------------------------
  // STEP 16: FRIENDS, CHAT, CALLS, NOTIFICATIONS & BLOCKS
  // -------------------------------------------------------------

  public searchUsers(query: string, currentUserId: string) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];

    const matched = this.schema.users.filter(u => {
      if (u.id === currentUserId) return false;
      const nameMatch = u.name && u.name.toLowerCase().includes(q);
      const emailMatch = u.email && u.email.toLowerCase().includes(q);
      return nameMatch || emailMatch;
    });

    return matched.map(u => {
      const status = this.getRelationshipStatus(currentUserId, u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || u.email)}`,
        status
      };
    });
  }

  public getRelationshipStatus(userA: string, userB: string): "self" | "blocked" | "friends" | "pending_sent" | "pending_received" | "none" {
    if (userA === userB) return "self";

    if (this.isBlocked(userA, userB) || this.isBlocked(userB, userA)) {
      return "blocked";
    }

    if (this.areFriends(userA, userB)) {
      return "friends";
    }

    const pendingSent = (this.schema.friendRequests || []).find(
      r => r.senderId === userA && r.receiverId === userB && r.status === "pending"
    );
    if (pendingSent) return "pending_sent";

    const pendingReceived = (this.schema.friendRequests || []).find(
      r => r.senderId === userB && r.receiverId === userA && r.status === "pending"
    );
    if (pendingReceived) return "pending_received";

    return "none";
  }

  public areFriends(userA: string, userB: string): boolean {
    return this.friendshipUniqueIndex.has(`${userA}_${userB}`) || this.friendshipUniqueIndex.has(`${userB}_${userA}`);
  }

  public isBlocked(blockerId: string, blockedId: string): boolean {
    return this.blockUniqueIndex.has(`${blockerId}_${blockedId}`);
  }

  public isAnyBlocked(userA: string, userB: string): boolean {
    return this.isBlocked(userA, userB) || this.isBlocked(userB, userA);
  }

  // --- Friend Requests ---
  public createFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new Error("Cannot send a friend request to yourself.");
    }
    const receiver = this.findUserById(receiverId);
    if (!receiver) {
      throw new Error("User not found.");
    }
    if (this.isAnyBlocked(senderId, receiverId)) {
      throw new Error("Unable to send request due to privacy settings or active blocks.");
    }
    if (this.areFriends(senderId, receiverId)) {
      throw new Error("You are already friends with this user.");
    }

    const existingPending = (this.schema.friendRequests || []).find(
      r => ((r.senderId === senderId && r.receiverId === receiverId) ||
            (r.senderId === receiverId && r.receiverId === senderId)) &&
            r.status === "pending"
    );
    if (existingPending) {
      if (existingPending.senderId === senderId) {
        throw new Error("Friend request already sent.");
      } else {
        throw new Error("This user has already sent you a friend request. Please check your incoming requests.");
      }
    }

    const sender = this.findUserById(senderId);
    const now = new Date().toISOString();
    const reqId = `freq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newRequest: FriendRequestTable = {
      _id: reqId,
      senderId,
      receiverId,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };

    if (!this.schema.friendRequests) this.schema.friendRequests = [];
    this.schema.friendRequests.unshift(newRequest);

    // Create notification
    this.createNotification({
      userId: receiverId,
      type: "friend_request",
      title: "New Friend Request",
      message: `${sender?.name || "Someone"} sent you a connection request.`,
      data: { requestId: reqId, senderId, senderName: sender?.name, senderAvatar: sender?.avatar }
    });

    this.save();
    return newRequest;
  }

  public getFriendRequests(userId: string) {
    const all = this.schema.friendRequests || [];
    const incomingRaw = all.filter(r => r.receiverId === userId && r.status === "pending");
    const outgoingRaw = all.filter(r => r.senderId === userId && r.status === "pending");

    const mapReq = (r: FriendRequestTable, otherId: string) => {
      const other = this.findUserById(otherId);
      return {
        _id: r._id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        status: r.status,
        createdAt: r.createdAt,
        user: other ? {
          id: other.id,
          name: other.name,
          email: other.email,
          avatar: other.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(other.name || other.email)}`
        } : null
      };
    };

    return {
      incoming: incomingRaw.map(r => mapReq(r, r.senderId)),
      outgoing: outgoingRaw.map(r => mapReq(r, r.receiverId))
    };
  }

  public acceptFriendRequest(requestId: string, userId: string) {
    const req = (this.schema.friendRequests || []).find(r => r._id === requestId);
    if (!req) {
      throw new Error("Friend request not found.");
    }
    if (req.receiverId !== userId) {
      throw new Error("Unauthorized to accept this friend request.");
    }
    if (req.status !== "pending") {
      throw new Error(`Friend request is already ${req.status}.`);
    }

    const now = new Date().toISOString();
    req.status = "accepted";
    req.updatedAt = now;

    if (!this.schema.friendships) this.schema.friendships = [];
    // Create bidirectional friendship records
    const f1Id = `fr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const f2Id = `fr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_2`;

    if (!this.areFriends(req.senderId, req.receiverId)) {
      this.schema.friendships.push({
        _id: f1Id,
        userId: req.senderId,
        friendId: req.receiverId,
        createdAt: now
      });
      this.schema.friendships.push({
        _id: f2Id,
        userId: req.receiverId,
        friendId: req.senderId,
        createdAt: now
      });
      this.friendshipUniqueIndex.add(`${req.senderId}_${req.receiverId}`);
      this.friendshipUniqueIndex.add(`${req.receiverId}_${req.senderId}`);
    }

    // Auto-create or get private conversation
    this.getOrCreateConversation(req.senderId, req.receiverId);

    // Notify sender
    const receiver = this.findUserById(userId);
    this.createNotification({
      userId: req.senderId,
      type: "friend_accepted",
      title: "Friend Request Accepted",
      message: `${receiver?.name || "A user"} accepted your connection request! You can now chat and call.`,
      data: { friendId: userId, friendName: receiver?.name, friendAvatar: receiver?.avatar }
    });

    this.save();
    return { success: true, message: "Friend request accepted." };
  }

  public rejectFriendRequest(requestId: string, userId: string) {
    const req = (this.schema.friendRequests || []).find(r => r._id === requestId);
    if (!req) {
      throw new Error("Friend request not found.");
    }
    if (req.receiverId !== userId) {
      throw new Error("Unauthorized to reject this friend request.");
    }
    if (req.status !== "pending") {
      throw new Error(`Friend request is already ${req.status}.`);
    }

    req.status = "rejected";
    req.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, message: "Friend request rejected." };
  }

  public cancelFriendRequest(requestId: string, userId: string) {
    const req = (this.schema.friendRequests || []).find(r => r._id === requestId);
    if (!req) {
      throw new Error("Friend request not found.");
    }
    if (req.senderId !== userId) {
      throw new Error("Unauthorized to cancel this friend request.");
    }
    if (req.status !== "pending") {
      throw new Error(`Friend request is already ${req.status}.`);
    }

    req.status = "cancelled";
    req.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, message: "Friend request cancelled." };
  }

  // --- Friends List & Removal ---
  public getFriends(userId: string) {
    const records = (this.schema.friendships || []).filter(f => f.userId === userId);
    const friends = [];

    for (const rec of records) {
      const u = this.findUserById(rec.friendId);
      if (u && !this.isAnyBlocked(userId, u.id)) {
        // Find existing conversation ID
        const conv = (this.schema.conversations || []).find(
          c => c.members.includes(userId) && c.members.includes(u.id)
        );

        friends.push({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || u.email)}`,
          status: u.status,
          friendshipId: rec._id,
          friendedAt: rec.createdAt,
          conversationId: conv?._id || null
        });
      }
    }

    return friends;
  }

  public removeFriend(userId: string, friendId: string) {
    if (!this.schema.friendships) return false;
    this.schema.friendships = this.schema.friendships.filter(
      f => !((f.userId === userId && f.friendId === friendId) || (f.userId === friendId && f.friendId === userId))
    );
    this.friendshipUniqueIndex.delete(`${userId}_${friendId}`);
    this.friendshipUniqueIndex.delete(`${friendId}_${userId}`);
    this.save();
    return true;
  }

  // --- Blocks ---
  public blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new Error("Cannot block yourself.");
    }
    const target = this.findUserById(blockedId);
    if (!target) {
      throw new Error("User not found.");
    }

    if (this.isBlocked(blockerId, blockedId)) {
      return { success: true, message: "User is already blocked." };
    }

    if (!this.schema.blocks) this.schema.blocks = [];
    this.schema.blocks.push({
      _id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      blockerId,
      blockedId,
      createdAt: new Date().toISOString()
    });
    this.blockUniqueIndex.add(`${blockerId}_${blockedId}`);

    // Break friendship
    this.removeFriend(blockerId, blockedId);

    // Cancel pending requests
    for (const r of (this.schema.friendRequests || [])) {
      if (((r.senderId === blockerId && r.receiverId === blockedId) ||
           (r.senderId === blockedId && r.receiverId === blockerId)) &&
          r.status === "pending") {
        r.status = "cancelled";
        r.updatedAt = new Date().toISOString();
      }
    }

    this.save();
    return { success: true, message: "User blocked successfully." };
  }

  public unblockUser(blockerId: string, blockedId: string) {
    if (!this.schema.blocks) return { success: true };
    this.schema.blocks = this.schema.blocks.filter(
      b => !(b.blockerId === blockerId && b.blockedId === blockedId)
    );
    this.blockUniqueIndex.delete(`${blockerId}_${blockedId}`);
    this.save();
    return { success: true, message: "User unblocked successfully." };
  }

  public getBlockedUsers(userId: string) {
    const list = (this.schema.blocks || []).filter(b => b.blockerId === userId);
    return list.map(b => {
      const u = this.findUserById(b.blockedId);
      return {
        _id: b._id,
        blockedId: b.blockedId,
        createdAt: b.createdAt,
        user: u ? {
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || u.email)}`
        } : null
      };
    });
  }

  // --- Conversations & Private Messaging ---
  public getConversations(userId: string) {
    const convs = (this.schema.conversations || []).filter(c => c.members.includes(userId));
    const result = [];

    for (const conv of convs) {
      const otherId = conv.members.find(m => m !== userId);
      const otherUser = otherId ? this.findUserById(otherId) : null;
      if (!otherUser) continue;

      // Get last message
      const convMessages = (this.schema.messages || []).filter(m => m.conversationId === conv._id);
      convMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastMessage = convMessages[0] || null;

      // Unread messages count
      const unreadCount = convMessages.filter(m => m.receiverId === userId && m.status !== "read").length;

      result.push({
        _id: conv._id,
        type: conv.type,
        members: conv.members,
        lastMessageAt: conv.lastMessageAt || conv.createdAt,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        unreadCount,
        lastMessage: lastMessage ? {
          _id: lastMessage._id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          status: lastMessage.status
        } : null,
        friend: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(otherUser.name || otherUser.email)}`
        }
      });
    }

    result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return result;
  }

  public getOrCreateConversation(userA: string, userB: string) {
    if (userA === userB) throw new Error("Cannot create conversation with yourself.");
    if (this.isAnyBlocked(userA, userB)) {
      throw new Error("Cannot communicate with this user due to privacy blocks.");
    }
    if (!this.areFriends(userA, userB)) {
      throw new Error("You must be accepted friends to start a private conversation.");
    }

    if (!this.schema.conversations) this.schema.conversations = [];
    let existing = this.schema.conversations.find(
      c => c.members.includes(userA) && c.members.includes(userB)
    );

    if (existing) return existing;

    const convId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const newConv: ConversationTable = {
      _id: convId,
      type: "private",
      members: [userA, userB],
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.schema.conversations.unshift(newConv);
    this.conversationIndex.set(convId, newConv);

    if (!this.schema.conversationMembers) this.schema.conversationMembers = [];
    this.schema.conversationMembers.push(
      { _id: `cm_${Date.now()}_1`, conversationId: convId, userId: userA, joinedAt: now },
      { _id: `cm_${Date.now()}_2`, conversationId: convId, userId: userB, joinedAt: now }
    );

    this.save();
    return newConv;
  }

  public getConversationById(convId: string, userId: string) {
    const conv = (this.schema.conversations || []).find(c => c._id === convId);
    if (!conv) throw new Error("Conversation not found.");
    if (!conv.members.includes(userId)) throw new Error("Unauthorized to access this conversation.");

    const otherId = conv.members.find(m => m !== userId);
    const otherUser = otherId ? this.findUserById(otherId) : null;

    return {
      ...conv,
      friend: otherUser ? {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        avatar: otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(otherUser.name || otherUser.email)}`
      } : null
    };
  }

  public getMessages(convId: string, userId: string, page = 1, limit = 50) {
    const conv = (this.schema.conversations || []).find(c => c._id === convId);
    if (!conv) throw new Error("Conversation not found.");
    if (!conv.members.includes(userId)) throw new Error("Unauthorized to access conversation messages.");

    let list = (this.schema.messages || []).filter(m => m.conversationId === convId);
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const total = list.length;
    // Automatic mark as read for incoming messages
    let changed = false;
    for (const m of list) {
      if (m.receiverId === userId && m.status !== "read") {
        m.status = "read";
        m.updatedAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) this.save();

    return {
      messages: list,
      total,
      page,
      limit
    };
  }

  public createMessage(convId: string, senderId: string, content: string) {
    const cleanContent = (content || "").trim();
    if (!cleanContent) throw new Error("Message content cannot be empty.");

    const conv = (this.schema.conversations || []).find(c => c._id === convId);
    if (!conv) throw new Error("Conversation not found.");
    if (!conv.members.includes(senderId)) throw new Error("Unauthorized to send message to this conversation.");

    const receiverId = conv.members.find(m => m !== senderId);
    if (!receiverId) throw new Error("Receiver not found in conversation.");

    if (this.isAnyBlocked(senderId, receiverId)) {
      throw new Error("Cannot send message: user is blocked.");
    }
    if (!this.areFriends(senderId, receiverId)) {
      throw new Error("You can only message accepted friends.");
    }

    const now = new Date().toISOString();
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newMsg: MessageTable = {
      _id: msgId,
      conversationId: convId,
      senderId,
      receiverId,
      messageType: "text",
      content: cleanContent,
      status: "sent",
      createdAt: now,
      updatedAt: now
    };

    if (!this.schema.messages) this.schema.messages = [];
    this.schema.messages.push(newMsg);

    conv.lastMessageAt = now;
    conv.updatedAt = now;

    // Create notification
    const sender = this.findUserById(senderId);
    this.createNotification({
      userId: receiverId,
      type: "new_message",
      title: `Message from ${sender?.name || "Friend"}`,
      message: cleanContent.length > 50 ? `${cleanContent.slice(0, 47)}...` : cleanContent,
      data: { conversationId: convId, messageId: msgId, senderId, senderName: sender?.name, senderAvatar: sender?.avatar }
    });

    this.save();
    return newMsg;
  }

  public markMessageAsRead(msgId: string, userId: string) {
    const msg = (this.schema.messages || []).find(m => m._id === msgId);
    if (!msg) throw new Error("Message not found.");
    if (msg.receiverId !== userId) throw new Error("Unauthorized to update read status.");

    msg.status = "read";
    msg.updatedAt = new Date().toISOString();
    this.save();
    return msg;
  }

  public deleteMessage(msgId: string, userId: string) {
    const idx = (this.schema.messages || []).findIndex(m => m._id === msgId);
    if (idx === -1) throw new Error("Message not found.");
    const msg = this.schema.messages[idx];
    if (msg.senderId !== userId) {
      throw new Error("You can only delete your own messages.");
    }
    this.schema.messages.splice(idx, 1);
    this.save();
    return { success: true, message: "Message deleted successfully." };
  }

  // --- Audio & Video Calls ---
  public createCallSession(callerId: string, receiverId: string, type: CallType) {
    if (callerId === receiverId) throw new Error("Cannot call yourself.");
    const receiver = this.findUserById(receiverId);
    if (!receiver) throw new Error("Receiver not found.");

    if (this.isAnyBlocked(callerId, receiverId)) {
      throw new Error("Cannot place call due to privacy blocks.");
    }
    if (!this.areFriends(callerId, receiverId)) {
      throw new Error("You can only call accepted friends.");
    }

    const caller = this.findUserById(callerId);
    const now = new Date().toISOString();
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const session: CallSessionTable = {
      _id: callId,
      callerId,
      receiverId,
      type,
      status: "ringing",
      duration: 0,
      createdAt: now
    };

    if (!this.schema.callSessions) this.schema.callSessions = [];
    this.schema.callSessions.unshift(session);

    if (!this.schema.callParticipants) this.schema.callParticipants = [];
    this.schema.callParticipants.push(
      { _id: `cp_${Date.now()}_1`, callId, userId: callerId, joinedAt: now },
      { _id: `cp_${Date.now()}_2`, callId, userId: receiverId, joinedAt: now }
    );

    this.createNotification({
      userId: receiverId,
      type: "incoming_call",
      title: `Incoming ${type === "video" ? "Video" : "Audio"} Call`,
      message: `${caller?.name || "Friend"} is calling you...`,
      data: { callId, callerId, callerName: caller?.name, callerAvatar: caller?.avatar, type }
    });

    this.save();
    return session;
  }

  public getCallSession(callId: string, userId: string) {
    const session = (this.schema.callSessions || []).find(c => c._id === callId);
    if (!session) throw new Error("Call session not found.");
    if (session.callerId !== userId && session.receiverId !== userId) {
      throw new Error("Unauthorized to access this call session.");
    }

    const caller = this.findUserById(session.callerId);
    const receiver = this.findUserById(session.receiverId);

    return {
      ...session,
      caller: caller ? { id: caller.id, name: caller.name, avatar: caller.avatar } : null,
      receiver: receiver ? { id: receiver.id, name: receiver.name, avatar: receiver.avatar } : null
    };
  }

  public acceptCall(callId: string, userId: string) {
    const session = (this.schema.callSessions || []).find(c => c._id === callId);
    if (!session) throw new Error("Call session not found.");
    if (session.receiverId !== userId) throw new Error("Unauthorized to accept this call.");
    if (session.status !== "ringing") throw new Error(`Call session is already ${session.status}.`);

    session.status = "accepted";
    session.startedAt = new Date().toISOString();
    this.save();
    return session;
  }

  public rejectCall(callId: string, userId: string) {
    const session = (this.schema.callSessions || []).find(c => c._id === callId);
    if (!session) throw new Error("Call session not found.");
    if (session.receiverId !== userId && session.callerId !== userId) {
      throw new Error("Unauthorized to reject this call.");
    }

    session.status = "rejected";
    session.endedAt = new Date().toISOString();
    this.save();
    return session;
  }

  public endCall(callId: string, userId: string) {
    const session = (this.schema.callSessions || []).find(c => c._id === callId);
    if (!session) throw new Error("Call session not found.");
    if (session.callerId !== userId && session.receiverId !== userId) {
      throw new Error("Unauthorized to end this call.");
    }

    const now = new Date();
    session.endedAt = now.toISOString();
    if (session.status === "ringing") {
      session.status = "missed";
    } else {
      session.status = "ended";
    }

    if (session.startedAt) {
      const start = new Date(session.startedAt).getTime();
      session.duration = Math.max(0, Math.round((now.getTime() - start) / 1000));
    }

    this.save();
    return session;
  }

  public getCallHistory(userId: string) {
    const list = (this.schema.callSessions || []).filter(
      c => c.callerId === userId || c.receiverId === userId
    );
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map(c => {
      const isCaller = c.callerId === userId;
      const otherId = isCaller ? c.receiverId : c.callerId;
      const other = this.findUserById(otherId);

      return {
        _id: c._id,
        direction: isCaller ? "outgoing" : "incoming",
        type: c.type,
        status: c.status,
        duration: c.duration || 0,
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        createdAt: c.createdAt,
        otherUser: other ? {
          id: other.id,
          name: other.name,
          email: other.email,
          avatar: other.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(other.name || other.email)}`
        } : null
      };
    });
  }

  // --- Notifications ---
  public createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    if (!this.schema.notifications) this.schema.notifications = [];
    const notif: NotificationTable = {
      _id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.schema.notifications.unshift(notif);
    // Keep max 100 notifications per user
    if (this.schema.notifications.length > 500) {
      this.schema.notifications = this.schema.notifications.slice(0, 500);
    }
    return notif;
  }

  public getNotifications(userId: string) {
    if (!this.schema.notifications) this.schema.notifications = [];
    let userNotifs = this.schema.notifications.filter(n => n.userId === userId);

    if (userNotifs.length === 0) {
      const now = Date.now();
      const defaults: NotificationTable[] = [
        {
          _id: `notif_fr_${now}_1`,
          userId,
          type: "friend_request",
          title: "Friend Request",
          message: "Rahul sent you a friend request",
          data: { requestId: `freq_rahul_${userId}`, senderId: "usr_dev_rahul", senderName: "Rahul" },
          read: false,
          createdAt: new Date(now - 15 * 60 * 1000).toISOString()
        },
        {
          _id: `notif_msg_${now}_2`,
          userId,
          type: "new_message",
          title: "New Message from Rahul",
          message: "Hey, how are you?",
          data: { conversationId: `conv_${userId}_rahul`, senderId: "usr_dev_rahul", senderName: "Rahul", content: "Hey, how are you?" },
          read: false,
          createdAt: new Date(now - 30 * 60 * 1000).toISOString()
        },
        {
          _id: `notif_call_${now}_3`,
          userId,
          type: "missed_call",
          title: "Missed Call",
          message: "Missed video call from Rahul",
          data: { callId: `call_rahul_${now}`, callerId: "usr_dev_rahul", callerName: "Rahul", type: "video" },
          read: false,
          createdAt: new Date(now - 45 * 60 * 1000).toISOString()
        },
        {
          _id: `notif_an_${now}_4`,
          userId,
          type: "analysis_complete",
          title: "Analysis Complete",
          message: "Your analysis is complete",
          data: { analysisId: "seed_an_01", title: "Multimodal Emotion & Tone Assessment", score: 0.88 },
          read: false,
          createdAt: new Date(now - 2 * 3600 * 1000).toISOString()
        },
        {
          _id: `notif_rep_${now}_5`,
          userId,
          type: "report_ready",
          title: "Report Ready",
          message: "Your report is ready",
          data: { reportId: "seed_rep_01", title: "Executive Sentiment & Tone Analysis Report - Q3" },
          read: false,
          createdAt: new Date(now - 3 * 3600 * 1000).toISOString()
        },
        {
          _id: `notif_like_${now}_6`,
          userId,
          type: "post_like",
          title: "Community Like",
          message: "Elena Rostova liked your community post",
          data: { postId: "post_seed_01", actorId: "usr_dev_02", actorName: "Elena Rostova" },
          read: false,
          createdAt: new Date(now - 4 * 3600 * 1000).toISOString()
        },
        {
          _id: `notif_comm_${now}_7`,
          userId,
          type: "post_comment",
          title: "New Comment",
          message: "Elena Rostova commented on your post: \"The visual emotion tracking is impressively accurate!\"",
          data: { postId: "post_seed_01", commentId: "comm_seed_01", actorId: "usr_dev_02", actorName: "Elena Rostova" },
          read: false,
          createdAt: new Date(now - 5 * 3600 * 1000).toISOString()
        }
      ];

      this.schema.notifications.unshift(...defaults);
      this.save();
      userNotifs = defaults;
    }

    return userNotifs.slice(0, 50);
  }

  public markNotificationAsRead(notifId: string, userId: string) {
    const notif = (this.schema.notifications || []).find(n => n._id === notifId && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.save();
    }
    return notif;
  }

  public markAllNotificationsAsRead(userId: string) {
    let changed = false;
    for (const n of (this.schema.notifications || [])) {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) this.save();
    return { success: true };
  }

  public getUnreadCounts(userId: string) {
    const pendingRequests = (this.schema.friendRequests || []).filter(
      r => r.receiverId === userId && r.status === "pending"
    ).length;

    const unreadMessages = (this.schema.messages || []).filter(
      m => m.receiverId === userId && m.status !== "read"
    ).length;

    const missedCalls = (this.schema.callSessions || []).filter(
      c => c.receiverId === userId && c.status === "missed"
    ).length;

    const unreadNotifications = (this.schema.notifications || []).filter(
      n => n.userId === userId && !n.read
    ).length;

    return {
      pendingRequests,
      unreadMessages,
      missedCalls,
      unreadNotifications,
      totalFriendsBadge: pendingRequests,
      totalMessagesBadge: unreadMessages,
      totalCallsBadge: missedCalls
    };
  }

  // -------------------------------------------------------------
  // STEP 18: GLOBAL SEARCH & SEARCH HISTORY
  // -------------------------------------------------------------

  public searchFriends(
    query: string,
    currentUserId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const q = (query || "").trim().toLowerCase();
    const allFriends = this.getFriends(currentUserId);

    let matched = allFriends;
    if (q) {
      matched = allFriends.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q)
      );
    }

    const total = matched.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    return {
      results: matched.slice(offset, offset + limit),
      total,
      page,
      limit
    };
  }

  public searchAnalyses(
    query: string,
    currentUserId: string,
    options: {
      sentiment?: string;
      inputType?: string;
      sort?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const q = (query || "").trim().toLowerCase();
    const sessionIds = this.userSessionsIndex.get(currentUserId) || new Set();
    let records = Array.from(sessionIds)
      .map(id => this.sessionIndex.get(id)!)
      .filter(Boolean);

    // Query text match
    if (q) {
      records = records.filter(r => {
        const titleMatch = r.title && r.title.toLowerCase().includes(q);
        const meaningMatch = r.meaning && r.meaning.toLowerCase().includes(q);
        const sentMatch = r.overallSentiment?.label && r.overallSentiment.label.toLowerCase().includes(q);
        const emoMatch = r.emotions?.dominant?.name && r.emotions.dominant.name.toLowerCase().includes(q);
        return titleMatch || meaningMatch || sentMatch || emoMatch;
      });
    }

    // Sentiment filter
    if (options.sentiment && options.sentiment !== "all") {
      const s = options.sentiment.toLowerCase();
      records = records.filter(r => r.overallSentiment?.label?.toLowerCase() === s);
    }

    // Input type filter
    if (options.inputType && options.inputType !== "all") {
      const targetType = options.inputType.toLowerCase();
      records = records.filter(r => {
        const hasText = r.inputSummary?.hasDirectText || (r.inputSummary?.textCount || 0) > 0;
        const imgCount = r.inputSummary?.imageCount || 0;
        const vidCount = r.inputSummary?.videoCount || 0;

        let inferredType: "text" | "image" | "video" | "multimodal" = "text";
        if (vidCount > 0 && (hasText || imgCount > 0)) inferredType = "multimodal";
        else if (vidCount > 0) inferredType = "video";
        else if (imgCount > 0 && hasText) inferredType = "multimodal";
        else if (imgCount > 0) inferredType = "image";
        else inferredType = "text";

        return inferredType === targetType || (targetType === "multimodal" && (imgCount > 0 || vidCount > 0));
      });
    }

    // Sorting
    records.sort((a, b) => {
      if (options.sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (options.sort === "relevant" && q) {
        const aTitle = (a.title || "").toLowerCase().includes(q) ? 2 : 0;
        const bTitle = (b.title || "").toLowerCase().includes(q) ? 2 : 0;
        if (aTitle !== bTitle) return bTitle - aTitle;
        return (b.score || 0) - (a.score || 0);
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = records.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const projected = records.slice(offset, offset + limit).map(r => {
      const imgCount = r.inputSummary?.imageCount || 0;
      const vidCount = r.inputSummary?.videoCount || 0;
      const hasText = r.inputSummary?.hasDirectText || (r.inputSummary?.textCount || 0) > 0;
      let inputType: "text" | "image" | "video" | "multimodal" = "text";
      if (vidCount > 0 && (hasText || imgCount > 0)) inputType = "multimodal";
      else if (vidCount > 0) inputType = "video";
      else if (imgCount > 0 && hasText) inputType = "multimodal";
      else if (imgCount > 0) inputType = "image";

      return {
        analysisId: r.analysisId,
        title: r.title || "Multimodal Analysis",
        inputType,
        sentiment: r.overallSentiment?.label || "Neutral",
        sentimentScore: r.score || r.overallSentiment?.score || 0.8,
        dominantEmotion: r.emotions?.dominant?.name || "Analytical Focus",
        dominantEmotionReason: r.emotions?.dominant?.reason || "",
        meaning: r.meaning || "",
        status: r.status,
        createdAt: r.createdAt
      };
    });

    return {
      results: projected,
      total,
      page,
      limit
    };
  }

  public searchReports(
    query: string,
    currentUserId: string,
    options: {
      sentiment?: string;
      sort?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const q = (query || "").trim().toLowerCase();
    let userReports = (this.schema.reports || []).filter(r => r.userId === currentUserId);

    if (q) {
      userReports = userReports.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.analysisId && r.analysisId.toLowerCase().includes(q)) ||
        (r.summary && r.summary.toLowerCase().includes(q)) ||
        (r.format && r.format.toLowerCase().includes(q))
      );
    }

    if (options.sentiment && options.sentiment !== "all") {
      const s = options.sentiment.toLowerCase();
      userReports = userReports.filter(r => {
        const session = this.sessionIndex.get(r.analysisId);
        const sent = session?.overallSentiment?.label?.toLowerCase() || "";
        return sent === s;
      });
    }

    userReports.sort((a, b) => {
      if (options.sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = userReports.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const projected = userReports.slice(offset, offset + limit).map(r => {
      const session = this.sessionIndex.get(r.analysisId);
      const sentiment = session?.overallSentiment?.label || "Positive";
      return {
        reportId: r.reportId,
        analysisId: r.analysisId,
        title: r.title,
        fileType: r.format ? `${r.format.toUpperCase()} Document` : "PDF Document",
        sentiment,
        summary: r.summary || "",
        createdAt: r.createdAt
      };
    });

    return {
      results: projected,
      total,
      page,
      limit
    };
  }

  public searchCommunity(
    query: string,
    currentUserId?: string,
    options: {
      sort?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const q = (query || "").trim().toLowerCase();

    // Privacy filter: public, community (if logged in), or own
    let posts = (this.schema.posts || []).filter(p => {
      if (currentUserId && p.authorId === currentUserId) return true;
      if (p.privacy === "public") return true;
      if (p.privacy === "community" && currentUserId) return true;
      return false;
    });

    if (q) {
      posts = posts.filter(p =>
        (p.content && p.content.toLowerCase().includes(q)) ||
        (p.authorName && p.authorName.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sort
    posts.sort((a, b) => {
      if (options.sort === "popular") {
        const scoreA = (a.likesCount || 0) + (a.commentsCount || 0);
        const scoreB = (b.likesCount || 0) + (b.commentsCount || 0);
        return scoreB - scoreA;
      }
      if (options.sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = posts.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const projected = posts.slice(offset, offset + limit).map(p => {
      const user = this.userIdIndex.get(p.authorId);
      const userProfile = (this.schema.userProfiles || []).find(pr => pr.userId === p.authorId);
      const avatar = userProfile?.avatarUrl || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.authorName)}`;

      return {
        postId: p.postId,
        authorId: p.authorId,
        authorName: p.authorName,
        authorAvatar: avatar,
        title: p.content.slice(0, 50) + (p.content.length > 50 ? "..." : ""),
        content: p.content,
        tags: p.tags || [],
        likesCount: p.likesCount || 0,
        commentsCount: p.commentsCount || 0,
        privacy: p.privacy,
        createdAt: p.createdAt
      };
    });

    return {
      results: projected,
      total,
      page,
      limit
    };
  }

  public globalSearch(
    query: string,
    currentUserId: string,
    options: {
      category?: string;
      sentiment?: string;
      inputType?: string;
      sort?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const q = (query || "").trim();
    const category = options.category || "all";

    if (category === "people" || category === "users") {
      const usersRes = this.searchUsersPaged(q, currentUserId, options);
      return {
        category: "people",
        results: usersRes.results,
        total: usersRes.total,
        page: usersRes.page,
        limit: usersRes.limit
      };
    }

    if (category === "friends") {
      const friendsRes = this.searchFriends(q, currentUserId, options);
      return {
        category: "friends",
        results: friendsRes.results,
        total: friendsRes.total,
        page: friendsRes.page,
        limit: friendsRes.limit
      };
    }

    if (category === "analyses") {
      const analysesRes = this.searchAnalyses(q, currentUserId, options);
      return {
        category: "analyses",
        results: analysesRes.results,
        total: analysesRes.total,
        page: analysesRes.page,
        limit: analysesRes.limit
      };
    }

    if (category === "reports") {
      const reportsRes = this.searchReports(q, currentUserId, options);
      return {
        category: "reports",
        results: reportsRes.results,
        total: reportsRes.total,
        page: reportsRes.page,
        limit: reportsRes.limit
      };
    }

    if (category === "community") {
      const communityRes = this.searchCommunity(q, currentUserId, options);
      return {
        category: "community",
        results: communityRes.results,
        total: communityRes.total,
        page: communityRes.page,
        limit: communityRes.limit
      };
    }

    // Default: "all" category with grouped summaries (5 items per category)
    const previewLimit = 5;
    const people = this.searchUsersPaged(q, currentUserId, { limit: previewLimit });
    const friends = this.searchFriends(q, currentUserId, { limit: previewLimit });
    const analyses = this.searchAnalyses(q, currentUserId, { sentiment: options.sentiment, inputType: options.inputType, sort: options.sort, limit: previewLimit });
    const reports = this.searchReports(q, currentUserId, { sentiment: options.sentiment, sort: options.sort, limit: previewLimit });
    const community = this.searchCommunity(q, currentUserId, { sort: options.sort, limit: previewLimit });

    const totalResults = people.total + friends.total + analyses.total + reports.total + community.total;

    return {
      category: "all",
      total: totalResults,
      query: q,
      groups: {
        people: { results: people.results, total: people.total },
        friends: { results: friends.results, total: friends.total },
        analyses: { results: analyses.results, total: analyses.total },
        reports: { results: reports.results, total: reports.total },
        community: { results: community.results, total: community.total }
      }
    };
  }

  public searchUsersPaged(
    query: string,
    currentUserId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const list = this.searchUsers(query, currentUserId);
    const total = list.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    return {
      results: list.slice(offset, offset + limit),
      total,
      page,
      limit
    };
  }

  public getSearchSuggestions(query: string, currentUserId: string) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];

    const suggestions: Array<{ type: "user" | "analysis" | "community" | "history" | "friend"; text: string; subtext?: string; id?: string }> = [];

    // 1. Matching recent searches
    const history = (this.schema.searchHistory || [])
      .filter(h => h.userId === currentUserId && h.query.toLowerCase().includes(q))
      .slice(0, 2);
    for (const h of history) {
      suggestions.push({ type: "history", text: h.query, subtext: "Recent search" });
    }

    // 2. Matching users
    const users = this.schema.users
      .filter(u => u.id !== currentUserId && u.name && u.name.toLowerCase().includes(q))
      .slice(0, 2);
    for (const u of users) {
      suggestions.push({ type: "user", text: u.name, subtext: "User profile", id: u.id });
    }

    // 3. Matching own analyses
    const sessionIds = this.userSessionsIndex.get(currentUserId) || new Set();
    const ownAnalyses = Array.from(sessionIds)
      .map(id => this.sessionIndex.get(id)!)
      .filter(r => r && r.title && r.title.toLowerCase().includes(q))
      .slice(0, 2);
    for (const a of ownAnalyses) {
      suggestions.push({ type: "analysis", text: a.title, subtext: `Analysis (${a.overallSentiment?.label || "Sentiment"})`, id: a.analysisId });
    }

    // 4. Matching community posts
    const posts = (this.schema.posts || [])
      .filter(p => (p.privacy === "public" || p.privacy === "community") && p.content && p.content.toLowerCase().includes(q))
      .slice(0, 2);
    for (const p of posts) {
      const titleSnippet = p.content.slice(0, 40);
      suggestions.push({ type: "community", text: titleSnippet, subtext: `Community post by ${p.authorName}`, id: p.postId });
    }

    // Deduplicate by text
    const seen = new Set<string>();
    return suggestions.filter(s => {
      if (seen.has(s.text.toLowerCase())) return false;
      seen.add(s.text.toLowerCase());
      return true;
    }).slice(0, 6);
  }

  // Search History Management
  public getSearchHistory(userId: string, limit: number = 20): SearchHistoryTable[] {
    if (!this.schema.searchHistory) this.schema.searchHistory = [];
    return this.schema.searchHistory
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public addSearchHistory(userId: string, query: string, category: string = "all"): SearchHistoryTable {
    if (!this.schema.searchHistory) this.schema.searchHistory = [];
    const cleanQuery = query.trim();
    if (!cleanQuery) throw new Error("Search query cannot be empty.");

    // Deduplicate same query for same user by removing prior instance
    this.schema.searchHistory = this.schema.searchHistory.filter(
      h => !(h.userId === userId && h.query.toLowerCase() === cleanQuery.toLowerCase())
    );

    const record: SearchHistoryTable = {
      _id: `sh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      query: cleanQuery,
      category,
      createdAt: new Date().toISOString()
    };

    this.schema.searchHistory.unshift(record);

    // Keep max 50 search history items per user
    const userItems = this.schema.searchHistory.filter(h => h.userId === userId);
    if (userItems.length > 50) {
      const itemsToKeep = new Set(userItems.slice(0, 50).map(i => i._id));
      this.schema.searchHistory = this.schema.searchHistory.filter(
        h => h.userId !== userId || itemsToKeep.has(h._id)
      );
    }

    this.save();
    return record;
  }

  public deleteSearchHistoryItem(id: string, userId: string): boolean {
    if (!this.schema.searchHistory) return false;
    const initialLen = this.schema.searchHistory.length;
    this.schema.searchHistory = this.schema.searchHistory.filter(
      h => !(h._id === id && h.userId === userId)
    );
    const deleted = this.schema.searchHistory.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public clearSearchHistory(userId: string): boolean {
    if (!this.schema.searchHistory) return true;
    this.schema.searchHistory = this.schema.searchHistory.filter(h => h.userId !== userId);
    this.save();
    return true;
  }

  // --- Step 19: GenAI Clarity Assistant Database Operations ---

  public createClarityConversation(userId: string, analysisId: string, title?: string): ClarityConversationTable {
    if (!this.schema.clarityConversations) {
      this.schema.clarityConversations = [];
    }
    const convId = `cl_conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const newConversation: ClarityConversationTable = {
      _id: convId,
      userId,
      analysisId,
      title: title || `Clarity Assistant - ${new Date().toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now
    };

    this.schema.clarityConversations.unshift(newConversation);
    this.save();
    return newConversation;
  }

  public getClarityConversations(userId: string, analysisId?: string): ClarityConversationTable[] {
    if (!this.schema.clarityConversations) return [];
    return this.schema.clarityConversations.filter(c => {
      if (c.userId !== userId) return false;
      if (analysisId && c.analysisId !== analysisId) return false;
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getClarityConversationById(
    conversationId: string,
    userId: string
  ): (ClarityConversationTable & { messages: ClarityMessageTable[] }) | null {
    if (!this.schema.clarityConversations) return null;
    const conversation = this.schema.clarityConversations.find(
      c => c._id === conversationId && c.userId === userId
    );
    if (!conversation) return null;

    const messages = this.getClarityMessages(conversationId);
    return {
      ...conversation,
      messages
    };
  }

  public getClarityMessages(conversationId: string): ClarityMessageTable[] {
    if (!this.schema.clarityMessages) return [];
    return this.schema.clarityMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addClarityMessage(params: {
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    explanationType?: "simple" | "detailed" | "section" | "general";
    references?: ClarityMessageReference[];
    confidenceNote?: string;
    disclaimer?: string;
    structuredResponse?: ClarityStructuredResponse;
  }): ClarityMessageTable {
    if (!this.schema.clarityMessages) {
      this.schema.clarityMessages = [];
    }
    const msgId = `cl_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const newMessage: ClarityMessageTable = {
      _id: msgId,
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      explanationType: params.explanationType || "general",
      references: params.references || [],
      confidenceNote: params.confidenceNote,
      disclaimer: params.disclaimer,
      structuredResponse: params.structuredResponse,
      createdAt: now
    };

    this.schema.clarityMessages.push(newMessage);

    // Update conversation updatedAt
    if (this.schema.clarityConversations) {
      const conv = this.schema.clarityConversations.find(c => c._id === params.conversationId);
      if (conv) {
        conv.updatedAt = now;
      }
    }

    this.save();
    return newMessage;
  }

  public deleteClarityConversation(conversationId: string, userId: string): boolean {
    if (!this.schema.clarityConversations) return false;
    const convIndex = this.schema.clarityConversations.findIndex(
      c => c._id === conversationId && c.userId === userId
    );
    if (convIndex === -1) return false;

    // Remove conversation
    this.schema.clarityConversations.splice(convIndex, 1);

    // Remove associated messages
    if (this.schema.clarityMessages) {
      this.schema.clarityMessages = this.schema.clarityMessages.filter(
        m => m.conversationId !== conversationId
      );
    }

    this.save();
    return true;
  }

  // ==========================================
  // Step 21: AI Insight Snapshots (MongoDB schema collection)
  // ==========================================
  public getAIInsightSnapshots(userId: string): AIInsightSnapshotTable[] {
    if (!this.schema.aiInsightSnapshots) return [];
    return this.schema.aiInsightSnapshots
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAIInsightSnapshotById(snapshotId: string, userId: string): AIInsightSnapshotTable | undefined {
    if (!this.schema.aiInsightSnapshots) return undefined;
    return this.schema.aiInsightSnapshots.find(s => s._id === snapshotId && s.userId === userId);
  }

  public saveAIInsightSnapshot(data: {
    userId: string;
    dateRange: string;
    filters?: any;
    analyticsVersion?: string;
    insights: AIInsightItem[];
    recommendations: AIRecommendationItem[];
    summary: string;
    totalAnalyses: number;
    confidenceScore: "high" | "medium" | "low";
    isInsufficientData?: boolean;
  }): AIInsightSnapshotTable {
    if (!this.schema.aiInsightSnapshots) {
      this.schema.aiInsightSnapshots = [];
    }
    const snapshotId = `snp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newSnapshot: AIInsightSnapshotTable = {
      _id: snapshotId,
      userId: data.userId,
      dateRange: data.dateRange || "last30",
      filters: data.filters,
      analyticsVersion: data.analyticsVersion || "1.0",
      insights: data.insights || [],
      recommendations: data.recommendations || [],
      summary: data.summary || "",
      totalAnalyses: data.totalAnalyses || 0,
      confidenceScore: data.confidenceScore || "medium",
      isInsufficientData: Boolean(data.isInsufficientData),
      createdAt: new Date().toISOString()
    };

    this.schema.aiInsightSnapshots.unshift(newSnapshot);
    // Keep max 50 snapshots per user to save disk space
    const userSnapshots = this.schema.aiInsightSnapshots.filter(s => s.userId === data.userId);
    if (userSnapshots.length > 50) {
      const oldest = userSnapshots.slice(50);
      const oldestIds = new Set(oldest.map(s => s._id));
      this.schema.aiInsightSnapshots = this.schema.aiInsightSnapshots.filter(s => !oldestIds.has(s._id));
    }

    this.save();
    return newSnapshot;
  }

  public deleteAIInsightSnapshot(snapshotId: string, userId: string): boolean {
    if (!this.schema.aiInsightSnapshots) return false;
    const initialLen = this.schema.aiInsightSnapshots.length;
    this.schema.aiInsightSnapshots = this.schema.aiInsightSnapshots.filter(
      s => !(s._id === snapshotId && s.userId === userId)
    );
    if (this.schema.aiInsightSnapshots.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // STEP 22: GOALS & MOOD TRACKING METHODS
  // -------------------------------------------------------------

  public createGoal(
    userId: string,
    data: {
      title: string;
      description?: string;
      category: GoalCategory;
      measurementType: GoalMeasurementType;
      targetValue: number;
      targetEmotion?: string;
      targetConfidenceThreshold?: number;
      startDate: string;
      endDate: string;
    }
  ): GoalWithProgress {
    if (!this.schema.goals) this.schema.goals = [];
    if (!this.schema.goalProgress) this.schema.goalProgress = [];

    const now = new Date();
    const newGoal: GoalTable = {
      _id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: data.title.trim(),
      description: data.description?.trim() || "",
      category: data.category || "activity",
      measurementType: data.measurementType || "analysis_count",
      targetValue: Math.max(1, Number(data.targetValue) || 1),
      targetEmotion: data.targetEmotion?.trim(),
      targetConfidenceThreshold: data.targetConfidenceThreshold ? Number(data.targetConfidenceThreshold) : undefined,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      status: "active",
      isPaused: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Calculate initial progress & status
    const progress = this.calculateGoalProgress(newGoal, userId);
    newGoal.status = progress.status;

    this.schema.goals.unshift(newGoal);
    this.save();

    return {
      ...newGoal,
      progress
    };
  }

  public getGoals(
    userId: string,
    options: {
      status?: string;
      category?: string;
      sort?: string;
    } = {}
  ): GoalWithProgress[] {
    if (!this.schema.goals) this.schema.goals = [];

    // Ensure default initial goals for existing user if empty
    let userGoals = this.schema.goals.filter(g => g.userId === userId);

    if (userGoals.length === 0) {
      const now = Date.now();
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const defaultGoals: GoalTable[] = [
        {
          _id: `goal_seed_${now}_1`,
          userId,
          title: "Complete 20 analyses this month",
          description: "Establish a steady workflow cadence by recording at least 20 multimodal analyses.",
          category: "activity",
          measurementType: "analysis_count",
          targetValue: 20,
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString(),
          status: "active",
          isPaused: false,
          createdAt: new Date(now - 10 * 24 * 3600 * 1000).toISOString(),
          updatedAt: new Date(now - 10 * 24 * 3600 * 1000).toISOString()
        },
        {
          _id: `goal_seed_${now}_2`,
          userId,
          title: "Track positive sentiment across 15 sessions",
          description: "Monitor communications highlighting constructive tone and positive sentiment cues.",
          category: "sentiment",
          measurementType: "positive_count",
          targetValue: 15,
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString(),
          status: "active",
          isPaused: false,
          createdAt: new Date(now - 8 * 24 * 3600 * 1000).toISOString(),
          updatedAt: new Date(now - 8 * 24 * 3600 * 1000).toISOString()
        },
        {
          _id: `goal_seed_${now}_3`,
          userId,
          title: "Track Happiness-related analysis signals",
          description: "Identify and track joyful/upbeat emotion signals in recorded sessions.",
          category: "emotion",
          measurementType: "emotion_count",
          targetValue: 8,
          targetEmotion: "Happiness",
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString(),
          status: "active",
          isPaused: false,
          createdAt: new Date(now - 6 * 24 * 3600 * 1000).toISOString(),
          updatedAt: new Date(now - 6 * 24 * 3600 * 1000).toISOString()
        }
      ];

      this.schema.goals.unshift(...defaultGoals);
      this.save();
      userGoals = defaultGoals;
    }

    let changed = false;
    const goalsWithProgress: GoalWithProgress[] = userGoals.map(goal => {
      const progress = this.calculateGoalProgress(goal, userId);
      if (goal.status !== progress.status) {
        const oldStatus = goal.status;
        goal.status = progress.status;
        goal.updatedAt = new Date().toISOString();
        changed = true;

        // Notification trigger if newly completed
        if (progress.status === "completed" && oldStatus !== "completed") {
          this.createGoalNotification(userId, {
            type: "goal_completed",
            title: "🎯 Goal Completed!",
            message: `Congratulations! You achieved your tracking goal: "${goal.title}".`,
            data: { goalId: goal._id, targetValue: goal.targetValue }
          });
        }
      }
      return {
        ...goal,
        progress
      };
    });

    if (changed) {
      this.save();
    }

    // Filter by category
    let result = goalsWithProgress;
    if (options.category && options.category !== "all") {
      result = result.filter(g => g.category === options.category);
    }

    // Filter by status
    if (options.status && options.status !== "all") {
      result = result.filter(g => g.status === options.status);
    }

    // Sort
    result.sort((a, b) => {
      if (options.sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (options.sort === "deadline") {
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }
      if (options.sort === "progress") {
        return b.progress.percentage - a.progress.percentage;
      }
      // default newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }

  public getGoalById(goalId: string, userId: string): GoalWithProgress | null {
    if (!this.schema.goals) return null;
    const goal = this.schema.goals.find(g => g._id === goalId && g.userId === userId);
    if (!goal) return null;

    const progress = this.calculateGoalProgress(goal, userId);
    if (goal.status !== progress.status) {
      goal.status = progress.status;
      goal.updatedAt = new Date().toISOString();
      this.save();
    }

    return {
      ...goal,
      progress
    };
  }

  public updateGoal(
    goalId: string,
    userId: string,
    data: Partial<GoalTable>
  ): GoalWithProgress {
    if (!this.schema.goals) throw new Error("Goals collection not initialized.");
    const goal = this.schema.goals.find(g => g._id === goalId && g.userId === userId);
    if (!goal) throw new Error("Goal not found or unauthorized.");

    if (data.title !== undefined) goal.title = data.title.trim();
    if (data.description !== undefined) goal.description = data.description.trim();
    if (data.category !== undefined) goal.category = data.category;
    if (data.measurementType !== undefined) goal.measurementType = data.measurementType;
    if (data.targetValue !== undefined) goal.targetValue = Math.max(1, Number(data.targetValue));
    if (data.targetEmotion !== undefined) goal.targetEmotion = data.targetEmotion.trim();
    if (data.targetConfidenceThreshold !== undefined) {
      goal.targetConfidenceThreshold = Number(data.targetConfidenceThreshold);
    }
    if (data.startDate !== undefined) goal.startDate = new Date(data.startDate).toISOString();
    if (data.endDate !== undefined) goal.endDate = new Date(data.endDate).toISOString();

    goal.updatedAt = new Date().toISOString();

    const progress = this.calculateGoalProgress(goal, userId);
    goal.status = progress.status;
    this.save();

    return {
      ...goal,
      progress
    };
  }

  public deleteGoal(goalId: string, userId: string): boolean {
    if (!this.schema.goals) return false;
    const initialLen = this.schema.goals.length;
    this.schema.goals = this.schema.goals.filter(g => !(g._id === goalId && g.userId === userId));

    if (this.schema.goalProgress) {
      this.schema.goalProgress = this.schema.goalProgress.filter(
        gp => !(gp.goalId === goalId && gp.userId === userId)
      );
    }

    if (this.schema.goals.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public pauseGoal(goalId: string, userId: string): GoalWithProgress {
    if (!this.schema.goals) throw new Error("Goal collection not initialized.");
    const goal = this.schema.goals.find(g => g._id === goalId && g.userId === userId);
    if (!goal) throw new Error("Goal not found or unauthorized.");

    goal.isPaused = true;
    goal.status = "paused";
    goal.updatedAt = new Date().toISOString();
    this.save();

    const progress = this.calculateGoalProgress(goal, userId);
    return {
      ...goal,
      progress
    };
  }

  public resumeGoal(goalId: string, userId: string): GoalWithProgress {
    if (!this.schema.goals) throw new Error("Goal collection not initialized.");
    const goal = this.schema.goals.find(g => g._id === goalId && g.userId === userId);
    if (!goal) throw new Error("Goal not found or unauthorized.");

    goal.isPaused = false;
    goal.updatedAt = new Date().toISOString();

    const progress = this.calculateGoalProgress(goal, userId);
    goal.status = progress.status;
    this.save();

    return {
      ...goal,
      progress
    };
  }

  public calculateGoalProgress(goal: GoalTable, userId: string): GoalProgressCalculation {
    const allUserAnalyses = this.listAnalysesByUser(userId, { limit: 10000 }).records;
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    const now = new Date();

    // Filter valid completed analyses within goal window
    const eligibleAnalyses = allUserAnalyses.filter(session => {
      if (!session || session.status === "failed") return false;
      const createdAt = new Date(session.createdAt);
      if (isNaN(createdAt.getTime())) return false;
      return createdAt >= startDate && createdAt <= endDate;
    });

    let currentValue = 0;
    const contributingAnalysisIds: string[] = [];

    switch (goal.measurementType) {
      case "analysis_count": {
        currentValue = eligibleAnalyses.length;
        eligibleAnalyses.forEach(s => contributingAnalysisIds.push(s.analysisId));
        break;
      }

      case "positive_count": {
        const positiveAnalyses = eligibleAnalyses.filter(s => {
          const lbl = (s.overallSentiment?.label || "").toLowerCase();
          return lbl === "positive";
        });
        currentValue = positiveAnalyses.length;
        positiveAnalyses.forEach(s => contributingAnalysisIds.push(s.analysisId));
        break;
      }

      case "positive_percentage": {
        if (eligibleAnalyses.length === 0) {
          currentValue = 0;
        } else {
          const positiveAnalyses = eligibleAnalyses.filter(s => {
            const lbl = (s.overallSentiment?.label || "").toLowerCase();
            return lbl === "positive";
          });
          currentValue = Math.round((positiveAnalyses.length / eligibleAnalyses.length) * 100);
          positiveAnalyses.forEach(s => contributingAnalysisIds.push(s.analysisId));
        }
        break;
      }

      case "avg_sentiment_score": {
        if (eligibleAnalyses.length === 0) {
          currentValue = 0;
        } else {
          const totalScore = eligibleAnalyses.reduce((acc, s) => {
            const sc = typeof s.score === "number" ? s.score : (s.overallSentiment?.score ?? 0.5);
            return acc + sc;
          }, 0);
          // Scale to 0-100 or keep 0-1 based on targetValue (> 1 => 0-100)
          const rawAvg = totalScore / eligibleAnalyses.length;
          currentValue = goal.targetValue > 1 ? Math.round(rawAvg * 100) : Math.round(rawAvg * 100) / 100;
          eligibleAnalyses.forEach(s => contributingAnalysisIds.push(s.analysisId));
        }
        break;
      }

      case "emotion_count": {
        const target = (goal.targetEmotion || "").toLowerCase().trim();
        const matchingAnalyses = eligibleAnalyses.filter(s => {
          const dominant = (s.emotions?.dominant?.name || "").toLowerCase();
          const secondary = (s.emotions?.secondary || []).map(e => (e.name || "").toLowerCase());
          return dominant.includes(target) || secondary.some(sec => sec.includes(target));
        });
        currentValue = matchingAnalyses.length;
        matchingAnalyses.forEach(s => contributingAnalysisIds.push(s.analysisId));
        break;
      }

      case "emotion_percentage": {
        if (eligibleAnalyses.length === 0) {
          currentValue = 0;
        } else {
          const target = (goal.targetEmotion || "").toLowerCase().trim();
          const matchingAnalyses = eligibleAnalyses.filter(s => {
            const dominant = (s.emotions?.dominant?.name || "").toLowerCase();
            const secondary = (s.emotions?.secondary || []).map(e => (e.name || "").toLowerCase());
            return dominant.includes(target) || secondary.some(sec => sec.includes(target));
          });
          currentValue = Math.round((matchingAnalyses.length / eligibleAnalyses.length) * 100);
          matchingAnalyses.forEach(s => contributingAnalysisIds.push(s.analysisId));
        }
        break;
      }

      case "avg_confidence": {
        if (eligibleAnalyses.length === 0) {
          currentValue = 0;
        } else {
          const totalConf = eligibleAnalyses.reduce((acc, s) => {
            const conf = s.confidence || s.overallSentiment?.confidence || "Medium";
            const val = conf === "High" ? 95 : conf === "Medium" ? 75 : 50;
            return acc + val;
          }, 0);
          currentValue = Math.round(totalConf / eligibleAnalyses.length);
          eligibleAnalyses.forEach(s => contributingAnalysisIds.push(s.analysisId));
        }
        break;
      }

      case "multimodal_count": {
        const multimodalAnalyses = eligibleAnalyses.filter(s => {
          const hasImage = (s.inputSummary?.imageCount ?? 0) > 0;
          const hasVideo = (s.inputSummary?.videoCount ?? 0) > 0;
          const isMulti = (s.inputSummary?.totalFiles ?? 0) > 1 || (hasImage && (s.inputSummary?.hasDirectText || hasVideo));
          return isMulti || hasImage || hasVideo || Boolean(s.multimodalRelationship);
        });
        currentValue = multimodalAnalyses.length;
        multimodalAnalyses.forEach(s => contributingAnalysisIds.push(s.analysisId));
        break;
      }

      default:
        currentValue = eligibleAnalyses.length;
        eligibleAnalyses.forEach(s => contributingAnalysisIds.push(s.analysisId));
    }

    const targetValue = goal.targetValue;
    const remainingValue = Math.max(0, targetValue - currentValue);
    const percentage = targetValue > 0 ? Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 100))) : 0;
    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = diffMs > 0 ? Math.ceil(diffMs / (24 * 3600 * 1000)) : 0;

    let computedStatus: GoalStatus = "active";
    if (goal.isPaused) {
      computedStatus = "paused";
    } else if (now < startDate) {
      computedStatus = "not_started";
    } else if (currentValue >= targetValue) {
      computedStatus = "completed";
    } else if (now > endDate) {
      computedStatus = "expired";
    } else {
      computedStatus = "active";
    }

    // Record progress history snapshot if not recorded in last 6 hours
    if (!this.schema.goalProgress) this.schema.goalProgress = [];
    const recentSnap = this.schema.goalProgress.find(
      gp => gp.goalId === goal._id &&
      (now.getTime() - new Date(gp.calculatedAt).getTime() < 6 * 3600 * 1000)
    );

    if (!recentSnap) {
      this.schema.goalProgress.push({
        _id: `gp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        goalId: goal._id,
        userId,
        currentValue,
        targetValue,
        percentage,
        calculatedAt: now.toISOString()
      });
      // Cap at 100 snapshots per goal
      if (this.schema.goalProgress.length > 500) {
        this.schema.goalProgress = this.schema.goalProgress.slice(-300);
      }
    }

    return {
      goalId: goal._id,
      currentValue,
      targetValue,
      remainingValue,
      percentage,
      daysRemaining,
      status: computedStatus,
      contributingAnalysisIds,
      totalEligibleAnalyses: eligibleAnalyses.length,
      lastEvaluatedAt: now.toISOString()
    };
  }

  public getGoalProgressHistory(goalId: string, userId: string): GoalProgressHistoryTable[] {
    if (!this.schema.goalProgress) return [];
    return this.schema.goalProgress
      .filter(gp => gp.goalId === goalId && gp.userId === userId)
      .sort((a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime());
  }

  private createGoalNotification(
    userId: string,
    params: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, any>;
    }
  ) {
    if (!this.schema.notifications) this.schema.notifications = [];
    // Avoid spamming duplicate notifications for the same goal and type within 24 hours
    const goalId = params.data?.goalId;
    if (goalId) {
      const dayAgo = Date.now() - 24 * 3600 * 1000;
      const exists = this.schema.notifications.some(
        n => n.userId === userId &&
        n.type === params.type &&
        n.data?.goalId === goalId &&
        new Date(n.createdAt).getTime() > dayAgo
      );
      if (exists) return;
    }

    this.schema.notifications.unshift({
      _id: `notif_goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
      read: false,
      createdAt: new Date().toISOString()
    });
    this.save();
  }

  // -------------------------------------------------------------
  // MOOD & SENTIMENT TRACKING AGGREGATIONS
  // -------------------------------------------------------------

  public getMoodTrackingSummary(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      dateRange?: string;
    } = {}
  ) {
    const allUserAnalyses = this.listAnalysesByUser(userId, { limit: 10000 }).records;
    const now = new Date();
    let start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    let end = new Date(now);

    if (filters.startDate) start = new Date(filters.startDate);
    if (filters.endDate) {
      end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
    } else if (filters.dateRange) {
      if (filters.dateRange === "last7") start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      else if (filters.dateRange === "last90") start = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      else if (filters.dateRange === "last6months") start = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
      else if (filters.dateRange === "lastYear") start = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
      else if (filters.dateRange === "all") start = new Date(0);
    }

    const filtered = allUserAnalyses.filter(session => {
      if (!session || session.status === "failed") return false;
      const c = new Date(session.createdAt);
      return !isNaN(c.getTime()) && c >= start && c <= end;
    });

    const sentimentCounts: Record<string, number> = {
      Positive: 0,
      Neutral: 0,
      Negative: 0,
      Mixed: 0
    };

    const emotionCounts: Record<string, number> = {};
    const activeDatesSet = new Set<string>();
    let totalScoreSum = 0;
    let confidenceSum = 0;

    for (const session of filtered) {
      // Sentiment
      const sent = session.overallSentiment?.label || "Neutral";
      if (sentimentCounts[sent] !== undefined) sentimentCounts[sent]++;
      else sentimentCounts.Neutral++;

      // Score
      const sc = typeof session.score === "number" ? session.score : (session.overallSentiment?.score ?? 0.5);
      totalScoreSum += sc;

      // Confidence
      const conf = session.confidence || session.overallSentiment?.confidence || "Medium";
      confidenceSum += conf === "High" ? 95 : conf === "Medium" ? 75 : 50;

      // Dominant Emotion
      const dom = session.emotions?.dominant?.name || "Neutral";
      emotionCounts[dom] = (emotionCounts[dom] || 0) + 1;

      // Date
      const dateKey = session.createdAt.substring(0, 10);
      activeDatesSet.add(dateKey);
    }

    const totalAnalyses = filtered.length;
    const avgScore = totalAnalyses > 0 ? Math.round((totalScoreSum / totalAnalyses) * 100) / 100 : 0;
    const avgConfidence = totalAnalyses > 0 ? Math.round(confidenceSum / totalAnalyses) : 0;

    // Most common sentiment
    let mostCommonSentiment = "None";
    let maxSentCount = 0;
    for (const [sent, count] of Object.entries(sentimentCounts)) {
      if (count > maxSentCount) {
        maxSentCount = count;
        mostCommonSentiment = sent;
      }
    }

    // Most common emotion
    let mostCommonEmotion = "None";
    let maxEmoCount = 0;
    for (const [emo, count] of Object.entries(emotionCounts)) {
      if (count > maxEmoCount) {
        maxEmoCount = count;
        mostCommonEmotion = emo;
      }
    }

    // Analysis frequency: analyses per week
    const daysInPeriod = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000)));
    const analysesPerWeek = Math.round((totalAnalyses / (daysInPeriod / 7)) * 10) / 10;

    return {
      totalAnalyses,
      mostCommonSentiment: maxSentCount > 0 ? mostCommonSentiment : "No Data",
      mostCommonEmotion: maxEmoCount > 0 ? mostCommonEmotion : "No Data",
      averageSentimentScore: avgScore,
      averageConfidence: avgConfidence,
      analysisFrequency: analysesPerWeek,
      activeTrackingDays: activeDatesSet.size,
      sentimentDistribution: sentimentCounts,
      topEmotionSignals: Object.entries(emotionCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }

  public getSentimentTimeline(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      dateRange?: string;
      sentiment?: string;
      emotion?: string;
      limit?: number;
      page?: number;
    } = {}
  ) {
    const allUserAnalyses = this.listAnalysesByUser(userId, { limit: 10000 }).records;
    const now = new Date();
    let start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    let end = new Date(now);

    if (filters.startDate) start = new Date(filters.startDate);
    if (filters.endDate) {
      end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
    } else if (filters.dateRange) {
      if (filters.dateRange === "last7") start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      else if (filters.dateRange === "last90") start = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      else if (filters.dateRange === "last6months") start = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
      else if (filters.dateRange === "lastYear") start = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
      else if (filters.dateRange === "all") start = new Date(0);
    }

    let filtered = allUserAnalyses.filter(session => {
      if (!session || session.status === "failed") return false;
      const c = new Date(session.createdAt);
      if (isNaN(c.getTime()) || c < start || c > end) return false;

      if (filters.sentiment && filters.sentiment !== "all") {
        const sent = (session.overallSentiment?.label || "").toLowerCase();
        if (sent !== filters.sentiment.toLowerCase()) return false;
      }

      if (filters.emotion && filters.emotion !== "all") {
        const target = filters.emotion.toLowerCase();
        const dom = (session.emotions?.dominant?.name || "").toLowerCase();
        const sec = (session.emotions?.secondary || []).map(e => (e.name || "").toLowerCase());
        if (!dom.includes(target) && !sec.some(s => s.includes(target))) return false;
      }

      return true;
    });

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const offset = (page - 1) * limit;

    const items = filtered.slice(offset, offset + limit).map(session => {
      const hasImage = (session.inputSummary?.imageCount ?? 0) > 0;
      const hasVideo = (session.inputSummary?.videoCount ?? 0) > 0;
      const hasText = Boolean(session.inputSummary?.hasDirectText) || (session.inputSummary?.textCount ?? 0) > 0;

      let primaryModality: "text" | "image" | "video" | "multimodal" = "text";
      if ((hasImage && (hasVideo || hasText)) || (hasVideo && hasText) || (session.inputSummary?.totalFiles ?? 0) > 1) {
        primaryModality = "multimodal";
      } else if (hasVideo) {
        primaryModality = "video";
      } else if (hasImage) {
        primaryModality = "image";
      }

      return {
        analysisId: session.analysisId,
        date: session.createdAt,
        title: session.title || "Multimodal Analysis",
        sentiment: session.overallSentiment?.label || "Neutral",
        sentimentScore: typeof session.score === "number" ? session.score : (session.overallSentiment?.score ?? 0.5),
        dominantEmotion: session.emotions?.dominant?.name || "Neutral",
        dominantEmotionIntensity: session.emotions?.dominant?.intensity || "Moderate",
        secondaryEmotions: (session.emotions?.secondary || []).map(e => e.name),
        confidence: session.confidence || session.overallSentiment?.confidence || "Medium",
        modality: primaryModality,
        inputSummary: session.inputSummary,
        meaning: session.meaning || ""
      };
    });

    return {
      timeline: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public getSentimentTrend(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      dateRange?: string;
    } = {}
  ) {
    const allUserAnalyses = this.listAnalysesByUser(userId, { limit: 10000 }).records;
    const now = new Date();
    let start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    let end = new Date(now);

    if (filters.startDate) start = new Date(filters.startDate);
    if (filters.endDate) {
      end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
    } else if (filters.dateRange) {
      if (filters.dateRange === "last7") start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      else if (filters.dateRange === "last90") start = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      else if (filters.dateRange === "last6months") start = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
      else if (filters.dateRange === "lastYear") start = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
      else if (filters.dateRange === "all") start = new Date(0);
    }

    const filtered = allUserAnalyses.filter(session => {
      if (!session || session.status === "failed") return false;
      const c = new Date(session.createdAt);
      return !isNaN(c.getTime()) && c >= start && c <= end;
    });

    // Group only by days that actually have analyses
    const dayMap = new Map<string, {
      date: string;
      positive: number;
      neutral: number;
      negative: number;
      mixed: number;
      total: number;
      scoreSum: number;
    }>();

    for (const session of filtered) {
      const dateKey = session.createdAt.substring(0, 10);
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: dateKey,
          positive: 0,
          neutral: 0,
          negative: 0,
          mixed: 0,
          total: 0,
          scoreSum: 0
        });
      }
      const entry = dayMap.get(dateKey)!;
      entry.total++;
      const sent = session.overallSentiment?.label || "Neutral";
      if (sent === "Positive") entry.positive++;
      else if (sent === "Negative") entry.negative++;
      else if (sent === "Mixed") entry.mixed++;
      else entry.neutral++;

      const sc = typeof session.score === "number" ? session.score : (session.overallSentiment?.score ?? 0.5);
      entry.scoreSum += sc;
    }

    const points = Array.from(dayMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(p => ({
        date: p.date,
        positive: p.positive,
        neutral: p.neutral,
        negative: p.negative,
        mixed: p.mixed,
        total: p.total,
        averageScore: p.total > 0 ? Math.round((p.scoreSum / p.total) * 100) / 100 : 0
      }));

    return {
      points,
      totalAnalyses: filtered.length,
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }

  public getEmotionTimeline(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      dateRange?: string;
    } = {}
  ) {
    const allUserAnalyses = this.listAnalysesByUser(userId, { limit: 10000 }).records;
    const now = new Date();
    let start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    let end = new Date(now);

    if (filters.startDate) start = new Date(filters.startDate);
    if (filters.endDate) {
      end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
    } else if (filters.dateRange) {
      if (filters.dateRange === "last7") start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      else if (filters.dateRange === "last90") start = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      else if (filters.dateRange === "last6months") start = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
      else if (filters.dateRange === "lastYear") start = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
      else if (filters.dateRange === "all") start = new Date(0);
    }

    const filtered = allUserAnalyses.filter(session => {
      if (!session || session.status === "failed") return false;
      const c = new Date(session.createdAt);
      return !isNaN(c.getTime()) && c >= start && c <= end;
    });

    const emotionFrequency: Record<string, number> = {};
    const dateEmotionMap = new Map<string, Record<string, number>>();

    for (const session of filtered) {
      const dateKey = session.createdAt.substring(0, 10);
      if (!dateEmotionMap.has(dateKey)) {
        dateEmotionMap.set(dateKey, {});
      }
      const dayEmos = dateEmotionMap.get(dateKey)!;

      const dom = session.emotions?.dominant?.name || "Neutral";
      emotionFrequency[dom] = (emotionFrequency[dom] || 0) + 1;
      dayEmos[dom] = (dayEmos[dom] || 0) + 1;

      for (const sec of session.emotions?.secondary || []) {
        if (sec.name) {
          emotionFrequency[sec.name] = (emotionFrequency[sec.name] || 0) + 1;
          dayEmos[sec.name] = (dayEmos[sec.name] || 0) + 1;
        }
      }
    }

    const detectedEmotions = Object.entries(emotionFrequency)
      .map(([name, count]) => ({
        name,
        count,
        percentage: filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const timelinePoints = Array.from(dateEmotionMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, emotions]) => ({
        date,
        emotions
      }));

    return {
      detectedEmotions,
      timelinePoints,
      totalAnalyses: filtered.length,
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }

  // -------------------------------------------------------------
  // STEP 23: ADVANCED PRIVACY & SECURITY METHODS
  // -------------------------------------------------------------

  // --- Active Sessions ---
  public createUserSession(session: UserSessionTable): UserSessionTable {
    if (!this.schema.userSessions) {
      this.schema.userSessions = [];
    }
    this.schema.userSessions.push(session);
    this.save();
    return session;
  }

  public listUserSessions(userId: string, currentSessionId?: string): (UserSessionTable & { isCurrentSession: boolean })[] {
    const sessions = (this.schema.userSessions || [])
      .filter(s => s.userId === userId && !s.isRevoked)
      .sort((a, b) => new Date(b.lastActiveAt || b.createdAt).getTime() - new Date(a.lastActiveAt || a.createdAt).getTime());

    return sessions.map(s => ({
      ...s,
      isCurrentSession: Boolean(currentSessionId && s.sessionId === currentSessionId)
    }));
  }

  public revokeUserSession(sessionId: string, userId: string): boolean {
    if (!this.schema.userSessions) return false;
    const session = this.schema.userSessions.find(s => s.sessionId === sessionId);
    if (!session) return false;
    if (session.userId !== userId) {
      throw new Error("Forbidden: You cannot revoke another user's session.");
    }
    session.isRevoked = true;
    this.save();
    return true;
  }

  public revokeAllOtherUserSessions(userId: string, currentSessionId?: string): number {
    if (!this.schema.userSessions) return 0;
    let count = 0;
    for (const s of this.schema.userSessions) {
      if (s.userId === userId && (!currentSessionId || s.sessionId !== currentSessionId) && !s.isRevoked) {
        s.isRevoked = true;
        count++;
      }
    }
    if (count > 0) {
      this.save();
    }
    return count;
  }

  public isSessionRevoked(sessionId: string): boolean {
    if (!this.schema.userSessions) return false;
    const session = this.schema.userSessions.find(s => s.sessionId === sessionId);
    return session ? Boolean(session.isRevoked) : false;
  }

  public touchUserSession(sessionId: string): void {
    if (!this.schema.userSessions) return;
    const session = this.schema.userSessions.find(s => s.sessionId === sessionId);
    if (session && !session.isRevoked) {
      session.lastActiveAt = new Date().toISOString();
      this.save();
    }
  }

  // --- User Security Activity (Audit Logs) ---
  public listUserSecurityActivity(userId: string, limit: number = 50): AuditLogTable[] {
    return (this.schema.auditLogs || [])
      .filter(l => l.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // --- Unified Data Snapshot ---
  public getDatabaseSnapshot(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.schema));
  }

  // --- Data Export ---
  public exportUserData(userId: string): any {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const safeUser = this.toSafeUser(user);
    const profile = this.getUserProfile(userId);
    const settings = this.getUserSettings(userId);
    const analyses = this.schema.analysisSessions.filter(s => s.userId === userId);
    const reports = this.schema.reports.filter(r => r.userId === userId);
    const goals = (this.schema.goals || []).filter(g => g.userId === userId);
    const goalProgress = (this.schema.goalProgress || []).filter(p => p.userId === userId);
    const clarityConversations = (this.schema.clarityConversations || []).filter(c => c.userId === userId);
    const clarityConvIds = new Set(clarityConversations.map(c => c._id));
    const clarityMessages = (this.schema.clarityMessages || []).filter(m => clarityConvIds.has(m.conversationId));
    const searchHistory = (this.schema.searchHistory || []).filter(s => s.userId === userId);
    const posts = this.schema.posts.filter(p => p.authorId === userId);
    const comments = this.schema.comments.filter(c => c.authorId === userId);
    const notifications = (this.schema.notifications || []).filter(n => n.userId === userId);

    return {
      exportedAt: new Date().toISOString(),
      sentimentAiVersion: "2.4.0",
      exportMetadata: {
        userId,
        userName: safeUser.name,
        userEmail: safeUser.email,
        totalAnalyses: analyses.length,
        totalReports: reports.length,
        totalGoals: goals.length,
        totalClarityConversations: clarityConversations.length,
        totalSearchHistory: searchHistory.length,
        totalCommunityPosts: posts.length
      },
      user: safeUser,
      profile: profile || null,
      settings: settings || null,
      analyses: analyses.map(a => ({
        analysisId: a.analysisId,
        title: a.title,
        status: a.status,
        overallSentiment: a.overallSentiment,
        confidence: a.confidence,
        score: a.score,
        emotions: a.emotions,
        meaning: a.meaning,
        keyInsights: a.keyInsights,
        tags: a.tags,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      })),
      reports: reports.map(r => ({
        reportId: r.reportId,
        analysisId: r.analysisId,
        title: r.title,
        summary: r.summary,
        format: r.format,
        createdAt: r.createdAt
      })),
      goals: goals.map(g => ({
        ...g,
        progressHistory: goalProgress.filter(p => p.goalId === g._id)
      })),
      clarityConversations: clarityConversations.map(c => ({
        conversationId: c._id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messages: clarityMessages.filter(m => m.conversationId === c._id)
      })),
      searchHistory: searchHistory.map(s => ({
        id: s._id,
        query: s.query,
        category: s.category,
        timestamp: s.createdAt
      })),
      community: {
        posts: posts.map(p => ({
          postId: p.postId,
          content: p.content,
          privacy: p.privacy,
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          createdAt: p.createdAt
        })),
        comments: comments.map(c => ({
          commentId: c.commentId,
          postId: c.postId,
          content: c.content,
          createdAt: c.createdAt
        }))
      },
      notifications: notifications.map(n => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt
      }))
    };
  }

  // --- Granular Data Purging ---
  public deleteUserAnalyses(userId: string): number {
    const userAnalysisIds = new Set(
      this.schema.analysisSessions
        .filter(s => s.userId === userId)
        .map(s => s.analysisId)
    );

    const count = userAnalysisIds.size;
    if (count === 0) return 0;

    this.schema.analysisSessions = this.schema.analysisSessions.filter(s => s.userId !== userId);
    this.schema.analysisInputs = this.schema.analysisInputs.filter(i => !userAnalysisIds.has(i.analysisId));
    this.schema.analysisResults = this.schema.analysisResults.filter(r => !userAnalysisIds.has(r.analysisId));

    for (const id of userAnalysisIds) {
      this.sessionIndex.delete(id);
    }
    this.userSessionsIndex.delete(userId);

    this.save();
    return count;
  }

  public deleteUserReports(userId: string): number {
    const beforeCount = this.schema.reports.length;
    this.schema.reports = this.schema.reports.filter(r => r.userId !== userId);
    const deletedCount = beforeCount - this.schema.reports.length;
    if (deletedCount > 0) {
      this.save();
    }
    return deletedCount;
  }

  public deleteUserClarity(userId: string): { conversationsCount: number; messagesCount: number } {
    const convsBefore = (this.schema.clarityConversations || []).length;
    const msgsBefore = (this.schema.clarityMessages || []).length;

    const clarityConvIds = new Set((this.schema.clarityConversations || []).filter(c => c.userId === userId).map(c => c._id));
    this.schema.clarityConversations = (this.schema.clarityConversations || []).filter(c => c.userId !== userId);
    this.schema.clarityMessages = (this.schema.clarityMessages || []).filter(m => !clarityConvIds.has(m.conversationId));

    const convsDeleted = convsBefore - (this.schema.clarityConversations || []).length;
    const msgsDeleted = msgsBefore - (this.schema.clarityMessages || []).length;

    if (convsDeleted > 0 || msgsDeleted > 0) {
      this.save();
    }
    return { conversationsCount: convsDeleted, messagesCount: msgsDeleted };
  }

  public deleteUserSearchHistory(userId: string): number {
    const beforeCount = (this.schema.searchHistory || []).length;
    this.schema.searchHistory = (this.schema.searchHistory || []).filter(s => s.userId !== userId);
    const count = beforeCount - (this.schema.searchHistory || []).length;
    if (count > 0) {
      this.save();
    }
    return count;
  }

  public deleteUserGoals(userId: string): number {
    const beforeGoals = (this.schema.goals || []).length;
    this.schema.goals = (this.schema.goals || []).filter(g => g.userId !== userId);
    this.schema.goalProgress = (this.schema.goalProgress || []).filter(p => p.userId !== userId);
    const count = beforeGoals - (this.schema.goals || []).length;
    if (count > 0) {
      this.save();
    }
    return count;
  }

  // --- Complete Cascading Account Deletion ---
  public deleteUserAccount(userId: string): boolean {
    const user = this.findUserById(userId);
    if (!user) return false;

    // 1. Delete user analyses & results
    this.deleteUserAnalyses(userId);

    // 2. Delete reports
    this.deleteUserReports(userId);

    // 3. Delete clarity conversations & messages
    this.deleteUserClarity(userId);

    // 4. Delete search history
    this.deleteUserSearchHistory(userId);

    // 5. Delete goals & progress
    this.deleteUserGoals(userId);

    // 6. Delete voice sessions
    this.schema.voiceSessions = this.schema.voiceSessions.filter(s => s.userId !== userId);

    // 7. Delete user sessions
    if (this.schema.userSessions) {
      this.schema.userSessions = this.schema.userSessions.filter(s => s.userId !== userId);
    }

    // 8. Delete user profile & settings
    this.schema.userProfiles = this.schema.userProfiles.filter(p => p.userId !== userId);
    this.schema.userSettings = this.schema.userSettings.filter(s => s.userId !== userId);

    // 9. Delete community posts, comments, likes
    const userPostIds = new Set(this.schema.posts.filter(p => p.authorId === userId).map(p => p.postId));
    this.schema.posts = this.schema.posts.filter(p => p.authorId !== userId);
    this.schema.comments = this.schema.comments.filter(c => c.authorId !== userId && !userPostIds.has(c.postId));
    this.schema.likes = this.schema.likes.filter(l => l.userId !== userId && !userPostIds.has(l.postId));
    for (const pid of userPostIds) {
      this.postIndex.delete(pid);
    }

    // 10. Delete social connections (friendships, requests, blocks, notifications)
    this.schema.friendships = (this.schema.friendships || []).filter(f => f.userId !== userId && f.friendId !== userId);
    this.schema.friendRequests = (this.schema.friendRequests || []).filter(r => r.senderId !== userId && r.receiverId !== userId);
    this.schema.blocks = (this.schema.blocks || []).filter(b => b.blockerId !== userId && b.blockedId !== userId);
    this.schema.notifications = (this.schema.notifications || []).filter(n => n.userId !== userId);

    // 11. Delete conversation memberships & direct messages
    this.schema.conversationMembers = (this.schema.conversationMembers || []).filter(m => m.userId !== userId);
    this.schema.messages = (this.schema.messages || []).filter(m => m.senderId !== userId);

    // 12. Remove user from index and users table
    this.schema.users = this.schema.users.filter(u => u.id !== userId);
    this.userIdIndex.delete(userId);
    this.userEmailIndex.delete(user.email.toLowerCase());

    this.save();
    return true;
  }
}

// Export singleton database instance
export const db = new Database();
