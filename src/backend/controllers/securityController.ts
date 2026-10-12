import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { validators } from "../validators";
import { auditService } from "../services/auditService";
import { hashPassword, comparePassword } from "../auth/password";

export const securityController = {
  // GET /api/security/sessions
  getSessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const currentSessionId = req.tokenPayload?.sessionId;

      const sessions = db.listUserSessions(userId, currentSessionId);
      return res.json({
        success: true,
        sessions
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/security/sessions/logout
  logoutSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const sessionId = req.body?.sessionId ? String(req.body.sessionId).trim() : "";

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Session ID is required." }
        });
      }

      const revoked = db.revokeUserSession(sessionId, userId);
      if (!revoked) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Session not found or already revoked." }
        });
      }

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "SESSION_REVOKED",
        targetType: "session",
        targetId: sessionId,
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: "Session terminated successfully."
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/security/sessions/logout-all
  logoutAllOtherSessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const currentSessionId = req.tokenPayload?.sessionId;

      const count = db.revokeAllOtherUserSessions(userId, currentSessionId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "ALL_OTHER_SESSIONS_REVOKED",
        targetType: "sessions",
        targetId: userId,
        metadata: { revokedCount: count },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `Signed out of ${count} other active session${count === 1 ? "" : "s"}.`,
        revokedCount: count
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/security/change-password
  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = validators.validatePasswordChange(req.body);

      const user = db.findUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "User not found." }
        });
      }

      // Check current password
      const isCurrentCorrect = await comparePassword(currentPassword, user.passwordHash);
      if (!isCurrentCorrect) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INCORRECT_CURRENT_PASSWORD",
            message: "The current password entered is incorrect."
          }
        });
      }

      // Hash and update
      const newHash = await hashPassword(newPassword);
      db.updateUser(userId, {
        passwordHash: newHash,
        updatedAt: new Date().toISOString()
      });

      // Revoke other sessions for security
      const currentSessionId = req.tokenPayload?.sessionId;
      db.revokeAllOtherUserSessions(userId, currentSessionId);

      // Audit Log
      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "PASSWORD_CHANGED",
        targetType: "user",
        targetId: userId,
        ipAddress: req.ip
      });

      // Send in-app notification to user
      try {
        db.createNotification({
          userId,
          type: "system",
          title: "🔐 Security Alert: Password Changed",
          message: "Your SentimentAI account password was recently changed. If this wasn't you, please secure your account immediately."
        });
      } catch {
        // non-blocking
      }

      return res.json({
        success: true,
        message: "Your password has been changed securely. Other active sessions have been signed out."
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/security/activity
  getSecurityActivity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;

      const logs = db.listUserSecurityActivity(userId, Math.min(100, Math.max(1, limit)));

      // Map to safe format without internal details
      const safeEvents = logs.map(l => ({
        id: l.id,
        userId: l.userId,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        metadata: l.metadata,
        ipAddress: l.ipAddress || "Local / Secure",
        timestamp: l.timestamp
      }));

      return res.json({
        success: true,
        events: safeEvents
      });
    } catch (err) {
      next(err);
    }
  }
};
