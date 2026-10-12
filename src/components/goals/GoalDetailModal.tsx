import React, { useState, useEffect } from "react";
import {
  GoalItem,
  GoalProgressHistoryItem
} from "../../types";
import { goalService } from "../../services/goalService";
import {
  X,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Smile,
  Heart,
  Sparkles,
  TrendingUp,
  ExternalLink,
  Pause,
  Play,
  Edit3,
  Trash2,
  BarChart2,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

interface GoalDetailModalProps {
  goal: GoalItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (goal: GoalItem) => void;
  onDelete: (goalId: string) => void;
  onPause: (goalId: string) => void;
  onResume: (goalId: string) => void;
  onViewAnalysis?: (id: string) => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  goal,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onPause,
  onResume,
  onViewAnalysis
}) => {
  const [history, setHistory] = useState<GoalProgressHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (goal && isOpen) {
      setIsLoadingHistory(true);
      goalService.getGoalById(goal._id)
        .then(res => {
          if (res.history) {
            setHistory(res.history);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingHistory(false));
    }
  }, [goal, isOpen]);

  if (!isOpen || !goal) return null;

  const progress = goal.progress || {
    currentValue: 0,
    targetValue: goal.targetValue,
    percentage: 0,
    remainingValue: goal.targetValue,
    daysRemaining: 0,
    status: goal.status,
    contributingAnalysisIds: [],
    totalEligibleAnalyses: 0
  };

  const chartData = history.map(h => ({
    time: new Date(h.calculatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    percentage: h.percentage,
    value: h.currentValue
  }));

  // If only 1 or 0 points, add current point for visualization
  if (chartData.length <= 1) {
    chartData.push({
      time: "Current",
      percentage: progress.percentage,
      value: progress.currentValue
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-white animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {goal.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                goal.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : goal.status === "paused"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/30"
              }`}>
                {goal.status}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {goal.title}
            </h2>
            {goal.description && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {goal.description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Current Progress
            </span>
            <div className="text-xl sm:text-2xl font-bold text-indigo-400">
              {progress.percentage}%
            </div>
            <span className="text-[11px] text-slate-500">
              {progress.currentValue} / {goal.targetValue} achieved
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Target Value
            </span>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {goal.targetValue}
            </div>
            <span className="text-[11px] text-slate-500">
              {progress.remainingValue} remaining
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Days Left
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">
              {progress.daysRemaining}
            </div>
            <span className="text-[11px] text-slate-500">
              Until {new Date(goal.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Eligible Analyses
            </span>
            <div className="text-xl sm:text-2xl font-bold text-purple-400">
              {progress.totalEligibleAnalyses || 0}
            </div>
            <span className="text-[11px] text-slate-500">
              In timeframe
            </span>
          </div>
        </div>

        {/* Progress Timeline Chart */}
        <div className="mt-6 bg-slate-800/40 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Progress Trajectory
              </h4>
            </div>
            <span className="text-xs text-slate-500">
              Authoritative Backend Snapshot Record
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12 }}
                  formatter={(val: any) => [`${val}%`, "Progress"]}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#6366f1" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contributing Analyses List */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Contributing Analysis Records ({progress.contributingAnalysisIds?.length || 0})</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Evaluated between {new Date(goal.startDate).toLocaleDateString()} and {new Date(goal.endDate).toLocaleDateString()}
            </span>
          </h4>

          {progress.contributingAnalysisIds && progress.contributingAnalysisIds.length > 0 ? (
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {progress.contributingAnalysisIds.map((analysisId, idx) => (
                <div
                  key={analysisId}
                  className="flex items-center justify-between p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300 font-mono truncate">
                      Analysis #{analysisId}
                    </span>
                  </div>

                  {onViewAnalysis && (
                    <button
                      onClick={() => {
                        onClose();
                        onViewAnalysis(analysisId);
                      }}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
              No matching analyses have met the criteria yet within this timeframe.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onDelete(goal._id);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Goal</span>
          </button>

          <div className="flex items-center gap-2">
            {goal.status === "paused" ? (
              <button
                onClick={() => {
                  onResume(goal._id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume Tracking</span>
              </button>
            ) : goal.status === "active" ? (
              <button
                onClick={() => {
                  onPause(goal._id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Goal</span>
              </button>
            ) : null}

            <button
              onClick={() => {
                onClose();
                onEdit(goal);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Parameters</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
