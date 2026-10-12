import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { AnalysisSessionTable, AnalysisInputTable } from "../database/types";

interface ParsedFilters {
  dateRange: "last7" | "last30" | "last90" | "last6months" | "lastYear" | "custom";
  startDate: Date;
  endDate: Date;
  sentiment?: string;
  emotion?: string;
  inputType?: string;
  confidence?: string;
}

function parseDateRangeAndFilters(query: any): ParsedFilters {
  const now = new Date();
  const dateRange = (query.dateRange as any) || "last30";
  let startDate = new Date();
  let endDate = new Date(now);

  switch (dateRange) {
    case "last7":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "last90":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "last6months":
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case "lastYear":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "custom":
      if (query.customStartDate) {
        startDate = new Date(String(query.customStartDate));
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (query.customEndDate) {
        endDate = new Date(String(query.customEndDate));
        // Include full end date
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    case "last30":
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  // Ensure valid dates
  if (isNaN(startDate.getTime())) {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  if (isNaN(endDate.getTime())) {
    endDate = new Date();
  }

  return {
    dateRange,
    startDate,
    endDate,
    sentiment: query.sentiment && query.sentiment !== "all" ? String(query.sentiment).toLowerCase() : undefined,
    emotion: query.emotion && query.emotion !== "all" ? String(query.emotion).toLowerCase() : undefined,
    inputType: query.inputType && query.inputType !== "all" ? String(query.inputType).toLowerCase() : undefined,
    confidence: query.confidence && query.confidence !== "all" ? String(query.confidence).toLowerCase() : undefined,
  };
}

function getUserFilteredAnalyses(userId: string, filters: ParsedFilters) {
  const allUserAnalyses = db.listAnalysesByUser(userId, { limit: 10000 }).records;

  const filtered = allUserAnalyses.filter((session) => {
    if (!session || !session.createdAt) return false;

    // Ignore deleted or failed sessions
    if (session.status === "failed") return false;

    // Date range check
    const createdAt = new Date(session.createdAt);
    if (isNaN(createdAt.getTime())) return false;
    if (createdAt < filters.startDate || createdAt > filters.endDate) return false;

    // Sentiment check
    if (filters.sentiment) {
      const sentimentLabel = (session.overallSentiment?.label || "").toLowerCase();
      if (sentimentLabel !== filters.sentiment) return false;
    }

    // Emotion check
    if (filters.emotion) {
      const dominantEmotion = (session.emotions?.dominant?.name || "").toLowerCase();
      const secondaryEmotions = (session.emotions?.secondary || []).map(e => (e.name || "").toLowerCase());
      const matchesDominant = dominantEmotion.includes(filters.emotion);
      const matchesSecondary = secondaryEmotions.some(s => s.includes(filters.emotion!));
      if (!matchesDominant && !matchesSecondary) return false;
    }

    // Confidence check
    if (filters.confidence) {
      const conf = (session.confidence || session.overallSentiment?.confidence || "").toLowerCase();
      if (conf !== filters.confidence) return false;
    }

    // Input Type check
    if (filters.inputType) {
      const summary = session.inputSummary || { textCount: 0, imageCount: 0, videoCount: 0 };
      const hasText = summary.textCount > 0 || Boolean((summary as any).hasDirectText);
      const hasImage = summary.imageCount > 0;
      const hasVideo = summary.videoCount > 0;
      const activeTypes = [hasText, hasImage, hasVideo].filter(Boolean).length;

      if (filters.inputType === "multimodal") {
        if (activeTypes < 2 && (summary.imageCount + summary.videoCount + (hasText ? 1 : 0)) < 2) {
          return false;
        }
      } else if (filters.inputType === "text") {
        if (!hasText) return false;
      } else if (filters.inputType === "image") {
        if (!hasImage) return false;
      } else if (filters.inputType === "video") {
        if (!hasVideo) return false;
      }
    }

    return true;
  });

  return filtered;
}

// Convert confidence string or number to 0-100 score
export function parseConfidenceScore(conf: string | number | undefined): number {
  if (typeof conf === "number") {
    return conf > 1 ? conf : Math.round(conf * 100);
  }
  if (!conf) return 75;
  const c = String(conf).toLowerCase();
  if (c === "high") return 92;
  if (c === "medium") return 72;
  if (c === "low") return 45;
  return 75;
}

export function computeFullAnalyticsData(userId: string, query: any) {
  const filters = parseDateRangeAndFilters(query);
  const analyses = getUserFilteredAnalyses(userId, filters);
  const totalAnalyses = analyses.length;

  if (totalAnalyses === 0) {
    return {
      filters: {
        dateRange: filters.dateRange,
        customStartDate: query.customStartDate ? String(query.customStartDate) : undefined,
        customEndDate: query.customEndDate ? String(query.customEndDate) : undefined,
        sentiment: query.sentiment ? (String(query.sentiment) as any) : "all",
        emotion: query.emotion ? String(query.emotion) : undefined,
        inputType: query.inputType ? (String(query.inputType) as any) : "all",
        confidence: query.confidence ? (String(query.confidence) as any) : "all",
      },
      overview: {
        totalAnalyses: 0,
        positiveCount: 0,
        positivePct: 0,
        neutralCount: 0,
        neutralPct: 0,
        negativeCount: 0,
        negativePct: 0,
        mixedCount: 0,
        mixedPct: 0,
        avgConfidenceScore: 0,
        avgConfidenceLabel: "Low" as const,
        avgSentimentScore: 0,
        mostDetectedEmotion: null,
        mostActiveDay: null
      },
      trend: [],
      emotions: [],
      topEmotions: [],
      inputTypes: [
        { type: "text", label: "Text & Documents", icon: "📝", count: 0, percentage: 0, color: "#0ea5e9" },
        { type: "image", label: "Images & Visuals", icon: "🖼️", count: 0, percentage: 0, color: "#10b981" },
        { type: "video", label: "Video & Dynamic Media", icon: "🎥", count: 0, percentage: 0, color: "#f59e0b" },
        { type: "multimodal", label: "Multimodal / Combined", icon: "🔀", count: 0, percentage: 0, color: "#8b5cf6" },
      ],
      confidence: {
        highCount: 0,
        highPct: 0,
        mediumCount: 0,
        mediumPct: 0,
        lowCount: 0,
        lowPct: 0,
        averageConfidencePct: 0
      },
      sentimentDistribution: {
        positive: { count: 0, percentage: 0 },
        neutral: { count: 0, percentage: 0 },
        negative: { count: 0, percentage: 0 },
        mixed: { count: 0, percentage: 0 }
      },
      activity: {
        totalActiveDays: 0,
        analysesPerActiveDay: 0,
        mostActiveDay: null,
        leastActiveDay: null,
        activityByDayOfWeek: [
          { day: "Sunday", count: 0 },
          { day: "Monday", count: 0 },
          { day: "Tuesday", count: 0 },
          { day: "Wednesday", count: 0 },
          { day: "Thursday", count: 0 },
          { day: "Friday", count: 0 },
          { day: "Saturday", count: 0 }
        ],
        timeline: []
      },
      multimodal: {
        totalMultimodal: 0,
        multimodalPercentage: 0,
        avgSentimentScore: 0,
        dominantEmotion: "N/A",
        combinations: []
      },
      comparison: {
        hasEnoughData: false,
        currentPeriod: {
          totalAnalyses: 0,
          positivePct: 0,
          negativePct: 0,
          neutralPct: 0,
          mixedPct: 0,
          avgSentimentScore: 0,
          avgConfidence: 0,
          dominantEmotion: "None"
        }
      },
      summaryText: "No analysis data available for this period. Complete analyses across text, images, or videos to generate detailed trends.",
      generatedAt: new Date().toISOString()
    };
  }

  // Calculations
  let posCount = 0, neuCount = 0, negCount = 0, mixCount = 0;
  let totalScore = 0, totalConfScore = 0;
  let highConf = 0, medConf = 0, lowConf = 0;
  let textCount = 0, imageCount = 0, videoCount = 0, multimodalCount = 0;
  let multiScore = 0;
  const multiEmotionCounts: Record<string, number> = {};
  const comboCounts: Record<string, { labels: string[]; count: number }> = {};
  const emotionCounts: Record<string, number> = {};
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeekCounts: Record<string, number> = {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
  };
  const dateBuckets: Record<string, {
    date: string;
    label: string;
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    mixed: number;
    scoreSum: number;
  }> = {};
  const dateCounts: Record<string, { count: number; dateStr: string; dayName: string }> = {};

  analyses.forEach((item) => {
    // Sentiment
    const s = (item.overallSentiment?.label || "Neutral").toLowerCase();
    if (s === "positive") posCount++;
    else if (s === "negative") negCount++;
    else if (s === "mixed") mixCount++;
    else neuCount++;

    // Score
    const score = typeof item.score === "number" ? item.score : (item.overallSentiment?.score ?? 0.5);
    totalScore += score;

    // Confidence
    const confLabel = (item.confidence || item.overallSentiment?.confidence || "Medium").toLowerCase();
    const confScore = parseConfidenceScore(confLabel);
    totalConfScore += confScore;
    if (confLabel === "high") highConf++;
    else if (confLabel === "low") lowConf++;
    else medConf++;

    // Emotion
    const dom = item.emotions?.dominant?.name;
    if (dom && dom.trim()) {
      emotionCounts[dom.trim()] = (emotionCounts[dom.trim()] || 0) + 1;
    }

    // Input type & Multimodal
    const summary = item.inputSummary || { textCount: 0, imageCount: 0, videoCount: 0 };
    const hasText = summary.textCount > 0 || Boolean((summary as any).hasDirectText);
    const hasImage = summary.imageCount > 0;
    const hasVideo = summary.videoCount > 0;
    const activeModalityCount = [hasText, hasImage, hasVideo].filter(Boolean).length;

    const parts: string[] = [];
    const labels: string[] = [];
    if (hasText) { parts.push("text"); labels.push("📝 Text"); }
    if (hasImage) { parts.push("image"); labels.push("🖼️ Image"); }
    if (hasVideo) { parts.push("video"); labels.push("🎥 Video"); }

    if (activeModalityCount > 1 || (summary.imageCount + summary.videoCount + (hasText ? 1 : 0)) > 1) {
      multimodalCount++;
      multiScore += score;
      if (dom) multiEmotionCounts[dom] = (multiEmotionCounts[dom] || 0) + 1;
      const comboKey = parts.join("+");
      if (!comboCounts[comboKey]) {
        comboCounts[comboKey] = { labels, count: 0 };
      }
      comboCounts[comboKey].count++;
    } else if (hasVideo) {
      videoCount++;
    } else if (hasImage) {
      imageCount++;
    } else {
      textCount++;
    }

    // Date & Trend
    const d = new Date(item.createdAt);
    if (!isNaN(d.getTime())) {
      const dayName = days[d.getDay()];
      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;

      const dateKey = d.toISOString().split("T")[0];
      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      if (!dateBuckets[dateKey]) {
        dateBuckets[dateKey] = {
          date: dateKey,
          label: dateLabel,
          total: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          mixed: 0,
          scoreSum: 0
        };
      }
      const bucket = dateBuckets[dateKey];
      bucket.total++;
      if (s === "positive") bucket.positive++;
      else if (s === "negative") bucket.negative++;
      else if (s === "mixed") bucket.mixed++;
      else bucket.neutral++;
      bucket.scoreSum += score;

      if (!dateCounts[dateKey]) {
        dateCounts[dateKey] = { count: 0, dateStr: dateKey, dayName };
      }
      dateCounts[dateKey].count++;
    }
  });

  const posPct = Math.round((posCount / totalAnalyses) * 100);
  const neuPct = Math.round((neuCount / totalAnalyses) * 100);
  const negPct = Math.round((negCount / totalAnalyses) * 100);
  const mixPct = Math.round((mixCount / totalAnalyses) * 100);

  const avgScore = Number((totalScore / totalAnalyses).toFixed(2));
  const avgConfidence = Math.round(totalConfScore / totalAnalyses);
  const avgConfidenceLabel = avgConfidence >= 80 ? "High" : avgConfidence >= 60 ? "Medium" : "Low";

  // Emotions ranked
  const palette = ["#0ea5e9", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e", "#eab308", "#3b82f6"];
  const sortedEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], idx) => ({
      name,
      count,
      percentage: Math.round((count / totalAnalyses) * 100),
      ranking: idx + 1,
      isDominant: idx === 0,
      color: palette[idx % palette.length]
    }));

  const topEmotion = sortedEmotions[0] || null;

  // Activity
  const activeDateEntries = Object.values(dateCounts);
  const totalActiveDays = activeDateEntries.length;
  const analysesPerActiveDay = totalActiveDays > 0 ? Number((totalAnalyses / totalActiveDays).toFixed(1)) : 0;
  activeDateEntries.sort((a, b) => b.count - a.count);
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

  // Trend
  const trendPoints = Object.values(dateBuckets)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(b => ({
      date: b.date,
      label: b.label,
      total: b.total,
      positive: b.positive,
      neutral: b.neutral,
      negative: b.negative,
      mixed: b.mixed,
      avgScore: b.total > 0 ? Number((b.scoreSum / b.total).toFixed(2)) : 0
    }));

  // Multimodal dominant
  let multiDominant = "N/A";
  let multiDominantCount = 0;
  for (const [em, cnt] of Object.entries(multiEmotionCounts)) {
    if (cnt > multiDominantCount) {
      multiDominant = em;
      multiDominantCount = cnt;
    }
  }

  const combinations = Object.entries(comboCounts).map(([key, item]) => ({
    key,
    labels: item.labels,
    count: item.count,
    percentage: multimodalCount > 0 ? Math.round((item.count / multimodalCount) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  // Period Comparison
  const periodDuration = filters.endDate.getTime() - filters.startDate.getTime();
  const prevEndDate = new Date(filters.startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - periodDuration);

  const prevAnalyses = db.listAnalysesByUser(userId, { limit: 10000 }).records.filter(s => {
    if (!s || s.status === "failed" || !s.createdAt) return false;
    const cd = new Date(s.createdAt);
    return cd >= prevStartDate && cd <= prevEndDate;
  });

  const prevTotal = prevAnalyses.length;
  let comparisonData: any;

  if (prevTotal === 0) {
    comparisonData = {
      hasEnoughData: false,
      currentPeriod: {
        totalAnalyses,
        positivePct: posPct,
        negativePct: negPct,
        neutralPct: neuPct,
        mixedPct: mixPct,
        avgSentimentScore: avgScore,
        avgConfidence: avgConfidence,
        dominantEmotion: topEmotion ? topEmotion.name : "None"
      }
    };
  } else {
    let pPos = 0, pNeg = 0, pNeu = 0, pMix = 0, pScore = 0, pConf = 0;
    const pEmotions: Record<string, number> = {};

    prevAnalyses.forEach(item => {
      const ps = (item.overallSentiment?.label || "Neutral").toLowerCase();
      if (ps === "positive") pPos++;
      else if (ps === "negative") pNeg++;
      else if (ps === "mixed") pMix++;
      else pNeu++;

      pScore += (typeof item.score === "number" ? item.score : 0.5);
      pConf += parseConfidenceScore(item.confidence || item.overallSentiment?.confidence);

      const pem = item.emotions?.dominant?.name;
      if (pem) pEmotions[pem] = (pEmotions[pem] || 0) + 1;
    });

    const prevPosPct = Math.round((pPos / prevTotal) * 100);
    const prevNegPct = Math.round((pNeg / prevTotal) * 100);
    const prevNeuPct = Math.round((pNeu / prevTotal) * 100);
    const prevMixPct = Math.round((pMix / prevTotal) * 100);
    const prevAvgScore = Number((pScore / prevTotal).toFixed(2));
    const prevAvgConf = Math.round(pConf / prevTotal);

    let pDomEmotion = "None";
    let pDomCnt = 0;
    for (const [em, cnt] of Object.entries(pEmotions)) {
      if (cnt > pDomCnt) {
        pDomEmotion = em;
        pDomCnt = cnt;
      }
    }

    const posDiff = posPct - prevPosPct;
    const negDiff = negPct - prevNegPct;
    const volumeDiff = totalAnalyses - prevTotal;
    const volumePctChange = prevTotal > 0 ? Math.round(((totalAnalyses - prevTotal) / prevTotal) * 100) : 0;
    const scoreDiff = Number((avgScore - prevAvgScore).toFixed(2));

    comparisonData = {
      hasEnoughData: true,
      currentPeriod: {
        totalAnalyses,
        positivePct: posPct,
        negativePct: negPct,
        neutralPct: neuPct,
        mixedPct: mixPct,
        avgSentimentScore: avgScore,
        avgConfidence: avgConfidence,
        dominantEmotion: topEmotion ? topEmotion.name : "None"
      },
      previousPeriod: {
        totalAnalyses: prevTotal,
        positivePct: prevPosPct,
        negativePct: prevNegPct,
        neutralPct: prevNeuPct,
        mixedPct: prevMixPct,
        avgSentimentScore: prevAvgScore,
        avgConfidence: prevAvgConf,
        dominantEmotion: pDomEmotion
      },
      changes: {
        positiveChange: posDiff,
        negativeChange: negDiff,
        volumeChange: volumeDiff,
        volumePercentageChange: volumePctChange,
        scoreChange: scoreDiff,
        positiveTrend: posDiff > 0 ? "increased" : posDiff < 0 ? "decreased" : "stable",
        negativeTrend: negDiff > 0 ? "increased" : negDiff < 0 ? "decreased" : "stable",
        volumeTrend: volumeDiff > 0 ? "increased" : volumeDiff < 0 ? "decreased" : "stable",
        dominantEmotionChanged: topEmotion ? topEmotion.name !== pDomEmotion : false
      }
    };
  }

  // Generate automated summary text
  let dominantSentiment = "predominantly neutral";
  if (posPct > 50) dominantSentiment = "strongly positive";
  else if (posPct >= 40) dominantSentiment = "moderately positive";
  else if (negPct > 40) dominantSentiment = "leaning negative";
  else if (mixPct > 35) dominantSentiment = "highly mixed and complex";

  const mostCommonInput = multimodalCount > textCount && multimodalCount > imageCount && multimodalCount > videoCount
    ? "multimodal"
    : textCount >= imageCount && textCount >= videoCount
    ? "text"
    : imageCount >= videoCount ? "image" : "video";

  const emotionCallout = topEmotion ? ` ${topEmotion.name} was your most frequently detected emotional signal (${topEmotion.percentage}% of sessions).` : "";
  const confidenceCallout = avgConfidence >= 80 ? ` AI detection confidence remained high at ${avgConfidence}%.` : ` AI detection confidence averaged ${avgConfidence}%.`;

  const summaryText = `Your analyses were ${dominantSentiment} (${posPct}% positive, ${negPct}% negative) during this period.${emotionCallout} ${mostCommonInput.charAt(0).toUpperCase() + mostCommonInput.slice(1)} was your most frequent modality, and${confidenceCallout.toLowerCase()}`;

  return {
    filters: {
      dateRange: filters.dateRange,
      customStartDate: query.customStartDate ? String(query.customStartDate) : undefined,
      customEndDate: query.customEndDate ? String(query.customEndDate) : undefined,
      sentiment: query.sentiment ? (String(query.sentiment) as any) : "all",
      emotion: query.emotion ? String(query.emotion) : undefined,
      inputType: query.inputType ? (String(query.inputType) as any) : "all",
      confidence: query.confidence ? (String(query.confidence) as any) : "all",
    },
    overview: {
      totalAnalyses,
      positiveCount: posCount,
      positivePct: posPct,
      neutralCount: neuCount,
      neutralPct: neuPct,
      negativeCount: negCount,
      negativePct: negPct,
      mixedCount: mixCount,
      mixedPct: mixPct,
      avgConfidenceScore: avgConfidence,
      avgConfidenceLabel,
      avgSentimentScore: avgScore,
      mostDetectedEmotion: topEmotion ? {
        name: topEmotion.name,
        count: topEmotion.count,
        percentage: topEmotion.percentage
      } : null,
      mostActiveDay
    },
    trend: trendPoints,
    emotions: sortedEmotions,
    topEmotions: sortedEmotions.slice(0, 5),
    inputTypes: [
      { type: "text", label: "Text & Documents", icon: "📝", count: textCount, percentage: Math.round((textCount / totalAnalyses) * 100), color: "#0ea5e9" },
      { type: "image", label: "Images & Visuals", icon: "🖼️", count: imageCount, percentage: Math.round((imageCount / totalAnalyses) * 100), color: "#10b981" },
      { type: "video", label: "Video & Media", icon: "🎥", count: videoCount, percentage: Math.round((videoCount / totalAnalyses) * 100), color: "#f59e0b" },
      { type: "multimodal", label: "Multimodal / Combined", icon: "🔀", count: multimodalCount, percentage: Math.round((multimodalCount / totalAnalyses) * 100), color: "#8b5cf6" },
    ],
    confidence: {
      highCount: highConf,
      highPct: Math.round((highConf / totalAnalyses) * 100),
      mediumCount: medConf,
      mediumPct: Math.round((medConf / totalAnalyses) * 100),
      lowCount: lowConf,
      lowPct: Math.round((lowConf / totalAnalyses) * 100),
      averageConfidencePct: avgConfidence
    },
    sentimentDistribution: {
      positive: { count: posCount, percentage: posPct },
      neutral: { count: neuCount, percentage: neuPct },
      negative: { count: negCount, percentage: negPct },
      mixed: { count: mixCount, percentage: mixPct }
    },
    activity: {
      totalActiveDays,
      analysesPerActiveDay,
      mostActiveDay,
      leastActiveDay,
      activityByDayOfWeek: days.map(d => ({ day: d, count: dayOfWeekCounts[d] })),
      timeline: activeDateEntries.map(e => ({ date: e.dateStr, count: e.count })).sort((a, b) => a.date.localeCompare(b.date))
    },
    multimodal: {
      totalMultimodal: multimodalCount,
      multimodalPercentage: Math.round((multimodalCount / totalAnalyses) * 100),
      avgSentimentScore: multimodalCount > 0 ? Number((multiScore / multimodalCount).toFixed(2)) : 0,
      dominantEmotion: multiDominant,
      combinations
    },
    comparison: comparisonData,
    summaryText,
    generatedAt: new Date().toISOString()
  };
}

export const analyticsController = {
  // GET /api/analytics/summary (or Full Dashboard)
  getSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);
      const totalAnalyses = analyses.length;

      let posCount = 0;
      let neuCount = 0;
      let negCount = 0;
      let mixCount = 0;
      let totalScore = 0;
      let totalConfScore = 0;
      const emotionCounts: Record<string, number> = {};
      const dayOfWeekCounts: Record<string, number> = {
        Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
      };
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      analyses.forEach((item) => {
        const s = (item.overallSentiment?.label || "Neutral").toLowerCase();
        if (s === "positive") posCount++;
        else if (s === "negative") negCount++;
        else if (s === "mixed") mixCount++;
        else neuCount++;

        // Score
        const score = typeof item.score === "number" ? item.score : (item.overallSentiment?.score ?? 0.5);
        totalScore += score;

        // Confidence
        const confVal = parseConfidenceScore(item.confidence || item.overallSentiment?.confidence);
        totalConfScore += confVal;

        // Dominant Emotion
        const domEmotion = item.emotions?.dominant?.name || "Curiosity";
        emotionCounts[domEmotion] = (emotionCounts[domEmotion] || 0) + 1;

        // Day of week
        const d = new Date(item.createdAt);
        if (!isNaN(d.getTime())) {
          const dayName = days[d.getDay()];
          dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
        }
      });

      const posPct = totalAnalyses > 0 ? Math.round((posCount / totalAnalyses) * 100) : 0;
      const neuPct = totalAnalyses > 0 ? Math.round((neuCount / totalAnalyses) * 100) : 0;
      const negPct = totalAnalyses > 0 ? Math.round((negCount / totalAnalyses) * 100) : 0;
      const mixPct = totalAnalyses > 0 ? Math.round((mixCount / totalAnalyses) * 100) : 0;

      const avgScore = totalAnalyses > 0 ? Number((totalScore / totalAnalyses).toFixed(2)) : 0;
      const avgConfidence = totalAnalyses > 0 ? Math.round(totalConfScore / totalAnalyses) : 0;
      const avgConfidenceLabel = avgConfidence >= 80 ? "High" : avgConfidence >= 60 ? "Medium" : "Low";

      // Most detected emotion
      let topEmotionName = "";
      let topEmotionCount = 0;
      for (const [name, count] of Object.entries(emotionCounts)) {
        if (count > topEmotionCount) {
          topEmotionName = name;
          topEmotionCount = count;
        }
      }

      // Most active day
      let mostActiveDayName = "";
      let mostActiveDayCount = 0;
      for (const [day, count] of Object.entries(dayOfWeekCounts)) {
        if (count > mostActiveDayCount) {
          mostActiveDayName = day;
          mostActiveDayCount = count;
        }
      }

      const overview = {
        totalAnalyses,
        positiveCount: posCount,
        positivePct: posPct,
        neutralCount: neuCount,
        neutralPct: neuPct,
        negativeCount: negCount,
        negativePct: negPct,
        mixedCount: mixCount,
        mixedPct: mixPct,
        avgConfidenceScore: avgConfidence,
        avgConfidenceLabel,
        avgSentimentScore: avgScore,
        mostDetectedEmotion: topEmotionName ? {
          name: topEmotionName,
          count: topEmotionCount,
          percentage: totalAnalyses > 0 ? Math.round((topEmotionCount / totalAnalyses) * 100) : 0
        } : null,
        mostActiveDay: mostActiveDayName && mostActiveDayCount > 0 ? {
          dayName: mostActiveDayName,
          count: mostActiveDayCount
        } : null
      };

      return res.json({
        success: true,
        overview,
        filters: {
          dateRange: filters.dateRange,
          customStartDate: req.query.customStartDate,
          customEndDate: req.query.customEndDate,
          sentiment: req.query.sentiment || "all",
          emotion: req.query.emotion || "all",
          inputType: req.query.inputType || "all",
          confidence: req.query.confidence || "all",
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/sentiment-trend
  getSentimentTrend: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);

      // Group analyses by date bucket (e.g., YYYY-MM-DD)
      const dateBuckets: Record<string, {
        date: string;
        label: string;
        total: number;
        positive: number;
        neutral: number;
        negative: number;
        mixed: number;
        scoreSum: number;
      }> = {};

      // Sort chronological
      const sorted = [...analyses].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      sorted.forEach((item) => {
        const d = new Date(item.createdAt);
        if (isNaN(d.getTime())) return;

        const dateKey = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        if (!dateBuckets[dateKey]) {
          dateBuckets[dateKey] = {
            date: dateKey,
            label,
            total: 0,
            positive: 0,
            neutral: 0,
            negative: 0,
            mixed: 0,
            scoreSum: 0
          };
        }

        const bucket = dateBuckets[dateKey];
        bucket.total++;

        const s = (item.overallSentiment?.label || "Neutral").toLowerCase();
        if (s === "positive") bucket.positive++;
        else if (s === "negative") bucket.negative++;
        else if (s === "mixed") bucket.mixed++;
        else bucket.neutral++;

        const score = typeof item.score === "number" ? item.score : (item.overallSentiment?.score ?? 0.5);
        bucket.scoreSum += score;
      });

      const trendPoints = Object.values(dateBuckets).map(b => ({
        date: b.date,
        label: b.label,
        total: b.total,
        positive: b.positive,
        neutral: b.neutral,
        negative: b.negative,
        mixed: b.mixed,
        avgScore: b.total > 0 ? Number((b.scoreSum / b.total).toFixed(2)) : 0
      }));

      return res.json({
        success: true,
        trend: trendPoints
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/emotions
  getEmotions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);
      const totalAnalyses = analyses.length;

      const emotionCounts: Record<string, number> = {};
      analyses.forEach((item) => {
        const dom = item.emotions?.dominant?.name;
        if (dom && dom.trim()) {
          emotionCounts[dom.trim()] = (emotionCounts[dom.trim()] || 0) + 1;
        }
        // Also capture secondary emotions
        if (Array.isArray(item.emotions?.secondary)) {
          item.emotions.secondary.forEach(s => {
            if (s.name && s.name.trim()) {
              emotionCounts[s.name.trim()] = (emotionCounts[s.name.trim()] || 0) + 0.5;
            }
          });
        }
      });

      // Palette
      const palette = [
        "#0ea5e9", "#10b981", "#6366f1", "#f59e0b", "#ec4899",
        "#8b5cf6", "#14b8a6", "#f43f5e", "#eab308", "#3b82f6"
      ];

      const sortedEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], index) => {
          const roundedCount = Math.round(count);
          return {
            name,
            count: roundedCount,
            percentage: totalAnalyses > 0 ? Math.round((roundedCount / totalAnalyses) * 100) : 0,
            ranking: index + 1,
            isDominant: index === 0,
            color: palette[index % palette.length]
          };
        });

      return res.json({
        success: true,
        emotions: sortedEmotions,
        topEmotions: sortedEmotions.slice(0, 5)
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/input-types
  getInputTypes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);
      const totalAnalyses = analyses.length;

      let textCount = 0;
      let imageCount = 0;
      let videoCount = 0;
      let multimodalCount = 0;

      analyses.forEach((item) => {
        const summary = item.inputSummary || { textCount: 0, imageCount: 0, videoCount: 0 };
        const hasText = summary.textCount > 0 || Boolean((summary as any).hasDirectText);
        const hasImage = summary.imageCount > 0;
        const hasVideo = summary.videoCount > 0;
        const activeModalityCount = [hasText, hasImage, hasVideo].filter(Boolean).length;

        if (activeModalityCount > 1 || (summary.imageCount + summary.videoCount + (hasText ? 1 : 0)) > 1) {
          multimodalCount++;
        } else if (hasVideo) {
          videoCount++;
        } else if (hasImage) {
          imageCount++;
        } else {
          textCount++;
        }
      });

      const inputTypes = [
        {
          type: "text" as const,
          label: "Text & Documents",
          icon: "📝",
          count: textCount,
          percentage: totalAnalyses > 0 ? Math.round((textCount / totalAnalyses) * 100) : 0,
          color: "#0ea5e9"
        },
        {
          type: "image" as const,
          label: "Images & Visuals",
          icon: "🖼️",
          count: imageCount,
          percentage: totalAnalyses > 0 ? Math.round((imageCount / totalAnalyses) * 100) : 0,
          color: "#10b981"
        },
        {
          type: "video" as const,
          label: "Video & Dynamic Media",
          icon: "🎥",
          count: videoCount,
          percentage: totalAnalyses > 0 ? Math.round((videoCount / totalAnalyses) * 100) : 0,
          color: "#f59e0b"
        },
        {
          type: "multimodal" as const,
          label: "Multimodal / Combined",
          icon: "🔀",
          count: multimodalCount,
          percentage: totalAnalyses > 0 ? Math.round((multimodalCount / totalAnalyses) * 100) : 0,
          color: "#8b5cf6"
        }
      ];

      return res.json({
        success: true,
        inputTypes
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/confidence
  getConfidence: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);
      const totalAnalyses = analyses.length;

      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;
      let totalConfidenceScore = 0;

      analyses.forEach((item) => {
        const confLabel = (item.confidence || item.overallSentiment?.confidence || "Medium").toLowerCase();
        const confScore = parseConfidenceScore(confLabel);
        totalConfidenceScore += confScore;

        if (confLabel === "high") highCount++;
        else if (confLabel === "low") lowCount++;
        else mediumCount++;
      });

      const confidence = {
        highCount,
        highPct: totalAnalyses > 0 ? Math.round((highCount / totalAnalyses) * 100) : 0,
        mediumCount,
        mediumPct: totalAnalyses > 0 ? Math.round((mediumCount / totalAnalyses) * 100) : 0,
        lowCount,
        lowPct: totalAnalyses > 0 ? Math.round((lowCount / totalAnalyses) * 100) : 0,
        averageConfidencePct: totalAnalyses > 0 ? Math.round(totalConfidenceScore / totalAnalyses) : 0
      };

      return res.json({
        success: true,
        confidence
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/sentiment-distribution
  getSentimentDistribution: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);
      const totalAnalyses = analyses.length;

      let positive = 0;
      let neutral = 0;
      let negative = 0;
      let mixed = 0;

      analyses.forEach((item) => {
        const s = (item.overallSentiment?.label || "Neutral").toLowerCase();
        if (s === "positive") positive++;
        else if (s === "negative") negative++;
        else if (s === "mixed") mixed++;
        else neutral++;
      });

      const sentimentDistribution = {
        positive: { count: positive, percentage: totalAnalyses > 0 ? Math.round((positive / totalAnalyses) * 100) : 0 },
        neutral: { count: neutral, percentage: totalAnalyses > 0 ? Math.round((neutral / totalAnalyses) * 100) : 0 },
        negative: { count: negative, percentage: totalAnalyses > 0 ? Math.round((negative / totalAnalyses) * 100) : 0 },
        mixed: { count: mixed, percentage: totalAnalyses > 0 ? Math.round((mixed / totalAnalyses) * 100) : 0 }
      };

      return res.json({
        success: true,
        sentimentDistribution
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/activity
  getActivity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);

      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeekCounts: Record<string, number> = {
        Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
      };
      const dateCounts: Record<string, { count: number; dateStr: string; dayName: string }> = {};

      analyses.forEach((item) => {
        const d = new Date(item.createdAt);
        if (isNaN(d.getTime())) return;

        const dayName = days[d.getDay()];
        dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;

        const dateKey = d.toISOString().split("T")[0];
        if (!dateCounts[dateKey]) {
          dateCounts[dateKey] = {
            count: 0,
            dateStr: dateKey,
            dayName
          };
        }
        dateCounts[dateKey].count++;
      });

      const activeDateEntries = Object.values(dateCounts);
      const totalActiveDays = activeDateEntries.length;
      const analysesPerActiveDay = totalActiveDays > 0 ? Number((analyses.length / totalActiveDays).toFixed(1)) : 0;

      // Find most and least active days
      let mostActiveDay: { date: string; dayName: string; count: number } | null = null;
      let leastActiveDay: { date: string; dayName: string; count: number } | null = null;

      if (activeDateEntries.length > 0) {
        activeDateEntries.sort((a, b) => b.count - a.count);
        mostActiveDay = {
          date: activeDateEntries[0].dateStr,
          dayName: activeDateEntries[0].dayName,
          count: activeDateEntries[0].count
        };
        leastActiveDay = {
          date: activeDateEntries[activeDateEntries.length - 1].dateStr,
          dayName: activeDateEntries[activeDateEntries.length - 1].dayName,
          count: activeDateEntries[activeDateEntries.length - 1].count
        };
      }

      const activityByDayOfWeek = days.map(day => ({
        day,
        count: dayOfWeekCounts[day]
      }));

      const timeline = activeDateEntries.map(e => ({
        date: e.dateStr,
        count: e.count
      })).sort((a, b) => a.date.localeCompare(b.date));

      return res.json({
        success: true,
        activity: {
          totalActiveDays,
          analysesPerActiveDay,
          mostActiveDay,
          leastActiveDay,
          activityByDayOfWeek,
          timeline
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/multimodal
  getMultimodal: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);
      const totalAnalyses = analyses.length;

      const comboCounts: Record<string, { labels: string[]; count: number }> = {};
      let totalMultimodal = 0;
      let totalScore = 0;
      const multimodalEmotions: Record<string, number> = {};

      analyses.forEach((item) => {
        const summary = item.inputSummary || { textCount: 0, imageCount: 0, videoCount: 0 };
        const hasText = summary.textCount > 0 || Boolean((summary as any).hasDirectText);
        const hasImage = summary.imageCount > 0;
        const hasVideo = summary.videoCount > 0;

        const parts: string[] = [];
        const labels: string[] = [];
        if (hasText) { parts.push("text"); labels.push("📝 Text"); }
        if (hasImage) { parts.push("image"); labels.push("🖼️ Image"); }
        if (hasVideo) { parts.push("video"); labels.push("🎥 Video"); }

        if (parts.length > 1 || (summary.imageCount + summary.videoCount + (hasText ? 1 : 0)) > 1) {
          totalMultimodal++;
          const comboKey = parts.join("+");
          if (!comboCounts[comboKey]) {
            comboCounts[comboKey] = { labels, count: 0 };
          }
          comboCounts[comboKey].count++;

          const score = typeof item.score === "number" ? item.score : (item.overallSentiment?.score ?? 0.5);
          totalScore += score;

          const dom = item.emotions?.dominant?.name || "Curiosity";
          multimodalEmotions[dom] = (multimodalEmotions[dom] || 0) + 1;
        }
      });

      // Dominant emotion in multimodal
      let dominantEmotion = "N/A";
      let topCount = 0;
      for (const [emo, count] of Object.entries(multimodalEmotions)) {
        if (count > topCount) {
          dominantEmotion = emo;
          topCount = count;
        }
      }

      const combinations = Object.entries(comboCounts).map(([comboKey, data]) => ({
        comboKey,
        labels: data.labels,
        count: data.count,
        percentage: totalMultimodal > 0 ? Math.round((data.count / totalMultimodal) * 100) : 0
      })).sort((a, b) => b.count - a.count);

      return res.json({
        success: true,
        multimodal: {
          totalMultimodal,
          multimodalPercentage: totalAnalyses > 0 ? Math.round((totalMultimodal / totalAnalyses) * 100) : 0,
          avgSentimentScore: totalMultimodal > 0 ? Number((totalScore / totalMultimodal).toFixed(2)) : 0,
          dominantEmotion,
          combinations
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/compare
  getCompare: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const currentAnalyses = getUserFilteredAnalyses(userId, filters);

      // Calculate previous equivalent window
      const durationMs = filters.endDate.getTime() - filters.startDate.getTime();
      const prevEndDate = new Date(filters.startDate.getTime() - 1);
      const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

      const prevFilters: ParsedFilters = {
        ...filters,
        startDate: prevStartDate,
        endDate: prevEndDate
      };

      const previousAnalyses = getUserFilteredAnalyses(userId, prevFilters);

      if (currentAnalyses.length === 0 || previousAnalyses.length === 0) {
        return res.json({
          success: true,
          comparison: {
            hasEnoughData: false,
            currentPeriod: {
              totalAnalyses: currentAnalyses.length,
              positivePct: 0,
              negativePct: 0,
              neutralPct: 0,
              mixedPct: 0,
              avgSentimentScore: 0,
              avgConfidence: 0,
              dominantEmotion: "None"
            }
          }
        });
      }

      const calculatePeriodStats = (list: AnalysisSessionTable[]) => {
        let pos = 0, neg = 0, neu = 0, mix = 0, scoreSum = 0, confSum = 0;
        const emotionMap: Record<string, number> = {};

        list.forEach(item => {
          const s = (item.overallSentiment?.label || "Neutral").toLowerCase();
          if (s === "positive") pos++;
          else if (s === "negative") neg++;
          else if (s === "mixed") mix++;
          else neu++;

          scoreSum += typeof item.score === "number" ? item.score : (item.overallSentiment?.score ?? 0.5);
          confSum += parseConfidenceScore(item.confidence || item.overallSentiment?.confidence);

          const dom = item.emotions?.dominant?.name;
          if (dom) emotionMap[dom] = (emotionMap[dom] || 0) + 1;
        });

        let dominantEmotion = "N/A";
        let topCount = 0;
        for (const [emo, count] of Object.entries(emotionMap)) {
          if (count > topCount) {
            dominantEmotion = emo;
            topCount = count;
          }
        }

        const len = list.length;
        return {
          totalAnalyses: len,
          positivePct: Math.round((pos / len) * 100),
          negativePct: Math.round((neg / len) * 100),
          neutralPct: Math.round((neu / len) * 100),
          mixedPct: Math.round((mix / len) * 100),
          avgSentimentScore: Number((scoreSum / len).toFixed(2)),
          avgConfidence: Math.round(confSum / len),
          dominantEmotion
        };
      };

      const currentStats = calculatePeriodStats(currentAnalyses);
      const previousStats = calculatePeriodStats(previousAnalyses);

      const changes = {
        totalAnalyses: currentStats.totalAnalyses - previousStats.totalAnalyses,
        positivePct: currentStats.positivePct - previousStats.positivePct,
        negativePct: currentStats.negativePct - previousStats.negativePct,
        neutralPct: currentStats.neutralPct - previousStats.neutralPct,
        mixedPct: currentStats.mixedPct - previousStats.mixedPct,
        avgSentimentScore: Number((currentStats.avgSentimentScore - previousStats.avgSentimentScore).toFixed(2)),
        avgConfidence: currentStats.avgConfidence - previousStats.avgConfidence,
        dominantEmotionChanged: currentStats.dominantEmotion !== previousStats.dominantEmotion
      };

      return res.json({
        success: true,
        comparison: {
          hasEnoughData: true,
          currentPeriod: currentStats,
          previousPeriod: previousStats,
          changes
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/export
  getExport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      // Re-use full dashboard payload for export formatting
      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);

      return res.json({
        success: true,
        exportMetadata: {
          userId,
          dateRange: filters.dateRange,
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
          totalRecords: analyses.length,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/analytics/full (Consolidated payload for lightning-fast frontend rendering)
  getFullAnalytics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
      }

      const filters = parseDateRangeAndFilters(req.query);
      const analyses = getUserFilteredAnalyses(userId, filters);
      const totalAnalyses = analyses.length;

      if (totalAnalyses === 0) {
        return res.json({
          success: true,
          data: {
            filters: {
              dateRange: filters.dateRange,
              customStartDate: req.query.customStartDate ? String(req.query.customStartDate) : undefined,
              customEndDate: req.query.customEndDate ? String(req.query.customEndDate) : undefined,
              sentiment: req.query.sentiment ? (String(req.query.sentiment) as any) : "all",
              emotion: req.query.emotion ? String(req.query.emotion) : undefined,
              inputType: req.query.inputType ? (String(req.query.inputType) as any) : "all",
              confidence: req.query.confidence ? (String(req.query.confidence) as any) : "all",
            },
            overview: {
              totalAnalyses: 0,
              positiveCount: 0,
              positivePct: 0,
              neutralCount: 0,
              neutralPct: 0,
              negativeCount: 0,
              negativePct: 0,
              mixedCount: 0,
              mixedPct: 0,
              avgConfidenceScore: 0,
              avgConfidenceLabel: "Low" as const,
              avgSentimentScore: 0,
              mostDetectedEmotion: null,
              mostActiveDay: null
            },
            trend: [],
            emotions: [],
            topEmotions: [],
            inputTypes: [
              { type: "text", label: "Text & Documents", icon: "📝", count: 0, percentage: 0, color: "#0ea5e9" },
              { type: "image", label: "Images & Visuals", icon: "🖼️", count: 0, percentage: 0, color: "#10b981" },
              { type: "video", label: "Video & Dynamic Media", icon: "🎥", count: 0, percentage: 0, color: "#f59e0b" },
              { type: "multimodal", label: "Multimodal / Combined", icon: "🔀", count: 0, percentage: 0, color: "#8b5cf6" },
            ],
            confidence: {
              highCount: 0,
              highPct: 0,
              mediumCount: 0,
              mediumPct: 0,
              lowCount: 0,
              lowPct: 0,
              averageConfidencePct: 0
            },
            sentimentDistribution: {
              positive: { count: 0, percentage: 0 },
              neutral: { count: 0, percentage: 0 },
              negative: { count: 0, percentage: 0 },
              mixed: { count: 0, percentage: 0 }
            },
            activity: {
              totalActiveDays: 0,
              analysesPerActiveDay: 0,
              mostActiveDay: null,
              leastActiveDay: null,
              activityByDayOfWeek: [
                { day: "Sunday", count: 0 },
                { day: "Monday", count: 0 },
                { day: "Tuesday", count: 0 },
                { day: "Wednesday", count: 0 },
                { day: "Thursday", count: 0 },
                { day: "Friday", count: 0 },
                { day: "Saturday", count: 0 }
              ],
              timeline: []
            },
            multimodal: {
              totalMultimodal: 0,
              multimodalPercentage: 0,
              avgSentimentScore: 0,
              dominantEmotion: "N/A",
              combinations: []
            },
            comparison: {
              hasEnoughData: false,
              currentPeriod: {
                totalAnalyses: 0,
                positivePct: 0,
                negativePct: 0,
                neutralPct: 0,
                mixedPct: 0,
                avgSentimentScore: 0,
                avgConfidence: 0,
                dominantEmotion: "None"
              }
            },
            summaryText: "No analysis data available for this period. Complete analyses across text, images, or videos to generate detailed trends.",
            generatedAt: new Date().toISOString()
          }
        });
      }

      // Calculations
      let posCount = 0, neuCount = 0, negCount = 0, mixCount = 0;
      let totalScore = 0, totalConfScore = 0;
      let highConf = 0, medConf = 0, lowConf = 0;
      let textCount = 0, imageCount = 0, videoCount = 0, multimodalCount = 0;
      let multiScore = 0;
      const multiEmotionCounts: Record<string, number> = {};
      const comboCounts: Record<string, { labels: string[]; count: number }> = {};
      const emotionCounts: Record<string, number> = {};
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeekCounts: Record<string, number> = {
        Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
      };
      const dateBuckets: Record<string, {
        date: string;
        label: string;
        total: number;
        positive: number;
        neutral: number;
        negative: number;
        mixed: number;
        scoreSum: number;
      }> = {};
      const dateCounts: Record<string, { count: number; dateStr: string; dayName: string }> = {};

      analyses.forEach((item) => {
        // Sentiment
        const s = (item.overallSentiment?.label || "Neutral").toLowerCase();
        if (s === "positive") posCount++;
        else if (s === "negative") negCount++;
        else if (s === "mixed") mixCount++;
        else neuCount++;

        // Score
        const score = typeof item.score === "number" ? item.score : (item.overallSentiment?.score ?? 0.5);
        totalScore += score;

        // Confidence
        const confLabel = (item.confidence || item.overallSentiment?.confidence || "Medium").toLowerCase();
        const confScore = parseConfidenceScore(confLabel);
        totalConfScore += confScore;
        if (confLabel === "high") highConf++;
        else if (confLabel === "low") lowConf++;
        else medConf++;

        // Emotion
        const dom = item.emotions?.dominant?.name;
        if (dom && dom.trim()) {
          emotionCounts[dom.trim()] = (emotionCounts[dom.trim()] || 0) + 1;
        }

        // Input type & Multimodal
        const summary = item.inputSummary || { textCount: 0, imageCount: 0, videoCount: 0 };
        const hasText = summary.textCount > 0 || Boolean((summary as any).hasDirectText);
        const hasImage = summary.imageCount > 0;
        const hasVideo = summary.videoCount > 0;
        const activeModalityCount = [hasText, hasImage, hasVideo].filter(Boolean).length;

        const parts: string[] = [];
        const labels: string[] = [];
        if (hasText) { parts.push("text"); labels.push("📝 Text"); }
        if (hasImage) { parts.push("image"); labels.push("🖼️ Image"); }
        if (hasVideo) { parts.push("video"); labels.push("🎥 Video"); }

        if (activeModalityCount > 1 || (summary.imageCount + summary.videoCount + (hasText ? 1 : 0)) > 1) {
          multimodalCount++;
          multiScore += score;
          if (dom) multiEmotionCounts[dom] = (multiEmotionCounts[dom] || 0) + 1;
          const comboKey = parts.join("+");
          if (!comboCounts[comboKey]) {
            comboCounts[comboKey] = { labels, count: 0 };
          }
          comboCounts[comboKey].count++;
        } else if (hasVideo) {
          videoCount++;
        } else if (hasImage) {
          imageCount++;
        } else {
          textCount++;
        }

        // Date & Trend
        const d = new Date(item.createdAt);
        if (!isNaN(d.getTime())) {
          const dayName = days[d.getDay()];
          dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;

          const dateKey = d.toISOString().split("T")[0];
          const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

          if (!dateBuckets[dateKey]) {
            dateBuckets[dateKey] = {
              date: dateKey,
              label: dateLabel,
              total: 0,
              positive: 0,
              neutral: 0,
              negative: 0,
              mixed: 0,
              scoreSum: 0
            };
          }
          const bucket = dateBuckets[dateKey];
          bucket.total++;
          if (s === "positive") bucket.positive++;
          else if (s === "negative") bucket.negative++;
          else if (s === "mixed") bucket.mixed++;
          else bucket.neutral++;
          bucket.scoreSum += score;

          if (!dateCounts[dateKey]) {
            dateCounts[dateKey] = { count: 0, dateStr: dateKey, dayName };
          }
          dateCounts[dateKey].count++;
        }
      });

      const posPct = Math.round((posCount / totalAnalyses) * 100);
      const neuPct = Math.round((neuCount / totalAnalyses) * 100);
      const negPct = Math.round((negCount / totalAnalyses) * 100);
      const mixPct = Math.round((mixCount / totalAnalyses) * 100);

      const avgScore = Number((totalScore / totalAnalyses).toFixed(2));
      const avgConfidence = Math.round(totalConfScore / totalAnalyses);
      const avgConfidenceLabel = avgConfidence >= 80 ? "High" : avgConfidence >= 60 ? "Medium" : "Low";

      // Emotions ranked
      const palette = ["#0ea5e9", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e", "#eab308", "#3b82f6"];
      const sortedEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], idx) => ({
          name,
          count,
          percentage: Math.round((count / totalAnalyses) * 100),
          ranking: idx + 1,
          isDominant: idx === 0,
          color: palette[idx % palette.length]
        }));

      const topEmotion = sortedEmotions[0] || null;

      // Activity
      const activeDateEntries = Object.values(dateCounts);
      const totalActiveDays = activeDateEntries.length;
      const analysesPerActiveDay = totalActiveDays > 0 ? Number((totalAnalyses / totalActiveDays).toFixed(1)) : 0;
      activeDateEntries.sort((a, b) => b.count - a.count);
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

      // Trend
      const trendPoints = Object.values(dateBuckets)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(b => ({
          date: b.date,
          label: b.label,
          total: b.total,
          positive: b.positive,
          neutral: b.neutral,
          negative: b.negative,
          mixed: b.mixed,
          avgScore: b.total > 0 ? Number((b.scoreSum / b.total).toFixed(2)) : 0
        }));

      // Multimodal dominant
      let multiDominant = "N/A";
      let multiTopCount = 0;
      for (const [emo, count] of Object.entries(multiEmotionCounts)) {
        if (count > multiTopCount) {
          multiDominant = emo;
          multiTopCount = count;
        }
      }

      const combinations = Object.entries(comboCounts).map(([comboKey, data]) => ({
        comboKey,
        labels: data.labels,
        count: data.count,
        percentage: multimodalCount > 0 ? Math.round((data.count / multimodalCount) * 100) : 0
      })).sort((a, b) => b.count - a.count);

      // Period Comparison
      const durationMs = filters.endDate.getTime() - filters.startDate.getTime();
      const prevEndDate = new Date(filters.startDate.getTime() - 1);
      const prevStartDate = new Date(prevEndDate.getTime() - durationMs);
      const prevFilters: ParsedFilters = {
        ...filters,
        startDate: prevStartDate,
        endDate: prevEndDate
      };
      const previousAnalyses = getUserFilteredAnalyses(userId, prevFilters);

      let comparisonData: any = {
        hasEnoughData: false,
        currentPeriod: {
          totalAnalyses,
          positivePct: posPct,
          negativePct: negPct,
          neutralPct: neuPct,
          mixedPct: mixPct,
          avgSentimentScore: avgScore,
          avgConfidence,
          dominantEmotion: topEmotion?.name || "None"
        }
      };

      if (previousAnalyses.length > 0) {
        let pPos = 0, pNeg = 0, pNeu = 0, pMix = 0, pScore = 0, pConf = 0;
        const pEmoMap: Record<string, number> = {};
        previousAnalyses.forEach(p => {
          const s = (p.overallSentiment?.label || "Neutral").toLowerCase();
          if (s === "positive") pPos++;
          else if (s === "negative") pNeg++;
          else if (s === "mixed") pMix++;
          else pNeu++;
          pScore += typeof p.score === "number" ? p.score : (p.overallSentiment?.score ?? 0.5);
          pConf += parseConfidenceScore(p.confidence || p.overallSentiment?.confidence);
          const d = p.emotions?.dominant?.name;
          if (d) pEmoMap[d] = (pEmoMap[d] || 0) + 1;
        });

        let pDom = "N/A";
        let pTop = 0;
        for (const [emo, count] of Object.entries(pEmoMap)) {
          if (count > pTop) { pDom = emo; pTop = count; }
        }

        const pLen = previousAnalyses.length;
        const prevStats = {
          totalAnalyses: pLen,
          positivePct: Math.round((pPos / pLen) * 100),
          negativePct: Math.round((pNeg / pLen) * 100),
          neutralPct: Math.round((pNeu / pLen) * 100),
          mixedPct: Math.round((pMix / pLen) * 100),
          avgSentimentScore: Number((pScore / pLen).toFixed(2)),
          avgConfidence: Math.round(pConf / pLen),
          dominantEmotion: pDom
        };

        comparisonData = {
          hasEnoughData: true,
          currentPeriod: comparisonData.currentPeriod,
          previousPeriod: prevStats,
          changes: {
            totalAnalyses: totalAnalyses - prevStats.totalAnalyses,
            positivePct: posPct - prevStats.positivePct,
            negativePct: negPct - prevStats.negativePct,
            neutralPct: neuPct - prevStats.neutralPct,
            mixedPct: mixPct - prevStats.mixedPct,
            avgSentimentScore: Number((avgScore - prevStats.avgSentimentScore).toFixed(2)),
            avgConfidence: avgConfidence - prevStats.avgConfidence,
            dominantEmotionChanged: (topEmotion?.name || "None") !== pDom
          }
        };
      }

      // Safe non-clinical insight summary generator strictly based on data
      const dominantSentiment = posPct >= Math.max(neuPct, negPct, mixPct) ? "mostly positive" :
        negPct >= Math.max(posPct, neuPct, mixPct) ? "more focused on critical and negative signals" :
        mixPct >= Math.max(posPct, neuPct, negPct) ? "nuanced with mixed sentiment polarity" :
        "primarily neutral and matter-of-fact";

      const mostCommonInput = textCount >= Math.max(imageCount, videoCount, multimodalCount) ? "text and document analysis" :
        multimodalCount >= Math.max(textCount, imageCount, videoCount) ? "multimodal cross-referencing" :
        imageCount >= Math.max(textCount, videoCount, multimodalCount) ? "visual inspection" : "video analysis";

      const emotionCallout = topEmotion ? ` ${topEmotion.name} was your most frequently detected emotional signal (${topEmotion.percentage}% of sessions).` : "";
      const confidenceCallout = avgConfidence >= 80 ? ` AI detection confidence remained high at ${avgConfidence}%.` : ` AI detection confidence averaged ${avgConfidence}%.`;

      const summaryText = `Your analyses were ${dominantSentiment} (${posPct}% positive, ${negPct}% negative) during this period.${emotionCallout} ${mostCommonInput.charAt(0).toUpperCase() + mostCommonInput.slice(1)} was your most frequent modality, and${confidenceCallout.toLowerCase()}`;

      return res.json({
        success: true,
        data: {
          filters: {
            dateRange: filters.dateRange,
            customStartDate: req.query.customStartDate ? String(req.query.customStartDate) : undefined,
            customEndDate: req.query.customEndDate ? String(req.query.customEndDate) : undefined,
            sentiment: req.query.sentiment ? (String(req.query.sentiment) as any) : "all",
            emotion: req.query.emotion ? String(req.query.emotion) : undefined,
            inputType: req.query.inputType ? (String(req.query.inputType) as any) : "all",
            confidence: req.query.confidence ? (String(req.query.confidence) as any) : "all",
          },
          overview: {
            totalAnalyses,
            positiveCount: posCount,
            positivePct: posPct,
            neutralCount: neuCount,
            neutralPct: neuPct,
            negativeCount: negCount,
            negativePct: negPct,
            mixedCount: mixCount,
            mixedPct: mixPct,
            avgConfidenceScore: avgConfidence,
            avgConfidenceLabel,
            avgSentimentScore: avgScore,
            mostDetectedEmotion: topEmotion ? {
              name: topEmotion.name,
              count: topEmotion.count,
              percentage: topEmotion.percentage
            } : null,
            mostActiveDay
          },
          trend: trendPoints,
          emotions: sortedEmotions,
          topEmotions: sortedEmotions.slice(0, 5),
          inputTypes: [
            { type: "text", label: "Text & Documents", icon: "📝", count: textCount, percentage: Math.round((textCount / totalAnalyses) * 100), color: "#0ea5e9" },
            { type: "image", label: "Images & Visuals", icon: "🖼️", count: imageCount, percentage: Math.round((imageCount / totalAnalyses) * 100), color: "#10b981" },
            { type: "video", label: "Video & Media", icon: "🎥", count: videoCount, percentage: Math.round((videoCount / totalAnalyses) * 100), color: "#f59e0b" },
            { type: "multimodal", label: "Multimodal / Combined", icon: "🔀", count: multimodalCount, percentage: Math.round((multimodalCount / totalAnalyses) * 100), color: "#8b5cf6" },
          ],
          confidence: {
            highCount: highConf,
            highPct: Math.round((highConf / totalAnalyses) * 100),
            mediumCount: medConf,
            mediumPct: Math.round((medConf / totalAnalyses) * 100),
            lowCount: lowConf,
            lowPct: Math.round((lowConf / totalAnalyses) * 100),
            averageConfidencePct: avgConfidence
          },
          sentimentDistribution: {
            positive: { count: posCount, percentage: posPct },
            neutral: { count: neuCount, percentage: neuPct },
            negative: { count: negCount, percentage: negPct },
            mixed: { count: mixCount, percentage: mixPct }
          },
          activity: {
            totalActiveDays,
            analysesPerActiveDay,
            mostActiveDay,
            leastActiveDay,
            activityByDayOfWeek: days.map(d => ({ day: d, count: dayOfWeekCounts[d] })),
            timeline: activeDateEntries.map(e => ({ date: e.dateStr, count: e.count })).sort((a, b) => a.date.localeCompare(b.date))
          },
          multimodal: {
            totalMultimodal: multimodalCount,
            multimodalPercentage: Math.round((multimodalCount / totalAnalyses) * 100),
            avgSentimentScore: multimodalCount > 0 ? Number((multiScore / multimodalCount).toFixed(2)) : 0,
            dominantEmotion: multiDominant,
            combinations
          },
          comparison: comparisonData,
          summaryText,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
