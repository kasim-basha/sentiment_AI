import React, { useState, useEffect } from "react";
import {
  Users,
  Brain,
  FileText,
  BarChart3,
  Settings,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { AdminStats, SystemStatus as SystemStatusType } from "../../types";
import { adminService } from "../../services/adminService";
import { SystemOverview } from "./SystemOverview";
import { AdminActivity } from "./AdminActivity";
import { AdminCardSkeleton } from "./AdminSkeleton";
import { AdminErrorState } from "./AdminErrorState";

interface AdminDashboardHomeProps {
  onNavigateSubView: (view: "users" | "analyses" | "reports" | "statistics" | "system") => void;
  onBackToDashboard: () => void;
}

export function AdminDashboardHome({ onNavigateSubView, onBackToDashboard }: AdminDashboardHomeProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, statusData] = await Promise.all([
        adminService.getAdminStatistics(),
        adminService.getSystemStatus()
      ]);
      setStats(statsData);
      setSystemStatus(statusData);
    } catch (err) {
      console.error("Failed to load admin overview:", err);
      setError("Unable to load platform overview metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  if (error) {
    return (
      <AdminErrorState
        message={error}
        onRetry={loadHomeData}
        onBackToDashboard={onBackToDashboard}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            🛡️ Platform Operations Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated system health, sentiment trends, and administrative controls.
          </p>
        </div>

        <button
          onClick={loadHomeData}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </button>
      </div>

      {loading || !stats ? (
        <div className="space-y-6">
          <AdminCardSkeleton count={4} />
          <div className="h-44 rounded-3xl bg-slate-900/80 border border-slate-800 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Real platform statistics & system overview */}
          <SystemOverview stats={stats} systemStatus={systemStatus} />

          {/* Quick Submodule Jump Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              onClick={() => onNavigateSubView("users")}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Users</span>
                  <span className="text-[10px] text-slate-400">Access & roles</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigateSubView("analyses")}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Analyses</span>
                  <span className="text-[10px] text-slate-400">Review records</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigateSubView("reports")}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Reports</span>
                  <span className="text-[10px] text-slate-400">Generated docs</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigateSubView("statistics")}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Statistics</span>
                  <span className="text-[10px] text-slate-400">Deep telemetry</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigateSubView("system")}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">System</span>
                  <span className="text-[10px] text-slate-400">Infrastructure</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Recent Admin Activity & Audit Trail */}
          <AdminActivity />
        </>
      )}
    </div>
  );
}
