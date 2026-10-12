import { jsPDF } from "jspdf";
import {
  AIInsightsResponse,
  AIInsightSnapshot,
  AnalyticsFilterParams,
  InsightConfidence,
  AIInsightItem,
  AIRecommendationItem
} from "../types";
import { analyticsService } from "./analyticsService";

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

function buildQueryString(filters?: Partial<AnalyticsFilterParams>, forceRefresh?: boolean): string {
  const params = new URLSearchParams();
  if (filters?.dateRange) params.set("dateRange", filters.dateRange);
  if (filters?.customStartDate) params.set("customStartDate", filters.customStartDate);
  if (filters?.customEndDate) params.set("customEndDate", filters.customEndDate);
  if (filters?.sentiment && filters.sentiment !== "all") params.set("sentiment", filters.sentiment);
  if (filters?.emotion && filters.emotion !== "all") params.set("emotion", filters.emotion);
  if (filters?.inputType && filters.inputType !== "all") params.set("inputType", filters.inputType);
  if (filters?.confidence && filters.confidence !== "all") params.set("confidence", filters.confidence);
  if (forceRefresh) params.set("forceRefresh", "true");
  return params.toString() ? `?${params.toString()}` : "";
}

function sanitizeFilename(text: string): string {
  return text
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50) || "AI_Insights";
}

