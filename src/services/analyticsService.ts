import { jsPDF } from "jspdf";
import {
  AnalyticsFilterParams,
  AnalyticsFullDashboardData,
  AnalyticsOverviewStats,
  SentimentTrendPoint,
  EmotionDistributionItem,
  InputTypeDistributionItem,
  ConfidenceAnalyticsData,
  SentimentDistributionData,
  AnalysisActivityData,
  MultimodalInsightsData,
  PeriodComparisonData,
  HistoryRecord
} from "../types";
import { historyService } from "./historyService";

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

function buildQueryString(filters?: Partial<AnalyticsFilterParams>): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.dateRange) params.set("dateRange", filters.dateRange);
  if (filters.customStartDate) params.set("customStartDate", filters.customStartDate);
  if (filters.customEndDate) params.set("customEndDate", filters.customEndDate);
  if (filters.sentiment && filters.sentiment !== "all") params.set("sentiment", filters.sentiment);
  if (filters.emotion && filters.emotion !== "all") params.set("emotion", filters.emotion);
  if (filters.inputType && filters.inputType !== "all") params.set("inputType", filters.inputType);
  if (filters.confidence && filters.confidence !== "all") params.set("confidence", filters.confidence);
  return params.toString() ? `?${params.toString()}` : "";
}

function sanitizeFilename(text: string): string {
  return text
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50) || "Analytics";
}

