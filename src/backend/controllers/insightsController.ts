import { Request, Response, NextFunction } from "express";
import { aiInsightsService } from "../services/aiInsightsService";
import { db } from "../database";

export const insightsController = {
  // GET /api/insights
  getInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required to generate insights." }
        });
      }

      const forceRefresh = req.query.forceRefresh === "true" || req.query.refresh === "true";
      const insightsResult = await aiInsightsService.getInsights(userId, req.query, forceRefresh);

      return res.json({
        success: true,
        data: insightsResult
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/insights/refresh
  refreshInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const queryFilters = req.body.filters || req.query;
      const insightsResult = await aiInsightsService.getInsights(userId, queryFilters, true);

      return res.json({
        success: true,
        message: "AI insights refreshed successfully.",
        data: insightsResult
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/insights/save
  saveSnapshot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const snapshotData = req.body;
      if (!snapshotData || !snapshotData.insights) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_BODY", message: "Snapshot payload with insights is required." }
        });
      }

      const saved = await aiInsightsService.saveSnapshot(userId, snapshotData);

      return res.status(201).json({
        success: true,
        message: "Insights snapshot successfully saved.",
        data: saved
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/insights/snapshots
  getSnapshots: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const snapshots = await aiInsightsService.getSavedSnapshots(userId);

      return res.json({
        success: true,
        data: snapshots
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/insights/snapshots/:id
  getSnapshotById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const snapshot = db.getAIInsightSnapshotById(req.params.id, userId);
      if (!snapshot) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Insight snapshot not found." }
        });
      }

      return res.json({
        success: true,
        data: snapshot
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/insights/snapshots/:id
  deleteSnapshot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const deleted = await aiInsightsService.deleteSnapshot(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Snapshot not found or unauthorized." }
        });
      }

      return res.json({
        success: true,
        message: "Snapshot deleted successfully."
      });
    } catch (err) {
      next(err);
    }
  }
};
