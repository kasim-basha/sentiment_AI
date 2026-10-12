import { Router } from "express";
import { messageController } from "../controllers/messageController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateUser);

router.patch("/:id/read", messageController.markAsRead);
router.delete("/:id", messageController.deleteMessage);

export const messageRoutes = router;
