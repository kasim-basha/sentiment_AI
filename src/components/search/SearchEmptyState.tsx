import React from "react";
import { Search, Sparkles, Filter, Users, Brain, FileText, Globe } from "lucide-react";

interface SearchEmptyStateProps {
  type: "no_query" | "no_results" | "no_category_results";
  query?: string;
  category?: string;
  onSelectSuggestion?: (query: string, category?: string) => void;
  onResetFilters?: () => void;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  type,
  query,
  category,
  onSelectSuggestion,
  onResetFilters
}) => {
  if (type === "no_query") {
    const popularQueries = [
      { text: "Rahul", category: "people", label: "Find Users", icon: <Users className="w-3.5 h-3.5 text-blue-400" /> },
      { text: "Multimodal Emotion Assessment", category: "analyses", label: "My Analyses", icon: <Brain className="w-3.5 h-3.5 text-indigo-400" /> },
      { text: "Sentiment Analysis Report", category: "reports", label: "Executive Reports", icon: <FileText className="w-3.5 h-3.5 text-amber-400" /> },
      { text: "Facial micro-expressions", category: "community", label: "Community Discussions", icon: <Globe className="w-3.5 h-3.5 text-teal-400" /> }
    ];

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto" id="search-empty-no-query">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
          <Search className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Search Across SentimentAI</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Quickly discover colleagues, search through your historical emotion analyses, lookup certified reports, or explore community discussions.
        </p>

        <div className="w-full text-left bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Popular & Suggested Topics</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {popularQueries.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSuggestion && onSelectSuggestion(item.text, item.category)}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-left transition-all group cursor-pointer"
              >
                {item.icon}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                    {item.text}
                  </p>
                  <span className="text-[10px] text-slate-500">{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto" id="search-empty-no-results">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-4">
        <Filter className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        No results found for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        We couldn&apos;t find any matches {category && category !== "all" ? `in ${category}` : "across SentimentAI"}. Try checking for typos, using broader keywords, or adjusting your filter settings.
      </p>

      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
};
