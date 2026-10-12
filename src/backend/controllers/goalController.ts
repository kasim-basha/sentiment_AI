import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { GoalCategory, GoalMeasurementType } from "../database/types";

const VALID_CATEGORIES: GoalCategory[] = [
  "activity",
  "sentiment",
  "emotion",
  "confidence",
  "trend",
  "multimodal"
];

const VALID_MEASUREMENT_TYPES: GoalMeasurementType[] = [
  "analysis_count",
  "positive_count",
  "positive_percentage",
  "avg_sentiment_score",
  "emotion_count",
  "emotion_percentage",
  "avg_confidence",
  "multimodal_count"
];

export const goalController = {
  // GET /api/goals
  getGoals: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { status, category, sort } = req.query;

      const goals = db.getGoals(userId, {
        status: status ? String(status) : undefined,
        category: category ? String(category) : undefined,
        sort: sort ? String(sort) : undefined
      });

      res.json({
        success: true,
        data: goals,
        total: goals.length
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/goals
  createGoal: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const {
        title,
        description,
        category,
        measurementType,
        targetValue,
        targetEmotion,
        targetConfidenceThreshold,
        startDate,
        endDate
      } = req.body;

      // Validation
      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_TITLE", message: "Goal title is required." }
        });
      }

      if (!category || !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_CATEGORY", message: `Invalid goal category. Supported: ${VALID_CATEGORIES.join(", ")}` }
        });
      }

      if (!measurementType || !VALID_MEASUREMENT_TYPES.includes(measurementType)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_MEASUREMENT_TYPE", message: `Invalid measurement type. Supported: ${VALID_MEASUREMENT_TYPES.join(", ")}` }
        });
      }

      const numTarget = Number(targetValue);
      if (isNaN(numTarget) || numTarget <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_TARGET", message: "Target value must be a positive number." }
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_DATES", message: "Start date and end date are required." }
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_DATE_FORMAT", message: "Invalid date format provided." }
        });
      }

      if (end <= start) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_DATE_RANGE", message: "End date must be after the start date." }
        });
      }

      if ((measurementType === "emotion_count" || measurementType === "emotion_percentage") && !targetEmotion) {
        return res.status(400).json({
          success: false,
          error: { code: "MISSING_TARGET_EMOTION", message: "An emotion signal name is required for emotion tracking goals." }
        });
      }

      const goal = db.createGoal(userId, {
        title: title.trim(),
        description: description ? String(description).trim() : "",
        category,
        measurementType,
        targetValue: numTarget,
        targetEmotion: targetEmotion ? String(targetEmotion).trim() : undefined,
        targetConfidenceThreshold: targetConfidenceThreshold ? Number(targetConfidenceThreshold) : undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });

      res.status(201).json({
        success: true,
        data: goal,
        message: "Goal created successfully."
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/goals/:id
  getGoalById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const goal = db.getGoalById(id, userId);
      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Goal not found or unauthorized." }
        });
      }

      const history = db.getGoalProgressHistory(id, userId);

      res.json({
        success: true,
        data: {
          ...goal,
          history
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/goals/:id
  updateGoal: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const {
        title,
        description,
        category,
        measurementType,
        targetValue,
        targetEmotion,
        targetConfidenceThreshold,
        startDate,
        endDate
      } = req.body;

      // Validation if provided
      if (title !== undefined && (!title || !title.trim())) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_TITLE", message: "Goal title cannot be empty." }
        });
      }

      if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_CATEGORY", message: "Invalid goal category." }
        });
      }

      if (measurementType !== undefined && !VALID_MEASUREMENT_TYPES.includes(measurementType)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_MEASUREMENT_TYPE", message: "Invalid measurement type." }
        });
      }

      if (targetValue !== undefined) {
        const num = Number(targetValue);
        if (isNaN(num) || num <= 0) {
          return res.status(400).json({
            success: false,
            error: { code: "INVALID_TARGET", message: "Target value must be greater than 0." }
          });
        }
      }

      if (startDate && endDate) {
        const s = new Date(startDate);
        const e = new Date(endDate);
        if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
          return res.status(400).json({
            success: false,
            error: { code: "INVALID_DATE_RANGE", message: "End date must be after start date." }
          });
        }
      }

      const updated = db.updateGoal(id, userId, {
        title,
        description,
        category,
        measurementType,
        targetValue: targetValue !== undefined ? Number(targetValue) : undefined,
        targetEmotion,
        targetConfidenceThreshold: targetConfidenceThreshold !== undefined ? Number(targetConfidenceThreshold) : undefined,
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: updated,
        message: "Goal updated successfully."
      });
    } catch (err: any) {
      if (err.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: err.message }
        });
      }
      next(err);
    }
  },

  // DELETE /api/goals/:id
  deleteGoal: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = db.deleteGoal(id, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Goal not found or unauthorized." }
        });
      }

      res.json({
        success: true,
        message: "Goal deleted successfully."
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/goals/:id/pause
  pauseGoal: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const updated = db.pauseGoal(id, userId);
      res.json({
        success: true,
        data: updated,
        message: "Goal paused."
      });
    } catch (err: any) {
      if (err.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: err.message }
        });
      }
      next(err);
    }
  },

  // POST /api/goals/:id/resume
  resumeGoal: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const updated = db.resumeGoal(id, userId);
      res.json({
        success: true,
        data: updated,
        message: "Goal resumed."
      });
    } catch (err: any) {
      if (err.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: err.message }
        });
      }
      next(err);
    }
  },

  // GET /api/goals/:id/progress
  getGoalProgress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const goal = db.getGoalById(id, userId);
      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Goal not found." }
        });
      }

      const history = db.getGoalProgressHistory(id, userId);

      res.json({
        success: true,
        data: {
          progress: goal.progress,
          history
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
