import React from "react";
import {
  Download,
  FileText,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3
} from "lucide-react";
import { AnalyticsDateRangePreset, AnalyticsFilterParams } from "../../types";

interface AnalyticsHeaderProps {
  filters: AnalyticsFilterParams;
  onFilterChange: (newFilters: Partial<AnalyticsFilterParams>) => void;
  onExportPDF: () => void;
  onExportTXT: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalAnalyses: number;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  filters,
  onFilterChange,
  onExportPDF,
  onExportTXT,
  onRefresh,
  isLoading,
  totalAnalyses
}) => {
  const presets: { id: AnalyticsDateRangePreset; label: string }[] = [
    { id: "last7", label: "Last 7 Days" },
    { id: "last30", label: "Last 30 Days" },
    { id: "last90", label: "Last 90 Days" },
    { id: "last6months", label: "Last 6 Months" },
    { id: "lastYear", label: "Last Year" },
    { id: "custom", label: "Custom Range" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Title & Subtitle */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                📊 Advanced Analytics
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Understand your sentiment and emotion patterns over time.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Refresh & Exports */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="analytics-refresh-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-500" : ""}`} />
            <span>Refresh</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-0.5" />

          <button
            id="analytics-export-pdf-btn"
            onClick={onExportPDF}
            disabled={totalAnalyses === 0 || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            id="analytics-export-txt-btn"
            onClick={onExportTXT}
            disabled={totalAnalyses === 0 || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export TXT</span>
          </button>
        </div>
      </div>

      {/* Date Range Preset Selector */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date Range:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {presets.map((p) => {
              const isActive = filters.dateRange === p.id;
              return (
                <button
                  key={p.id}
                  id={`analytics-range-${p.id}`}
                  onClick={() => onFilterChange({ dateRange: p.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-sky-500 text-white shadow-sm font-semibold"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Range Inputs */}
        {filters.dateRange === "custom" && (
          <div className="mt-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-wrap items-center gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">From:</label>
              <input
                type="date"
                id="analytics-start-date"
                value={filters.customStartDate || ""}
                onChange={(e) => onFilterChange({ customStartDate: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">To:</label>
              <input
                type="date"
                id="analytics-end-date"
                value={filters.customEndDate || ""}
                onChange={(e) => onFilterChange({ customEndDate: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            {(filters.customStartDate || filters.customEndDate) && (
              <button
                onClick={() => onFilterChange({ customStartDate: undefined, customEndDate: undefined })}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium ml-auto"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
