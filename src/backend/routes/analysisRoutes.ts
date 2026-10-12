import { Router } from "express";
import { analysisController } from "../controllers/analysisController";
import { authenticateUser, optionalAuth } from "../middleware/authMiddleware";
import { aiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Core Analysis Endpoints
router.post("/", authenticateUser, aiRateLimiter, analysisController.createAnalysis);
router.get("/", authenticateUser, analysisController.listAnalyses);
router.get("/:id", authenticateUser, analysisController.getAnalysisById);
router.delete("/:id", authenticateUser, analysisController.deleteAnalysis);

export const analysisRoutes = router;