export const analyticsService = {
  // 1. Get full consolidated analytics dashboard data
  getFullAnalytics: async (filters?: Partial<AnalyticsFilterParams>): Promise<AnalyticsFullDashboardData> => {
    try {
      const qs = buildQueryString(filters);
      const res = await fetch(`/api/analytics/full${qs}`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Backend analytics endpoint unreachable, computing from local history records:", err);
    }

    // Fallback: Compute safely from client-side history records
    return analyticsService.computeLocalAnalytics(filters);
  },

  // 2. Overview summary
  getAnalyticsSummary: async (filters?: Partial<AnalyticsFilterParams>): Promise<AnalyticsOverviewStats> => {
    const full = await analyticsService.getFullAnalytics(filters);
    return full.overview;
  },

  // 3. Sentiment trend
  getSentimentTrend: async (filters?: Partial<AnalyticsFilterParams>): Promise<SentimentTrendPoint[]> => {
    const full = await analyticsService.getFullAnalytics(filters);
    return full.trend;
  },

  // 4. Emotion distribution
  getEmotionDistribution: async (filters?: Partial<AnalyticsFilterParams>): Promise<EmotionDistributionItem[]> => {
    const full = await analyticsService.getFullAnalytics(filters);
    return full.emotions;
  },

  // 5. Input types distribution
  getInputTypeDistribution: async (filters?: Partial<AnalyticsFilterParams>): Promise<InputTypeDistributionItem[]> => {
    const full = await analyticsService.getFullAnalytics(filters);
    return full.inputTypes;
  },

  // 6. Confidence analytics
  getConfidenceAnalytics: async (filters?: Partial<AnalyticsFilterParams>): Promise<ConfidenceAnalyticsData> => {
    const full = await analyticsService.getFullAnalytics(filters);
    return full.confidence;
  },

  // 7. Sentiment distribution
  getSentimentDistribution: async (filters?: Partial<AnalyticsFilterParams>): Promise<SentimentDistributionData> => {
    const full = await analyticsService.getFullAnalytics(filters);
    return full.sentimentDistribution;
  },

  // 8. Analysis activity
  getAnalysisActivity: async (filters?: Partial<AnalyticsFilterParams>): Promise<AnalysisActivityData> => {
    const full = await analyticsService.getFullAnalytics(filters);
    return full.activity;
  },

  // 9. Multimodal insights
  getMultimodalInsights: async (filters?: Partial<AnalyticsFilterParams>): Promise<MultimodalInsightsData> => {
    const full = await analyticsService.getFullAnalytics(filters);
    return full.multimodal;
  },

  // 10. Compare periods
  comparePeriods: async (filters?: Partial<AnalyticsFilterParams>): Promise<PeriodComparisonData> => {
    const full = await analyticsService.getFullAnalytics(filters);
    return full.comparison;
  },

  // 11. Fallback local computation for zero-downtime reliability
  computeLocalAnalytics: async (filters?: Partial<AnalyticsFilterParams>): Promise<AnalyticsFullDashboardData> => {
    const allRecords = await historyService.getAnalyses();
    const now = new Date();
    const range = filters?.dateRange || "last30";

    let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let endDate = new Date(now);

    if (range === "last7") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === "last90") startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    else if (range === "last6months") startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    else if (range === "lastYear") startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    else if (range === "custom") {
      if (filters?.customStartDate) startDate = new Date(filters.customStartDate);
      if (filters?.customEndDate) {
        endDate = new Date(filters.customEndDate);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    const filtered = allRecords.filter(r => {
      if (!r.createdAt) return false;
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return false;
      if (d < startDate || d > endDate) return false;

      if (filters?.sentiment && filters.sentiment !== "all") {
        if ((r.overallSentiment?.label || "").toLowerCase() !== filters.sentiment.toLowerCase()) return false;
      }
      if (filters?.emotion && filters.emotion !== "all") {
        if (!(r.dominantEmotion || "").toLowerCase().includes(filters.emotion.toLowerCase())) return false;
      }
      if (filters?.inputType && filters.inputType !== "all") {
        const types = r.inputTypes || [];
        if (filters.inputType === "multimodal" && types.length < 2) return false;
        if (filters.inputType !== "multimodal" && !types.includes(filters.inputType)) return false;
      }
      if (filters?.confidence && filters.confidence !== "all") {
        if ((r.overallSentiment?.confidence || "").toLowerCase() !== filters.confidence.toLowerCase()) return false;
      }
      return true;
    });

    const totalAnalyses = filtered.length;
    let pos = 0, neu = 0, neg = 0, mix = 0, scoreSum = 0, confSum = 0;
    let highC = 0, medC = 0, lowC = 0;
    let textC = 0, imgC = 0, vidC = 0, multiC = 0;
    let multiScoreSum = 0;
    const emotionCounts: Record<string, number> = {};
    const multiEmos: Record<string, number> = {};
    const comboCounts: Record<string, { labels: string[]; count: number }> = {};
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeekCounts: Record<string, number> = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
    const dateBuckets: Record<string, any> = {};
    const dateCounts: Record<string, any> = {};

    filtered.forEach(r => {
      const s = (r.overallSentiment?.label || "Neutral").toLowerCase();
      if (s === "positive") pos++;
      else if (s === "negative") neg++;
      else if (s === "mixed") mix++;
      else neu++;

      const sc = typeof r.overallSentiment?.score === "number" ? r.overallSentiment.score : 0.5;
      scoreSum += sc;

      const c = (r.overallSentiment?.confidence || "Medium").toLowerCase();
      const cScore = c === "high" ? 92 : c === "low" ? 45 : 72;
      confSum += cScore;
      if (c === "high") highC++;
      else if (c === "low") lowC++;
      else medC++;

      const dom = r.dominantEmotion || "Curiosity";
      emotionCounts[dom] = (emotionCounts[dom] || 0) + 1;

      const types = r.inputTypes || ["text"];
      if (types.length > 1) {
        multiC++;
        multiScoreSum += sc;
        multiEmos[dom] = (multiEmos[dom] || 0) + 1;
        const key = types.join("+");
        if (!comboCounts[key]) {
          comboCounts[key] = {
            labels: types.map(t => t === "text" ? "📝 Text" : t === "image" ? "🖼️ Image" : "🎥 Video"),
            count: 0
          };
        }
        comboCounts[key].count++;
      } else if (types.includes("video")) {
        vidC++;
      } else if (types.includes("image")) {
        imgC++;
      } else {
        textC++;
      }

      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) {
        const dayName = days[d.getDay()];
        dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;

        const dateKey = d.toISOString().split("T")[0];
        const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!dateBuckets[dateKey]) {
          dateBuckets[dateKey] = { date: dateKey, label: dateLabel, total: 0, positive: 0, neutral: 0, negative: 0, mixed: 0, scoreSum: 0 };
        }
        const b = dateBuckets[dateKey];
        b.total++;
        if (s === "positive") b.positive++;
        else if (s === "negative") b.negative++;
        else if (s === "mixed") b.mixed++;
        else b.neutral++;
        b.scoreSum += sc;

        if (!dateCounts[dateKey]) dateCounts[dateKey] = { count: 0, dateStr: dateKey, dayName };
        dateCounts[dateKey].count++;
      }
    });

    const posPct = totalAnalyses > 0 ? Math.round((pos / totalAnalyses) * 100) : 0;
    const neuPct = totalAnalyses > 0 ? Math.round((neu / totalAnalyses) * 100) : 0;
    const negPct = totalAnalyses > 0 ? Math.round((neg / totalAnalyses) * 100) : 0;
    const mixPct = totalAnalyses > 0 ? Math.round((mix / totalAnalyses) * 100) : 0;

    const avgScore = totalAnalyses > 0 ? Number((scoreSum / totalAnalyses).toFixed(2)) : 0;
    const avgConf = totalAnalyses > 0 ? Math.round(confSum / totalAnalyses) : 0;

    const palette = ["#0ea5e9", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e", "#eab308", "#3b82f6"];
    const emotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: totalAnalyses > 0 ? Math.round((count / totalAnalyses) * 100) : 0,
        ranking: idx + 1,
        isDominant: idx === 0,
        color: palette[idx % palette.length]
      }));

    const topEmotion = emotions[0] || null;

    const activeDateEntries = Object.values(dateCounts).sort((a: any, b: any) => b.count - a.count);
    const mostActiveDay = activeDateEntries.length > 0 ? {
      date: activeDateEntries[0].dateStr,
      dayName: activeDateEntries[0].dayName,
      count: activeDateEntries[0].count
    } : null;

    const leastActiveDay = activeDateEntries.length > 0 ? {
      date: activeDateEntries[activeDateEntries.length - 1].dateStr,
      dayName: activeDateEntries[activeDateEntries.length - 1].dayName,
      count: activeDateEntries[activeDateEntries.length - 1].count
    } : null;

    const summaryText = totalAnalyses > 0
      ? `Your analyses were ${posPct >= 50 ? "mostly positive" : "balanced"} (${posPct}% positive, ${negPct}% negative). ${topEmotion ? `${topEmotion.name} was your most detected emotional pattern.` : ""} AI detection confidence averaged ${avgConf}%.`
      : "No analysis data available for this period.";

    return {
      filters: {
        dateRange: range,
        customStartDate: filters?.customStartDate,
        customEndDate: filters?.customEndDate,
        sentiment: filters?.sentiment || "all",
        emotion: filters?.emotion,
        inputType: filters?.inputType || "all",
        confidence: filters?.confidence || "all",
      },
      overview: {
        totalAnalyses,
        positiveCount: pos,
        positivePct: posPct,
        neutralCount: neu,
        neutralPct: neuPct,
        negativeCount: neg,
        negativePct: negPct,
        mixedCount: mix,
        mixedPct: mixPct,
        avgConfidenceScore: avgConf,
        avgConfidenceLabel: avgConf >= 80 ? "High" : avgConf >= 60 ? "Medium" : "Low",
        avgSentimentScore: avgScore,
        mostDetectedEmotion: topEmotion ? { name: topEmotion.name, count: topEmotion.count, percentage: topEmotion.percentage } : null,
        mostActiveDay
      },
      trend: Object.values(dateBuckets).sort((a: any, b: any) => a.date.localeCompare(b.date)).map((b: any) => ({
        date: b.date,
        label: b.label,
        total: b.total,
        positive: b.positive,
        neutral: b.neutral,
        negative: b.negative,
        mixed: b.mixed,
        avgScore: b.total > 0 ? Number((b.scoreSum / b.total).toFixed(2)) : 0
      })),
      emotions,
      topEmotions: emotions.slice(0, 5),
      inputTypes: [
        { type: "text", label: "Text & Documents", icon: "📝", count: textC, percentage: totalAnalyses > 0 ? Math.round((textC / totalAnalyses) * 100) : 0, color: "#0ea5e9" },
        { type: "image", label: "Images & Visuals", icon: "🖼️", count: imgC, percentage: totalAnalyses > 0 ? Math.round((imgC / totalAnalyses) * 100) : 0, color: "#10b981" },
        { type: "video", label: "Video & Media", icon: "🎥", count: vidC, percentage: totalAnalyses > 0 ? Math.round((vidC / totalAnalyses) * 100) : 0, color: "#f59e0b" },
        { type: "multimodal", label: "Multimodal / Combined", icon: "🔀", count: multiC, percentage: totalAnalyses > 0 ? Math.round((multiC / totalAnalyses) * 100) : 0, color: "#8b5cf6" },
      ],
      confidence: {
        highCount: highC,
        highPct: totalAnalyses > 0 ? Math.round((highC / totalAnalyses) * 100) : 0,
        mediumCount: medC,
        mediumPct: totalAnalyses > 0 ? Math.round((medC / totalAnalyses) * 100) : 0,
        lowCount: lowC,
        lowPct: totalAnalyses > 0 ? Math.round((lowC / totalAnalyses) * 100) : 0,
        averageConfidencePct: avgConf
      },
      sentimentDistribution: {
        positive: { count: pos, percentage: posPct },
        neutral: { count: neu, percentage: neuPct },
        negative: { count: neg, percentage: negPct },
        mixed: { count: mix, percentage: mixPct }
      },
      activity: {
        totalActiveDays: activeDateEntries.length,
        analysesPerActiveDay: activeDateEntries.length > 0 ? Number((totalAnalyses / activeDateEntries.length).toFixed(1)) : 0,
        mostActiveDay,
        leastActiveDay,
        activityByDayOfWeek: days.map(d => ({ day: d, count: dayOfWeekCounts[d] })),
        timeline: activeDateEntries.map((e: any) => ({ date: e.dateStr, count: e.count })).sort((a: any, b: any) => a.date.localeCompare(b.date))
      },
      multimodal: {
        totalMultimodal: multiC,
        multimodalPercentage: totalAnalyses > 0 ? Math.round((multiC / totalAnalyses) * 100) : 0,
        avgSentimentScore: multiC > 0 ? Number((multiScoreSum / multiC).toFixed(2)) : 0,
        dominantEmotion: "N/A",
        combinations: Object.entries(comboCounts).map(([key, val]) => ({
          comboKey: key,
          labels: val.labels,
          count: val.count,
          percentage: multiC > 0 ? Math.round((val.count / multiC) * 100) : 0
        }))
      },
      comparison: {
        hasEnoughData: false,
        currentPeriod: {
          totalAnalyses,
          positivePct: posPct,
          negativePct: negPct,
          neutralPct: neuPct,
          mixedPct: mixPct,
          avgSentimentScore: avgScore,
          avgConfidence: avgConf,
          dominantEmotion: topEmotion?.name || "None"
        }
      },
      summaryText,
      generatedAt: new Date().toISOString()
    };
  },

  // 12. Export Analytics as PDF
  exportAnalyticsPDF: (data: AnalyticsFullDashboardData, userName?: string): void => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (spaceNeeded: number) => {
      if (y + spaceNeeded > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // Header Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 68, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text("SentimentAI — Advanced Analytics Report", margin + 16, y + 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    const rangeLabel = data.filters.dateRange === "last7" ? "Last 7 Days" :
      data.filters.dateRange === "last90" ? "Last 90 Days" :
      data.filters.dateRange === "last6months" ? "Last 6 Months" :
      data.filters.dateRange === "lastYear" ? "Last Year" :
      data.filters.dateRange === "custom" ? `Custom (${data.filters.customStartDate || "Start"} to ${data.filters.customEndDate || "End"})` :
      "Last 30 Days";

    doc.text(`Period: ${rangeLabel}   •   Generated: ${new Date(data.generatedAt).toLocaleString()}   •   User: ${userName || "Active Account"}`, margin + 16, y + 48);
    y += 84;

    // Executive Summary Box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 54, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Analytics Summary & AI Signal Discovery", margin + 12, y + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const summaryLines = doc.splitTextToSize(data.summaryText, contentWidth - 24);
    doc.text(summaryLines, margin + 12, y + 32);
    y += 66;

    // Overview Stats Grid
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Key Metrics Overview", margin, y);
    y += 16;

    const stats = [
      { label: "Total Analyses", val: `${data.overview.totalAnalyses}` },
      { label: "Positive Sentiment", val: `${data.overview.positiveCount} (${data.overview.positivePct}%)` },
      { label: "Negative Sentiment", val: `${data.overview.negativeCount} (${data.overview.negativePct}%)` },
      { label: "Neutral / Mixed", val: `${data.overview.neutralCount + data.overview.mixedCount} (${data.overview.neutralPct + data.overview.mixedPct}%)` },
      { label: "Average Score", val: `${(data.overview.avgSentimentScore * 100).toFixed(0)}%` },
      { label: "Average Confidence", val: `${data.overview.avgConfidenceScore}% (${data.overview.avgConfidenceLabel})` },
    ];

    const colWidth = contentWidth / 3;
    stats.forEach((st, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const cardX = margin + col * colWidth;
      const cardY = y + row * 44;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, cardY, colWidth - 8, 38, 3, 3, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(st.label, cardX + 8, cardY + 14);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(st.val, cardX + 8, cardY + 28);
    });

    y += 102;

    // Emotion Analytics Table
    checkPageBreak(120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Emotion Frequency & Rankings", margin, y);
    y += 16;

    doc.setFillColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 20, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text("Rank", margin + 8, y + 13);
    doc.text("Emotion", margin + 60, y + 13);
    doc.text("Occurrences", margin + 220, y + 13);
    doc.text("Percentage", margin + 340, y + 13);
    doc.text("Status", margin + 440, y + 13);
    y += 20;

    const topList = data.emotions.slice(0, 7);
    if (topList.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text("No emotion data recorded in this period.", margin + 8, y + 14);
      y += 22;
    } else {
      topList.forEach((emo, idx) => {
        checkPageBreak(22);
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
        doc.rect(margin, y, contentWidth, 18, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);

        doc.text(`#${emo.ranking}`, margin + 8, y + 12);
        doc.text(emo.name, margin + 60, y + 12);
        doc.text(`${emo.count}`, margin + 220, y + 12);
        doc.text(`${emo.percentage}%`, margin + 340, y + 12);
        doc.text(emo.isDominant ? "Dominant Signal" : "Secondary", margin + 440, y + 12);
        y += 18;
      });
    }

    y += 14;

    // Input Types & Multimodal Table
    checkPageBreak(120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Analysis Type & Multimodal Utilization", margin, y);
    y += 16;

    data.inputTypes.forEach(inp => {
      checkPageBreak(18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`• ${inp.label}: ${inp.count} analyses (${inp.percentage}%)`, margin + 12, y);
      y += 14;
    });

    if (data.multimodal.totalMultimodal > 0) {
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Multimodal Combinations (${data.multimodal.totalMultimodal} total, ${data.multimodal.multimodalPercentage}% of all sessions):`, margin + 12, y);
      y += 14;

      data.multimodal.combinations.forEach(combo => {
        checkPageBreak(16);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`  - ${combo.labels.join(" + ")}: ${combo.count} sessions (${combo.percentage}%)`, margin + 16, y);
        y += 12;
      });
    }

    // Period Comparison Section (if available)
    if (data.comparison && data.comparison.hasEnoughData && data.comparison.changes) {
      y += 14;
      checkPageBreak(90);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Period Comparison (vs. Previous Window)", margin, y);
      y += 16;

      const ch = data.comparison.changes;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`• Total Analyses Change: ${ch.totalAnalyses >= 0 ? `+${ch.totalAnalyses}` : ch.totalAnalyses}`, margin + 12, y);
      y += 13;
      doc.text(`• Positive Sentiment Delta: ${ch.positivePct >= 0 ? `+${ch.positivePct}%` : `${ch.positivePct}%`}`, margin + 12, y);
      y += 13;
      doc.text(`• Negative Sentiment Delta: ${ch.negativePct >= 0 ? `+${ch.negativePct}%` : `${ch.negativePct}%`}`, margin + 12, y);
      y += 13;
      doc.text(`• Average Sentiment Score Delta: ${ch.avgSentimentScore >= 0 ? `+${ch.avgSentimentScore}` : `${ch.avgSentimentScore}`}`, margin + 12, y);
      y += 16;
    }

    // Footer Disclaimer
    checkPageBreak(40);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Notice: SentimentAI analytics provide computational sentiment & communication signals for reflection. Not intended for psychological diagnosis.", margin, y);

    const filename = `SentimentAI_Analytics_${sanitizeFilename(rangeLabel)}.pdf`;
    doc.save(filename);
  },

  // 13. Export Analytics as Plain Text (TXT)
  exportAnalyticsTXT: (data: AnalyticsFullDashboardData, userName?: string): void => {
    const rangeLabel = data.filters.dateRange === "last7" ? "Last 7 Days" :
      data.filters.dateRange === "last90" ? "Last 90 Days" :
      data.filters.dateRange === "last6months" ? "Last 6 Months" :
      data.filters.dateRange === "lastYear" ? "Last Year" :
      data.filters.dateRange === "custom" ? `Custom (${data.filters.customStartDate || "Start"} to ${data.filters.customEndDate || "End"})` :
      "Last 30 Days";

    const lines: string[] = [];
    lines.push("================================================================");
    lines.push("SENTIMENTAI — ADVANCED ANALYTICS REPORT");
    lines.push("================================================================");
    lines.push(`Generated: ${new Date(data.generatedAt).toLocaleString()}`);
    lines.push(`Date Range: ${rangeLabel}`);
    lines.push(`User: ${userName || "Active Account"}`);
    lines.push("");

    lines.push("--- ANALYTICS SUMMARY ---");
    lines.push(data.summaryText);
    lines.push("");

    lines.push("--- OVERVIEW STATISTICS ---");
    lines.push(`Total Analyses: ${data.overview.totalAnalyses}`);
    lines.push(`Positive: ${data.overview.positiveCount} (${data.overview.positivePct}%)`);
    lines.push(`Neutral: ${data.overview.neutralCount} (${data.overview.neutralPct}%)`);
    lines.push(`Negative: ${data.overview.negativeCount} (${data.overview.negativePct}%)`);
    lines.push(`Mixed: ${data.overview.mixedCount} (${data.overview.mixedPct}%)`);
    lines.push(`Average Sentiment Score: ${(data.overview.avgSentimentScore * 100).toFixed(0)}% (${data.overview.avgSentimentScore})`);
    lines.push(`Average Confidence: ${data.overview.avgConfidenceScore}% (${data.overview.avgConfidenceLabel})`);
    if (data.overview.mostDetectedEmotion) {
      lines.push(`Most Detected Emotion: ${data.overview.mostDetectedEmotion.name} (${data.overview.mostDetectedEmotion.count} occurrences, ${data.overview.mostDetectedEmotion.percentage}%)`);
    }
    if (data.overview.mostActiveDay) {
      lines.push(`Most Active Day: ${data.overview.mostActiveDay.dayName} (${data.overview.mostActiveDay.count} analyses)`);
    }
    lines.push("");

    lines.push("--- EMOTION DISTRIBUTION ---");
    if (data.emotions.length === 0) {
      lines.push("No emotion data recorded for this period.");
    } else {
      data.emotions.forEach(e => {
        lines.push(`${e.ranking}. ${e.name} — ${e.count} (${e.percentage}%)${e.isDominant ? " [Dominant Signal]" : ""}`);
      });
    }
    lines.push("");

    lines.push("--- ANALYSIS INPUT TYPES ---");
    data.inputTypes.forEach(inp => {
      lines.push(`• ${inp.label}: ${inp.count} (${inp.percentage}%)`);
    });
    lines.push("");

    if (data.multimodal.totalMultimodal > 0) {
      lines.push("--- MULTIMODAL INSIGHTS ---");
      lines.push(`Total Multimodal Sessions: ${data.multimodal.totalMultimodal} (${data.multimodal.multimodalPercentage}% of total)`);
      lines.push(`Average Multimodal Sentiment Score: ${(data.multimodal.avgSentimentScore * 100).toFixed(0)}%`);
      lines.push(`Dominant Multimodal Emotion: ${data.multimodal.dominantEmotion}`);
      lines.push("Combinations:");
      data.multimodal.combinations.forEach(c => {
        lines.push(`  - ${c.labels.join(" + ")}: ${c.count} (${c.percentage}%)`);
      });
      lines.push("");
    }

    if (data.comparison && data.comparison.hasEnoughData && data.comparison.changes) {
      lines.push("--- PERIOD COMPARISON (vs. Previous Window) ---");
      const ch = data.comparison.changes;
      lines.push(`Total Analyses: ${ch.totalAnalyses >= 0 ? `+${ch.totalAnalyses}` : ch.totalAnalyses}`);
      lines.push(`Positive % Delta: ${ch.positivePct >= 0 ? `+${ch.positivePct}%` : `${ch.positivePct}%`}`);
      lines.push(`Negative % Delta: ${ch.negativePct >= 0 ? `+${ch.negativePct}%` : `${ch.negativePct}%`}`);
      lines.push(`Average Score Delta: ${ch.avgSentimentScore >= 0 ? `+${ch.avgSentimentScore}` : `${ch.avgSentimentScore}`}`);
      lines.push(`Confidence Delta: ${ch.avgConfidence >= 0 ? `+${ch.avgConfidence}%` : `${ch.avgConfidence}%`}`);
      lines.push("");
    }

    lines.push("================================================================");
    lines.push("Notice: SentimentAI provides computational linguistic & emotion signals for reflection.");
    lines.push("================================================================");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SentimentAI_Analytics_${sanitizeFilename(rangeLabel)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
