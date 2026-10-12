import React from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { ViewState } from "../../types";

interface HistoryErrorStateProps {
  onRetry: () => void;
  onNavigate: (view: ViewState) => void;
}

export function HistoryErrorState({ onRetry, onNavigate }: HistoryErrorStateProps) {
  return (
    <div className="bg-slate-900/40 border border-rose-500/20 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] backdrop-blur-md">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-400">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
        ⚠️ Unable to load your analysis history.
      </h3>

      <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed mb-8">
        An error occurred while retrieving your past analysis sessions. Please verify your connection or try again.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
