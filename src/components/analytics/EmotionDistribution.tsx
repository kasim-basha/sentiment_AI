import React, { useState } from "react";
import { Sparkles, Award, ChevronDown, ChevronUp } from "lucide-react";
import { EmotionDistributionItem } from "../../types";

interface EmotionDistributionProps {
  emotions: EmotionDistributionItem[];
  dominantEmotion: { name: string; count: number; percentage: number } | null;
}

export const EmotionDistribution: React.FC<EmotionDistributionProps> = ({ emotions, dominantEmotion }) => {
  const [showAll, setShowAll] = useState(false);
  const displayEmotions = showAll ? emotions : emotions.slice(0, 6);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Emotion Frequency Distribution
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {emotions.length} Categories
          </span>
        </div>

        {/* Dominant Emotion Highlight Pill */}
        {dominantEmotion && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
                  Dominant Emotion
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {dominantEmotion.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {dominantEmotion.percentage}%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {dominantEmotion.count} occurrences
              </span>
            </div>
          </div>
        )}

        {emotions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No emotional cues detected in this timeframe.
          </div>
        ) : (
          <div className="space-y-3">
            {displayEmotions.map((emo) => (
              <div key={emo.name} className="text-xs">
                <div className="flex items-center justify-between mb-1.5 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center text-[10px]">
                      #{emo.ranking}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {emo.name}
                    </span>
                    {emo.isDominant && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                        Top
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">{emo.count}x</span>
                    <span className="font-bold text-slate-900 dark:text-white min-w-[36px] text-right">
                      {emo.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(emo.percentage, 4)}%`,
                      backgroundColor: emo.color || "#0ea5e9"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {emotions.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 w-full text-center text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center justify-center gap-1 transition-colors"
        >
          <span>{showAll ? "Show Top 6" : `View All ${emotions.length} Emotions`}</span>
          {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
};
