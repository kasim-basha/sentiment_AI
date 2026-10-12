import React from "react";
import { ArrowUpDown } from "lucide-react";
import { HistorySortOption } from "../../types";

interface HistorySortProps {
  value: HistorySortOption;
  onChange: (val: HistorySortOption) => void;
}

export function HistorySort({ value, onChange }: HistorySortProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="history-sort-select" className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1.5">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
        <span>Sort by:</span>
      </label>
      <select
        id="history-sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as HistorySortOption)}
        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="most_positive">Most Positive</option>
        <option value="most_negative">Most Negative</option>
      </select>
    </div>
  );
}
