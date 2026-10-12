import { Router } from "express";
import { securityController } from "../controllers/securityController";
import { authenticateUser } from "../middleware/authMiddleware";
import { sensitiveSecurityRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Sessions management
router.get("/sessions", authenticateUser, securityController.getSessions);
router.post("/sessions/logout", authenticateUser, sensitiveSecurityRateLimiter, securityController.logoutSession);
router.post("/sessions/logout-all", authenticateUser, sensitiveSecurityRateLimiter, securityController.logoutAllOtherSessions);

// Password change
router.post("/change-password", authenticateUser, sensitiveSecurityRateLimiter, securityController.changePassword);

// Security activity (audit logs for current user)
router.get("/activity", authenticateUser, securityController.getSecurityActivity);

export const securityRoutes = router;
