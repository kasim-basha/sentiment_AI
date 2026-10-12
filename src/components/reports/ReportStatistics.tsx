import React from "react";
import { ReportStatistics as ReportStatisticsType } from "../../types";

interface ReportStatisticsProps {
  stats: ReportStatisticsType;
}

export function ReportStatistics({ stats }: ReportStatisticsProps) {
  const cards = [
    {
      label: "Total Reports",
      count: stats.totalReports,
      emoji: "📊",
      textColor: "text-blue-400",
      bgGradient: "from-blue-500/10 to-indigo-500/5",
      borderColor: "border-blue-500/20"
    },
    {
      label: "Positive",
      count: stats.positive,
      emoji: "😊",
      textColor: "text-emerald-400",
      bgGradient: "from-emerald-500/10 to-teal-500/5",
      borderColor: "border-emerald-500/20"
    },
    {
      label: "Negative",
      count: stats.negative,
      emoji: "😞",
      textColor: "text-rose-400",
      bgGradient: "from-rose-500/10 to-pink-500/5",
      borderColor: "border-rose-500/20"
    },
    {
      label: "Neutral",
      count: stats.neutral,
      emoji: "😐",
      textColor: "text-slate-300",
      bgGradient: "from-slate-500/10 to-gray-500/5",
      borderColor: "border-slate-500/20"
    },
    {
      label: "Mixed",
      count: stats.mixed,
      emoji: "🔀",
      textColor: "text-violet-400",
      bgGradient: "from-violet-500/10 to-purple-500/5",
      borderColor: "border-violet-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`p-4 rounded-2xl bg-gradient-to-br ${card.bgGradient} bg-slate-900/60 border ${card.borderColor} backdrop-blur-md transition-all hover:translate-y-[-1px]`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {card.label}
            </span>
            <span className="text-base" role="img" aria-label={card.label}>
              {card.emoji}
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.textColor}`}>
            {card.count}
          </div>
        </div>
      ))}
    </div>
  );
}
