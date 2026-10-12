import { Router } from "express";
import { privacyController } from "../controllers/privacyController";
import { authenticateUser } from "../middleware/authMiddleware";
import { sensitiveSecurityRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Account Deletion
router.delete("/", authenticateUser, sensitiveSecurityRateLimiter, privacyController.deleteAccount);

export const accountRoutes = router;
