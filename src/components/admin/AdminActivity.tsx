import React, { useState, useEffect } from "react";
import {
  Clock,
  ShieldAlert,
  UserMinus,
  UserCheck,
  Trash2,
  RefreshCw,
  Calendar,
  AlertCircle
} from "lucide-react";
import { AdminActivity as AdminActivityType } from "../../types";
import { auditLogService } from "../../services/auditLogService";

export function AdminActivity() {
  const [activities, setActivities] = useState<AdminActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await auditLogService.getActivities(20);
      setActivities(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "USER_ROLE_CHANGED":
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />,
          label: "Role Changed",
          badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20"
        };
      case "USER_SUSPENDED":
        return {
          icon: <UserMinus className="w-3.5 h-3.5 text-rose-400" />,
          label: "User Suspended",
          badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20"
        };
      case "USER_ACTIVATED":
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-emerald-400" />,
          label: "User Activated",
          badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        };
      case "REPORT_DELETED":
      case "ANALYSIS_DELETED":
        return {
          icon: <Trash2 className="w-3.5 h-3.5 text-amber-400" />,
          label: action === "REPORT_DELETED" ? "Report Deleted" : "Analysis Deleted",
          badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20"
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
          label: action,
          badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20"
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          🕐 Recent Admin Activity & Audit Trail
        </h3>

        <button
          onClick={loadActivities}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh activity logs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 bg-slate-950/60 rounded-2xl" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
            No administrative events recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {activities.map((act) => {
              const meta = getActionBadge(act.action);
              return (
                <div key={act.activityId} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={`p-2 rounded-xl border shrink-0 ${meta.badgeClass}`}>
                      {meta.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {act.adminName || "Admin"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-slate-300">
                          on <span className="font-semibold text-white">{act.targetName || act.targetId}</span>
                        </span>
                      </div>
                      {act.details && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {act.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap self-end sm:self-auto font-mono">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    {new Date(act.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
