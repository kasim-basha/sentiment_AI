import React from "react";
import { HistoryStatistics } from "../../types";

interface HistoryStatisticsCardsProps {
  stats: HistoryStatistics;
}

export function HistoryStatisticsCards({ stats }: HistoryStatisticsCardsProps) {
  const statItems = [
    {
      id: "total-analyses",
      label: "Total Analyses",
      icon: "📊",
      value: stats.totalAnalyses,
      subtext: "Sessions across all inputs",
      borderClass: "border-slate-800 hover:border-slate-700",
      bgClass: "bg-slate-900/60",
      textClass: "text-white"
    },
    {
      id: "positive-analyses",
      label: "Positive",
      icon: "😊",
      value: stats.positive,
      subtext: stats.totalAnalyses > 0 ? `${Math.round((stats.positive / stats.totalAnalyses) * 100)}% of total` : "0%",
      borderClass: "border-emerald-500/20 hover:border-emerald-500/40",
      bgClass: "bg-emerald-500/5",
      textClass: "text-emerald-400"
    },
    {
      id: "negative-analyses",
      label: "Negative",
      icon: "😞",
      value: stats.negative,
      subtext: stats.totalAnalyses > 0 ? `${Math.round((stats.negative / stats.totalAnalyses) * 100)}% of total` : "0%",
      borderClass: "border-rose-500/20 hover:border-rose-500/40",
      bgClass: "bg-rose-500/5",
      textClass: "text-rose-400"
    },
    {
      id: "neutral-analyses",
      label: "Neutral",
      icon: "😐",
      value: stats.neutral,
      subtext: stats.totalAnalyses > 0 ? `${Math.round((stats.neutral / stats.totalAnalyses) * 100)}% of total` : "0%",
      borderClass: "border-slate-700/40 hover:border-slate-600",
      bgClass: "bg-slate-800/20",
      textClass: "text-slate-300"
    },
    {
      id: "mixed-analyses",
      label: "Mixed",
      icon: "🔀",
      value: stats.mixed,
      subtext: stats.totalAnalyses > 0 ? `${Math.round((stats.mixed / stats.totalAnalyses) * 100)}% of total` : "0%",
      borderClass: "border-violet-500/20 hover:border-violet-500/40",
      bgClass: "bg-violet-500/5",
      textClass: "text-violet-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
      {statItems.map((item) => (
        <div
          key={item.id}
          id={`stat-card-${item.id}`}
          className={`p-4 sm:p-5 rounded-2xl border ${item.borderClass} ${item.bgClass} backdrop-blur-md transition-all flex flex-col justify-between shadow-lg shadow-black/20`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 truncate">
              {item.label}
            </span>
            <span className="text-lg select-none" aria-hidden="true">
              {item.icon}
            </span>
          </div>

          <div className="mt-1">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${item.textClass}`}>
              {item.value.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              {item.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
