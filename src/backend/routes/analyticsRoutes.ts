import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

// Protect all analytics endpoints with server-side authentication
router.use(authenticateUser);

// 1. Overview Summary
router.get("/summary", analyticsController.getSummary);

// 2. Sentiment Trend
router.get("/sentiment-trend", analyticsController.getSentimentTrend);

// 3. Emotions Frequency & Distribution
router.get("/emotions", analyticsController.getEmotions);

// 4. Input Type Distribution
router.get("/input-types", analyticsController.getInputTypes);

// 5. AI Confidence Analytics
router.get("/confidence", analyticsController.getConfidence);

// 6. Sentiment Distribution
router.get("/sentiment-distribution", analyticsController.getSentimentDistribution);

// 7. Analysis Activity
router.get("/activity", analyticsController.getActivity);

// 8. Multimodal Insights
router.get("/multimodal", analyticsController.getMultimodal);

// 9. Period Comparison
router.get("/compare", analyticsController.getCompare);

// 10. Export Analytics
router.get("/export", analyticsController.getExport);

// 11. Full Dashboard Consolidated Payload (Ultra-fast load)
router.get("/full", analyticsController.getFullAnalytics);

export const analyticsRoutes = router;
