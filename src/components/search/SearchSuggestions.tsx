import React from "react";
import { SearchSuggestion } from "../../types";
import { User, Brain, FileText, Globe, History, ArrowRight } from "lucide-react";

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  isOpen: boolean;
  onSelect: (item: SearchSuggestion) => void;
  selectedIndex?: number;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  isOpen,
  onSelect,
  selectedIndex = -1
}) => {
  if (!isOpen || suggestions.length === 0) return null;

  const getIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "user":
      case "friend":
        return <User className="w-4 h-4 text-blue-400" />;
      case "analysis":
        return <Brain className="w-4 h-4 text-indigo-400" />;
      case "community":
        return <Globe className="w-4 h-4 text-teal-400" />;
      case "history":
      default:
        return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryBadge = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "user":
      case "friend":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Person</span>;
      case "analysis":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Analysis</span>;
      case "community":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">Community</span>;
      case "history":
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Recent</span>;
    }
  };

  return (
    <div
      id="search-suggestions-dropdown"
      className="absolute top-full left-0 right-0 mt-2 py-2 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden divide-y divide-slate-800/60 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
        <span>Suggested Matches</span>
        <span className="text-[10px] text-slate-400">↑↓ to navigate, Enter to select</span>
      </div>

      <div className="py-1">
        {suggestions.map((item, idx) => (
          <button
            key={`${item.type}_${item.text}_${idx}`}
            id={`suggestion-item-${idx}`}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent input blur
              onSelect(item);
            }}
            className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group ${
              selectedIndex === idx ? "bg-indigo-600/20 text-white" : "hover:bg-slate-800/60 text-slate-200"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 group-hover:border-slate-600 transition-colors">
                {getIcon(item.type)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                  {item.text}
                </p>
                {item.subtext && (
                  <p className="text-xs text-slate-400 truncate">{item.subtext}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {getCategoryBadge(item.type)}
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
