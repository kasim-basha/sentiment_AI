import React, { useState } from "react";
import {
  AIInsightItem,
  InsightType,
  InsightConfidence
} from "../../types";
import {
  TrendingUp,
  Smile,
  Activity,
  Layers,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Compass,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Info,
  Sparkles
} from "lucide-react";

interface InsightCardProps {
  insight: AIInsightItem;
  onExploreTopic?: (type: InsightType) => void;
}

const TYPE_CONFIG: Record<InsightType, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; badgeBg: string }> = {
  trend: {
    label: "Trend Trajectory",
    icon: <TrendingUp className="w-4 h-4" />,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/50",
    badgeBg: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
  },
  sentiment: {
    label: "Sentiment Pattern",
    icon: <Smile className="w-4 h-4" />,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/50",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
  },
  emotion: {
    label: "Emotional Signal",
    icon: <Sparkles className="w-4 h-4" />,
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/50",
    badgeBg: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
  },
  multimodal: {
    label: "Multimodal Synergy",
    icon: <Layers className="w-4 h-4" />,
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800/50",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
  },
  confidence: {
    label: "AI Certainty & Precision",
    icon: <ShieldCheck className="w-4 h-4" />,
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800/50",
    badgeBg: "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300"
  },
  activity: {
    label: "Cadence & Activity",
    icon: <Calendar className="w-4 h-4" />,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/50",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
  },
  attention: {
    label: "Focus Area",
    icon: <AlertTriangle className="w-4 h-4" />,
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/50",
    badgeBg: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300"
  },
  pattern: {
    label: "Communication Pattern",
    icon: <Compass className="w-4 h-4" />,
    bg: "bg-teal-50 dark:bg-teal-950/30",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800/50",
    badgeBg: "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
  }
};

const CONFIDENCE_BADGES: Record<InsightConfidence, { label: string; dot: string; text: string }> = {
  high: { label: "High Certainty", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  medium: { label: "Moderate Certainty", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  low: { label: "Preliminary Signal", dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-400" }
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onExploreTopic }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const typeConfig = TYPE_CONFIG[insight.type] || TYPE_CONFIG.pattern;
  const confConfig = CONFIDENCE_BADGES[insight.confidence] || CONFIDENCE_BADGES.medium;

  const handleCopy = () => {
    const text = `${insight.title}\n\nObservation: ${insight.observation}\nInterpretation: ${insight.interpretation}\nMetric: ${insight.supportingData.metric} (${insight.supportingData.value})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`insight-${insight.id}`}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Card Header: Type Badge, Confidence Indicator & Copy Action */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeConfig.badgeBg}`}>
              {typeConfig.icon}
              <span>{typeConfig.label}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <span className={`w-1.5 h-1.5 rounded-full ${confConfig.dot}`} />
              {confConfig.label}
            </span>
          </div>

          <button
            id={`copy-insight-${insight.id}`}
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copy insight details"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {insight.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {insight.description}
        </p>

        {/* Observation vs Interpretation Structured Breakdown */}
        <div className="space-y-2.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg p-3.5 border border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0 w-24 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-blue-500" />
              Observation:
            </span>
            <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {insight.observation}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0 w-24 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-purple-500" />
              Interpretation:
            </span>
            <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {insight.interpretation}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Supporting Data Pill & Expand Trigger */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        {/* Supporting Metric Pill */}
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono">
            <span className="text-slate-400 font-sans font-normal text-[11px]">{insight.supportingData.metric}:</span>
            <span className="font-semibold text-primary-600 dark:text-primary-400">{insight.supportingData.value}</span>
          </div>

          {insight.supportingData.previousValue && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              prev: {insight.supportingData.previousValue}
            </span>
          )}
        </div>

        {/* Expand/Details Toggle */}
        <button
          id={`expand-insight-${insight.id}`}
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 transition-colors shrink-0"
        >
          {isExpanded ? (
            <>Less <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>Details <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>
      </div>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-400 animate-fadeIn">
          {insight.supportingData.label && (
            <div className="flex justify-between">
              <span className="text-slate-500">Cohort / Sample:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{insight.supportingData.label}</span>
            </div>
          )}
          {insight.supportingData.details && (
            <div className="flex justify-between">
              <span className="text-slate-500">Additional Signal:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{insight.supportingData.details}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Strictly grounded in your recorded SentimentAI session metrics.</span>
          </div>
        </div>
      )}
    </div>
  );
};
