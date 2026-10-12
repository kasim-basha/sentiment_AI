import React from "react";
import { FileText, Brain } from "lucide-react";

interface ReportsEmptyStateProps {
  onStartAnalysis: () => void;
}

export function ReportsEmptyState({ onStartAnalysis }: ReportsEmptyStateProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center my-8">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 text-3xl sm:text-4xl shadow-lg shadow-blue-500/5">
        📄
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
        No reports yet
      </h2>

      <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
        Reports generated from your SentimentAI analyses will appear here.
      </p>

      <button
        type="button"
        onClick={onStartAnalysis}
        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <Brain className="w-4 h-4" />
        <span>🧠 Start New Analysis</span>
      </button>
    </div>
  );
}
