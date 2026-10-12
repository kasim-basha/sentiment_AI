import React from "react";
import { Search, RotateCcw } from "lucide-react";

interface NoReportResultsProps {
  onClearFilters: () => void;
}

export function NoReportResults({ onClearFilters }: NoReportResultsProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center my-8">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-blue-400 flex items-center justify-center mb-5 text-3xl sm:text-4xl shadow-inner">
        🔍
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
        No reports found
      </h2>

      <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
        Try changing your search or filters.
      </p>

      <button
        type="button"
        onClick={onClearFilters}
        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <RotateCcw className="w-4 h-4 text-blue-400" />
        <span>Clear Filters</span>
      </button>
    </div>
  );
}
