import React from "react";
import { Sparkles, Layers, ArrowRight } from "lucide-react";
import { MultimodalInsightsData } from "../../types";

interface MultimodalInsightsProps {
  multimodal: MultimodalInsightsData;
}

export const MultimodalInsights: React.FC<MultimodalInsightsProps> = ({ multimodal }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Multimodal Insights
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            {multimodal.totalMultimodal} Sessions
          </span>
        </div>

        {multimodal.totalMultimodal === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No multimodal analyses recorded yet. Upload both text and media together to discover cross-modality signals.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stat Pills */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">
                  Usage Share
                </span>
                <span className="text-lg font-bold text-purple-950 dark:text-purple-100">
                  {multimodal.multimodalPercentage}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block">
                  Avg Score
                </span>
                <span className="text-lg font-bold text-indigo-950 dark:text-indigo-100">
                  {(multimodal.avgSentimentScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">
                  Top Emotion
                </span>
                <span className="text-sm font-bold text-amber-950 dark:text-amber-100 truncate block mt-1">
                  {multimodal.dominantEmotion}
                </span>
              </div>
            </div>

            {/* Common Modality Combinations */}
            {multimodal.combinations.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  Common Modality Combinations
                </span>
                <div className="space-y-2">
                  {multimodal.combinations.map(combo => (
                    <div
                      key={combo.comboKey}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        {combo.labels.map((lbl, idx) => (
                          <React.Fragment key={lbl}>
                            {idx > 0 && <span className="text-slate-400 font-bold">+</span>}
                            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]">
                              {lbl}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">{combo.count} sessions</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {combo.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
