import { Request, Response, NextFunction } from "express";
import { db } from "../database";

export const settingsController = {
  getSettings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const settings = db.getUserSettings(userId);
      return res.json({
        success: true,
        settings
      });
    } catch (err) {
      next(err);
    }
  },

  updateSettings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { appearance, notifications, privacy, language } = req.body;
      const updates: any = {};
      if (appearance) updates.appearance = appearance;
      if (notifications) updates.notifications = notifications;
      if (privacy) updates.privacy = privacy;
      if (language) updates.language = language;

      const updated = db.updateUserSettings(userId, updates);
      return res.json({
        success: true,
        message: "Settings updated successfully.",
        settings: updated
      });
    } catch (err) {
      next(err);
    }
  }
};
