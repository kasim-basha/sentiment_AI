import React, { useState } from "react";
import {
  AnalyticsFilterParams,
  AnalyticsDateRangePreset
} from "../../types";
import {
  Calendar,
  RefreshCw,
  Bookmark,
  Download,
  FileText,
  SlidersHorizontal,
  Check,
  History,
  Sparkles
} from "lucide-react";

interface InsightFilterBarProps {
  filters: AnalyticsFilterParams;
  onFilterChange: (filters: Partial<AnalyticsFilterParams>) => void;
  onRefresh: () => void;
  onSaveSnapshot: () => void;
  onOpenSnapshots: () => void;
  onExportPDF: () => void;
  onExportTXT: () => void;
  isRefreshing: boolean;
  isSaving: boolean;
  isCached?: boolean;
}

const DATE_RANGE_OPTIONS: Array<{ value: AnalyticsDateRangePreset; label: string }> = [
  { value: "last30", label: "Last 30 Days" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last90", label: "Last 90 Days" },
  { value: "last6months", label: "Last 6 Months" },
  { value: "lastYear", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
];

export const InsightFilterBar: React.FC<InsightFilterBarProps> = ({
  filters,
  onFilterChange,
  onRefresh,
  onSaveSnapshot,
  onOpenSnapshots,
  onExportPDF,
  onExportTXT,
  isRefreshing,
  isSaving,
  isCached
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left Side: Date Range Selector & Secondary Filter Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative inline-flex items-center">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              id="insights-date-range-select"
              value={filters.dateRange}
              onChange={(e) => onFilterChange({ dateRange: e.target.value as AnalyticsDateRangePreset })}
              className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer appearance-none"
            >
              {DATE_RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</div>
          </div>

          {/* Custom Date Range Inputs */}
          {filters.dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                id="insights-custom-start"
                value={filters.customStartDate || ""}
                onChange={(e) => onFilterChange({ customStartDate: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                id="insights-custom-end"
                value={filters.customEndDate || ""}
                onChange={(e) => onFilterChange({ customEndDate: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Advanced Filter Toggle */}
          <button
            id="insights-advanced-filters-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              showAdvanced || (filters.sentiment !== "all" || filters.inputType !== "all" || filters.confidence !== "all")
                ? "bg-primary-50 dark:bg-primary-950/40 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300"
                : "bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Refine Scope</span>
            {(filters.sentiment !== "all" || filters.inputType !== "all" || filters.confidence !== "all") && (
              <span className="w-2 h-2 rounded-full bg-primary-500" />
            )}
          </button>

          {isCached && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Cached Sync
            </span>
          )}
        </div>

        {/* Right Side: Refresh, Save Snapshot, Snapshots History & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh AI Insights */}
          <button
            id="insights-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Recalculate AI insights using current data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary-500" : ""}`} />
            <span>{isRefreshing ? "Analyzing..." : "Refresh Insights"}</span>
          </button>

          {/* Save Snapshot */}
          <button
            id="insights-save-snapshot-btn"
            onClick={onSaveSnapshot}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Save current insight report to database"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Snapshot"}</span>
          </button>

          {/* View Saved Snapshots */}
          <button
            id="insights-view-snapshots-btn"
            onClick={onOpenSnapshots}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            title="Browse past saved insights snapshots"
          >
            <History className="w-3.5 h-3.5" />
            <span>Snapshots</span>
          </button>

          {/* Export Menu Dropdown */}
          <div className="relative">
            <button
              id="insights-export-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-30 text-xs">
                  <button
                    id="insights-export-pdf-option"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportPDF();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-500" />
                    <span>Download PDF Report</span>
                  </button>
                  <button
                    id="insights-export-txt-option"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportTXT();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>Download Text / Markdown</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filter Row (Expandable) */}
      {showAdvanced && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
          {/* Sentiment Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Sentiment Polarity
            </label>
            <select
              id="insights-sentiment-filter"
              value={filters.sentiment || "all"}
              onChange={(e) => onFilterChange({ sentiment: e.target.value as any })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive Only</option>
              <option value="neutral">Neutral Only</option>
              <option value="negative">Negative / Critical Only</option>
              <option value="mixed">Mixed Only</option>
            </select>
          </div>

          {/* Modality Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Modality Focus
            </label>
            <select
              id="insights-modality-filter"
              value={filters.inputType || "all"}
              onChange={(e) => onFilterChange({ inputType: e.target.value as any })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Modalities</option>
              <option value="text">Text & Documents</option>
              <option value="image">Images & Visuals</option>
              <option value="video">Video & Media</option>
              <option value="multimodal">Multimodal Combined</option>
            </select>
          </div>

          {/* Confidence Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Detection Confidence
            </label>
            <select
              id="insights-confidence-filter"
              value={filters.confidence || "all"}
              onChange={(e) => onFilterChange({ confidence: e.target.value as any })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Confidence Levels</option>
              <option value="high">High Confidence (≥80%)</option>
              <option value="medium">Moderate Confidence (60-79%)</option>
              <option value="low">Low / Ambiguous (&lt;60%)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
