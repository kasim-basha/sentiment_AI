import React from "react";
import { Search, X } from "lucide-react";

interface HistorySearchProps {
  value: string;
  onChange: (val: string) => void;
  resultCount?: number;
}

export function HistorySearch({ value, onChange, resultCount }: HistorySearchProps) {
  return (
    <div className="relative w-full">
      <label htmlFor="history-search-input" className="sr-only">
        Search analyses by title, file name, summary, input type, sentiment, or emotion
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none flex items-center gap-1.5">
          <Search className="w-4 h-4" />
        </div>
        <input
          id="history-search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="🔍 Search analyses by title, file, sentiment, emotion..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all backdrop-blur-md shadow-inner"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
