import React, { useState } from "react";
import { Filter, RotateCcw, Calendar, ChevronDown } from "lucide-react";
import { ReportFilters as ReportFiltersType } from "../../types";

interface ReportFiltersProps {
  filters: ReportFiltersType;
  onChange: (filters: ReportFiltersType) => void;
  onReset: () => void;
  totalFiltered: number;
}

export function ReportFilters({
  filters,
  onChange,
  onReset,
  totalFiltered
}: ReportFiltersProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const hasActiveFilters =
    filters.inputType !== "all" ||
    filters.sentiment !== "all" ||
    filters.format !== "all" ||
    filters.date !== "all";

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 mb-6 backdrop-blur-md">
      {/* Mobile Toggle Bar */}
      <div className="flex sm:hidden items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white cursor-pointer"
        >
          <Filter className="w-4 h-4 text-blue-400" />
          <span>Filters {hasActiveFilters && "(Active)"}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isMobileExpanded ? "rotate-180" : ""}`} />
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div className={`${isMobileExpanded ? "block mt-4 pt-3 border-t border-slate-800" : "hidden"} sm:block space-y-3`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Input Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Input Type
            </label>
            <select
              value={filters.inputType}
              onChange={(e) => onChange({ ...filters, inputType: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="text">📝 Text</option>
              <option value="image">🖼️ Image</option>
              <option value="video">🎥 Video</option>
              <option value="mixed">🔀 Mixed</option>
            </select>
          </div>

          {/* Sentiment */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Sentiment
            </label>
            <select
              value={filters.sentiment}
              onChange={(e) => onChange({ ...filters, sentiment: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Sentiments</option>
              <option value="Positive">😊 Positive</option>
              <option value="Negative">😞 Negative</option>
              <option value="Neutral">😐 Neutral</option>
              <option value="Mixed">🔀 Mixed</option>
            </select>
          </div>

          {/* Report Format */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Report Format
            </label>
            <select
              value={filters.format}
              onChange={(e) => onChange({ ...filters, format: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Formats</option>
              <option value="pdf">📄 PDF Ready</option>
              <option value="txt">📝 TXT Export</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Date Period
            </label>
            <select
              value={filters.date}
              onChange={(e) => onChange({ ...filters, date: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Row if selected */}
        {filters.date === "custom" && (
          <div className="pt-2 flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Start:</span>
              <input
                type="date"
                value={filters.customStartDate || ""}
                onChange={(e) => onChange({ ...filters, customStartDate: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>End:</span>
              <input
                type="date"
                value={filters.customEndDate || ""}
                onChange={(e) => onChange({ ...filters, customEndDate: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Active Filters Row with Reset Button */}
        {hasActiveFilters && (
          <div className="hidden sm:flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400">
              Matching <strong className="text-white">{totalFiltered}</strong> reports
            </span>
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
