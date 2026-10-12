import { GoogleGenAI, Type } from "@google/genai";
import { config } from "../config";
import { db } from "../database";
import { computeFullAnalyticsData } from "../controllers/analyticsController";
import {
  AIInsightItem,
  AIRecommendationItem,
  AIInsightSnapshotTable,
  InsightConfidence,
  InsightType
} from "../database/types";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: config.geminiApiKey || process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

export interface GeneratedAIInsightsResponse {
  summary: string;
  totalAnalyses: number;
  confidenceScore: InsightConfidence;
  isInsufficientData: boolean;
  insights: AIInsightItem[];
  recommendations: AIRecommendationItem[];
  generatedAt: string;
  dateRange: string;
  filters?: any;
  cached?: boolean;
}

// In-memory cache with 10-minute TTL per user & filter hash
interface CacheEntry {
  data: GeneratedAIInsightsResponse;
  timestamp: number;
}
const insightsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCacheKey(userId: string, filters: any): string {
  const norm = {
    dateRange: filters?.dateRange || "last30",
    customStartDate: filters?.customStartDate || "",
    customEndDate: filters?.customEndDate || "",
    sentiment: filters?.sentiment || "all",
    emotion: filters?.emotion || "all",
    inputType: filters?.inputType || "all",
    confidence: filters?.confidence || "all"
  };
  return `${userId}:${JSON.stringify(norm)}`;
}

