import React, { useRef, useEffect } from "react";
import { Search, X, Loader2, Sparkles } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (val: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  onClear,
  isLoading = false,
  placeholder = "Search people, analyses, reports, community posts, friends...",
  autoFocus = true,
  onFocus,
  onBlur,
  onKeyDown
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Global shortcut to focus search on Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full" id="global-search-form">
      <div className="relative flex items-center w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-600 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl transition-all shadow-lg backdrop-blur-md">
        <div className="pl-4 pr-2 text-slate-400 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          id="global-search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full py-3.5 pl-1 pr-24 bg-transparent text-slate-100 placeholder-slate-400 text-sm md:text-base focus:outline-none"
        />

        <div className="absolute right-3 flex items-center gap-2">
          {value && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={onClear}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-400">
            <span className="text-[10px]">⌘</span>
            <span>K</span>
          </div>

          <button
            type="submit"
            id="submit-search-btn"
            disabled={!value.trim()}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>
    </form>
  );
};
