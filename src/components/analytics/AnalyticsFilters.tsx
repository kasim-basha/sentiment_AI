import React from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import { AnalyticsFilterParams, EmotionDistributionItem } from "../../types";

interface AnalyticsFiltersProps {
  filters: AnalyticsFilterParams;
  availableEmotions: EmotionDistributionItem[];
  onFilterChange: (newFilters: Partial<AnalyticsFilterParams>) => void;
  onResetFilters: () => void;
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  availableEmotions,
  onFilterChange,
  onResetFilters
}) => {
  const hasActiveFilters =
    (filters.sentiment && filters.sentiment !== "all") ||
    (filters.emotion && filters.emotion !== "all") ||
    (filters.inputType && filters.inputType !== "all") ||
    (filters.confidence && filters.confidence !== "all");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5 text-sky-500" />
          <span>Filter Signals:</span>
        </div>

        {hasActiveFilters && (
          <button
            id="analytics-reset-filters-btn"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Sentiment Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Sentiment
          </label>
          <select
            id="analytics-filter-sentiment"
            value={filters.sentiment || "all"}
            onChange={(e) => onFilterChange({ sentiment: e.target.value as any })}
            className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Sentiments</option>
            <option value="Positive">🟢 Positive</option>
            <option value="Neutral">🔵 Neutral</option>
            <option value="Negative">🔴 Negative</option>
            <option value="Mixed">🟣 Mixed</option>
          </select>
        </div>

        {/* 2. Emotion Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Emotion
          </label>
          <select
            id="analytics-filter-emotion"
            value={filters.emotion || "all"}
            onChange={(e) => onFilterChange({ emotion: e.target.value })}
            className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Emotions ({availableEmotions.length})</option>
            {availableEmotions.map((emo) => (
              <option key={emo.name} value={emo.name.toLowerCase()}>
                {emo.name} ({emo.count})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Input Type Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Input Modality
          </label>
          <select
            id="analytics-filter-input-type"
            value={filters.inputType || "all"}
            onChange={(e) => onFilterChange({ inputType: e.target.value as any })}
            className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Modalities</option>
            <option value="text">📝 Text & Documents</option>
            <option value="image">🖼️ Images & Visuals</option>
            <option value="video">🎥 Video & Media</option>
            <option value="multimodal">🔀 Multimodal Combined</option>
          </select>
        </div>

        {/* 4. Confidence Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            AI Confidence
          </label>
          <select
            id="analytics-filter-confidence"
            value={filters.confidence || "all"}
            onChange={(e) => onFilterChange({ confidence: e.target.value as any })}
            className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Confidence Levels</option>
            <option value="High">🛡️ High (≥80%)</option>
            <option value="Medium">⚖️ Medium (60-79%)</option>
            <option value="Low">⚠️ Low (&lt;60%)</option>
          </select>
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Active:</span>
          {filters.sentiment && filters.sentiment !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Sentiment: {filters.sentiment}
              <button onClick={() => onFilterChange({ sentiment: "all" })}><X className="w-3 h-3 hover:text-sky-900" /></button>
            </span>
          )}
          {filters.emotion && filters.emotion !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Emotion: {filters.emotion}
              <button onClick={() => onFilterChange({ emotion: "all" })}><X className="w-3 h-3 hover:text-indigo-900" /></button>
            </span>
          )}
          {filters.inputType && filters.inputType !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Type: {filters.inputType}
              <button onClick={() => onFilterChange({ inputType: "all" })}><X className="w-3 h-3 hover:text-emerald-900" /></button>
            </span>
          )}
          {filters.confidence && filters.confidence !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Confidence: {filters.confidence}
              <button onClick={() => onFilterChange({ confidence: "all" })}><X className="w-3 h-3 hover:text-amber-900" /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
