import React from "react";
import {
  HelpCircle,
  Sparkles,
  TrendingUp,
  Smile,
  ShieldAlert,
  Lightbulb,
  Layers,
  ArrowRight
} from "lucide-react";
import { ClarityExplanationType } from "../../types";

interface StarterPrompt {
  id: string;
  icon: React.ReactNode;
  label: string;
  prompt: string;
  mode: ClarityExplanationType;
  section?: string;
}

interface ClarityStarterPromptsProps {
  onSelectPrompt: (prompt: string, mode: ClarityExplanationType, section?: string) => void;
  sentimentLabel?: string;
  score?: number;
  dominantEmotion?: string;
}

export function ClarityStarterPrompts({
  onSelectPrompt,
  sentimentLabel = "Neutral",
  score = 50,
  dominantEmotion
}: ClarityStarterPromptsProps) {
  const prompts: StarterPrompt[] = [
    {
      id: "why_score",
      icon: <TrendingUp className="w-4 h-4 text-blue-400" />,
      label: `Why is my score ${Math.round(score * 100)}% (${sentimentLabel})?`,
      prompt: `Can you explain why my overall sentiment was classified as ${sentimentLabel} with a ${Math.round(score * 100)}% score?`,
      mode: "simple",
      section: "overallSentiment"
    },
    {
      id: "explain_simple",
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      label: "Explain this in simple terms",
      prompt: "Can you summarize this entire analysis in very simple, easy-to-understand language?",
      mode: "simple"
    },
    {
      id: "dominant_emotion",
      icon: <Smile className="w-4 h-4 text-emerald-400" />,
      label: dominantEmotion ? `What does "${dominantEmotion}" mean?` : "Explain the detected emotions",
      prompt: dominantEmotion
        ? `What caused the dominant emotion "${dominantEmotion}" to be detected, and what does it indicate?`
        : "What are the main emotional drivers detected across this analysis?",
      mode: "detailed",
      section: "emotions"
    },
    {
      id: "coaching",
      icon: <Lightbulb className="w-4 h-4 text-purple-400" />,
      label: "How can I improve my tone?",
      prompt: "What actionable steps and communication tips do you recommend based on this analysis?",
      mode: "detailed",
      section: "sentiment_coaching"
    },
    {
      id: "multimodal",
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      label: "How do voice & visual cues compare?",
      prompt: "How did the visual observations, voice audio, and text messages align in this session?",
      mode: "detailed",
      section: "multimodalRelationship"
    },
    {
      id: "confidence",
      icon: <HelpCircle className="w-4 h-4 text-indigo-400" />,
      label: "How reliable is this result?",
      prompt: "Can you explain what the model confidence score means and how reliable these findings are?",
      mode: "simple",
      section: "confidence"
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>Suggested Questions to Ask</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPrompt(p.prompt, p.mode, p.section)}
            className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 text-left transition-all group flex items-start justify-between gap-2.5 cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0 group-hover:scale-105 transition-transform">
                {p.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                  {p.label}
                </p>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {p.prompt}
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
