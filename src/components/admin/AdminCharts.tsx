import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { PieChart as PieIcon, TrendingUp, BarChart2, Layers } from "lucide-react";

interface AdminChartsProps {
  analysesOverTime: Array<{ date: string; count: number }>;
  sentimentData: Array<{ name: string; value: number; color: string }>;
  emotionData: Array<{ name: string; count: number; color?: string }>;
  inputTypeData: Array<{ name: string; value: number; color: string }>;
  userGrowthData: Array<{ date: string; users: number }>;
  reportGenerationData: Array<{ date: string; reports: number }>;
}

export function AdminCharts({
  analysesOverTime,
  sentimentData,
  emotionData,
  inputTypeData,
  userGrowthData,
  reportGenerationData
}: AdminChartsProps) {
  const hasAnalyses = analysesOverTime.some(d => d.count > 0);
  const hasSentiment = sentimentData.some(d => d.value > 0);
  const hasEmotions = emotionData.some(d => d.count > 0);
  const hasInputTypes = inputTypeData.some(d => d.value > 0);
  const hasUserGrowth = userGrowthData.some(d => d.users > 0);
  const hasReports = reportGenerationData.some(d => d.reports > 0);

  const customTooltipStyle = {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Analyses Over Time */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Analyses Over Time
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Real-time Volume</span>
        </div>

        {hasAnalyses ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area type="monotone" dataKey="count" name="Analyses" stroke="#3b82f6" strokeWidth={2.5} fill="url(#areaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-800/40">
            Not enough data available
          </div>
        )}
      </div>

      {/* 2. Sentiment Distribution */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-400" />
            Sentiment Distribution
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Category Ratio</span>
        </div>

        {hasSentiment ? (
          <div className="h-64 w-full flex flex-col justify-between">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60">
              {sentimentData.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-400 truncate">{s.name}</span>
                  <span className="font-bold text-white ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-800/40">
            Not enough data available
          </div>
        )}
      </div>

      {/* 3. Emotion Distribution */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-400" />
            Emotion Distribution
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Dominant Tones</span>
        </div>

        {hasEmotions ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                  {emotionData.map((entry, index) => (
                    <Cell key={`em-cell-${index}`} fill={entry.color || "#f59e0b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-800/40">
            Not enough data available
          </div>
        )}
      </div>

      {/* 4. Input Type Distribution */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Input Type Distribution
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Modality</span>
        </div>

        {hasInputTypes ? (
          <div className="h-64 w-full flex flex-col justify-between">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inputTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {inputTypeData.map((entry, index) => (
                      <Cell key={`type-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60">
              {inputTypeData.map((t) => (
                <div key={t.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-slate-400 truncate">{t.name}</span>
                  <span className="font-bold text-white ml-auto">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-800/40">
            Not enough data available
          </div>
        )}
      </div>

      {/* 5. User Growth */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            User Growth
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Platform Registrations</span>
        </div>

        {hasUserGrowth ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area type="monotone" dataKey="users" name="Active Users" stroke="#06b6d4" strokeWidth={2.5} fill="url(#userGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-800/40">
            Not enough data available
          </div>
        )}
      </div>

      {/* 6. Report Generation */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Report Generation
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Generated Reports</span>
        </div>

        {hasReports ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportGenerationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="reports" name="Reports" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-800/40">
            Not enough data available
          </div>
        )}
      </div>
    </div>
  );
}
