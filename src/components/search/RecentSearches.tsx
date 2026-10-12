import React from "react";
import { SearchHistoryItem } from "../../types";
import { History, X, Trash2, ArrowUpRight } from "lucide-react";

interface RecentSearchesProps {
  history: SearchHistoryItem[];
  onSelect: (query: string, category?: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  history,
  onSelect,
  onDeleteItem,
  onClearAll
}) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 shadow-sm" id="recent-searches-box">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span>Recent Searches</span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {history.map((item) => (
          <div
            key={item._id}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-lg text-xs text-slate-200 transition-all shadow-xs"
          >
            <button
              type="button"
              onClick={() => onSelect(item.query, item.category)}
              className="flex items-center gap-1 text-left hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <span>{item.query}</span>
              {item.category && item.category !== "all" && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-700/80 text-slate-400">
                  {item.category}
                </span>
              )}
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem(item._id);
              }}
              className="p-0.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors cursor-pointer ml-1"
              title="Remove this search"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
