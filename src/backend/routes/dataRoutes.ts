import { Router } from "express";
import { privacyController } from "../controllers/privacyController";
import { authenticateUser } from "../middleware/authMiddleware";
import { sensitiveSecurityRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Central database retrieval
router.get("/all", authenticateUser, sensitiveSecurityRateLimiter, privacyController.getDatabaseSnapshot);
router.get("/snapshot", authenticateUser, sensitiveSecurityRateLimiter, privacyController.getDatabaseSnapshot);

// Data Export (supports both GET and POST)
router.get("/export", authenticateUser, sensitiveSecurityRateLimiter, privacyController.exportData);
router.post("/export", authenticateUser, sensitiveSecurityRateLimiter, privacyController.exportData);

// Data Purging
router.delete("/analyses", authenticateUser, sensitiveSecurityRateLimiter, privacyController.deleteAnalyses);
router.delete("/reports", authenticateUser, sensitiveSecurityRateLimiter, privacyController.deleteReports);
router.delete("/clarity", authenticateUser, sensitiveSecurityRateLimiter, privacyController.deleteClarity);
router.delete("/search-history", authenticateUser, sensitiveSecurityRateLimiter, privacyController.deleteSearchHistory);
router.delete("/goals", authenticateUser, sensitiveSecurityRateLimiter, privacyController.deleteGoals);

export const dataRoutes = router;
