import {
  HistoryRecord,
  HistoryStatistics,
  HistoryFilters,
  HistorySortOption,
  AnalysisRecord
} from "../types";
import { firestoreService } from "./firestoreService";
import { cloudStorageService } from "./cloudStorageService";

const STORAGE_KEY = "sentimentai_analysis_history_v2";

export const historyService = {
  // Retrieve all analysis history records, filtering by user if specified
  getAnalyses: async (userId?: string): Promise<HistoryRecord[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let records: HistoryRecord[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Ensure no legacy demo-filled records remain
            records = parsed.filter((r: any) =>
              !r.analysisId?.includes("_xyz") &&
              r.userId !== "user_default" &&
              r.title !== "Customer Feedback & Feature Requests"
            );
          }
        } catch {
          records = [];
        }
      }

      // Also merge any real records from v1 that might have been saved before
      const legacyStored = localStorage.getItem("sentimentai_analysis_history_v1");
      if (legacyStored) {
        try {
          const legacyParsed = JSON.parse(legacyStored);
          if (Array.isArray(legacyParsed)) {
            const existingIds = new Set(records.map(r => r.analysisId));
            let merged = false;
            for (const item of legacyParsed) {
              if (
                item?.analysisId &&
                !existingIds.has(item.analysisId) &&
                !item.analysisId.includes("_xyz") &&
                item.userId !== "user_default" &&
                item.title !== "Customer Feedback & Feature Requests"
              ) {
                records.push(item);
                existingIds.add(item.analysisId);
                merged = true;
              }
            }
            if (merged || !stored) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            }
          }
        } catch {}
      }

      if (userId) {
        return records.filter(r => r.userId === userId);
      }

      return records;
    } catch (err) {
      console.error("Failed to load history from localStorage:", err);
      return [];
    }
  },

  // Get a single analysis by unique ID
  getAnalysisById: async (id: string): Promise<HistoryRecord | null> => {
    const all = await historyService.getAnalyses();
    const found = all.find(r => r.analysisId === id);
    return found || null;
  },

  // Search analyses across title, file names, summary, input types, sentiment, and emotion
  searchAnalyses: (query: string, items: HistoryRecord[]): HistoryRecord[] => {
    if (!query || !query.trim()) return items;
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchTitle = (item.title || "").toLowerCase().includes(q);
      const matchSummary = (item.summary || "").toLowerCase().includes(q);
      const matchFiles = (item.fileNames || []).some(f => f.toLowerCase().includes(q));
      const matchType = (item.inputTypes || []).some(t => t.toLowerCase().includes(q));
      const matchSentiment = (item.overallSentiment?.label || "").toLowerCase().includes(q);
      const matchEmotion = (item.dominantEmotion || "").toLowerCase().includes(q);

      return matchTitle || matchSummary || matchFiles || matchType || matchSentiment || matchEmotion;
    });
  },

  // Filter analyses based on active criteria
  filterAnalyses: (filters: HistoryFilters, items: HistoryRecord[]): HistoryRecord[] => {
    return items.filter((item) => {
      // 1. Input Type filter
      if (filters.inputType && filters.inputType !== "all") {
        if (filters.inputType === "mixed") {
          if (item.inputTypes.length < 2) return false;
        } else {
          if (!item.inputTypes.includes(filters.inputType)) return false;
        }
      }

      // 2. Sentiment filter
      if (filters.sentiment && filters.sentiment !== "all") {
        if (item.overallSentiment?.label?.toLowerCase() !== filters.sentiment.toLowerCase()) {
          return false;
        }
      }

      // 3. Status filter
      if (filters.status && filters.status !== "all") {
        if (item.status !== filters.status) {
          return false;
        }
      }

      // 4. Date Range filter
      if (filters.date && filters.date !== "all") {
        const itemDate = new Date(item.createdAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (filters.date === "today") {
          if (now - itemDate > oneDay) return false;
        } else if (filters.date === "last7") {
          if (now - itemDate > 7 * oneDay) return false;
        } else if (filters.date === "last30") {
          if (now - itemDate > 30 * oneDay) return false;
        } else if (filters.date === "custom") {
          if (filters.customStartDate) {
            const start = new Date(filters.customStartDate).getTime();
            if (itemDate < start) return false;
          }
          if (filters.customEndDate) {
            const end = new Date(filters.customEndDate).getTime() + oneDay;
            if (itemDate > end) return false;
          }
        }
      }

      return true;
    });
  },

  // Sort analyses by chosen criteria
  sortAnalyses: (sortOption: HistorySortOption, items: HistoryRecord[]): HistoryRecord[] => {
    const list = [...items];
    switch (sortOption) {
      case "newest":
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "oldest":
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "most_positive":
        return list.sort((a, b) => {
          const scoreA = a.overallSentiment?.score ?? (a.overallSentiment?.label === "Positive" ? 0.8 : 0.5);
          const scoreB = b.overallSentiment?.score ?? (b.overallSentiment?.label === "Positive" ? 0.8 : 0.5);
          return scoreB - scoreA;
        });
      case "most_negative":
        return list.sort((a, b) => {
          const scoreA = a.overallSentiment?.score ?? (a.overallSentiment?.label === "Negative" ? 0.2 : 0.5);
          const scoreB = b.overallSentiment?.score ?? (b.overallSentiment?.label === "Negative" ? 0.2 : 0.5);
          return scoreA - scoreB;
        });
      default:
        return list;
    }
  },

  // Save or update an analysis record in history
  saveAnalysis: async (record: HistoryRecord): Promise<void> => {
    try {
      const records = await historyService.getAnalyses();
      const existingIndex = records.findIndex(r => r.analysisId === record.analysisId);
      let updated: HistoryRecord[];
      if (existingIndex >= 0) {
        updated = [...records];
        updated[existingIndex] = record;
      } else {
        updated = [record, ...records];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Automatic Cloud Storage: persist analysis to Google Cloud Firestore & Cloud Storage
      cloudStorageService.autoStoreRecord(record).catch(err => {
        console.warn("[historyService] Cloud Storage auto-store notice:", err);
      });

      // Legacy direct Firestore fallback
      if (record.userId) {
        firestoreService.saveAnalysisRecord({
          id: record.analysisId,
          userId: record.userId,
          modality: ((record.inputTypes && record.inputTypes[0]) as any) || "text",
          sentiment: record.overallSentiment?.label || "neutral",
          score: record.overallSentiment?.score ?? 0,
          emotions: record.fullResult?.emotions ? (record.fullResult.emotions as any) : undefined,
          summary: record.summary,
          createdAt: record.createdAt || new Date().toISOString(),
          metadata: {
            title: record.title,
            dominantEmotion: record.dominantEmotion,
            confidence: record.overallSentiment?.confidence
          }
        }).catch(err => {
          console.warn("[historyService] Firestore sync warning:", err);
        });
      }
    } catch (err) {
      console.error("Failed to save analysis to history:", err);
    }
  },

  // Delete a single analysis record by ID
  deleteAnalysis: async (id: string): Promise<boolean> => {
    try {
      const records = await historyService.getAnalyses();
      const updated = records.filter(r => r.analysisId !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error("Failed to delete analysis from history:", err);
      return false;
    }
  },

  // Delete multiple analysis records (bulk deletion)
  deleteAnalyses: async (ids: string[]): Promise<boolean> => {
    try {
      const idSet = new Set(ids);
      const records = await historyService.getAnalyses();
      const updated = records.filter(r => !idSet.has(r.analysisId));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error("Failed to bulk delete analyses:", err);
      return false;
    }
  },

  // Clear all analyses completely
  clearAll: async (): Promise<void> => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("sentimentai_analysis_history_v1");
    } catch (err) {
      console.error("Failed to clear analyses:", err);
    }
  },

  // Calculate statistics directly from the actual history data (never hardcoded)
  getHistoryStatistics: async (userId?: string): Promise<HistoryStatistics> => {
    const records = await historyService.getAnalyses(userId);
    if (!records || records.length === 0) {
      return {
        totalAnalyses: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        mixed: 0
      };
    }

    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let mixed = 0;

    for (const record of records) {
      const label = record.overallSentiment?.label;
      if (label === "Positive") positive++;
      else if (label === "Negative") negative++;
      else if (label === "Neutral") neutral++;
      else if (label === "Mixed") mixed++;
    }

    return {
      totalAnalyses: records.length,
      positive,
      negative,
      neutral,
      mixed
    };
  },

  // Convert history records into lightweight AnalysisRecord[] for the Dashboard Recent Analyses component
  getRecentAnalysesForDashboard: async (limit: number = 4, userId?: string): Promise<AnalysisRecord[]> => {
    const records = await historyService.getAnalyses(userId);
    if (!records || records.length === 0) {
      return [];
    }
    const sorted = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const slice = sorted.slice(0, limit);

    return slice.map(item => {
      let typeStr: "Text" | "Image" | "Video" | "Mixed" = "Text";
      if (item.inputTypes.length > 1) {
        typeStr = "Mixed";
      } else if (item.inputTypes[0] === "video") {
        typeStr = "Video";
      } else if (item.inputTypes[0] === "image") {
        typeStr = "Image";
      } else {
        typeStr = "Text";
      }

      // Format human-friendly relative date
      const d = new Date(item.createdAt);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      let dateDisplay = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (isToday) dateDisplay = "Today";
      else if (isYesterday) dateDisplay = "Yesterday";

      return {
        id: item.analysisId,
        title: item.title,
        type: typeStr,
        sentiment: item.overallSentiment?.label || "Neutral",
        date: dateDisplay
      };
    });
  },

  // Export selected analyses to JSON
  exportToJSON: (records: HistoryRecord[]): void => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `SentimentAI_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },

  // Export selected analyses to CSV
  exportToCSV: (records: HistoryRecord[]): void => {
    const headers = ["Title", "Date", "Sentiment", "Emotion", "Summary", "Input Types", "Files"];
    const rows = records.map(r => [
      `"${r.title.replace(/"/g, '""')}"`,
      new Date(r.createdAt).toLocaleString(),
      r.overallSentiment?.label || "Neutral",
      r.dominantEmotion || "None",
      `"${(r.summary || "").replace(/"/g, '""')}"`,
      `"${r.inputTypes.join(", ")}"`,
      `"${(r.fileNames || []).join(", ")}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SentimentAI_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Alias for getAnalyses
  getHistory: async (userId?: string): Promise<HistoryRecord[]> => {
    return historyService.getAnalyses(userId);
  }
};
