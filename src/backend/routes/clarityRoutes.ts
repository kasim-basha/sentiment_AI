import { Router } from "express";
import { clarityController } from "../controllers/clarityController";
import { authenticateUser } from "../middleware/authMiddleware";
import { aiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// All clarity assistant endpoints require authentication
router.use(authenticateUser);

// Conversations management
router.post("/conversations", clarityController.createConversation);
router.get("/conversations", clarityController.getConversations);
router.get("/conversations/:id", clarityController.getConversation);
router.post("/conversations/:id/messages", aiRateLimiter, clarityController.sendMessage);
router.delete("/conversations/:id", clarityController.deleteConversation);

// Quick explanation endpoint
router.post("/explain", aiRateLimiter, clarityController.quickExplain);

export const clarityRoutes = router;
