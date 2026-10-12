import React from "react";
import { SearchCategory } from "../../types";
import { ArrowRight } from "lucide-react";

interface SearchResultGroupProps {
  title: string;
  category: SearchCategory;
  icon: React.ReactNode;
  count: number;
  onViewAll: (category: SearchCategory) => void;
  children: React.ReactNode;
}

export const SearchResultGroup: React.FC<SearchResultGroupProps> = ({
  title,
  category,
  icon,
  count,
  onViewAll,
  children
}) => {
  if (count === 0) return null;

  return (
    <div className="flex flex-col gap-3" id={`search-group-${category}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-800 text-indigo-400">
            {icon}
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            {title}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700/60">
            {count}
          </span>
        </div>

        {count > 0 && (
          <button
            type="button"
            onClick={() => onViewAll(category)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer group"
          >
            <span>See all {count} results</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
};
