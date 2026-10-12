import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import { TrendingUp, Layers, Activity } from "lucide-react";
import { SentimentTrendPoint } from "../../types";

interface SentimentTrendChartProps {
  trendData: SentimentTrendPoint[];
}

export const SentimentTrendChart: React.FC<SentimentTrendChartProps> = ({ trendData }) => {
  const [chartMode, setChartMode] = useState<"stacked" | "score">("stacked");

  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Sentiment Trend Data</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Complete more analyses across multiple days to visualize your sentiment trajectory over time.
        </p>
      </div>
    );
  }

  // Format data for score view with 0-100 scale
  const formattedData = trendData.map(d => ({
    ...d,
    scorePct: Math.round((d.avgScore || 0) * 100)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/60 p-3.5 rounded-xl shadow-xl text-xs min-w-[190px]">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span>{data.label || label}</span>
            <span className="text-slate-400 font-normal">{data.total} {data.total === 1 ? "Analysis" : "Analyses"}</span>
          </div>

          {chartMode === "stacked" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Positive
                </span>
                <span className="font-bold">{data.positive}</span>
              </div>
              <div className="flex items-center justify-between text-sky-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Neutral
                </span>
                <span className="font-bold">{data.neutral}</span>
              </div>
              <div className="flex items-center justify-between text-rose-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Negative
                </span>
                <span className="font-bold">{data.negative}</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Mixed
                </span>
                <span className="font-bold">{data.mixed}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-indigo-300 py-1">
              <span>Avg Sentiment Score:</span>
              <span className="font-bold text-white text-sm">{data.scorePct}% ({data.avgScore})</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-500" />
            Sentiment Trend Over Time
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chronological pattern of sentiment polarities and average scoring
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setChartMode("stacked")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartMode === "stacked"
                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Volume Breakdown</span>
          </button>
          <button
            onClick={() => setChartMode("score")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartMode === "score"
                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Average Score</span>
          </button>
        </div>
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === "stacked" ? (
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorNeu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorMix" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              />
              <Area type="monotone" dataKey="positive" name="Positive" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorPos)" />
              <Area type="monotone" dataKey="neutral" name="Neutral" stackId="1" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorNeu)" />
              <Area type="monotone" dataKey="negative" name="Negative" stackId="1" stroke="#f43f5e" fillOpacity={1} fill="url(#colorNeg)" />
              <Area type="monotone" dataKey="mixed" name="Mixed" stackId="1" stroke="#a855f7" fillOpacity={1} fill="url(#colorMix)" />
            </AreaChart>
          ) : (
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis
                domain={[0, 100]}
                unit="%"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="scorePct"
                name="Avg Sentiment Score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#4f46e5" }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
