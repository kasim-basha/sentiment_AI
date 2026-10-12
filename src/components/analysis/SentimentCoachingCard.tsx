import React, { useState } from 'react';
import { Sparkles, ArrowRight, Clipboard, Check, Lightbulb, ClipboardCopy } from 'lucide-react';

interface SentimentCoachingCardProps {
  sentimentLabel: "Positive" | "Negative" | "Neutral" | "Mixed";
  coaching?: {
    current_tone_evaluation: string;
    target_goal: string;
    actionable_steps: string[];
    suggested_positive_rewrite?: string;
    positive_reframing_tips: string[];
  };
}

export function SentimentCoachingCard({ sentimentLabel, coaching }: SentimentCoachingCardProps) {
  if (!coaching) return null;

  const [copied, setCopied] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const handleCopy = () => {
    if (coaching.suggested_positive_rewrite) {
      navigator.clipboard.writeText(coaching.suggested_positive_rewrite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const isNegative = sentimentLabel === "Negative";
  const isNeutral = sentimentLabel === "Neutral";
  const isMixed = sentimentLabel === "Mixed";

  // Badge configurations based on the current sentiment label
  const badgeConfig = {
    Negative: {
      label: "Negative Tone Reframing Required",
      bgColor: "bg-rose-500/10 border-rose-500/25 text-rose-400",
      targetColor: "text-emerald-400 bg-emerald-500/5 border-emerald-500/15",
      iconClass: "text-rose-400"
    },
    Neutral: {
      label: "Neutral Tone Elevation Recommended",
      bgColor: "bg-amber-500/10 border-amber-500/25 text-amber-400",
      targetColor: "text-emerald-400 bg-emerald-500/5 border-emerald-500/15",
      iconClass: "text-amber-400"
    },
    Mixed: {
      label: "Mixed Tone Alignment Suggested",
      bgColor: "bg-purple-500/10 border-purple-500/25 text-purple-400",
      targetColor: "text-emerald-400 bg-emerald-500/5 border-emerald-500/15",
      iconClass: "text-purple-400"
    },
    Positive: {
      label: "Positive Tone Coaching Active",
      bgColor: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
      targetColor: "text-sky-400 bg-sky-500/5 border-sky-500/15",
      iconClass: "text-emerald-400"
    }
  }[sentimentLabel] || {
    label: "Sentiment Coaching Active",
    bgColor: "bg-slate-500/10 border-slate-500/25 text-slate-400",
    targetColor: "text-blue-400 bg-blue-500/5 border-blue-500/15",
    iconClass: "text-slate-400"
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 space-y-8">
      {/* Header section with state indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 text-purple-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-lg font-bold tracking-tight text-white">
              💡 AI Actionable Guidance & Sentiment Coaching
            </h4>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
              Transformative communication strategies and positive outcome planning
            </p>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider self-start md:self-center ${badgeConfig.bgColor}`}>
          {badgeConfig.label}
        </div>
      </div>

      {/* Target Transformation Roadmap visualizer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-6 py-4 bg-slate-950/65 border border-slate-800/50 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Current state:</span>
          <span className={`text-sm font-extrabold uppercase ${badgeConfig.iconClass}`}>{sentimentLabel} Tone</span>
        </div>
        <ArrowRight className="hidden sm:block w-5 h-5 text-slate-600" />
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Target goal:</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold ${badgeConfig.targetColor}`}>
            <span>🎯</span>
            <span>{coaching.target_goal}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step-by-Step Transformational checklist */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              ⚖️ Tone & Impact Evaluation
            </h5>
            <p className="text-sm font-medium text-slate-300 leading-relaxed bg-slate-950/25 p-4 border border-slate-800/25 rounded-xl">
              {coaching.current_tone_evaluation}
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3.5">
              📋 Actionable Guidelines to Refine/Improve (Checklist)
            </h5>
            <div className="space-y-3">
              {coaching.actionable_steps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`flex items-start gap-3 p-3.5 border rounded-2xl cursor-pointer transition-all duration-200 ${
                    completedSteps[idx]
                      ? "bg-emerald-950/15 border-emerald-500/20 text-emerald-300/80 line-through"
                      : "bg-slate-950/40 border-slate-800/40 text-slate-200 hover:border-slate-700/60"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                    completedSteps[idx]
                      ? "bg-emerald-500 border-emerald-600 text-slate-950"
                      : "border-slate-700 text-transparent"
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium leading-relaxed select-none">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proactive tips & complete rewritten alternative */}
        <div className="lg:col-span-5 space-y-6">
          {coaching.suggested_positive_rewrite && (
            <div className="bg-slate-950/70 border border-slate-800/50 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Suggested Positive Version
                </span>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all duration-150 ${
                    copied
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Copy Draft</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-sm italic font-medium text-slate-300 bg-slate-950/50 p-4 border border-slate-900/80 rounded-xl leading-relaxed whitespace-pre-wrap">
                "{coaching.suggested_positive_rewrite}"
              </div>

              <p className="text-[11px] font-semibold text-slate-500 text-center uppercase tracking-wide">
                💡 Perfect for constructive resolution emails, scripts, or messages
              </p>
            </div>
          )}

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-blue-400 mb-3.5">
              <Lightbulb className="w-4 h-4" />
              <h5 className="text-xs font-bold uppercase tracking-widest">
                Reframing Core Principles
              </h5>
            </div>
            <ul className="space-y-3">
              {coaching.positive_reframing_tips.map((tip, idx) => (
                <li key={idx} className="flex gap-2.5 text-xs font-semibold text-slate-400 leading-relaxed">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
