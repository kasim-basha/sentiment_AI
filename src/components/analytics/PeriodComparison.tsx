import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Scale, AlertCircle } from "lucide-react";
import { PeriodComparisonData } from "../../types";

interface PeriodComparisonProps {
  comparison: PeriodComparisonData;
}

export const PeriodComparison: React.FC<PeriodComparisonProps> = ({ comparison }) => {
  if (!comparison || !comparison.hasEnoughData || !comparison.previousPeriod || !comparison.changes) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-500" />
              Period-over-Period Comparison
            </h3>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center py-8">
            <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Not enough historical data for comparison
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Period comparison requires analyses from both the current window and the preceding equivalent timeframe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { currentPeriod, previousPeriod, changes } = comparison;

  const renderDelta = (delta: number, isPct = true, invertGood = false) => {
    if (delta === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-slate-400 font-semibold">
          <Minus className="w-3 h-3" /> 0{isPct ? "%" : ""}
        </span>
      );
    }
    const isPositive = delta > 0;
    const isGood = invertGood ? !isPositive : isPositive;

    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      }`}>
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {isPositive ? `+${delta}` : delta}{isPct ? "%" : ""}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-500" />
            Period-over-Period Comparison
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            vs. Prior Window
          </span>
        </div>

        <div className="space-y-3">
          {/* Total Analyses */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Total Analyses</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentPeriod.totalAnalyses} vs {previousPeriod.totalAnalyses} (prior)
              </span>
            </div>
            {renderDelta(changes.totalAnalyses, false)}
          </div>

          {/* Positive Sentiment */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Positive Polarity</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentPeriod.positivePct}% vs {previousPeriod.positivePct}% (prior)
              </span>
            </div>
            {renderDelta(changes.positivePct)}
          </div>

          {/* Negative Sentiment */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Negative Polarity</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentPeriod.negativePct}% vs {previousPeriod.negativePct}% (prior)
              </span>
            </div>
            {renderDelta(changes.negativePct, true, true)}
          </div>

          {/* Average Sentiment Score */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Mean Sentiment Score</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {(currentPeriod.avgSentimentScore * 100).toFixed(0)}% vs {(previousPeriod.avgSentimentScore * 100).toFixed(0)}%
              </span>
            </div>
            {renderDelta(Math.round(changes.avgSentimentScore * 100))}
          </div>

          {/* Dominant Emotion Comparison */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Dominant Emotion</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentPeriod.dominantEmotion} (current) vs {previousPeriod.dominantEmotion} (prior)
              </span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              changes.dominantEmotionChanged
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}>
              {changes.dominantEmotionChanged ? "Shifted" : "Steady"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
