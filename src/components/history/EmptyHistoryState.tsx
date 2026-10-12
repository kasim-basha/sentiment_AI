import React from "react";
import { ChevronRight } from "lucide-react";
import { ViewState } from "../../types";

interface EmptyHistoryStateProps {
  onNavigate: (view: ViewState) => void;
}

export function EmptyHistoryState({ onNavigate }: EmptyHistoryStateProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center min-h-[420px] backdrop-blur-md">
      <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6 text-3xl shadow-xl shadow-blue-500/10 select-none" aria-hidden="true">
        🕐
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
        No analyses yet
      </h2>

      <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-base leading-relaxed mb-8 font-medium">
        Your completed text, image, and video analyses will appear here.
      </p>

      <button
        type="button"
        onClick={() => onNavigate("my-analysis")}
        className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-xl shadow-blue-600/25 transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.98]"
      >
        <span>🧠 Start New Analysis</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
