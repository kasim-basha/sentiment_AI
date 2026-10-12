import React from "react";
import {
  BarChart2,
  Smile,
  Meh,
  Frown,
  Shuffle,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  CalendarDays
} from "lucide-react";
import { AnalyticsOverviewStats } from "../../types";

interface OverviewStatsProps {
  stats: AnalyticsOverviewStats;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Total Analyses */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Analyses</span>
          <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <BarChart2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {stats.totalAnalyses}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Completed sessions
          </span>
        </div>
      </div>

      {/* 2. Positive Sentiment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Positive</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Smile className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.positiveCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60">
              {stats.positivePct}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Favorable signals
          </span>
        </div>
      </div>

      {/* 3. Neutral Sentiment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Neutral</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Meh className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.neutralCount}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60">
              {stats.neutralPct}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Objective / balanced
          </span>
        </div>
      </div>

      {/* 4. Negative Sentiment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Negative</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Frown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.negativeCount}
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60">
              {stats.negativePct}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Critical / concern
          </span>
        </div>
      </div>

      {/* 5. Mixed Sentiment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Mixed</span>
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Shuffle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.mixedCount}
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60">
              {stats.mixedPct}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Dual polarities
          </span>
        </div>
      </div>

      {/* 6. Average Confidence */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Avg Confidence</span>
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.avgConfidenceScore}%
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              stats.avgConfidenceLabel === "High" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" :
              stats.avgConfidenceLabel === "Medium" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400" :
              "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
            }`}>
              {stats.avgConfidenceLabel}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Detection certainty
          </span>
        </div>
      </div>

      {/* 7. Average Sentiment Score */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Avg Score</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {(stats.avgSentimentScore * 100).toFixed(0)}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Mean polarity weight ({stats.avgSentimentScore})
          </span>
        </div>
      </div>

      {/* 8. Most Detected Emotion */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors col-span-1 sm:col-span-2 lg:col-span-2">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Most Detected Emotion</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          {stats.mostDetectedEmotion ? (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {stats.mostDetectedEmotion.name}
              </span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 shrink-0">
                {stats.mostDetectedEmotion.count} ({stats.mostDetectedEmotion.percentage}%)
              </span>
            </div>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500 italic">No emotion detected</span>
          )}
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Primary recurring affective cue
          </span>
        </div>
      </div>

      {/* 9. Most Active Day */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Most Active Day</span>
          <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {stats.mostActiveDay?.dayName || "N/A"}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {stats.mostActiveDay ? `${stats.mostActiveDay.count} sessions recorded` : "No session activity"}
          </span>
        </div>
      </div>
    </div>
  );
};
