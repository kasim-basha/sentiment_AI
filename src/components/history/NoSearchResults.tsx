import React from "react";
import { RotateCcw } from "lucide-react";

interface NoSearchResultsProps {
  onClearFilters: () => void;
  searchQuery?: string;
}

export function NoSearchResults({ onClearFilters, searchQuery }: NoSearchResultsProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] backdrop-blur-md">
      <div className="w-20 h-20 rounded-3xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-6 text-3xl shadow-xl shadow-black/20 select-none" aria-hidden="true">
        🔍
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
        No matching analyses found
      </h3>

      {searchQuery && (
        <p className="text-xs text-blue-400 font-semibold mb-2">
          No matches for "{searchQuery}"
        </p>
      )}

      <p className="text-slate-400 max-w-sm mx-auto text-sm leading-relaxed mb-8">
        Try changing your search terms or filters to find what you're looking for.
      </p>

      <button
        type="button"
        onClick={onClearFilters}
        className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-700 hover:border-slate-600"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Clear Filters</span>
      </button>
    </div>
  );
}
