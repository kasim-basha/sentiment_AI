import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { VoiceSessionTable } from "../database/types";

export const voiceController = {
  listVoiceSessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const sessions = db.listVoiceSessionsByUser(userId);
      return res.json({
        success: true,
        sessions
      });
    } catch (err) {
      next(err);
    }
  },

  createVoiceSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { title, transcript, audioSummary, durationSeconds, language, analysisId } = req.body;
      const now = new Date().toISOString();

      const newSession: VoiceSessionTable = {
        sessionId: "vs_" + Math.random().toString(36).substring(2, 10),
        userId,
        analysisId,
        title: title ? String(title).trim() : "Voice Assistant Session",
        transcript: transcript ? String(transcript).trim() : "",
        audioSummary: audioSummary ? String(audioSummary).trim() : "",
        durationSeconds: Number(durationSeconds) || 0,
        language: language || "English",
        createdAt: now,
        updatedAt: now
      };

      const saved = db.createVoiceSession(newSession);
      return res.status(201).json({
        success: true,
        session: saved
      });
    } catch (err) {
      next(err);
    }
  }
};
