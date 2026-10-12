import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { aiService } from "../services/aiService";
import { validators } from "../validators";
import { auditService } from "../services/auditService";
import { AnalysisSessionTable, AnalysisInputTable, AnalysisResultTable } from "../database/types";

export const analysisController = {
  createAnalysis: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Authenticated user or fallback to demo/guest user
      let userId = req.user?.id || (req.body?.userId ? String(req.body.userId) : undefined);
      if (!userId) {
        const defaultUser = db.findUserByEmail("alex@sentimentai.com") || db.findUserById("usr_dev_01");
        userId = defaultUser ? defaultUser.id : "usr_dev_01";
      }

      const { text, files, language } = validators.validateMultimodalInput(req.body);

      // Perform AI Analysis via aiService
      const aiResult = await aiService.analyzeMultimodal(text, files, language);

      const now = new Date().toISOString();
      const analysisId = aiResult.analysis_id || ("an_" + Math.random().toString(36).substring(2, 12));

      // Derive title from text or uploaded file name
      let title = "Multimodal Sentiment Analysis";
      if (text && text.trim()) {
        title = text.trim().substring(0, 60);
      } else if (files && files.length > 0 && files[0].name) {
        title = `Media Analysis: ${files[0].name}`;
      }

      const session: AnalysisSessionTable = {
        analysisId,
        userId,
        title,
        inputSummary: {
          textCount: text ? 1 : 0,
          imageCount: files.filter((f: any) => f.mimeType?.startsWith("image/")).length,
          videoCount: files.filter((f: any) => f.mimeType?.startsWith("video/")).length,
          totalFiles: files.length,
          hasDirectText: Boolean(text && text.trim())
        },
        overallSentiment: {
          label: aiResult.overall_sentiment.label,
          intensity: aiResult.overall_sentiment.intensity,
          confidence: aiResult.overall_sentiment.confidence,
          score: aiResult.overall_sentiment.score
        },
        confidence: aiResult.overall_sentiment.confidence,
        score: aiResult.overall_sentiment.score,
        emotions: {
          dominant: aiResult.emotions.dominant,
          secondary: aiResult.emotions.secondary || []
        },
        meaning: aiResult.meaning,
        emotionalContext: aiResult.emotional_context,
        visualObservations: aiResult.visual_observations,
        audioContext: aiResult.audio_context,
        multimodalRelationship: aiResult.multimodal_relationship,
        keyInsights: aiResult.key_insights || [],
        positiveSignals: aiResult.positive_signals || [],
        concerns: aiResult.concerns || [],
        voiceSummary: aiResult.tts_summary || "",
        status: "completed",
        language,
        tags: [aiResult.overall_sentiment.label, aiResult.emotions?.dominant?.name || "Emotion"].filter(Boolean),
        createdAt: now,
        updatedAt: now
      };

      const inputs: AnalysisInputTable[] = [];
      if (text) {
        inputs.push({
          inputId: "inp_" + Math.random().toString(36).substring(2, 9),
          analysisId,
          inputType: "text",
          textContentReference: text.substring(0, 500),
          processingStatus: "processed",
          createdAt: now
        });
      }

      for (const f of files) {
        const isVid = f.mimeType?.startsWith("video/");
        inputs.push({
          inputId: "inp_" + Math.random().toString(36).substring(2, 9),
          analysisId,
          inputType: isVid ? "video" : "image",
          fileName: f.name || "Upload",
          fileSize: f.size || (f.data ? Math.round(f.data.length * 0.75) : 0),
          mimeType: f.mimeType,
          processingStatus: "processed",
          createdAt: now
        });
      }

      const resultRecord: AnalysisResultTable = {
        resultId: "res_" + Math.random().toString(36).substring(2, 9),
        analysisId,
        fullResultJson: aiResult,
        exactFileContents: aiResult.exact_file_contents,
        fileContentItems: aiResult.file_content_items,
        coachingData: aiResult.sentiment_coaching,
        timelineBreakdown: aiResult.timeline_breakdown,
        turningPoints: aiResult.turning_points,
        videoMetadata: aiResult.video_metadata,
        documentMetadata: aiResult.document_metadata,
        timeSavedSummary: aiResult.time_saved_summary,
        executiveTakeaways: aiResult.executive_takeaways,
        createdAt: now,
        updatedAt: now
      };

      const userSettings = db.getUserSettings(userId);
      const shouldSaveHistory = userSettings.privacy?.saveAnalysisHistory !== false && userSettings.privacy?.autoDeleteHistory !== "after_use";

      if (shouldSaveHistory) {
        db.createAnalysisSession(session, inputs, resultRecord);
      }

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "ANALYSIS_CREATED",
        targetType: "analysis",
        targetId: analysisId,
        metadata: { title, score: session.score, sentiment: session.overallSentiment.label, persisted: shouldSaveHistory },
        ipAddress: req.ip
      });

      // Return both wrapped format and top-level properties so existing frontend works seamlessly!
      return res.status(201).json({
        success: true,
        analysisId,
        ...aiResult,
        session
      });
    } catch (err) {
      next(err);
    }
  },

  listAnalyses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const search = req.query.search ? String(req.query.search) : undefined;
      const sentiment = req.query.sentiment ? String(req.query.sentiment) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const sortBy = (req.query.sortBy as any) || "date";
      const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

      const result = db.listAnalysesByUser(userId, {
        search,
        sentiment,
        status,
        sortBy,
        sortOrder,
        page,
        limit
      });

      return res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  getAnalysisById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const session = db.getAnalysisSession(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Analysis session not found." }
        });
      }

      // Authorization check (user can only access their own, unless admin)
      if (session.userId !== userId && userRole !== "admin") {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You do not have permission to view this analysis." }
        });
      }

      const inputs = db.getAnalysisInputs(id);
      const result = db.getAnalysisResult(id);

      return res.json({
        success: true,
        analysis: session,
        inputs,
        result: result?.fullResultJson || null
      });
    } catch (err) {
      next(err);
    }
  },

  deleteAnalysis: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const session = db.getAnalysisSession(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Analysis session not found." }
        });
      }

      // Ensure ownership
      if (session.userId !== userId && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You can only delete your own analyses." }
        });
      }

      db.deleteAnalysisSession(id, session.userId);

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "ANALYSIS_DELETED",
        targetType: "analysis",
        targetId: id,
        metadata: { title: session.title },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: "Analysis and associated data deleted successfully."
      });
    } catch (err) {
      next(err);
    }
  },

  translateVoiceSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { summary, targetLanguage } = req.body;
      if (!summary || !targetLanguage) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Summary and targetLanguage are required." }
        });
      }

      const translatedSummary = await aiService.translateSummary(summary, targetLanguage);
      return res.json({
        success: true,
        translatedSummary
      });
    } catch (err) {
      next(err);
    }
  }
};
