import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { realtimeHub } from "../services/realtimeService";

export const messageController = {
  // PATCH /api/messages/:id/read
  markAsRead: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const updated = db.markMessageAsRead(id, userId);

      // Notify sender that message was read
      realtimeHub.sendToUser(updated.senderId, {
        type: "message_read",
        messageId: updated._id,
        conversationId: updated.conversationId,
        readBy: userId
      });

      res.json({
        success: true,
        message: updated
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "READ_ERROR", message: err.message || "Failed to mark message as read." }
      });
    }
  },

  // DELETE /api/messages/:id
  deleteMessage: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = db.deleteMessage(id, userId);
      res.json(result);
    } catch (err: any) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: err.message || "Unable to delete message." }
      });
    }
  }
};
