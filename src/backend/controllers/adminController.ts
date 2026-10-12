import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { auditService } from "../services/auditService";

export const adminController = {
  getUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = db.listUsers();
      return res.json({
        success: true,
        users
      });
    } catch (err) {
      next(err);
    }
  },

  updateUserStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status !== "active" && status !== "suspended") {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_STATUS", message: "Status must be 'active' or 'suspended'." }
        });
      }

      // Prevent self-suspension
      if (id === req.user?.id) {
        return res.status(400).json({
          success: false,
          error: { code: "SELF_ACTION_NOT_ALLOWED", message: "Administrators cannot suspend their own account." }
        });
      }

      const updated = db.updateUser(id, { status });

      auditService.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: status === "suspended" ? "USER_SUSPENDED" : "USER_ACTIVATED",
        targetType: "user",
        targetId: id,
        metadata: { targetName: updated.name, targetEmail: updated.email },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `User status changed to ${status}.`,
        user: updated
      });
    } catch (err) {
      next(err);
    }
  },

  updateUserRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (role !== "user" && role !== "admin") {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ROLE", message: "Role must be 'user' or 'admin'." }
        });
      }

      // Prevent self-demotion
      if (id === req.user?.id && role !== "admin") {
        return res.status(400).json({
          success: false,
          error: { code: "SELF_DEMOTION_NOT_ALLOWED", message: "Administrators cannot remove their own admin role." }
        });
      }

      const updated = db.updateUser(id, { role });

      auditService.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: "USER_ROLE_CHANGED",
        targetType: "user",
        targetId: id,
        metadata: { newRole: role, targetName: updated.name },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `User role changed to ${role}.`,
        user: updated
      });
    } catch (err) {
      next(err);
    }
  },

  getAnalyses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = db.listAllAnalysesAdmin({ page, limit, search });
      return res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  getReports: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = db.listUsers();
      const allReports: any[] = [];
      for (const u of users) {
        const userReports = db.listReportsByUser(u.id);
        for (const rep of userReports) {
          allReports.push({
            ...rep,
            authorName: u.name,
            authorEmail: u.email
          });
        }
      }
      return res.json({
        success: true,
        reports: allReports
      });
    } catch (err) {
      next(err);
    }
  },

  getStatistics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = db.getSystemStatistics();
      return res.json({
        success: true,
        statistics: stats
      });
    } catch (err) {
      next(err);
    }
  },

  getSystemInfo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mem = process.memoryUsage();
      return res.json({
        success: true,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          uptimeSeconds: Math.floor(process.uptime()),
          memory: {
            rssMb: Math.round(mem.rss / 1024 / 1024),
            heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
            heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024)
          },
          environment: process.env.NODE_ENV || "development",
          databaseStatus: "healthy",
          geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  getCommunityReports: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      const reports = db.listCommunityReports(status);
      return res.json({
        success: true,
        reports
      });
    } catch (err) {
      next(err);
    }
  },

  actionCommunityReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, actionTaken, removeTarget } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Status is required." }
        });
      }

      const report = db.updateCommunityReportStatus(id, status, actionTaken);

      // If requested, take down the reported post or comment
      if (removeTarget) {
        if (report.targetType === "post") {
          db.deletePost(report.targetId, "admin", true);
        } else if (report.targetType === "comment") {
          db.deleteComment(report.targetId, "admin", true);
        }
      }

      auditService.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: "COMMUNITY_MODERATED",
        targetType: report.targetType,
        targetId: report.targetId,
        metadata: { reportId: id, status, actionTaken, removed: Boolean(removeTarget) },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: "Community report resolved successfully.",
        report
      });
    } catch (err) {
      next(err);
    }
  },

  getAuditLogs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const action = req.query.action ? String(req.query.action) : undefined;
      const userId = req.query.userId ? String(req.query.userId) : undefined;

      const logs = db.listAuditLogs({ limit, action, userId });
      return res.json({
        success: true,
        logs
      });
    } catch (err) {
      next(err);
    }
  }
};
