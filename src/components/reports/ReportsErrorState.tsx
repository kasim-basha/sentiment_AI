import React from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

interface ReportsErrorStateProps {
  onRetry: () => void;
  onBackToDashboard: () => void;
  errorMessage?: string;
}

export function ReportsErrorState({
  onRetry,
  onBackToDashboard,
  errorMessage
}: ReportsErrorStateProps) {
  return (
    <div className="bg-slate-900/40 border border-rose-500/30 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center my-8">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5 text-3xl shadow-lg shadow-rose-500/5">
        ⚠️
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
        Unable to load your reports
      </h2>

      <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
        {errorMessage || "An unexpected error occurred while fetching your reports. Please try again."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
