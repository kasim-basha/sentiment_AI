import React from "react";

interface CommunityEmptyStateProps {
  onCreatePostClick: () => void;
}

export function CommunityEmptyState({ onCreatePostClick }: CommunityEmptyStateProps) {
  return (
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-12 text-center flex flex-col items-center justify-center my-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl mb-4 text-blue-400">
        🌐
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        No community posts yet
      </h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        Be the first to share something with the SentimentAI community.
      </p>
      <button
        type="button"
        onClick={onCreatePostClick}
        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
      >
        <span>📝</span>
        <span>Create Post</span>
      </button>
    </div>
  );
}

interface CommunityNoResultsProps {
  onClearFilters: () => void;
}

export function CommunityNoResults({ onClearFilters }: CommunityNoResultsProps) {
  return (
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-12 text-center flex flex-col items-center justify-center my-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-3xl mb-4 text-slate-400">
        🔍
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        No posts found
      </h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        Try a different search or filter.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all border border-slate-700 cursor-pointer"
      >
        Clear Filters
      </button>
    </div>
  );
}

interface CommunityErrorStateProps {
  onRetry: () => void;
  onBackToDashboard: () => void;
}

export function CommunityErrorState({ onRetry, onBackToDashboard }: CommunityErrorStateProps) {
  return (
    <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 p-12 text-center flex flex-col items-center justify-center my-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-3xl mb-4 text-rose-400">
        ⚠️
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        Unable to load the community.
      </h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        An error occurred while fetching shared community streams. Please retry or return to your dashboard.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
