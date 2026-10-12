import { Request, Response, NextFunction } from "express";
import { db } from "../database";

export const userController = {
  // GET /api/users/search?query=...
  searchUsers: (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const query = (req.query.query as string) || (req.query.q as string) || "";

      const users = db.searchUsers(query, currentUserId);
      res.json({
        success: true,
        users,
        total: users.length
      });
    } catch (err) {
      next(err);
    }
  }
};
