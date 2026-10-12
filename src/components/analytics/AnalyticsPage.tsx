import React, { useState, useEffect, useCallback } from "react";
import {
  AnalyticsFilterParams,
  AnalyticsFullDashboardData,
  UserProfile
} from "../../types";
import { analyticsService } from "../../services/analyticsService";
import { AnalyticsHeader } from "./AnalyticsHeader";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { AnalyticsSummary } from "./AnalyticsSummary";
import { OverviewStats } from "./OverviewStats";
import { SentimentTrendChart } from "./SentimentTrendChart";
import { SentimentDistribution } from "./SentimentDistribution";
import { EmotionDistribution } from "./EmotionDistribution";
import { InputTypeDistribution } from "./InputTypeDistribution";
import { ConfidenceAnalytics } from "./ConfidenceAnalytics";
import { AnalysisActivity } from "./AnalysisActivity";
import { MultimodalInsights } from "./MultimodalInsights";
import { PeriodComparison } from "./PeriodComparison";
import { AnalyticsEmptyState } from "./AnalyticsEmptyState";
import { AnalyticsLoadingState } from "./AnalyticsLoadingState";

interface AnalyticsPageProps {
  user: UserProfile | null;
  onNavigate: (view: any) => void;
}

const DEFAULT_FILTERS: AnalyticsFilterParams = {
  dateRange: "last30",
  sentiment: "all",
  emotion: "all",
  inputType: "all",
  confidence: "all",
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ user, onNavigate }) => {
  const [filters, setFilters] = useState<AnalyticsFilterParams>(DEFAULT_FILTERS);
  const [data, setData] = useState<AnalyticsFullDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (currentFilters: AnalyticsFilterParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getFullAnalytics(currentFilters);
      setData(result);
    } catch (err: any) {
      console.error("Failed to load analytics dashboard:", err);
      setError(err?.message || "Failed to load analytics data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(filters);
  }, [filters, loadAnalytics]);

  const handleFilterChange = (newFilters: Partial<AnalyticsFilterParams>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      dateRange: filters.dateRange,
      customStartDate: undefined,
      customEndDate: undefined
    });
  };

  const handleExportPDF = () => {
    if (!data) return;
    analyticsService.exportAnalyticsPDF(data, user?.fullName);
  };

  const handleExportTXT = () => {
    if (!data) return;
    analyticsService.exportAnalyticsTXT(data, user?.fullName);
  };

  const hasActiveFilters =
    (filters.sentiment && filters.sentiment !== "all") ||
    (filters.emotion && filters.emotion !== "all") ||
    (filters.inputType && filters.inputType !== "all") ||
    (filters.confidence && filters.confidence !== "all");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* 1. Header with Title, Range Selector & Action Buttons */}
      <AnalyticsHeader
        filters={filters}
        onFilterChange={handleFilterChange}
        onExportPDF={handleExportPDF}
        onExportTXT={handleExportTXT}
        onRefresh={() => loadAnalytics(filters)}
        isLoading={isLoading}
        totalAnalyses={data?.overview.totalAnalyses || 0}
      />

      {/* 2. Secondary Filter Bar */}
      <AnalyticsFilters
        filters={filters}
        availableEmotions={data?.emotions || []}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Main Content Display */}
      {isLoading ? (
        <AnalyticsLoadingState />
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-center text-rose-700 dark:text-rose-300 text-sm">
          {error}
          <div className="mt-3">
            <button
              onClick={() => loadAnalytics(filters)}
              className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : !data || data.overview.totalAnalyses === 0 ? (
        hasActiveFilters ? (
          <AnalyticsEmptyState
            type="no_filter_match"
            onResetFilters={handleResetFilters}
          />
        ) : (
          <AnalyticsEmptyState
            type="no_data"
            onNewAnalysis={() => onNavigate("my-analysis")}
          />
        )
      ) : (
        <div className="space-y-6">
          {/* 4. Insight Summary Box */}
          <AnalyticsSummary summaryText={data.summaryText} />

          {/* 5. Overview Metric Cards Grid */}
          <OverviewStats stats={data.overview} />

          {/* 6. Sentiment Trend Over Time (Line / Area Chart) */}
          <SentimentTrendChart trendData={data.trend} />

          {/* 7. Grid of In-Depth Breakdown Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sentiment Distribution (Donut & Breakdown) */}
            <SentimentDistribution
              distribution={data.sentimentDistribution}
              total={data.overview.totalAnalyses}
            />

            {/* Emotion Frequency Distribution */}
            <EmotionDistribution
              emotions={data.emotions}
              dominantEmotion={data.overview.mostDetectedEmotion}
            />

            {/* Input Type & Modality */}
            <InputTypeDistribution
              inputTypes={data.inputTypes}
              total={data.overview.totalAnalyses}
            />

            {/* AI Confidence Analytics */}
            <ConfidenceAnalytics
              confidence={data.confidence}
              total={data.overview.totalAnalyses}
            />

            {/* Analysis Activity & Frequency */}
            <AnalysisActivity
              activity={data.activity}
            />

            {/* Multimodal Insights */}
            <MultimodalInsights
              multimodal={data.multimodal}
            />
          </div>

          {/* 8. Period-over-Period Comparison (Full Width or 2-col) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PeriodComparison comparison={data.comparison} />

            {/* Key Reflection Takeaways Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  💡 Analysis Takeaways & Patterns
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Key patterns calculated from your sentiment and emotion history:
                </p>
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                    <span className="text-sky-500 font-bold">•</span>
                    <span>
                      <strong>Sentiment Polarity:</strong> {data.overview.positivePct}% of evaluated sessions reflected positive emotional sentiment, with {data.overview.negativePct}% highlighting concerns or critical feedback.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>
                      <strong>Multimodal Cross-Referencing:</strong> {data.multimodal.totalMultimodal} analyses utilized combined text and visual modalities, achieving an average polarity score of {(data.multimodal.avgSentimentScore * 100).toFixed(0)}%.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>
                      <strong>AI Detection Precision:</strong> Model detection confidence averaged {data.confidence.averageConfidencePct}%, with {data.confidence.highPct}% classified under high certainty.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
