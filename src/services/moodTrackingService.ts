import { jsPDF } from "jspdf";
import {
  MoodTrackingSummary,
  SentimentTimelineItem,
  SentimentTrendPoint,
  EmotionTimelineData
} from "../types";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-access-token"] = token;
  }
  return headers;
}

function buildParams(filters?: {
  startDate?: string;
  endDate?: string;
  dateRange?: string;
  sentiment?: string;
  emotion?: string;
  limit?: number;
  page?: number;
}): string {
  const p = new URLSearchParams();
  if (filters?.startDate) p.set("startDate", filters.startDate);
  if (filters?.endDate) p.set("endDate", filters.endDate);
  if (filters?.dateRange && filters.dateRange !== "all") p.set("dateRange", filters.dateRange);
  if (filters?.sentiment && filters.sentiment !== "all") p.set("sentiment", filters.sentiment);
  if (filters?.emotion && filters.emotion !== "all") p.set("emotion", filters.emotion);
  if (filters?.limit) p.set("limit", String(filters.limit));
  if (filters?.page) p.set("page", String(filters.page));
  return p.toString() ? `?${p.toString()}` : "";
}

export const moodTrackingService = {
  getSummary: async (filters?: { startDate?: string; endDate?: string; dateRange?: string }): Promise<MoodTrackingSummary> => {
    const qs = buildParams(filters);
    const res = await fetch(`/api/mood-tracking${qs}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to fetch mood tracking summary");
    }

    const data = await res.json();
    return data.data;
  },

  getTimeline: async (filters?: {
    startDate?: string;
    endDate?: string;
    dateRange?: string;
    sentiment?: string;
    emotion?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    timeline: SentimentTimelineItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const qs = buildParams(filters);
    const res = await fetch(`/api/mood-tracking/timeline${qs}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to fetch sentiment timeline");
    }

    const data = await res.json();
    return data.data;
  },

  getSentimentTrend: async (filters?: {
    startDate?: string;
    endDate?: string;
    dateRange?: string;
  }): Promise<{
    points: SentimentTrendPoint[];
    totalAnalyses: number;
    startDate: string;
    endDate: string;
  }> => {
    const qs = buildParams(filters);
    const res = await fetch(`/api/mood-tracking/sentiment${qs}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to fetch sentiment trend");
    }

    const data = await res.json();
    return data.data;
  },

  getEmotionTimeline: async (filters?: {
    startDate?: string;
    endDate?: string;
    dateRange?: string;
  }): Promise<EmotionTimelineData> => {
    const qs = buildParams(filters);
    const res = await fetch(`/api/mood-tracking/emotions${qs}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to fetch emotion timeline");
    }

    const data = await res.json();
    return data.data;
  },

  exportCSV: (summary: MoodTrackingSummary, timeline: SentimentTimelineItem[]) => {
    const headers = [
      "Analysis ID",
      "Timestamp",
      "Title",
      "Sentiment",
      "Sentiment Score",
      "Dominant Emotion",
      "Dominant Intensity",
      "Secondary Emotions",
      "Confidence",
      "Modality"
    ];

    const rows = timeline.map(item => [
      `"${item.analysisId}"`,
      `"${item.date}"`,
      `"${(item.title || "").replace(/"/g, '""')}"`,
      `"${item.sentiment}"`,
      item.sentimentScore,
      `"${item.dominantEmotion}"`,
      `"${item.dominantEmotionIntensity}"`,
      `"${(item.secondaryEmotions || []).join("; ")}"`,
      `"${item.confidence}"`,
      `"${item.modality}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SentimentAI_Mood_Tracking_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportPDF: (summary: MoodTrackingSummary, timeline: SentimentTimelineItem[]) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Dark Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("SentimentAI — Mood & Goals Tracking", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Total Analyses Evaluated: ${summary.totalAnalyses}`, 14, 28);
    doc.text("Authoritative history tracking & goal progress report", 14, 34);

    let y = 50;

    // Metrics Summary Section
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Tracking Metrics Summary", 14, y);
    y += 8;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 38, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Dominant Sentiment:", 20, y + 10);
    doc.text("Dominant Emotion Signal:", 20, y + 18);
    doc.text("Average Confidence:", 20, y + 26);
    doc.text("Analysis Cadence:", 20, y + 34);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`${summary.mostCommonSentiment} (${summary.sentimentDistribution.Positive} Pos, ${summary.sentimentDistribution.Neutral} Neu, ${summary.sentimentDistribution.Negative} Neg)`, 75, y + 10);
    doc.text(`${summary.mostCommonEmotion}`, 75, y + 18);
    doc.text(`${summary.averageConfidence}%`, 75, y + 26);
    doc.text(`${summary.analysisFrequency} analyses / week across ${summary.activeTrackingDays} active days`, 75, y + 34);

    y += 48;

    // Top Emotion Signals
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Top Detected Emotion Signals", 14, y);
    y += 8;

    summary.topEmotionSignals.forEach((emo, i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`${i + 1}. ${emo.name} — ${emo.count} occurrences`, 20, y);
      y += 6;
    });

    y += 6;

    // Recent Timeline Records
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Recorded Analysis Timeline (Latest)", 14, y);
    y += 8;

    const sampleItems = timeline.slice(0, 8);
    sampleItems.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, y, 182, 16, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}. ${item.title.substring(0, 45)}`, 18, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Date: ${new Date(item.date).toLocaleDateString()} | Sentiment: ${item.sentiment} (${Math.round(item.sentimentScore * 100)}%) | Dominant: ${item.dominantEmotion} | Modality: ${item.modality}`,
        18,
        y + 12
      );

      y += 19;
    });

    // Privacy & Non-diagnostic disclaimer footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Note: SentimentAI provides pattern tracking based on recorded multimodal content. It does not provide medical or psychological diagnoses.", 14, 285);

    doc.save(`SentimentAI_Mood_Tracking_Report_${new Date().toISOString().substring(0, 10)}.pdf`);
  }
};
