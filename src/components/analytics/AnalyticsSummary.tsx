import React from "react";
import { Sparkles, Info } from "lucide-react";

interface AnalyticsSummaryProps {
  summaryText: string;
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ summaryText }) => {
  if (!summaryText) return null;

  return (
    <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 dark:border-sky-500/30 rounded-2xl p-5 shadow-sm mb-6 transition-colors">
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Insight Summary
            </h3>
            <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
              Aggregated Signals
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {summaryText}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Info className="w-3 h-3" />
            <span>SentimentAI signals provide reflection insights computed directly from your saved analyses. Non-clinical.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
