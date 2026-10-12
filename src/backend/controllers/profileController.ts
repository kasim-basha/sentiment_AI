import { Request, Response, NextFunction } from "express";
import { db } from "../database";

export const profileController = {
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      let profile = db.getUserProfile(userId);
      if (!profile) {
        profile = db.createUserProfile({
          userId,
          name: req.user.name,
          email: req.user.email,
          updatedAt: new Date().toISOString()
        });
      }

      return res.json({
        success: true,
        profile
      });
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { name, bio, avatarUrl, title, organization, location, phone, socialLinks } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = String(name).trim();
      if (bio !== undefined) updates.bio = String(bio).trim();
      if (avatarUrl !== undefined) updates.avatarUrl = String(avatarUrl).trim();
      if (title !== undefined) updates.title = String(title).trim();
      if (organization !== undefined) updates.organization = String(organization).trim();
      if (location !== undefined) updates.location = String(location).trim();
      if (phone !== undefined) updates.phone = String(phone).trim();
      if (socialLinks !== undefined && typeof socialLinks === "object") updates.socialLinks = socialLinks;

      const updated = db.updateUserProfile(userId, updates);

      // If name was updated, also update User table and req.user
      if (updates.name) {
        db.updateUser(userId, { name: updates.name });
      }

      return res.json({
        success: true,
        message: "Profile updated successfully.",
        profile: updated
      });
    } catch (err) {
      next(err);
    }
  }
};
