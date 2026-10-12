import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { analysisRoutes } from "./analysisRoutes";
import { reportRoutes } from "./reportRoutes";
import { profileRoutes } from "./profileRoutes";
import { settingsRoutes } from "./settingsRoutes";
import { voiceRoutes } from "./voiceRoutes";
import { communityRoutes } from "./communityRoutes";
import { adminRoutes } from "./adminRoutes";
import { friendRoutes } from "./friendRoutes";
import { conversationRoutes } from "./conversationRoutes";
import { messageRoutes } from "./messageRoutes";
import { callRoutes } from "./callRoutes";
import { blockRoutes } from "./blockRoutes";
import { notificationRoutes } from "./notificationRoutes";
import { userRoutes } from "./userRoutes";
import { searchRoutes } from "./searchRoutes";
import { clarityRoutes } from "./clarityRoutes";
import { analyticsRoutes } from "./analyticsRoutes";
import { chatbotRoutes } from "./chatbotRoutes";
import { insightsRoutes } from "./insightsRoutes";
import { goalRoutes } from "./goalRoutes";
import { moodTrackingRoutes } from "./moodTrackingRoutes";
import { securityRoutes } from "./securityRoutes";
import { dataRoutes } from "./dataRoutes";
import { accountRoutes } from "./accountRoutes";
import { cloudStorageRoutes } from "./cloudStorageRoutes";
import { analysisController } from "../controllers/analysisController";
import { optionalAuth } from "../middleware/authMiddleware";
import { aiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Health Check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SentimentAI Core Backend",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Modular Routes
router.use("/auth", authRoutes);
router.use("/analyses", analysisRoutes);
router.use("/reports", reportRoutes);
router.use("/profile", profileRoutes);
router.use("/settings", settingsRoutes);
router.use("/voice", voiceRoutes);
router.use("/community", communityRoutes);
router.use("/admin", adminRoutes);

// Step 16: Friends, Chat, Audio/Video Calls, Blocks & Notifications
router.use("/friends", friendRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/calls", callRoutes);
router.use("/blocks", blockRoutes);
router.use("/notifications", notificationRoutes);
router.use("/users", userRoutes);

// Step 18: Global Search
router.use("/search", searchRoutes);

// Step 19: GenAI Clarity Assistant
router.use("/clarity", clarityRoutes);

// Step 20: Advanced Analytics
router.use("/analytics", analyticsRoutes);

// Step 21: AI Insights & Recommendations
router.use("/insights", insightsRoutes);

// Step 22: Goals & Mood Tracking
router.use("/goals", goalRoutes);
router.use("/mood-tracking", moodTrackingRoutes);

// Step 23: Advanced Privacy & Security
router.use("/security", securityRoutes);
router.use("/data", dataRoutes);
router.use("/account", accountRoutes);

// Automatic Cloud Storage & Sync
router.use("/cloud-storage", cloudStorageRoutes);

// Gemini Chatbot Assistant
router.use("/chatbot", chatbotRoutes);
router.use("/chat", chatbotRoutes);

// Compatibility Endpoints for existing frontend service calls
router.post("/analyze/multimodal", optionalAuth, aiRateLimiter, analysisController.createAnalysis);
router.post("/translate/summary", analysisController.translateVoiceSummary);

export const apiRouter = router;
