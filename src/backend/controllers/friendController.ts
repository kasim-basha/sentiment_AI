import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { realtimeHub } from "../services/realtimeService";

export const friendController = {
  // GET /api/friends
  getFriends: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const friends = db.getFriends(userId);
      // Attach actual online presence
      const enriched = friends.map(f => ({
        ...f,
        isOnline: realtimeHub.isUserOnline(f.id)
      }));

      res.json({
        success: true,
        friends: enriched,
        total: enriched.length
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/friends/:friendId
  removeFriend: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { friendId } = req.params;

      if (!friendId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Friend ID is required." }
        });
      }

      const success = db.removeFriend(userId, friendId);
      if (success) {
        realtimeHub.sendToUser(friendId, {
          type: "friend_removed",
          userId
        });
      }

      res.json({
        success: true,
        message: "Friend removed successfully."
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/friends/requests
  sendFriendRequest: (req: Request, res: Response, next: NextFunction) => {
    try {
      const senderId = req.user!.id;
      const { receiverId } = req.body;

      if (!receiverId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Target user ID is required." }
        });
      }

      const request = db.createFriendRequest(senderId, receiverId);

      // Realtime notification
      const sender = db.findUserById(senderId);
      realtimeHub.sendToUser(receiverId, {
        type: "friend_request_received",
        request: {
          _id: request._id,
          senderId,
          receiverId,
          status: request.status,
          createdAt: request.createdAt,
          user: sender ? { id: sender.id, name: sender.name, email: sender.email, avatar: sender.avatar } : null
        }
      });

      res.status(201).json({
        success: true,
        message: "Friend request sent successfully.",
        request
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "FRIEND_REQUEST_ERROR", message: err.message || "Failed to send friend request." }
      });
    }
  },

  // GET /api/friends/requests
  getFriendRequests: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { incoming, outgoing } = db.getFriendRequests(userId);
      res.json({
        success: true,
        incoming,
        outgoing,
        totalIncoming: incoming.length,
        totalOutgoing: outgoing.length
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/friends/requests/:id/accept
  acceptFriendRequest: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = db.acceptFriendRequest(id, userId);

      // Find sender to notify
      const reqRecord = (db as any).schema.friendRequests.find((r: any) => r._id === id);
      if (reqRecord) {
        const currentUser = db.findUserById(userId);
        realtimeHub.sendToUser(reqRecord.senderId, {
          type: "friend_request_accepted",
          friend: currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar } : null
        });
      }

      res.json({
        success: true,
        message: "Friend request accepted."
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "ACCEPT_REQUEST_ERROR", message: err.message || "Failed to accept friend request." }
      });
    }
  },

  // POST /api/friends/requests/:id/reject
  rejectFriendRequest: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = db.rejectFriendRequest(id, userId);
      res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "REJECT_REQUEST_ERROR", message: err.message || "Failed to reject friend request." }
      });
    }
  },

  // DELETE /api/friends/requests/:id (Cancel)
  cancelFriendRequest: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = db.cancelFriendRequest(id, userId);
      res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "CANCEL_REQUEST_ERROR", message: err.message || "Failed to cancel friend request." }
      });
    }
  }
};
