import { Router } from "express";
import { notificationController } from "../controllers/notificationController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateUser);

router.get("/", notificationController.getNotifications);
router.get("/counts", notificationController.getNotificationCounts);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/read-all", notificationController.markAllAsRead);

export const notificationRoutes = router;
