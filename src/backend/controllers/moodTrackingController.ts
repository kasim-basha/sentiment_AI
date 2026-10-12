import { Request, Response, NextFunction } from "express";
import { db } from "../database";

export const moodTrackingController = {
  // GET /api/mood-tracking
  getTrackingSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, dateRange } = req.query;

      const summary = db.getMoodTrackingSummary(userId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        dateRange: dateRange ? String(dateRange) : undefined
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/mood-tracking/timeline
  getSentimentTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, dateRange, sentiment, emotion, limit, page } = req.query;

      const result = db.getSentimentTimeline(userId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        dateRange: dateRange ? String(dateRange) : undefined,
        sentiment: sentiment ? String(sentiment) : undefined,
        emotion: emotion ? String(emotion) : undefined,
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/mood-tracking/sentiment
  getSentimentTrend: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, dateRange } = req.query;

      const result = db.getSentimentTrend(userId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        dateRange: dateRange ? String(dateRange) : undefined
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/mood-tracking/emotions
  getEmotionTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, dateRange } = req.query;

      const result = db.getEmotionTimeline(userId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        dateRange: dateRange ? String(dateRange) : undefined
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};
