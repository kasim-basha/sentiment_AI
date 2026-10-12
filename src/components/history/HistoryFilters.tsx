import React, { useState } from "react";
import { Filter, RotateCcw, Calendar, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { HistoryFilters as HistoryFiltersType } from "../../types";

interface HistoryFiltersProps {
  filters: HistoryFiltersType;
  onChange: (newFilters: HistoryFiltersType) => void;
  onReset: () => void;
  activeCount: number;
}

export function HistoryFilters({
  filters,
  onChange,
  onReset,
  activeCount
}: HistoryFiltersProps) {
  const [showCustomDate, setShowCustomDate] = useState(filters.date === "custom");
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  const handleInputTypeChange = (inputType: HistoryFiltersType["inputType"]) => {
    onChange({ ...filters, inputType });
  };

  const handleSentimentChange = (sentiment: HistoryFiltersType["sentiment"]) => {
    onChange({ ...filters, sentiment });
  };

  const handleDateChange = (date: HistoryFiltersType["date"]) => {
    setShowCustomDate(date === "custom");
    onChange({ ...filters, date });
  };

  const handleStatusChange = (status: HistoryFiltersType["status"]) => {
    onChange({ ...filters, status });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md mb-6 transition-all">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Filter className="w-4 h-4 text-blue-400" />
          <span>Filters & Refinement</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold">
              {activeCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpandedMobile(!isExpandedMobile)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle filter controls"
          >
            {isExpandedMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${isExpandedMobile ? 'block' : 'hidden md:grid'}`}>
        {/* Input Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Input Type
          </label>
          <div className="relative">
            <select
              value={filters.inputType}
              onChange={(e) => handleInputTypeChange(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="text">📝 Text</option>
              <option value="image">🖼️ Image</option>
              <option value="video">🎥 Video</option>
              <option value="mixed">🔀 Mixed</option>
            </select>
          </div>
        </div>

        {/* Sentiment */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Sentiment
          </label>
          <div className="relative">
            <select
              value={filters.sentiment}
              onChange={(e) => handleSentimentChange(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
            >
              <option value="all">All Sentiments</option>
              <option value="Positive">😊 Positive</option>
              <option value="Negative">😞 Negative</option>
              <option value="Neutral">😐 Neutral</option>
              <option value="Mixed">🔀 Mixed</option>
            </select>
          </div>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Date
          </label>
          <div className="relative">
            <select
              value={filters.date}
              onChange={(e) => handleDateChange(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Status
          </label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Inputs */}
      {showCustomDate && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={filters.customStartDate || ""}
              onChange={(e) => onChange({ ...filters, customStartDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={filters.customEndDate || ""}
              onChange={(e) => onChange({ ...filters, customEndDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}
