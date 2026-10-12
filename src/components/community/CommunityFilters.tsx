import React from "react";
import { CommunityFeedFilter } from "../../types";

interface CommunityFiltersProps {
  activeFilter: CommunityFeedFilter;
  onFilterChange: (filter: CommunityFeedFilter) => void;
}

export function CommunityFilters({ activeFilter, onFilterChange }: CommunityFiltersProps) {
  const filters: { id: CommunityFeedFilter; label: string; emoji: string }[] = [
    { id: "recent", label: "Recent", emoji: "🆕" },
    { id: "popular", label: "Popular", emoji: "🔥" },
    { id: "analyses", label: "Analyses", emoji: "🧠" },
    { id: "files", label: "Files & Media", emoji: "📁" },
    { id: "discussions", label: "Discussions", emoji: "💬" },
  ];

  return (
    <div
      className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar"
      role="tablist"
      aria-label="Community feed filters"
    >
      {filters.map((tab) => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
