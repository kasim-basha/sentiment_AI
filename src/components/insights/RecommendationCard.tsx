import React from "react";
import {
  AIRecommendationItem,
  RecommendationType
} from "../../types";
import {
  CheckCircle2,
  ArrowRight,
  Target,
  Search,
  Sparkles,
  Clock,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface RecommendationCardProps {
  recommendation: AIRecommendationItem;
  onNavigate?: (view: any) => void;
}

const TYPE_CONFIG: Record<RecommendationType, { label: string; icon: React.ReactNode; badgeColor: string }> = {
  tracking: {
    label: "Tracking & Cadence",
    icon: <Clock className="w-4 h-4 text-blue-500" />,
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40"
  },
  review: {
    label: "Session Review",
    icon: <Search className="w-4 h-4 text-purple-500" />,
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40"
  },
  modalities: {
    label: "Modality Expansion",
    icon: <Sparkles className="w-4 h-4 text-amber-500" />,
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
  },
  history: {
    label: "Historical Exploration",
    icon: <Target className="w-4 h-4 text-teal-500" />,
    badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800/40"
  },
  attention: {
    label: "Focus & De-escalation",
    icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
  },
  general: {
    label: "Best Practice",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
  }
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onNavigate }) => {
  const config = TYPE_CONFIG[recommendation.type] || TYPE_CONFIG.general;

  const handleActionClick = () => {
    if (!onNavigate) return;

    if (recommendation.type === "modalities" || recommendation.title.toLowerCase().includes("analysis")) {
      onNavigate("my-analysis");
    } else if (recommendation.type === "review" || recommendation.type === "history") {
      onNavigate("history");
    } else if (recommendation.type === "tracking") {
      onNavigate("analytics");
    } else {
      onNavigate("my-analysis");
    }
  };

  return (
    <div
      id={`recommendation-${recommendation.id}`}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Type Badge & Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeColor}`}>
            {config.icon}
            <span>{config.label}</span>
          </span>
        </div>

        {/* Action Title */}
        <h4 className="text-base font-semibold text-slate-900 dark:text-white leading-snug mb-2">
          {recommendation.title}
        </h4>

        {/* Action Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {recommendation.description}
        </p>

        {/* Data Grounding Box */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 mb-4 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Why this recommendation: </span>
            <span>{recommendation.reason}</span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      {recommendation.actionHint && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            id={`action-${recommendation.id}`}
            onClick={handleActionClick}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 text-xs font-semibold transition-colors"
          >
            <span>{recommendation.actionHint}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
