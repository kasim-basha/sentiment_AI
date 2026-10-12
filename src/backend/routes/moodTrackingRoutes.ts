import { Router } from "express";
import { moodTrackingController } from "../controllers/moodTrackingController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

// All mood & sentiment tracking endpoints require authenticated user context
router.use(authenticateUser);

router.get("/", moodTrackingController.getTrackingSummary);
router.get("/timeline", moodTrackingController.getSentimentTimeline);
router.get("/sentiment", moodTrackingController.getSentimentTrend);
router.get("/emotions", moodTrackingController.getEmotionTimeline);

export const moodTrackingRoutes = router;
