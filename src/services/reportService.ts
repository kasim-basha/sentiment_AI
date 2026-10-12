import { jsPDF } from "jspdf";
import {
  ReportRecord,
  ReportStatistics,
  ReportFilters,
  ReportSortOption,
  MultimodalAnalysisResult,
  HistoryRecord
} from "../types";
import { historyService } from "./historyService";
import { analysisSessionService } from "./analysisSessionService";

const DELETED_REPORTS_KEY = "sentimentai_deleted_reports_v1";

function getDeletedReportIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_REPORTS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDeletedReportIds(ids: Set<string>): void {
  try {
    localStorage.setItem(DELETED_REPORTS_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.error("Failed to save deleted report ids:", err);
  }
}

function sanitizeFilename(title: string): string {
  return title
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50) || "Report";
}

function historyToReport(record: HistoryRecord): ReportRecord {
  const secondaryEmotions = record.fullResult?.emotions?.secondary?.map(e => e.name) || [];
  return {
    reportId: `rep_${record.analysisId}`,
    analysisId: record.analysisId,
    userId: record.userId,
    title: record.title || "Multimodal Sentiment Report",
    createdAt: record.createdAt,
    inputSummary: {
      textCount: record.inputSummary?.textCount ?? 0,
      imageCount: record.inputSummary?.imageCount ?? 0,
      videoCount: record.inputSummary?.videoCount ?? 0,
      totalFiles: record.inputSummary?.totalFiles ?? 1
    },
    inputTypes: record.inputTypes || ["text"],
    fileNames: record.fileNames || [],
    overallSentiment: {
      label: record.overallSentiment?.label || "Neutral",
      score: record.overallSentiment?.score ?? 0.5,
      confidence: record.overallSentiment?.confidence || "Medium"
    },
    dominantEmotion: record.dominantEmotion || "Curiosity",
    secondaryEmotions,
    summary: record.summary || "Sentiment analysis completed successfully.",
    resultReference: record.resultReference || record.analysisId,
    fullResult: record.fullResult
  };
}

