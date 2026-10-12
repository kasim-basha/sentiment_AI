import React from "react";
import { BarChart3, PlusCircle, RotateCcw } from "lucide-react";

interface AnalyticsEmptyStateProps {
  type: "no_data" | "no_filter_match";
  onNewAnalysis?: () => void;
  onResetFilters?: () => void;
}

export const AnalyticsEmptyState: React.FC<AnalyticsEmptyStateProps> = ({
  type,
  onNewAnalysis,
  onResetFilters
}) => {
  if (type === "no_filter_match") {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
          No Matching Analyses Found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          No completed analyses match your selected date window or filter criteria. Try broadening your filter settings.
        </p>
        {onResetFilters && (
          <button
            id="empty-reset-filters-btn"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto my-8 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
        <BarChart3 className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
        No Analyses Recorded Yet
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        Start by analyzing text, images, or video. SentimentAI will automatically build your sentiment trajectory and emotion insights.
      </p>
      {onNewAnalysis && (
        <button
          id="empty-new-analysis-btn"
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md shadow-sky-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start First Analysis</span>
        </button>
      )}
    </div>
  );
};