export const aiInsightsService = {
  /**
   * Main entry point to get AI insights and recommendations for a user.
   */
  async getInsights(
    userId: string,
    queryFilters: any,
    forceRefresh: boolean = false
  ): Promise<GeneratedAIInsightsResponse> {
    const cacheKey = getCacheKey(userId, queryFilters);

    if (!forceRefresh) {
      const cached = insightsCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        return { ...cached.data, cached: true };
      }
    }

    // Step 1: Compute real, strictly grounded analytics for this user & filter set
    const analyticsData = computeFullAnalyticsData(userId, queryFilters);
    const totalAnalyses = analyticsData.overview.totalAnalyses;

    // Step 2: If insufficient data (< 2 analyses), return structured empty/insufficient state
    if (totalAnalyses < 2) {
      const insufficientResponse: GeneratedAIInsightsResponse = {
        summary: totalAnalyses === 0
          ? "No analysis history recorded for this time filter. Run text, image, or video sentiment analyses to unlock AI pattern discovery and personalized recommendations."
          : "Only 1 analysis recorded in this period. Complete at least 2 or more analyses across text, images, or videos to establish detectable patterns and unlock deep AI insights.",
        totalAnalyses,
        confidenceScore: "low",
        isInsufficientData: true,
        insights: totalAnalyses === 1 ? [
          {
            id: "ins_single_analysis",
            type: "activity",
            title: "Initial Analysis Baseline",
            description: "You have recorded your first analysis session.",
            observation: `1 session recorded with ${analyticsData.overview.positivePct}% positive sentiment and detection confidence of ${analyticsData.confidence.averageConfidencePct}%.`,
            interpretation: "A single session represents an initial baseline. Additional data points will reveal emotional trajectories and recurring communication patterns.",
            supportingData: {
              metric: "Analysis Count",
              value: 1,
              label: "Baseline Analysis",
              details: `Modality: ${analyticsData.inputTypes.find(t => t.count > 0)?.label || "Text"}`
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
            reason: "Having multiple sessions provides the statistical baseline needed for trend regression and emotional variance tracking.",
            actionHint: "Start a new analysis in My Analysis"
          },
          {
            id: "rec_try_multimodal",
            type: "modalities",
            title: "Experiment with Multimodal Inputs",
            description: "You may find it useful to combine text with facial expression images or video clips to test multimodal sentiment alignment.",
            reason: "Multimodal cross-referencing yields higher precision confidence scores and richer nuance detection.",
            actionHint: "Upload an image or video along with text"
          },
          {
            id: "rec_adjust_filter",
            type: "review",
            title: "Expand Date Range Filter",
            description: "If you have previous analyses, consider expanding the date range filter to 'Last 90 Days' or 'Last Year'.",
            reason: "Wider time windows capture historical sessions that may fall outside the currently selected window.",
            actionHint: "Select 'Last 90 Days' or 'Last Year' in the filter bar"
          }
        ],
        generatedAt: new Date().toISOString(),
        dateRange: analyticsData.filters.dateRange,
        filters: analyticsData.filters,
        cached: false
      };

      insightsCache.set(cacheKey, { data: insufficientResponse, timestamp: Date.now() });
      return insufficientResponse;
    }

    // Step 3: Attempt Gemini GenAI generation with structured JSON schema
    try {
      const aiResponse = await this.generateInsightsWithGemini(analyticsData);
      if (aiResponse && aiResponse.insights.length > 0) {
        insightsCache.set(cacheKey, { data: aiResponse, timestamp: Date.now() });
        return aiResponse;
      }
    } catch (genAiError) {
      console.warn("Gemini AI Insights generation fallback triggered:", genAiError);
    }

    // Step 4: Deterministic fallback engine mathematically grounded in the same analytics
    const fallbackResponse = this.generateDeterministicGroundedInsights(analyticsData);
    insightsCache.set(cacheKey, { data: fallbackResponse, timestamp: Date.now() });
    return fallbackResponse;
  },

  /**
   * Generates AI insights using Google GenAI SDK (gemini-3.8-flash) with structured JSON schema.
   */
  async generateInsightsWithGemini(analyticsData: any): Promise<GeneratedAIInsightsResponse> {
    const ai = getAiClient();

    const systemPrompt = `You are the SentimentAI Insights & Recommendations Engine powered by Google Gemini.
Your job is to analyze the user's real, aggregated sentiment and emotion analytics and produce structured, actionable, and data-grounded insights.

CRITICAL SAFETY & ETHICAL BOUNDARIES:
1. STRICT DATA GROUNDING: Only reference metrics, counts, percentages, and patterns provided in the analytics context. Never invent numbers, dates, or analyses.
2. NO MEDICAL/THERAPEUTIC CLAIMS: Never diagnose psychological, clinical, or psychiatric conditions. Do not offer medical treatment, psychiatric assessment, or therapy.
3. NO 100% EMOTIONAL CERTAINTY: Human emotion is nuanced. Always refer to "signals detected in analyzed sessions", "patterns in analysis history", or "observed linguistic markers".
4. SEPARATE OBSERVATION FROM INTERPRETATION:
   - Observation: Exact statistical fact from data (e.g. "Positive sentiment accounts for 68% of 24 analyzed sessions, rising 12% over the previous period").
   - Interpretation: What this pattern in communication/sentiment suggests constructively (e.g. "Indicates an upward trend in optimistic and collaborative framing across your written materials").
5. SUPPORTIVE, CONSTRUCTIVE LANGUAGE:
   - Use phrasing like "Consider reviewing...", "You may find it useful to...", "Your analysis history suggests...".
   - Never use commanding words like "You must", "You should stop", or make harmful assumptions.
6. INSIGHT TYPES TO COVER (provide at least 4-6 distinct, varied insights):
   - "trend": period-over-period or chronological trajectory.
   - "sentiment": distribution of positive, neutral, negative, and mixed sentiments.
   - "emotion": dominant emotions, shifts, and emotional diversity.
   - "multimodal": cross-modal alignment between text, image, and video.
   - "confidence": model detection certainty patterns and ambiguity markers.
   - "activity": temporal patterns, high-frequency active days vs rest days.
   - "attention": constructive highlights (e.g. dips in confidence, negative clusters, or high-conflict phrases needing review).
7. RECOMMENDATIONS (provide 3-4 actionable recommendations):
   - Action-oriented, practical suggestions for improving communication clarity, balancing emotional tone, or enriching analysis tracking.
   - Each recommendation MUST include a "reason" grounded in the user's data.`;

    const userPrompt = `Here is the user's aggregated SentimentAI Analytics payload:
${JSON.stringify({
  filters: analyticsData.filters,
  overview: analyticsData.overview,
  confidence: analyticsData.confidence,
  sentimentDistribution: analyticsData.sentimentDistribution,
  topEmotions: analyticsData.topEmotions,
  inputTypes: analyticsData.inputTypes,
  activity: {
    totalActiveDays: analyticsData.activity.totalActiveDays,
    analysesPerActiveDay: analyticsData.activity.analysesPerActiveDay,
    mostActiveDay: analyticsData.activity.mostActiveDay,
    leastActiveDay: analyticsData.activity.leastActiveDay,
    activityByDayOfWeek: analyticsData.activity.activityByDayOfWeek
  },
  multimodal: analyticsData.multimodal,
  comparison: analyticsData.comparison
}, null, 2)}

Generate a complete JSON response matching the required schema with comprehensive insights and recommendations.`;

    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let response: any = null;
    let lastErr: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: "2-3 sentence executive synthesis of key sentiment patterns" },
                confidenceScore: { type: Type.STRING, enum: ["high", "medium", "low"], description: "Overall confidence in the insight patterns based on data volume and stability" },
                insights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: {
                        type: Type.STRING,
                        enum: ["trend", "sentiment", "emotion", "multimodal", "confidence", "activity", "attention", "pattern"]
                      },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      observation: { type: Type.STRING, description: "Concrete statistical observation directly from the data" },
                      interpretation: { type: Type.STRING, description: "Constructive interpretation of the pattern" },
                      supportingData: {
                        type: Type.OBJECT,
                        properties: {
                          metric: { type: Type.STRING },
                          value: { type: Type.STRING },
                          previousValue: { type: Type.STRING },
                          label: { type: Type.STRING },
                          details: { type: Type.STRING }
                        },
                        required: ["metric", "value"]
                      },
                      confidence: { type: Type.STRING, enum: ["high", "medium", "low"] }
                    },
                    required: ["id", "type", "title", "description", "observation", "interpretation", "supportingData", "confidence"]
                  }
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: {
                        type: Type.STRING,
                        enum: ["tracking", "review", "modalities", "history", "attention", "general"]
                      },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      reason: { type: Type.STRING, description: "Specific justification grounded in data" },
                      actionHint: { type: Type.STRING }
                    },
                    required: ["id", "type", "title", "description", "reason"]
                  }
                }
              },
              required: ["summary", "confidenceScore", "insights", "recommendations"]
            }
          }
        });
        if (response?.text) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`[aiInsightsService] Model ${modelName} unavailable: ${err?.message || err}. Trying next model...`);
      }
    }

    if (!response?.text) {
      throw lastErr || new Error("All Gemini candidate models failed to generate insights");
    }

    const text = response.text || "";
    const parsed = JSON.parse(text);

    return {
      summary: parsed.summary || analyticsData.summaryText,
      totalAnalyses: analyticsData.overview.totalAnalyses,
      confidenceScore: (parsed.confidenceScore as InsightConfidence) || "high",
      isInsufficientData: false,
      insights: (parsed.insights || []).map((ins: any, idx: number) => ({
        ...ins,
        id: ins.id || `ins_${idx}_${Date.now()}`
      })),
      recommendations: (parsed.recommendations || []).map((rec: any, idx: number) => ({
        ...rec,
        id: rec.id || `rec_${idx}_${Date.now()}`
      })),
      generatedAt: new Date().toISOString(),
      dateRange: analyticsData.filters.dateRange,
      filters: analyticsData.filters,
      cached: false
    };
  },

  /**
   * Deterministic mathematical rule engine that generates high-fidelity insights
   * grounded directly in the analytics numbers when Gemini is offline or rate-limited.
   */
  generateDeterministicGroundedInsights(analyticsData: any): GeneratedAIInsightsResponse {
    const total = analyticsData.overview.totalAnalyses;
    const posPct = analyticsData.overview.positivePct;
    const negPct = analyticsData.overview.negativePct;
    const neuPct = analyticsData.overview.neutralPct;
    const mixPct = analyticsData.overview.mixedPct;
    const avgConfidence = analyticsData.confidence.averageConfidencePct;
    const topEmotion = analyticsData.topEmotions?.[0];
    const comparison = analyticsData.comparison;
    const multimodal = analyticsData.multimodal;
    const activity = analyticsData.activity;

    const insights: AIInsightItem[] = [];
    const recommendations: AIRecommendationItem[] = [];

    // 1. Sentiment Distribution Insight
    const primarySentimentLabel = posPct >= 50 ? "Positive Predominance" : negPct >= 40 ? "Elevated Concern Signals" : "Balanced Neutral Dynamic";
    insights.push({
      id: "ins_sentiment_dist",
      type: "sentiment",
      title: `${primarySentimentLabel} in Analysis History`,
      description: `Your analyzed sessions show ${posPct}% positive, ${neuPct}% neutral, and ${negPct}% critical/negative tones.`,
      observation: `${posPct}% of evaluated sessions reflected positive emotional sentiment, with ${neuPct}% maintaining neutral tone and ${negPct}% expressing critical sentiment across ${total} total analyses.`,
      interpretation: posPct >= 50
        ? "Your analyzed communications consistently demonstrate constructive, solution-oriented phrasing and optimistic emotional valence."
        : negPct >= 40
        ? "A notable portion of your sessions focus on troubleshooting, problem resolution, or critical feedback discussions."
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

    // 2. Emotional Signal Pattern
    if (topEmotion) {
      insights.push({
        id: "ins_emotion_pattern",
        type: "emotion",
        title: `Prominent Signal: ${topEmotion.name.charAt(0).toUpperCase() + topEmotion.name.slice(1)}`,
        description: `${topEmotion.name} was detected as the dominant emotional state in ${topEmotion.percentage}% of analyses.`,
        observation: `${topEmotion.name} appeared in ${topEmotion.count} out of ${total} recorded analyses (${topEmotion.percentage}% frequency), outranking secondary emotion signatures.`,
        interpretation: `Your communication history frequently conveys strong ${topEmotion.name.toLowerCase()} nuances, serving as the core emotional anchor for your analyzed messages.`,
        supportingData: {
          metric: "Dominant Emotion Frequency",
          value: `${topEmotion.percentage}%`,
          label: `${topEmotion.name} (${topEmotion.count} sessions)`,
          details: `Ranked #1 across ${analyticsData.emotions?.length || 1} distinct detected emotions`
        },
        confidence: topEmotion.count >= 3 ? "high" : "medium"
      });
    }

    // 3. Period-over-Period Trend Insight
    if (comparison?.hasEnoughData) {
      const posChange = comparison.changes.positiveChange;
      const volChange = comparison.changes.volumePercentageChange;
      const trendDirection = posChange > 0 ? "Upward Positive Momentum" : posChange < 0 ? "Shift Toward Analytical Restraint" : "Stable Emotional Consistency";

      insights.push({
        id: "ins_trend_trajectory",
        type: "trend",
        title: `${trendDirection} (${posChange >= 0 ? "+" : ""}${posChange}% Sentiment Change)`,
        description: `Compared to the previous period, positive sentiment shifted by ${posChange >= 0 ? "+" : ""}${posChange} percentage points.`,
        observation: `Positive sentiment changed from ${comparison.previousPeriod.positivePct}% to ${comparison.currentPeriod.positivePct}% (${posChange >= 0 ? "+" : ""}${posChange}%), while analysis volume changed by ${volChange >= 0 ? "+" : ""}${volChange}%.`,
        interpretation: posChange >= 0
          ? "Your recent communication demonstrates growing enthusiasm, collaborative alignment, or positive client reception."
          : "Recent sessions reflect increased rigor, analytical scrutiny, or complex problem-solving dialogues.",
        supportingData: {
          metric: "Positive Shift",
          value: `${posChange >= 0 ? "+" : ""}${posChange}%`,
          previousValue: `${comparison.previousPeriod.positivePct}%`,
          label: `Period Comparison (${total} vs ${comparison.previousPeriod.totalAnalyses} sessions)`,
          details: `Volume Shift: ${volChange >= 0 ? "+" : ""}${volChange}%`
        },
        confidence: "high"
      });
    }

    // 4. Multimodal & Modality Synergy Insight
    if (multimodal.totalMultimodal > 0) {
      insights.push({
        id: "ins_multimodal_synergy",
        type: "multimodal",
        title: "Multimodal Alignment & Cross-Referencing",
        description: `${multimodal.totalMultimodal} analyses integrated multimodal inputs with an average score of ${(multimodal.avgSentimentScore * 100).toFixed(0)}%.`,
        observation: `${multimodal.totalMultimodal} sessions (${multimodal.multimodalPercentage}% of all analyses) combined text, visual, or audio modalities, achieving a composite polarity score of ${(multimodal.avgSentimentScore * 100).toFixed(0)}%.`,
        interpretation: "Cross-referencing text with visual facial signals and vocal inflections provides higher multi-dimensional fidelity and captures subtleties that single modalities miss.",
        supportingData: {
          metric: "Multimodal Sessions",
          value: `${multimodal.totalMultimodal}`,
          label: `${multimodal.multimodalPercentage}% of analysis volume`,
          details: `Dominant cross-modal emotion: ${multimodal.dominantEmotion}`
        },
        confidence: "high"
      });
    } else {
      const topInput = analyticsData.inputTypes.reduce((max: any, t: any) => t.count > max.count ? t : max, analyticsData.inputTypes[0]);
      insights.push({
        id: "ins_modality_focus",
        type: "pattern",
        title: `Primary Focus on ${topInput?.label || "Text Inputs"}`,
        description: `${topInput?.percentage || 100}% of your analyses relied on ${topInput?.label || "text"}.`,
        observation: `${topInput?.count || total} out of ${total} sessions utilized ${topInput?.label || "text"}, representing ${topInput?.percentage || 100}% of total analytical volume.`,
        interpretation: "Your current workflow is heavily optimized for textual review. Introducing image or video analyses could reveal non-verbal sentiment correlations.",
        supportingData: {
          metric: "Modality Share",
          value: `${topInput?.percentage || 100}%`,
          label: topInput?.label || "Text",
          details: `${topInput?.count || total} sessions`
        },
        confidence: "high"
      });
    }

    // 5. AI Detection Confidence & Reliability Insight
    insights.push({
      id: "ins_confidence_precision",
      type: "confidence",
      title: `AI Model Precision (${avgConfidence}% Average Confidence)`,
      description: `${analyticsData.confidence.highPct}% of your analyses were classified with high certainty.`,
      observation: `Model detection certainty averaged ${avgConfidence}%, with ${analyticsData.confidence.highCount} sessions (${analyticsData.confidence.highPct}%) rated as High Confidence and ${analyticsData.confidence.lowCount} sessions (${analyticsData.confidence.lowPct}%) rated as Low.`,
      interpretation: avgConfidence >= 75
        ? "Your input texts and media contain rich, explicit linguistic and visual cues that allow the AI models to extract sentiment with high diagnostic reliability."
        : "Some evaluated sessions contained nuanced, sarcastic, or ambiguous statements where sentiment polarity spans multiple conflicting interpretations.",
      supportingData: {
        metric: "Average AI Confidence",
        value: `${avgConfidence}%`,
        label: `${analyticsData.confidence.highPct}% High Certainty`,
        details: `Low Confidence Cases: ${analyticsData.confidence.lowCount}`
      },
      confidence: "high"
    });

    // 6. Temporal & Activity Pattern Insight
    if (activity?.mostActiveDay) {
      insights.push({
        id: "ins_activity_pattern",
        type: "activity",
        title: `Peak Engagement on ${activity.mostActiveDay.dayName}s`,
        description: `You performed the highest volume of sentiment evaluations (${activity.mostActiveDay.count} analyses) on ${activity.mostActiveDay.dayName}s.`,
        observation: `${activity.totalActiveDays} active calendar days logged, with ${activity.mostActiveDay.dayName} (${activity.mostActiveDay.date}) recording peak analysis throughput of ${activity.mostActiveDay.count} sessions.`,
        interpretation: `Your sentiment evaluation cadence peaks during mid-week communication cycles, aligning with key meeting, presentation, or email preparation workflows.`,
        supportingData: {
          metric: "Peak Day Analyses",
          value: `${activity.mostActiveDay.count}`,
          label: `${activity.mostActiveDay.dayName} (${activity.mostActiveDay.date})`,
          details: `Average: ${activity.analysesPerActiveDay} analyses per active day`
        },
        confidence: "medium"
      });
    }

    // Recommendations Generation Grounded in Real Data
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
        reason: `100% of your current analyses use single-modality text or media without cross-modal triangulation.`,
        actionHint: "Attach an image or video in My Analysis"
      });
    }

    if (analyticsData.confidence.lowCount > 0) {
      recommendations.push({
        id: "rec_clarify_ambiguity",
        type: "review",
        title: "Refine Context for Ambiguous Analyses",
        description: "Consider providing slightly longer text excerpts or clearer background context in sessions flagged with lower confidence.",
        reason: `${analyticsData.confidence.lowCount} analysis sessions exhibited mixed or ambiguous sentiment signals.`,
        actionHint: "Use the 'Ask AI for Clarity' tool on low-confidence history records"
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
      dateRange: analyticsData.filters.dateRange,
      filters: analyticsData.filters,
      cached: false
    };
  },

  /**
   * Save an insights snapshot to the persistent database
   */
  async saveSnapshot(
    userId: string,
    data: GeneratedAIInsightsResponse
  ): Promise<AIInsightSnapshotTable> {
    return db.saveAIInsightSnapshot({
      userId,
      dateRange: data.dateRange || "last30",
      filters: data.filters,
      analyticsVersion: "1.0",
      insights: data.insights,
      recommendations: data.recommendations,
      summary: data.summary,
      totalAnalyses: data.totalAnalyses,
      confidenceScore: data.confidenceScore,
      isInsufficientData: data.isInsufficientData
    });
  },

  /**
   * Retrieve saved snapshots for a user
   */
  async getSavedSnapshots(userId: string): Promise<AIInsightSnapshotTable[]> {
    return db.getAIInsightSnapshots(userId);
  },

  /**
   * Delete a saved snapshot
   */
  async deleteSnapshot(snapshotId: string, userId: string): Promise<boolean> {
    return db.deleteAIInsightSnapshot(snapshotId, userId);
  }
};
