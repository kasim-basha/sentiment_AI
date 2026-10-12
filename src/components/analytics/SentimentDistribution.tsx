import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { SentimentDistributionData } from "../../types";

interface SentimentDistributionProps {
  distribution: SentimentDistributionData;
  total: number;
}

export const SentimentDistribution: React.FC<SentimentDistributionProps> = ({ distribution, total }) => {
  const chartData = [
    { name: "Positive", value: distribution.positive.count, percentage: distribution.positive.percentage, color: "#10b981", bg: "bg-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-600 dark:text-emerald-400" },
    { name: "Neutral", value: distribution.neutral.count, percentage: distribution.neutral.percentage, color: "#0ea5e9", bg: "bg-sky-500", lightBg: "bg-sky-50 dark:bg-sky-950/60", text: "text-sky-600 dark:text-sky-400" },
    { name: "Negative", value: distribution.negative.count, percentage: distribution.negative.percentage, color: "#f43f5e", bg: "bg-rose-500", lightBg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-600 dark:text-rose-400" },
    { name: "Mixed", value: distribution.mixed.count, percentage: distribution.mixed.percentage, color: "#a855f7", bg: "bg-purple-500", lightBg: "bg-purple-50 dark:bg-purple-950/60", text: "text-purple-600 dark:text-purple-400" },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white border border-slate-700/60 px-3 py-2 rounded-xl shadow-xl text-xs">
          <div className="font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}: {data.value} analyses ({data.percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-sky-500" />
            Sentiment Distribution
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {total} Total
          </span>
        </div>

        {total === 0 || chartData.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No sentiment records in this date window.
          </div>
        ) : (
          <div>
            {/* Donut Chart */}
            <div className="w-full h-44 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown Bars & Labels */}
            <div className="space-y-2 mt-3">
              {[
                { label: "Positive", ...distribution.positive, color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
                { label: "Neutral", ...distribution.neutral, color: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
                { label: "Negative", ...distribution.negative, color: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
                { label: "Mixed", ...distribution.mixed, color: "bg-purple-500", text: "text-purple-600 dark:text-purple-400" },
              ].map(item => (
                <div key={item.label} className="text-xs">
                  <div className="flex items-center justify-between mb-1 text-slate-600 dark:text-slate-300">
                    <span className="font-medium flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.count} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
