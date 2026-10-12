import React from "react";
import { Clock, Brain, Cloud } from "lucide-react";
import { ViewState } from "../../types";

interface HistoryHeaderProps {
  onNavigate: (view: ViewState) => void;
  onOpenCloudStorage?: () => void;
}

export function HistoryHeader({ onNavigate, onOpenCloudStorage }: HistoryHeaderProps) {
  return (
    <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <span className="text-xl">🕐</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Analysis History
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-Stored in Cloud
              </span>
            </div>
          </div>
        </div>
        <p className="text-slate-400 mt-2 text-sm font-medium">
          View, search, and manage your previous SentimentAI analyses backed up in real time.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onOpenCloudStorage && (
          <button
            type="button"
            id="btn-history-cloud-storage"
            onClick={onOpenCloudStorage}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-blue-400 text-sm font-bold border border-slate-700 hover:border-blue-500/40 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            title="Open Automatic Cloud Storage Hub"
          >
            <Cloud className="w-4 h-4 text-blue-400" />
            <span>Cloud Storage Hub</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate("analytics")}
          className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <span>📊</span>
          <span>View Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("my-analysis")}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.98]"
        >
          <span className="text-lg">🧠</span>
          <span>New Analysis</span>
        </button>
      </div>
    </header>
  );
}
