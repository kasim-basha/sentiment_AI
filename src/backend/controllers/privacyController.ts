import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { validators } from "../validators";
import { auditService } from "../services/auditService";
import { config } from "../config";
import { comparePassword } from "../auth/password";

export const privacyController = {
  // GET /api/settings/privacy
  getPrivacySettings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const settings = db.getUserSettings(userId);
      return res.json({
        success: true,
        privacy: settings.privacy
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH or PUT /api/settings/privacy
  updatePrivacySettings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const validatedPrivacy = validators.validatePrivacySettings(req.body);

      const updated = db.updateUserSettings(userId, {
        privacy: validatedPrivacy
      });

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "PRIVACY_SETTINGS_UPDATED",
        targetType: "settings",
        targetId: userId,
        metadata: { updatedFields: Object.keys(validatedPrivacy) },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: "Privacy settings updated successfully.",
        privacy: updated.privacy
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/data/snapshot or /api/data/all
  getDatabaseSnapshot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.role === "admin";
      const payload = isAdmin ? db.getDatabaseSnapshot() : db.exportUserData(userId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: isAdmin ? "FULL_DATABASE_ACCESSED" : "USER_DATA_RETRIEVED",
        targetType: "database",
        targetId: userId,
        metadata: { admin: isAdmin },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        data: payload
      });
    } catch (err) {
      next(err);
    }
  },

  // POST or GET /api/data/export
  exportData: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const exportPayload = db.exportUserData(userId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "DATA_EXPORTED",
        targetType: "user_data",
        targetId: userId,
        metadata: { summary: exportPayload.exportMetadata },
        ipAddress: req.ip
      });

      // Set download headers
      const fileName = `sentimentai-data-export-${new Date().toISOString().substring(0, 10)}.json`;
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/json; charset=utf-8");

      return res.json({
        success: true,
        data: exportPayload
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/data/analyses
  deleteAnalyses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const deletedCount = db.deleteUserAnalyses(userId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "ANALYSES_PURGED",
        targetType: "analyses",
        targetId: userId,
        metadata: { deletedCount },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} saved analysis session${deletedCount === 1 ? "" : "s"}.`,
        deletedCount
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/data/reports
  deleteReports: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const deletedCount = db.deleteUserReports(userId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "REPORTS_PURGED",
        targetType: "reports",
        targetId: userId,
        metadata: { deletedCount },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} generated report${deletedCount === 1 ? "" : "s"}.`,
        deletedCount
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/data/clarity
  deleteClarity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { conversationsCount, messagesCount } = db.deleteUserClarity(userId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "CLARITY_CONVERSATIONS_PURGED",
        targetType: "clarity",
        targetId: userId,
        metadata: { conversationsCount, messagesCount },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `Successfully deleted ${conversationsCount} AI Clarity conversation${conversationsCount === 1 ? "" : "s"} and ${messagesCount} message${messagesCount === 1 ? "" : "s"}.`,
        conversationsCount,
        messagesCount
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/data/search-history
  deleteSearchHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const deletedCount = db.deleteUserSearchHistory(userId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "SEARCH_HISTORY_PURGED",
        targetType: "search_history",
        targetId: userId,
        metadata: { deletedCount },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `Successfully cleared ${deletedCount} search history quer${deletedCount === 1 ? "y" : "ies"}.`,
        deletedCount
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/data/goals
  deleteGoals: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const deletedCount = db.deleteUserGoals(userId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "GOALS_PURGED",
        targetType: "goals",
        targetId: userId,
        metadata: { deletedCount },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} tracking goal${deletedCount === 1 ? "" : "s"} and progress histor${deletedCount === 1 ? "y" : "ies"}.`,
        deletedCount
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/account
  deleteAccount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { confirmation } = validators.validateAccountDeletion(req.body);

      const user = db.findUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "User account not found." }
        });
      }

      // Check confirmation: either exact string "DELETE" or valid current password
      const isWordConfirmed = confirmation.trim().toUpperCase() === "DELETE";
      let isPasswordConfirmed = false;
      if (!isWordConfirmed && user.passwordHash) {
        isPasswordConfirmed = await comparePassword(confirmation, user.passwordHash);
      }

      if (!isWordConfirmed && !isPasswordConfirmed) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_CONFIRMATION",
            message: "To permanently delete your account, enter 'DELETE' or your current password."
          }
        });
      }

      // Log audit before deleting
      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "ACCOUNT_DELETED",
        targetType: "user",
        targetId: userId,
        metadata: { email: user.email },
        ipAddress: req.ip
      });

      // Cascade delete user
      db.deleteUserAccount(userId);

      // Clear cookie
      res.clearCookie(config.cookieName);

      return res.json({
        success: true,
        message: "Your SentimentAI account and all associated data have been permanently deleted."
      });
    } catch (err) {
      next(err);
    }
  }
};
