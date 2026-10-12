import React from "react";
import { Globe, PlusCircle } from "lucide-react";

interface CommunityHeaderProps {
  onCreatePostClick: () => void;
}

export function CommunityHeader({ onCreatePostClick }: CommunityHeaderProps) {
  return (
    <header className="relative w-full rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-blue-950/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl overflow-hidden mb-8">
      {/* Subtle background glow */}
      <div
        className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -left-16 -bottom-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            <span role="img" aria-label="Globe">🌐</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                SentimentAI Community
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Shared Insights
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
              Explore shared analyses, insights, and conversations from the community.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            type="button"
            onClick={onCreatePostClick}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Create a new community post"
          >
            <span>📝</span>
            <span>Create Post</span>
          </button>
        </div>
      </div>
    </header>
  );
}
