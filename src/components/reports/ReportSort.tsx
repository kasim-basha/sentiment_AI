import React from "react";
import { ArrowUpDown } from "lucide-react";
import { ReportSortOption } from "../../types";

interface ReportSortProps {
  value: ReportSortOption;
  onChange: (sort: ReportSortOption) => void;
}

export function ReportSort({ value, onChange }: ReportSortProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 shrink-0">
        <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Sort:</span>
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ReportSortOption)}
        className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
        aria-label="Sort reports"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="most_positive">Most Positive</option>
        <option value="most_negative">Most Negative</option>
      </select>
    </div>
  );
}
