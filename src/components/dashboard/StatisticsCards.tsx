import { DashboardStats } from "../../types";
import {
  BarChart,
  Smile,
  Frown,
  Minus,
  Activity
} from "lucide-react";

interface StatisticsCardsProps {
  stats: DashboardStats;
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  const statItems = [
    {
      label: "Total Analyses",
      value: stats.totalAnalyses,
      icon: BarChart,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Positive",
      value: stats.positive,
      icon: Smile,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Negative",
      value: stats.negative,
      icon: Frown,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
    },
    {
      label: "Neutral",
      value: stats.neutral,
      icon: Minus,
      color: "text-slate-400",
      bg: "bg-slate-400/10",
    },
    {
      label: "Mixed",
      value: stats.mixed,
      icon: Activity,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
    },
  ];

  return (
    <section className="mb-10">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center hover:border-slate-700 transition-colors"
          >
            <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center mb-3 ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{item.value}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