export const aiInsightsService = {
  // Fetch AI insights for current user & filters
  getInsights: async (
    filters?: Partial<AnalyticsFilterParams>,
    forceRefresh?: boolean
  ): Promise<AIInsightsResponse> => {
    try {
      const qs = buildQueryString(filters, forceRefresh);
      const res = await fetch(`/api/insights${qs}`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Backend insights endpoint unreachable, computing client-side fallback:", err);
    }

    // Client-side fallback: Calculate strictly from full analytics
    const analytics = await analyticsService.getFullAnalytics(filters);
    return aiInsightsService.computeClientFallbackInsights(analytics, filters);
  },

  // Force refresh AI insights
  refreshInsights: async (filters?: Partial<AnalyticsFilterParams>): Promise<AIInsightsResponse> => {
    try {
      const res = await fetch(`/api/insights/refresh`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ filters })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Refresh failed, generating fresh client fallback:", err);
    }

    return aiInsightsService.getInsights(filters, true);
  },

  // Save current insights snapshot
  saveSnapshot: async (data: AIInsightsResponse): Promise<AIInsightSnapshot> => {
    try {
      const res = await fetch(`/api/insights/save`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Could not save snapshot to backend:", err);
    }

    // LocalStorage fallback
    const localSnapshot: AIInsightSnapshot = {
      id: `snap_${Date.now()}`,
      userId: "current_user",
      createdAt: new Date().toISOString(),
      dateRange: data.dateRange || "last30",
      filters: data.filters || {},
      analyticsVersion: "1.0",
      insights: data.insights,
      recommendations: data.recommendations,
      summary: data.summary,
      totalAnalyses: data.totalAnalyses,
      confidenceScore: data.confidenceScore,
      isInsufficientData: data.isInsufficientData
    };

    try {
      const existing = JSON.parse(localStorage.getItem("sentimentai_saved_insights_snapshots") || "[]");
      existing.unshift(localSnapshot);
      localStorage.setItem("sentimentai_saved_insights_snapshots", JSON.stringify(existing.slice(0, 30)));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    return localSnapshot;
  },

  // Retrieve saved snapshots
  getSavedSnapshots: async (): Promise<AIInsightSnapshot[]> => {
    try {
      const res = await fetch(`/api/insights/snapshots`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Could not fetch snapshots from backend, checking local storage:", err);
    }

    try {
      return JSON.parse(localStorage.getItem("sentimentai_saved_insights_snapshots") || "[]");
    } catch {
      return [];
    }
  },

  // Delete saved snapshot
  deleteSnapshot: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/insights/snapshots/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.warn("Could not delete snapshot from backend:", err);
    }

    try {
      const existing: AIInsightSnapshot[] = JSON.parse(localStorage.getItem("sentimentai_saved_insights_snapshots") || "[]");
      const filtered = existing.filter(s => s.id !== id);
      localStorage.setItem("sentimentai_saved_insights_snapshots", JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  },

  // Compute deterministic client fallback strictly grounded in analytics
  computeClientFallbackInsights: (analyticsData: any, filters?: any): AIInsightsResponse => {
    const total = analyticsData.overview.totalAnalyses;

    if (total < 2) {
      return {
        summary: total === 0
          ? "No analysis history recorded for this time filter. Run text, image, or video sentiment analyses to unlock AI pattern discovery and personalized recommendations."
          : "Only 1 analysis recorded in this period. Complete at least 2 or more analyses across text, images, or videos to establish detectable patterns.",
        totalAnalyses: total,
        confidenceScore: "low",
        isInsufficientData: true,
        insights: total === 1 ? [
          {
            id: "ins_single_analysis",
            type: "activity",
            title: "Initial Analysis Baseline",
            description: "You have recorded your first analysis session.",
            observation: `1 session recorded with ${analyticsData.overview.positivePct}% positive sentiment.`,
            interpretation: "A single session represents an initial baseline. Additional data points will reveal emotional trajectories.",
            supportingData: {
              metric: "Analysis Count",
              value: 1,
              label: "Baseline Session"
            },
            confidence: "low"
          }
        ] : [],
        recommendations: [
          {
            id: "rec_add_analyses",
            type: "tracking",
            title: "Log Diverse Communication Sessions",
            description: "Consider analyzing a variety of written drafts, conversation transcripts, emails, or multimedia content over the coming days.",
            reason: "Having multiple sessions provides the statistical baseline needed for trend discovery.",
            actionHint: "Start a new analysis in My Analysis"
          },
          {
            id: "rec_try_multimodal",
            type: "modalities",
            title: "Experiment with Multimodal Inputs",
            description: "You may find it useful to combine text with facial expression images or video clips to test multimodal sentiment alignment.",
            reason: "Multimodal cross-referencing yields higher precision confidence scores and richer nuance detection.",
            actionHint: "Upload an image or video along with text"
          }
        ],
        generatedAt: new Date().toISOString(),
        dateRange: filters?.dateRange || "last30",
        filters: filters || {}
      };
    }

    const posPct = analyticsData.overview.positivePct;
    const negPct = analyticsData.overview.negativePct;
    const neuPct = analyticsData.overview.neutralPct;
    const avgConfidence = analyticsData.confidence.averageConfidencePct;
    const topEmotion = analyticsData.topEmotions?.[0];
    const comparison = analyticsData.comparison;
    const multimodal = analyticsData.multimodal;
    const activity = analyticsData.activity;

    const insights: AIInsightItem[] = [];
    const recommendations: AIRecommendationItem[] = [];

    // Sentiment insight
    insights.push({
      id: "ins_sentiment_dist",
      type: "sentiment",
      title: `${posPct >= 50 ? "Positive Predominance" : negPct >= 40 ? "Elevated Critical Signals" : "Balanced Neutral Dynamic"} in Analysis History`,
      description: `Your analyzed sessions show ${posPct}% positive, ${neuPct}% neutral, and ${negPct}% critical/negative tones.`,
      observation: `${posPct}% of evaluated sessions reflected positive sentiment across ${total} total analyses.`,
      interpretation: posPct >= 50
        ? "Your analyzed communications consistently demonstrate constructive, solution-oriented phrasing."
        : "Your analyzed content maintains an objective, measured, and fact-focused communication posture.",
      supportingData: {
        metric: "Positive Sentiment Ratio",
        value: `${posPct}%`,
        previousValue: comparison?.hasEnoughData ? `${comparison.previousPeriod?.positivePct}%` : undefined,
        label: `${analyticsData.overview.positiveCount} of ${total} analyses`,
        details: `Average Polarity Score: ${(analyticsData.overview.avgSentimentScore * 100).toFixed(0)}/100`
      },
      confidence: total >= 10 ? "high" : "medium"
    });

    // Emotion pattern
    if (topEmotion) {
      insights.push({
        id: "ins_emotion_pattern",
        type: "emotion",
        title: `Prominent Signal: ${topEmotion.name.charAt(0).toUpperCase() + topEmotion.name.slice(1)}`,
        description: `${topEmotion.name} was detected as the dominant emotional state in ${topEmotion.percentage}% of analyses.`,
        observation: `${topEmotion.name} appeared in ${topEmotion.count} out of ${total} recorded analyses (${topEmotion.percentage}% frequency).`,
        interpretation: `Your communication history frequently conveys strong ${topEmotion.name.toLowerCase()} nuances.`,
        supportingData: {
          metric: "Dominant Emotion Frequency",
          value: `${topEmotion.percentage}%`,
          label: `${topEmotion.name} (${topEmotion.count} sessions)`,
          details: `Ranked #1 across all detected emotions`
        },
        confidence: topEmotion.count >= 3 ? "high" : "medium"
      });
    }

    // Trend trajectory
    if (comparison?.hasEnoughData) {
      const posChange = comparison.changes.positiveChange;
      const volChange = comparison.changes.volumePercentageChange;
      insights.push({
        id: "ins_trend_trajectory",
        type: "trend",
        title: `${posChange >= 0 ? "Upward Positive Momentum" : "Shift Toward Analytical Restraint"} (${posChange >= 0 ? "+" : ""}${posChange}% Shift)`,
        description: `Compared to the previous period, positive sentiment shifted by ${posChange >= 0 ? "+" : ""}${posChange} percentage points.`,
        observation: `Positive sentiment changed from ${comparison.previousPeriod.positivePct}% to ${comparison.currentPeriod.positivePct}% (${posChange >= 0 ? "+" : ""}${posChange}%).`,
        interpretation: posChange >= 0
          ? "Your recent communication demonstrates growing optimism and collaborative alignment."
          : "Recent sessions reflect increased rigor or critical scrutiny.",
        supportingData: {
          metric: "Positive Shift",
          value: `${posChange >= 0 ? "+" : ""}${posChange}%`,
          previousValue: `${comparison.previousPeriod.positivePct}%`,
          label: `Period Comparison (${total} vs ${comparison.previousPeriod.totalAnalyses} sessions)`
        },
        confidence: "high"
      });
    }

    // Multimodal
    if (multimodal.totalMultimodal > 0) {
      insights.push({
        id: "ins_multimodal_synergy",
        type: "multimodal",
        title: "Multimodal Alignment & Cross-Referencing",
        description: `${multimodal.totalMultimodal} analyses integrated multimodal inputs with an average score of ${(multimodal.avgSentimentScore * 100).toFixed(0)}%.`,
        observation: `${multimodal.totalMultimodal} sessions (${multimodal.multimodalPercentage}% of all analyses) combined text, visual, or audio modalities.`,
        interpretation: "Cross-referencing text with visual facial signals and vocal inflections provides higher multi-dimensional fidelity.",
        supportingData: {
          metric: "Multimodal Sessions",
          value: `${multimodal.totalMultimodal}`,
          label: `${multimodal.multimodalPercentage}% of analysis volume`,
          details: `Dominant cross-modal emotion: ${multimodal.dominantEmotion}`
        },
        confidence: "high"
      });
    }

    // AI Confidence insight
    insights.push({
      id: "ins_confidence_precision",
      type: "confidence",
      title: `AI Model Precision (${avgConfidence}% Average Confidence)`,
      description: `${analyticsData.confidence.highPct}% of your analyses were classified with high certainty.`,
      observation: `Model detection certainty averaged ${avgConfidence}%, with ${analyticsData.confidence.highCount} sessions rated as High Confidence.`,
      interpretation: avgConfidence >= 75
        ? "Your input texts and media contain rich, explicit linguistic and visual cues that allow high diagnostic reliability."
        : "Some evaluated sessions contained nuanced or ambiguous statements where sentiment polarity spans multiple conflicting interpretations.",
      supportingData: {
        metric: "Average AI Confidence",
        value: `${avgConfidence}%`,
        label: `${analyticsData.confidence.highPct}% High Certainty`
      },
      confidence: "high"
    });

    // Recommendations
    if (negPct >= 25) {
      recommendations.push({
        id: "rec_deescalation",
        type: "attention",
        title: "Review Critical Feedback Formulations",
        description: "Consider examining drafts classified under critical sentiment to ensure concerns are paired with constructive actionable solutions.",
        reason: `${negPct}% of your evaluated sessions contained negative or critical sentiment signals.`,
        actionHint: "Filter History by Negative Sentiment to inspect recurring phrases"
      });
    }

    if (multimodal.totalMultimodal === 0) {
      recommendations.push({
        id: "rec_explore_multimodal",
        type: "modalities",
        title: "Incorporate Visual & Audio Modalities",
        description: "You may find it useful to test video recordings or expression photos alongside written drafts for comprehensive multimodal validation.",
        reason: `100% of your current analyses use single-modality text or media.`,
        actionHint: "Attach an image or video in My Analysis"
      });
    }

    recommendations.push({
      id: "rec_tracking_cadence",
      type: "tracking",
      title: "Maintain Consistent Evaluation Intervals",
      description: "Consider scheduling regular sentiment health-checks for ongoing email threads, stakeholder memos, and team communications.",
      reason: `Tracking across consecutive time windows unlocks period-over-period trend analysis and velocity indicators.`,
      actionHint: "Export regular insight snapshots to monitor long-term trends"
    });

    const confidenceScore: InsightConfidence = total >= 8 && avgConfidence >= 75 ? "high" : total >= 3 ? "medium" : "low";

    return {
      summary: analyticsData.summaryText,
      totalAnalyses: total,
      confidenceScore,
      isInsufficientData: false,
      insights,
      recommendations,
      generatedAt: new Date().toISOString(),
      dateRange: filters?.dateRange || "last30",
      filters: filters || {}
    };
  },

  // Export to PDF
  exportToPDF: (data: AIInsightsResponse, userName: string = "User"): void => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header banner
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SentimentAI — AI Insights & Recommendations Report", 14, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated for ${userName} • ${new Date(data.generatedAt || Date.now()).toLocaleString()}`, 14, 21);

    y = 38;

    // Executive Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Executive AI Synthesis", 18, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const splitSummary = doc.splitTextToSize(data.summary || "No summary available.", pageWidth - 36);
    doc.text(splitSummary, 18, y + 14);

    y += 34;

    // Meta badges
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Sessions Analyzed: ${data.totalAnalyses}   |   Overall AI Confidence: ${(data.confidenceScore || "High").toUpperCase()}   |   Filter: ${data.dateRange || "Custom"}`, 14, y);

    y += 8;

    // Key Insights Section
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Pattern Discoveries & Key Insights", 14, y);
    y += 6;

    if (!data.insights || data.insights.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("No insights generated for this dataset.", 14, y + 4);
      y += 10;
    } else {
      data.insights.forEach((ins, idx) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        // Card box
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. ${ins.title}`, 18, y + 6);

        // Badge
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(14, 165, 233);
        doc.text(`[${ins.type.toUpperCase()} • ${ins.confidence.toUpperCase()} CONFIDENCE]`, pageWidth - 65, y + 6);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text("Observation:", 18, y + 13);
        doc.setFont("helvetica", "normal");
        const obsSplit = doc.splitTextToSize(ins.observation, pageWidth - 55);
        doc.text(obsSplit, 38, y + 13);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text("Interpretation:", 18, y + 21);
        doc.setFont("helvetica", "normal");
        const intSplit = doc.splitTextToSize(ins.interpretation, pageWidth - 55);
        doc.text(intSplit, 38, y + 21);

        y += 32;
      });
    }

    // Recommendations Section
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Actionable AI Recommendations", 14, y);
    y += 6;

    if (!data.recommendations || data.recommendations.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("No recommendations available for this period.", 14, y + 4);
    } else {
      data.recommendations.forEach((rec, idx) => {
        if (y > 255) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`✓  ${rec.title}`, 18, y + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const descSplit = doc.splitTextToSize(rec.description, pageWidth - 36);
        doc.text(descSplit, 18, y + 12);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Data grounding: ${rec.reason}`, 18, y + 18);

        y += 26;
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SentimentAI • Non-diagnostic supportive intelligence • Page ${i} of ${totalPages}`,
        pageWidth / 2,
        290,
        { align: "center" }
      );
    }

    const filename = `SentimentAI_AI_Insights_${sanitizeFilename(data.dateRange || "report")}_${Date.now()}.pdf`;
    doc.save(filename);
  },

  // Export to TXT / Markdown
  exportToText: (data: AIInsightsResponse): void => {
    let content = `# SentimentAI — AI Insights & Recommendations Report\n`;
    content += `Generated: ${new Date(data.generatedAt || Date.now()).toLocaleString()}\n`;
    content += `Total Analyses: ${data.totalAnalyses}\n`;
    content += `Overall AI Confidence: ${(data.confidenceScore || "High").toUpperCase()}\n`;
    content += `Time Window: ${data.dateRange || "Custom"}\n\n`;
    content += `---------------------------------------------------\n`;
    content += `## Executive AI Synthesis\n`;
    content += `${data.summary}\n\n`;
    content += `---------------------------------------------------\n`;
    content += `## Pattern Discoveries & Key Insights\n\n`;

    (data.insights || []).forEach((ins, idx) => {
      content += `### ${idx + 1}. ${ins.title} [${ins.type.toUpperCase()}]\n`;
      content += `- Observation: ${ins.observation}\n`;
      content += `- Interpretation: ${ins.interpretation}\n`;
      content += `- Metric: ${ins.supportingData.metric} = ${ins.supportingData.value} ${ins.supportingData.label ? `(${ins.supportingData.label})` : ""}\n`;
      content += `- Confidence: ${ins.confidence.toUpperCase()}\n\n`;
    });

    content += `---------------------------------------------------\n`;
    content += `## Actionable AI Recommendations\n\n`;

    (data.recommendations || []).forEach((rec, idx) => {
      content += `### ${idx + 1}. ${rec.title} [${rec.type.toUpperCase()}]\n`;
      content += `- Recommendation: ${rec.description}\n`;
      content += `- Data Justification: ${rec.reason}\n`;
      if (rec.actionHint) {
        content += `- Action Step: ${rec.actionHint}\n`;
      }
      content += `\n`;
    });

    content += `\nDisclaimer: SentimentAI recommendations are designed for communication awareness and self-reflection. They do not constitute clinical, psychiatric, or medical diagnoses.\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SentimentAI_Insights_${sanitizeFilename(data.dateRange || "report")}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