export const reportService = {
  // 1. Get all reports derived from user's history, excluding specifically deleted reports
  getReports: async (userId?: string): Promise<ReportRecord[]> => {
    try {
      const analyses = await historyService.getAnalyses(userId);
      const deletedIds = getDeletedReportIds();

      const reports: ReportRecord[] = [];
      for (const item of analyses) {
        const reportId = `rep_${item.analysisId}`;
        if (!deletedIds.has(reportId) && !deletedIds.has(item.analysisId)) {
          reports.push(historyToReport(item));
        }
      }

      return reports;
    } catch (err) {
      console.error("Failed to load reports from history:", err);
      return [];
    }
  },

  // 2. Get single report by reportId or analysisId
  getReportById: async (id: string): Promise<ReportRecord | null> => {
    try {
      const reports = await reportService.getReports();
      const direct = reports.find(r => r.reportId === id || r.analysisId === id);
      if (direct) {
        // If fullResult is missing on the record, retrieve it via analysisSessionService
        if (!direct.fullResult) {
          const session = await analysisSessionService.getAnalysisSession(direct.analysisId);
          if (session?.result) {
            direct.fullResult = session.result;
          }
        }
        return direct;
      }

      // Check if session exists in history directly
      const session = await analysisSessionService.getAnalysisSession(id);
      if (session) {
        const rep = historyToReport(session.record);
        rep.fullResult = session.result;
        return rep;
      }

      return null;
    } catch (err) {
      console.error("Failed to get report by id:", err);
      return null;
    }
  },

  // 3. Search reports across title, analysis title, filename, sentiment, dominant emotion, input type, date
  searchReports: (query: string, items: ReportRecord[]): ReportRecord[] => {
    if (!query || !query.trim()) return items;
    const q = query.trim().toLowerCase();

    return items.filter(item => {
      const matchTitle = (item.title || "").toLowerCase().includes(q);
      const matchAnalysisId = (item.analysisId || "").toLowerCase().includes(q);
      const matchSentiment = (item.overallSentiment?.label || "").toLowerCase().includes(q);
      const matchEmotion = (item.dominantEmotion || "").toLowerCase().includes(q);
      const matchSummary = (item.summary || "").toLowerCase().includes(q);
      const matchFiles = (item.fileNames || []).some(f => f.toLowerCase().includes(q));
      const matchType = (item.inputTypes || []).some(t => t.toLowerCase().includes(q));

      let matchDate = false;
      try {
        const d = new Date(item.createdAt);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toLowerCase();
        matchDate = dateStr.includes(q);
      } catch {
        matchDate = false;
      }

      return (
        matchTitle ||
        matchAnalysisId ||
        matchSentiment ||
        matchEmotion ||
        matchSummary ||
        matchFiles ||
        matchType ||
        matchDate
      );
    });
  },

  // 4. Filter reports based on inputType, sentiment, format, date
  filterReports: (filters: ReportFilters, items: ReportRecord[]): ReportRecord[] => {
    return items.filter(item => {
      // Input type filter
      if (filters.inputType && filters.inputType !== "all") {
        const types = item.inputTypes || [];
        if (filters.inputType === "mixed") {
          if (types.length < 2) return false;
        } else {
          if (!types.includes(filters.inputType)) return false;
        }
      }

      // Sentiment filter
      if (filters.sentiment && filters.sentiment !== "all") {
        if (item.overallSentiment?.label?.toLowerCase() !== filters.sentiment.toLowerCase()) {
          return false;
        }
      }

      // Date range filter
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

  // 5. Sort reports
  sortReports: (sortOption: ReportSortOption, items: ReportRecord[]): ReportRecord[] => {
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

  // 6. Delete a single report without destroying underlying analysis unless specified
  deleteReport: async (reportId: string): Promise<boolean> => {
    try {
      const deletedIds = getDeletedReportIds();
      deletedIds.add(reportId);
      // If reportId starts with rep_, also record the base analysisId
      if (reportId.startsWith("rep_")) {
        deletedIds.add(reportId.replace("rep_", ""));
      }
      saveDeletedReportIds(deletedIds);
      return true;
    } catch (err) {
      console.error("Failed to delete report:", err);
      return false;
    }
  },

  // 7. Bulk delete reports
  deleteReports: async (reportIds: string[]): Promise<boolean> => {
    try {
      const deletedIds = getDeletedReportIds();
      for (const id of reportIds) {
        deletedIds.add(id);
        if (id.startsWith("rep_")) {
          deletedIds.add(id.replace("rep_", ""));
        }
      }
      saveDeletedReportIds(deletedIds);
      return true;
    } catch (err) {
      console.error("Failed to bulk delete reports:", err);
      return false;
    }
  },

  // 8. Calculate statistics directly from real saved reports
  getReportStatistics: async (userId?: string): Promise<ReportStatistics> => {
    const reports = await reportService.getReports(userId);
    if (!reports || reports.length === 0) {
      return {
        totalReports: 0,
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

    for (const r of reports) {
      const label = r.overallSentiment?.label;
      if (label === "Positive") positive++;
      else if (label === "Negative") negative++;
      else if (label === "Neutral") neutral++;
      else if (label === "Mixed") mixed++;
    }

    return {
      totalReports: reports.length,
      positive,
      negative,
      neutral,
      mixed
    };
  },

  // 9. Generate and download professional PDF report
  generatePDF: async (reportId: string): Promise<void> => {
    const report = await reportService.getReportById(reportId);
    if (!report) {
      throw new Error(`Report not found for ID: ${reportId}`);
    }

    // Ensure we have full analysis result
    let fullResult: MultimodalAnalysisResult | undefined = report.fullResult;
    if (!fullResult) {
      const session = await analysisSessionService.getAnalysisSession(report.analysisId);
      fullResult = session?.result;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 45;
    const contentWidth = pageWidth - margin * 2;
    let y = 45;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
        // Running header
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 150);
        doc.text("SentimentAI • Multimodal Analysis Report", margin, 30);
        doc.setDrawColor(220, 225, 235);
        doc.line(margin, 35, pageWidth - margin, 35);
      }
    };

    // --- HEADER BANNER ---
    // Deep slate background box for header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, y, contentWidth, 75, 8, 8, "F");

    // SentimentAI Logo / Brand Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("SentimentAI", margin + 18, y + 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Analysis Report • Executive Intelligence", margin + 18, y + 46);

    // Right side badge in header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text("CONFIDENTIAL", pageWidth - margin - 90, y + 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const dateFormatted = new Date(report.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    doc.text(dateFormatted, pageWidth - margin - 90, y + 46);

    y += 92;

    // --- REPORT TITLE & METADATA ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    const splitTitle = doc.splitTextToSize(report.title, contentWidth);
    doc.text(splitTitle, margin, y);
    y += splitTitle.length * 18 + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Analysis ID: ${report.analysisId}   |   Created: ${new Date(report.createdAt).toUTCString()}`, margin, y);
    y += 18;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    // --- INPUT SUMMARY ---
    checkPageBreak(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Input Summary", margin, y);
    y += 14;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 32, 4, 4, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 32, 4, 4, "D");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const inputSummaryText = `Text Inputs: ${report.inputSummary.textCount}   •   Image Files: ${report.inputSummary.imageCount}   •   Video Files: ${report.inputSummary.videoCount}   •   Total Sources: ${report.inputSummary.totalFiles}`;
    doc.text(inputSummaryText, margin + 12, y + 20);
    y += 45;

    // --- OVERALL SENTIMENT & EMOTIONS GRID ---
    checkPageBreak(70);
    const colWidth = (contentWidth - 12) / 2;

    // Left Box: Overall Sentiment
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, colWidth, 58, 6, 6, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, colWidth, 58, 6, 6, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("OVERALL SENTIMENT", margin + 12, y + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const sentLabel = report.overallSentiment.label;
    if (sentLabel === "Positive") doc.setTextColor(16, 185, 129);
    else if (sentLabel === "Negative") doc.setTextColor(239, 68, 68);
    else if (sentLabel === "Mixed") doc.setTextColor(139, 92, 246);
    else doc.setTextColor(100, 116, 139);
    doc.text(sentLabel, margin + 12, y + 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const scoreVal = (report.overallSentiment.score * 100).toFixed(0);
    doc.text(`Score: ${scoreVal}%  •  Confidence: ${report.overallSentiment.confidence}`, margin + 12, y + 50);

    // Right Box: Emotion Analysis
    const rightColX = margin + colWidth + 12;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightColX, y, colWidth, 58, 6, 6, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(rightColX, y, colWidth, 58, 6, 6, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("EMOTION ANALYSIS", rightColX + 12, y + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(59, 130, 246);
    doc.text(report.dominantEmotion, rightColX + 12, y + 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const secondaryList = report.secondaryEmotions && report.secondaryEmotions.length > 0
      ? report.secondaryEmotions.slice(0, 3).join(", ")
      : "Standard affective spectrum";
    doc.text(`Secondary: ${secondaryList}`, rightColX + 12, y + 50);

    y += 72;

    // --- MEANING / SYNTHESIS ---
    const meaningText = fullResult?.meaning || report.summary || "No meaning synthesis available for this analysis.";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    checkPageBreak(40);
    doc.text("Meaning & Interpretive Summary", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const splitMeaning = doc.splitTextToSize(meaningText, contentWidth);
    checkPageBreak(splitMeaning.length * 13 + 10);
    doc.text(splitMeaning, margin, y);
    y += splitMeaning.length * 13 + 16;

    // --- EMOTIONAL CONTEXT ---
    const contextText = fullResult?.emotional_context || "Context derived from multimodal input parameters.";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    checkPageBreak(40);
    doc.text("Emotional Context", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const splitContext = doc.splitTextToSize(contextText, contentWidth);
    checkPageBreak(splitContext.length * 13 + 10);
    doc.text(splitContext, margin, y);
    y += splitContext.length * 13 + 16;

    // --- VISUAL OBSERVATIONS (IF AVAILABLE) ---
    if (fullResult?.visual_observations) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      checkPageBreak(40);
      doc.text("Visual Observations", margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const splitObs = doc.splitTextToSize(fullResult.visual_observations, contentWidth);
      checkPageBreak(splitObs.length * 13 + 10);
      doc.text(splitObs, margin, y);
      y += splitObs.length * 13 + 16;
    }

    // --- AUDIO / SPEECH CONTEXT (IF AVAILABLE) ---
    if (fullResult?.audio_context) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      checkPageBreak(40);
      doc.text("Audio & Speech Context", margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const splitAudio = doc.splitTextToSize(fullResult.audio_context, contentWidth);
      checkPageBreak(splitAudio.length * 13 + 10);
      doc.text(splitAudio, margin, y);
      y += splitAudio.length * 13 + 16;
    }

    // --- MULTIMODAL RELATIONSHIP (IF MULTIPLE MODALITIES) ---
    if (fullResult?.multimodal_relationship) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      checkPageBreak(40);
      doc.text("Multimodal Relationship", margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const splitRel = doc.splitTextToSize(fullResult.multimodal_relationship, contentWidth);
      checkPageBreak(splitRel.length * 13 + 10);
      doc.text(splitRel, margin, y);
      y += splitRel.length * 13 + 16;
    }

    // --- KEY INSIGHTS ---
    const insights = fullResult?.key_insights || [report.summary];
    if (insights.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      checkPageBreak(40);
      doc.text("Key Insights", margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      for (const item of insights) {
        const itemLines = doc.splitTextToSize(`• ${item}`, contentWidth - 10);
        checkPageBreak(itemLines.length * 13 + 6);
        doc.text(itemLines, margin + 8, y);
        y += itemLines.length * 13 + 4;
      }
      y += 8;
    }

    // --- POSITIVE SIGNALS & CONCERNS (SIDE BY SIDE OR STACKED) ---
    const posSignals = fullResult?.positive_signals || [];
    const concerns = fullResult?.concerns || [];

    if (posSignals.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129); // green
      checkPageBreak(35);
      doc.text("Positive Signals", margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      for (const item of posSignals) {
        const lines = doc.splitTextToSize(`+ ${item}`, contentWidth - 10);
        checkPageBreak(lines.length * 13 + 4);
        doc.text(lines, margin + 8, y);
        y += lines.length * 13 + 3;
      }
      y += 8;
    }

    if (concerns.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(239, 68, 68); // red
      checkPageBreak(35);
      doc.text("Identified Concerns & Friction Points", margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      for (const item of concerns) {
        const lines = doc.splitTextToSize(`- ${item}`, contentWidth - 10);
        checkPageBreak(lines.length * 13 + 4);
        doc.text(lines, margin + 8, y);
        y += lines.length * 13 + 3;
      }
      y += 8;
    }

    // --- CONFIDENCE & CLOSING ---
    checkPageBreak(40);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Analysis Confidence: ${report.overallSentiment.confidence}   •   Generated by SentimentAI`, margin, y);

    // Save and trigger download
    const filename = `SentimentAI_${sanitizeFilename(report.title)}.pdf`;
    doc.save(filename);
  },

  // 10. Generate and download plain text (TXT) report
  generateTXT: async (reportId: string): Promise<string> => {
    const report = await reportService.getReportById(reportId);
    if (!report) {
      throw new Error(`Report not found for ID: ${reportId}`);
    }

    let fullResult: MultimodalAnalysisResult | undefined = report.fullResult;
    if (!fullResult) {
      const session = await analysisSessionService.getAnalysisSession(report.analysisId);
      fullResult = session?.result;
    }

    const secondaryFormatted = (report.secondaryEmotions && report.secondaryEmotions.length > 0)
      ? report.secondaryEmotions.join("\n")
      : "None recorded";

    const insightsFormatted = (fullResult?.key_insights && fullResult.key_insights.length > 0)
      ? fullResult.key_insights.map(i => `• ${i}`).join("\n")
      : `• ${report.summary}`;

    const positiveFormatted = (fullResult?.positive_signals && fullResult.positive_signals.length > 0)
      ? fullResult.positive_signals.map(s => `• ${s}`).join("\n")
      : "Not available for this analysis.";

    const concernsFormatted = (fullResult?.concerns && fullResult.concerns.length > 0)
      ? fullResult.concerns.map(c => `• ${c}`).join("\n")
      : "Not available for this analysis.";

    const visualFormatted = fullResult?.visual_observations || "Not available for this analysis.";
    const audioFormatted = fullResult?.audio_context || "Not available for this analysis.";
    const multimodalFormatted = fullResult?.multimodal_relationship || "Not available for this analysis.";

    const textContent = `SENTIMENTAI ANALYSIS REPORT
===========================

Report Title:
${report.title}

Analysis Date:
${report.createdAt.split("T")[0]}

Analysis ID:
${report.analysisId}

INPUT SUMMARY
-------------
Text Files: ${report.inputSummary.textCount}
Image Files: ${report.inputSummary.imageCount}
Video Files: ${report.inputSummary.videoCount}
Total Files: ${report.inputSummary.totalFiles}

OVERALL SENTIMENT
-----------------
Sentiment: ${report.overallSentiment.label}
Score: ${report.overallSentiment.score.toFixed(2)}
Confidence: ${report.overallSentiment.confidence}

DOMINANT EMOTION
----------------
${report.dominantEmotion}

SECONDARY EMOTIONS
------------------
${secondaryFormatted}

MEANING
-------
${fullResult?.meaning || report.summary}

EMOTIONAL CONTEXT
-----------------
${fullResult?.emotional_context || "Not available for this analysis."}

VISUAL OBSERVATIONS
-------------------
${visualFormatted}

AUDIO/SPEECH CONTEXT
--------------------
${audioFormatted}

MULTIMODAL RELATIONSHIP
-----------------------
${multimodalFormatted}

KEY INSIGHTS
------------
${insightsFormatted}

POSITIVE SIGNALS
----------------
${positiveFormatted}

CONCERNS
--------
${concernsFormatted}

--------------------------------
Generated by SentimentAI
`;

    const filename = `SentimentAI_${sanitizeFilename(report.title)}.txt`;
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return textContent;
  }
};
