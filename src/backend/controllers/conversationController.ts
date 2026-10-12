import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { realtimeHub } from "../services/realtimeService";

export const conversationController = {
  // GET /api/conversations
  getConversations: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const list = db.getConversations(userId);
      // Attach online status
      const enriched = list.map(c => ({
        ...c,
        friend: c.friend ? {
          ...c.friend,
          isOnline: realtimeHub.isUserOnline(c.friend.id)
        } : null
      }));

      res.json({
        success: true,
        conversations: enriched,
        total: enriched.length
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/conversations (Start/Get private conversation)
  createConversation: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { friendId } = req.body;

      if (!friendId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Target friend ID is required." }
        });
      }

      const conversation = db.getOrCreateConversation(userId, friendId);
      const full = db.getConversationById(conversation._id, userId);

      res.status(201).json({
        success: true,
        conversation: {
          ...full,
          friend: full.friend ? {
            ...full.friend,
            isOnline: realtimeHub.isUserOnline(full.friend.id)
          } : null
        }
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "CONVERSATION_ERROR", message: err.message || "Failed to initiate conversation." }
      });
    }
  },

  // GET /api/conversations/:id
  getConversationById: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const conversation = db.getConversationById(id, userId);
      res.json({
        success: true,
        conversation: {
          ...conversation,
          friend: conversation.friend ? {
            ...conversation.friend,
            isOnline: realtimeHub.isUserOnline(conversation.friend.id)
          } : null
        }
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: err.message || "Conversation not found." }
      });
    }
  },

  // GET /api/conversations/:id/messages
  getMessages: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const result = db.getMessages(id, userId, page, limit);
      res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: err.message || "Unable to load messages." }
      });
    }
  },

  // POST /api/conversations/:id/messages
  sendMessage: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Message content cannot be empty." }
        });
      }

      const message = db.createMessage(id, userId, content);

      // Create notification for receiver
      const sender = db.findUserById(userId);
      db.createNotification({
        userId: message.receiverId,
        type: "new_message",
        title: `New message from ${sender?.name || "Someone"}`,
        message: content.length > 60 ? `${content.slice(0, 57)}...` : content,
        data: {
          conversationId: id,
          messageId: message._id,
          senderId: userId,
          senderName: sender?.name || "Friend",
          content
        }
      });

      // Realtime push
      realtimeHub.sendToUser(message.receiverId, {
        type: "new_message",
        message
      });

      res.status(201).json({
        success: true,
        message
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "MESSAGE_ERROR", message: err.message || "Failed to send message." }
      });
    }
  }
};
