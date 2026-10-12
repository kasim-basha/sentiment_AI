import React from "react";
import {
  Users,
  Brain,
  FileText,
  Mic,
  Smile,
  Frown,
  Meh,
  Shuffle,
  Activity,
  TrendingUp,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { AdminStats, SystemStatus } from "../../types";

interface SystemOverviewProps {
  stats: AdminStats;
  systemStatus: SystemStatus | null;
}

export function SystemOverview({ stats, systemStatus }: SystemOverviewProps) {
  const isOperational =
    systemStatus?.app === "operational" &&
    systemStatus?.database === "operational" &&
    systemStatus?.aiService === "operational" &&
    systemStatus?.storage === "operational";

  return (
    <div className="space-y-6">
      {/* 1. Main Platform Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Users</span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalUsers}
            </div>
            <span className="text-[11px] text-blue-400 font-medium">
              Registered Accounts
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Analyses */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Analyses</span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalAnalyses}
            </div>
            <span className="text-[11px] text-purple-400 font-medium">
              Multimodal Inferences
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
        </div>

        {/* Total Reports */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Reports</span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalReports}
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              PDF & Intelligence Dockets
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Voice Sessions */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Voice Sessions</span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.voiceSessions}
            </div>
            <span className="text-[11px] text-amber-400 font-medium">
              Speech Invocations
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Mic className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Sentiment Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Positive Analyses */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Positive</span>
            <p className="text-lg font-bold text-white mt-0.5">{stats.sentimentDistribution.positive}</p>
          </div>
        </div>

        {/* Negative Analyses */}
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <Frown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">Negative</span>
            <p className="text-lg font-bold text-white mt-0.5">{stats.sentimentDistribution.negative}</p>
          </div>
        </div>

        {/* Neutral Analyses */}
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Meh className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Neutral</span>
            <p className="text-lg font-bold text-white mt-0.5">{stats.sentimentDistribution.neutral}</p>
          </div>
        </div>

        {/* Mixed Analyses */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Shuffle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Mixed</span>
            <p className="text-lg font-bold text-white mt-0.5">{stats.sentimentDistribution.mixed}</p>
          </div>
        </div>
      </div>

      {/* 3. Section 5: System Overview Panel */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            📊 System Overview
          </h3>

          {/* System Status: 🟢 Operational only if verified */}
          <div className="flex items-center gap-2">
            {isOperational ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                🟢 Operational
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                ⚠️ Degraded Performance
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Active Users</span>
            <div className="text-xl font-bold text-white mt-1">
              {stats.growth.usersToday || 1}
            </div>
            <span className="text-[10px] text-slate-500">Currently Online</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Analyses Today</span>
            <div className="text-xl font-bold text-white mt-1">
              {stats.growth.analysesToday}
            </div>
            <span className="text-[10px] text-slate-500">Past 24 Hours</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Analyses This Week</span>
            <div className="text-xl font-bold text-white mt-1">
              {stats.growth.analysesThisWeek}
            </div>
            <span className="text-[10px] text-slate-500">Rolling 7-day window</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Reports Generated</span>
            <div className="text-xl font-bold text-white mt-1">
              {stats.totalReports}
            </div>
            <span className="text-[10px] text-slate-500">Total generated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
