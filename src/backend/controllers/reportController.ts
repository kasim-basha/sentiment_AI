import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { auditService } from "../services/auditService";
import { ReportTable } from "../database/types";

export const reportController = {
  listReports: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const reports = db.listReportsByUser(userId);
      return res.json({
        success: true,
        reports
      });
    } catch (err) {
      next(err);
    }
  },

  getReportById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const report = db.getReport(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Report not found." }
        });
      }

      // Check ownership or admin
      if (report.userId !== userId && userRole !== "admin") {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You do not have permission to view this report." }
        });
      }

      // Include associated analysis data if available
      const analysis = db.getAnalysisSession(report.analysisId);
      const analysisResult = db.getAnalysisResult(report.analysisId);

      return res.json({
        success: true,
        report,
        analysis,
        analysisResult: analysisResult?.fullResultJson
      });
    } catch (err) {
      next(err);
    }
  },

  createReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { analysisId, title, summary, format } = req.body;
      if (!analysisId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Analysis ID is required to generate a report." }
        });
      }

      const analysis = db.getAnalysisSession(analysisId);
      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Target analysis not found." }
        });
      }

      // Ensure user owns the analysis
      if (analysis.userId !== userId && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You can only generate reports for your own analyses." }
        });
      }

      const now = new Date().toISOString();
      const newReport: ReportTable = {
        reportId: "rep_" + Math.random().toString(36).substring(2, 10),
        userId,
        analysisId,
        title: title ? String(title).trim() : `Executive Briefing: ${analysis.title || 'Sentiment Report'}`,
        summary: summary ? String(summary).trim() : (analysis.meaning || "Comprehensive multimodal analysis summary."),
        format: format || "executive",
        status: "completed",
        createdAt: now,
        updatedAt: now
      };

      const saved = db.createReport(newReport);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "REPORT_GENERATED",
        targetType: "report",
        targetId: saved.reportId,
        metadata: { title: saved.title, analysisId },
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        report: saved
      });
    } catch (err) {
      next(err);
    }
  },

  deleteReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const report = db.getReport(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Report not found." }
        });
      }

      if (report.userId !== userId && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You can only delete your own reports." }
        });
      }

      db.deleteReport(id, report.userId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "REPORT_DELETED",
        targetType: "report",
        targetId: id,
        metadata: { title: report.title },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: "Report deleted successfully."
      });
    } catch (err) {
      next(err);
    }
  }
};
