import { Request, Response, NextFunction } from "express";
import { db } from "../database";

export const blockController = {
  // GET /api/blocks
  getBlockedUsers: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const list = db.getBlockedUsers(userId);
      res.json({
        success: true,
        blocks: list,
        total: list.length
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/blocks/:userId
  blockUser: (req: Request, res: Response, next: NextFunction) => {
    try {
      const blockerId = req.user!.id;
      const { userId: blockedId } = req.params;

      const result = db.blockUser(blockerId, blockedId);
      res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BLOCK_ERROR", message: err.message || "Failed to block user." }
      });
    }
  },

  // DELETE /api/blocks/:userId
  unblockUser: (req: Request, res: Response, next: NextFunction) => {
    try {
      const blockerId = req.user!.id;
      const { userId: blockedId } = req.params;

      const result = db.unblockUser(blockerId, blockedId);
      res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "UNBLOCK_ERROR", message: err.message || "Failed to unblock user." }
      });
    }
  }
};
