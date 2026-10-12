import { Request, Response, NextFunction } from "express";
import { db } from "../database";

export const notificationController = {
  // GET /api/notifications
  getNotifications: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const notifications = db.getNotifications(userId);
      res.json({
        success: true,
        notifications,
        total: notifications.length
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/notifications/:id/read
  markAsRead: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notif = db.markNotificationAsRead(id, userId);
      res.json({
        success: true,
        notification: notif
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/notifications/read-all
  markAllAsRead: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const result = db.markAllNotificationsAsRead(userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/notifications/counts
  getNotificationCounts: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const counts = db.getUnreadCounts(userId);
      res.json({
        success: true,
        counts
      });
    } catch (err) {
      next(err);
    }
  }
};
