import { Router } from "express";
import { chatbotController } from "../controllers/chatbotController";
import { optionalAuth } from "../middleware/authMiddleware";
import { aiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Chatbot routes (support optional auth so users or guests can chat)
router.post("/message", optionalAuth, aiRateLimiter, chatbotController.sendMessage);
router.get("/personas", chatbotController.getPersonas);

export const chatbotRoutes = router;
