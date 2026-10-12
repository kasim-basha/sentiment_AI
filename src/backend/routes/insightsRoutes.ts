import { Router } from "express";
import { insightsController } from "../controllers/insightsController";
import { authenticateUser } from "../middleware/authMiddleware";
import { aiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// All insight routes require user authentication
router.get("/", authenticateUser, insightsController.getInsights);
router.post("/refresh", authenticateUser, aiRateLimiter, insightsController.refreshInsights);
router.post("/save", authenticateUser, insightsController.saveSnapshot);
router.get("/snapshots", authenticateUser, insightsController.getSnapshots);
router.get("/snapshots/:id", authenticateUser, insightsController.getSnapshotById);
router.delete("/snapshots/:id", authenticateUser, insightsController.deleteSnapshot);

export const insightsRoutes = router;
