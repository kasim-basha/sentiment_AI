import React from "react";
import {
  GoalItem,
  GoalCategory,
  GoalMeasurementType,
  GoalStatus
} from "../../types";
import {
  Target,
  Smile,
  Heart,
  Activity,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Edit3,
  Trash2,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight
} from "lucide-react";

interface GoalCardProps {
  goal: GoalItem;
  onEdit: (goal: GoalItem) => void;
  onDelete: (goalId: string) => void;
  onPause: (goalId: string) => void;
  onResume: (goalId: string) => void;
  onViewDetails: (goal: GoalItem) => void;
}

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; icon: any; color: string }> = {
  activity: { label: "Activity Cadence", icon: Activity, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  sentiment: { label: "Sentiment Balance", icon: Smile, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  emotion: { label: "Emotion Signal", icon: Heart, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  confidence: { label: "Analysis Confidence", icon: Sparkles, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  trend: { label: "Trend Continuity", icon: TrendingUp, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  multimodal: { label: "Multimodal Richness", icon: Layers, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" }
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: "Active", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  completed: { label: "Completed", bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400", dot: "bg-blue-400" },
  paused: { label: "Paused", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", dot: "bg-amber-400" },
  expired: { label: "Expired", bg: "bg-slate-700/40 border-slate-600", text: "text-slate-400", dot: "bg-slate-500" },
  not_started: { label: "Upcoming", bg: "bg-indigo-500/10 border-indigo-500/30", text: "text-indigo-400", dot: "bg-indigo-400" }
};

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onPause,
  onResume,
  onViewDetails
}) => {
  const cat = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.activity;
  const status = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active;
  const CatIcon = cat.icon;

  const progress = goal.progress || {
    currentValue: 0,
    targetValue: goal.targetValue,
    percentage: 0,
    remainingValue: goal.targetValue,
    daysRemaining: 0,
    status: goal.status
  };

  const getMetricDisplay = () => {
    switch (goal.measurementType) {
      case "analysis_count":
        return `${progress.currentValue} / ${goal.targetValue} analyses`;
      case "positive_count":
        return `${progress.currentValue} / ${goal.targetValue} positive sessions`;
      case "positive_percentage":
        return `${progress.currentValue}% / ${goal.targetValue}% positive`;
      case "avg_sentiment_score":
        return `${progress.currentValue} / ${goal.targetValue} score avg`;
      case "emotion_count":
        return `${progress.currentValue} / ${goal.targetValue} "${goal.targetEmotion || "Emotion"}" sessions`;
      case "emotion_percentage":
        return `${progress.currentValue}% / ${goal.targetValue}% "${goal.targetEmotion || "Emotion"}"`;
      case "avg_confidence":
        return `${progress.currentValue}% / ${goal.targetValue}% confidence`;
      case "multimodal_count":
        return `${progress.currentValue} / ${goal.targetValue} multimodal analyses`;
      default:
        return `${progress.currentValue} / ${goal.targetValue}`;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-md">
      <div>
        {/* Top bar: Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cat.color}`}>
            <CatIcon className="w-3.5 h-3.5" />
            <span>{cat.label}</span>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
            <span>{status.label}</span>
          </div>
        </div>

        {/* Title and description */}
        <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
          {goal.title}
        </h3>
        {goal.description && (
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {goal.description}
          </p>
        )}

        {/* Progress Bar and Metric */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-300 font-medium">{getMetricDisplay()}</span>
            <span className="font-bold text-white">{progress.percentage}%</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                goal.status === "completed"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : goal.status === "paused"
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-indigo-500 to-blue-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(2, progress.percentage))}%` }}
            />
          </div>

          {/* Timeline and Days Remaining */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {goal.status === "completed"
                  ? "Goal achieved!"
                  : goal.status === "expired"
                  ? "Timeline concluded"
                  : `${progress.daysRemaining} day${progress.daysRemaining === 1 ? '' : 's'} remaining`}
              </span>
            </div>
            <span>
              End: {new Date(goal.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetails(goal)}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1.5 px-2.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <span>View Progress</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1">
          {goal.status === "paused" ? (
            <button
              onClick={() => onResume(goal._id)}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Resume Tracking"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : goal.status === "active" ? (
            <button
              onClick={() => onPause(goal._id)}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Pause Goal"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : null}

          <button
            onClick={() => onEdit(goal)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Edit Goal"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(goal._id)}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Delete Goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
