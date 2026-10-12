import { Router } from "express";
import { authController } from "../controllers/authController";
import { authenticateUser } from "../middleware/authMiddleware";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authRateLimiter, authController.register);
router.post("/login", authRateLimiter, authController.login);
router.post("/social-login", authRateLimiter, authController.socialLogin);
router.post("/forgot-password", authRateLimiter, authController.forgotPassword);
router.post("/verify-reset-code", authRateLimiter, authController.verifyResetCode);
router.post("/reset-password", authRateLimiter, authController.resetPassword);
router.post("/logout", authController.logout);
router.get("/me", authenticateUser, authController.getMe);

export const authRoutes = router;
