import { Router } from "express";
import { conversationController } from "../controllers/conversationController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateUser);

router.get("/", conversationController.getConversations);
router.post("/", conversationController.createConversation);
router.get("/:id", conversationController.getConversationById);
router.get("/:id/messages", conversationController.getMessages);
router.post("/:id/messages", conversationController.sendMessage);

export const conversationRoutes = router;
