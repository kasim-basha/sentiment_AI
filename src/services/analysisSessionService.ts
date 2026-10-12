import {
  HistoryRecord,
  HistoryInputType,
  HistoryInputSummary,
  MultimodalAnalysisResult
} from "../types";
import { historyService } from "./historyService";

const STORAGE_KEY = "sentimentai_analysis_history_v2";

export interface CreateSessionParams {
  userId: string;
  title?: string;
  result: MultimodalAnalysisResult;
  inputTypes?: HistoryInputType[];
  inputSummary?: HistoryInputSummary;
  fileNames?: string[];
  rawText?: string;
}

export const analysisSessionService = {
  // Generate a standard unique analysis ID matching the required convention: analysis_{timestamp}_{random}
  generateAnalysisId: (): string => {
    const timestamp = Math.floor(Date.now() / 1000);
    const rand = Math.random().toString(36).substring(2, 7);
    return `analysis_${timestamp}_${rand}`;
  },

  // Derive an appropriate title from user content or result insights
  deriveSessionTitle: (params: CreateSessionParams): string => {
    if (params.title && params.title.trim()) {
      return params.title.trim();
    }

    if (params.result.video_metadata?.title) {
      return params.result.video_metadata.title;
    }

    if (params.result.document_metadata?.file_name) {
      return params.result.document_metadata.file_name.replace(/\.[^/.]+$/, "");
    }

    if (params.fileNames && params.fileNames.length > 0) {
      const primaryFile = params.fileNames[0].replace(/\.[^/.]+$/, "");
      if (params.fileNames.length > 1) {
        return `${primaryFile} & ${params.fileNames.length - 1} more`;
      }
      return `${primaryFile} Analysis`;
    }

    if (params.rawText && params.rawText.trim()) {
      const cleaned = params.rawText.trim().replace(/\n+/g, " ");
      const words = cleaned.split(" ").slice(0, 6).join(" ");
      return words.length > 40 ? `${words.slice(0, 37)}...` : words;
    }

    if (params.result.meaning) {
      const firstSentence = params.result.meaning.split(".")[0];
      if (firstSentence && firstSentence.length <= 45) {
        return firstSentence;
      }
    }

    return "Multimodal Sentiment Analysis";
  },

  // Create and save an analysis session
  createAnalysisSession: async (params: CreateSessionParams): Promise<HistoryRecord> => {
    const analysisId = params.result?.analysis_id || analysisSessionService.generateAnalysisId();
    if (params.result) {
      params.result.analysis_id = analysisId;
    }

    const rawSummary: any = params.result?.input_summary || (params.result as any)?.inputSummary || {};
    const textCount = rawSummary.text_count ?? rawSummary.textCount ?? (rawSummary.has_direct_text || rawSummary.hasDirectText || params.rawText ? 1 : 0);
    const imageCount = rawSummary.image_count ?? rawSummary.imageCount ?? 0;
    const videoCount = rawSummary.video_count ?? rawSummary.videoCount ?? 0;
    const totalFiles = rawSummary.total_files ?? rawSummary.totalFiles ?? (params.fileNames?.length || 1);

    // Detect input types if not provided
    const inputTypes: HistoryInputType[] = params.inputTypes || [];
    if (inputTypes.length === 0) {
      if (textCount > 0) inputTypes.push("text");
      if (imageCount > 0) inputTypes.push("image");
      if (videoCount > 0) inputTypes.push("video");
      if (inputTypes.length === 0) inputTypes.push("text");
    }

    const inputSummary: HistoryInputSummary = params.inputSummary || {
      textCount,
      imageCount,
      videoCount,
      totalFiles
    };

    const title = analysisSessionService.deriveSessionTitle(params);

    const record: HistoryRecord = {
      analysisId,
      userId: params.userId || "usr_dev_01",
      title,
      createdAt: new Date().toISOString(),
      status: "completed",
      inputSummary,
      inputTypes,
      fileNames: params.fileNames || [],
      overallSentiment: {
        label: params.result?.overall_sentiment?.label || "Neutral",
        score: typeof params.result?.overall_sentiment?.score === "number" ? params.result.overall_sentiment.score : 0.5,
        confidence: params.result?.overall_sentiment?.confidence || "Medium"
      },
      dominantEmotion: params.result?.emotions?.dominant?.name || "Reflective",
      summary: params.result?.tts_summary || params.result?.meaning || "Sentiment analysis completed successfully.",
      resultReference: analysisId,
      fullResult: params.result
    };

    return await analysisSessionService.saveAnalysisSession(record);
  },

  // Save an analysis record into the permanent history store
  saveAnalysisSession: async (session: HistoryRecord): Promise<HistoryRecord> => {
    try {
      // Save directly into historyService store (v2)
      await historyService.saveAnalysis(session);

      // Keep v1 in sync for backward compatibility
      try {
        const storedV1 = localStorage.getItem("sentimentai_analysis_history_v1");
        let v1Records: HistoryRecord[] = storedV1 ? JSON.parse(storedV1) : [];
        const index = v1Records.findIndex(r => r.analysisId === session.analysisId);
        if (index >= 0) {
          v1Records[index] = session;
        } else {
          v1Records.unshift(session);
        }
        localStorage.setItem("sentimentai_analysis_history_v1", JSON.stringify(v1Records));
      } catch {}

      return session;
    } catch (err) {
      console.error("Failed to save analysis session:", err);
      return session;
    }
  },

  // Retrieve an analysis session and its full result
  getAnalysisSession: async (id: string): Promise<{ record: HistoryRecord; result: MultimodalAnalysisResult } | null> => {
    const record = await historyService.getAnalysisById(id);
    if (!record) return null;

    if (record.fullResult) {
      return { record, result: record.fullResult };
    }

    // If for some reason fullResult was not cached, reconstruct a valid MultimodalAnalysisResult
    const fallbackResult: MultimodalAnalysisResult = {
      analysis_id: record.analysisId,
      created_at: new Date(record.createdAt).getTime(),
      language: "English",
      input_summary: {
        text_count: record.inputSummary.textCount,
        image_count: record.inputSummary.imageCount,
        video_count: record.inputSummary.videoCount,
        total_files: record.inputSummary.totalFiles,
        has_direct_text: record.inputSummary.textCount > 0
      },
      overall_sentiment: {
        label: record.overallSentiment.label,
        intensity: "High",
        confidence: record.overallSentiment.confidence,
        score: record.overallSentiment.score
      },
      emotions: {
        dominant: {
          name: record.dominantEmotion,
          intensity: "High",
          reason: "Primary emotional driver detected across analyzed signals."
        },
        secondary: []
      },
      meaning: record.summary,
      emotional_context: "Recorded from previous analysis session in SentimentAI.",
      key_insights: [record.summary],
      positive_signals: record.overallSentiment.label === "Positive" ? ["Strong positive signals identified."] : [],
      concerns: record.overallSentiment.label === "Negative" ? ["Friction points identified."] : [],
      tts_summary: record.summary
    };

    return { record, result: fallbackResult };
  },

  // Update existing session metadata
  updateAnalysisSession: async (id: string, updates: Partial<HistoryRecord>): Promise<HistoryRecord | null> => {
    try {
      const records = await historyService.getAnalyses();
      const index = records.findIndex(r => r.analysisId === id);
      if (index === -1) return null;

      const updated = { ...records[index], ...updates };
      await historyService.saveAnalysis(updated);
      return updated;
    } catch (err) {
      console.error("Failed to update analysis session:", err);
      return null;
    }
  },

  // Delete an analysis session
  deleteAnalysisSession: async (id: string): Promise<boolean> => {
    return await historyService.deleteAnalysis(id);
  },

  // Download raw analysis JSON file to user's local disk
  downloadAnalysisAsJSON: (record: HistoryRecord | { result: MultimodalAnalysisResult; title?: string }): void => {
    try {
      const exportData = "result" in record
        ? {
            analysisId: record.result.analysis_id,
            title: record.title || "Sentiment Analysis",
            exportedAt: new Date().toISOString(),
            ...record.result
          }
        : record;

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement("a");
      const title = "title" in record && record.title
        ? record.title
        : ("result" in record ? record.result.analysis_id : record.analysisId);
      const filename = `${String(title).replace(/[^a-z0-9_-]/gi, "_")}.json`;
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Failed to download analysis JSON:", e);
    }
  }
};
