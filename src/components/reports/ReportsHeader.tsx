import React from "react";
import { FileText, Brain } from "lucide-react";

interface ReportsHeaderProps {
  onNewAnalysis: () => void;
}

export function ReportsHeader({ onNewAnalysis }: ReportsHeaderProps) {
  return (
    <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Analysis Reports</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Generate, view, export, and manage reports from your previous SentimentAI analyses.
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNewAnalysis}
        className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
        aria-label="Start New Analysis"
      >
        <Brain className="w-4 h-4" />
        <span>🧠 New Analysis</span>
      </button>
    </header>
  );
}
