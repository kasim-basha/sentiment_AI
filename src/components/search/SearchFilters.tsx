import React from "react";
import {
  SearchCategory,
  SearchSortOption,
  SearchSentimentOption,
  SearchInputTypeOption
} from "../../types";
import {
  Layers,
  Users,
  Brain,
  FileText,
  Globe,
  UserCheck,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw
} from "lucide-react";

interface SearchFiltersProps {
  selectedCategory: SearchCategory;
  onCategoryChange: (cat: SearchCategory) => void;
  sentiment: SearchSentimentOption;
  onSentimentChange: (sent: SearchSentimentOption) => void;
  inputType: SearchInputTypeOption;
  onInputTypeChange: (type: SearchInputTypeOption) => void;
  sort: SearchSortOption;
  onSortChange: (sort: SearchSortOption) => void;
  counts?: {
    people?: number;
    friends?: number;
    analyses?: number;
    reports?: number;
    community?: number;
  };
  onReset?: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  selectedCategory,
  onCategoryChange,
  sentiment,
  onSentimentChange,
  inputType,
  onInputTypeChange,
  sort,
  onSortChange,
  counts,
  onReset
}) => {
  const categories: Array<{ id: SearchCategory; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "all", label: "All", icon: <Layers className="w-4 h-4" /> },
    { id: "people", label: "People", icon: <Users className="w-4 h-4" />, count: counts?.people },
    { id: "analyses", label: "Analyses", icon: <Brain className="w-4 h-4" />, count: counts?.analyses },
    { id: "reports", label: "Reports", icon: <FileText className="w-4 h-4" />, count: counts?.reports },
    { id: "community", label: "Community", icon: <Globe className="w-4 h-4" />, count: counts?.community },
    { id: "friends", label: "Friends", icon: <UserCheck className="w-4 h-4" />, count: counts?.friends }
  ];

  const hasActiveSecondaryFilters = sentiment !== "all" || inputType !== "all" || sort !== "newest";

  return (
    <div className="flex flex-col gap-3 w-full" id="search-filters-container">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800/80">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`search-tab-${cat.id}`}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              {typeof cat.count === "number" && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contextual Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sentiment Filter (For analyses, reports, all) */}
          {(selectedCategory === "all" || selectedCategory === "analyses" || selectedCategory === "reports") && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 font-medium">Sentiment:</span>
              <select
                id="filter-sentiment-select"
                value={sentiment}
                onChange={(e) => onSentimentChange(e.target.value as SearchSentimentOption)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-semibold"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Sentiments</option>
                <option value="Positive" className="bg-slate-900 text-emerald-400">Positive</option>
                <option value="Negative" className="bg-slate-900 text-rose-400">Negative</option>
                <option value="Neutral" className="bg-slate-900 text-slate-300">Neutral</option>
                <option value="Mixed" className="bg-slate-900 text-amber-400">Mixed</option>
              </select>
            </div>
          )}

          {/* Input Type Filter (For analyses) */}
          {(selectedCategory === "all" || selectedCategory === "analyses") && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 font-medium">Input Type:</span>
              <select
                id="filter-input-type-select"
                value={inputType}
                onChange={(e) => onInputTypeChange(e.target.value as SearchInputTypeOption)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-semibold"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Formats</option>
                <option value="text" className="bg-slate-900 text-slate-200">Text & Notes</option>
                <option value="image" className="bg-slate-900 text-slate-200">Image & Facial</option>
                <option value="video" className="bg-slate-900 text-slate-200">Video & Stream</option>
                <option value="multimodal" className="bg-slate-900 text-slate-200">Multimodal Fusion</option>
              </select>
            </div>
          )}

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Sort:</span>
            <select
              id="filter-sort-select"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SearchSortOption)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="newest" className="bg-slate-900 text-slate-200">Newest First</option>
              <option value="oldest" className="bg-slate-900 text-slate-200">Oldest First</option>
              <option value="relevant" className="bg-slate-900 text-slate-200">Most Relevant</option>
              {selectedCategory === "community" && (
                <option value="popular" className="bg-slate-900 text-slate-200">Most Popular (Likes/Comments)</option>
              )}
            </select>
          </div>
        </div>

        {/* Reset Action */}
        {hasActiveSecondaryFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Reset filters to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
