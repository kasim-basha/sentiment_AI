import React from 'react';
import { MultimodalAnalysisResult } from '../../types';

interface EmotionAnalysisCardProps {
  emotions: MultimodalAnalysisResult['emotions'];
}

export function EmotionAnalysisCard({ emotions }: EmotionAnalysisCardProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 relative group h-full">
      <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">🎭 Emotional Analysis</h4>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Dominant Emotion</p>
            <p className="text-3xl font-black text-blue-400 tracking-tight">{emotions.dominant.name}</p>
            <p className="text-xs font-bold text-slate-500 mt-2 italic">"{emotions.dominant.reason}"</p>
          </div>
          <div className="flex-1 border-l border-slate-800/50 pl-6 hidden sm:block">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">💭 Secondary</p>
            <div className="flex flex-wrap gap-2">
              {emotions.secondary.map((e, idx) => (
                <div key={idx} className="group/item relative">
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300 cursor-help">
                    {e.name}
                  </span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-400 w-48 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-50">
                    {e.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
