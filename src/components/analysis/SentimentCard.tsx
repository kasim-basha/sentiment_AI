import React from 'react';
import { MultimodalAnalysisResult } from '../../types';

interface SentimentCardProps {
  sentiment: MultimodalAnalysisResult['overall_sentiment'];
}

export function SentimentCard({ sentiment }: SentimentCardProps) {
  const getSentimentColor = (label: string) => {
    switch (label.toLowerCase()) {
      case "positive": return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
      case "negative": return "text-rose-400 border-rose-500/20 bg-rose-500/10";
      case "neutral": return "text-blue-400 border-blue-500/20 bg-blue-500/10";
      case "mixed": return "text-amber-400 border-amber-500/20 bg-amber-500/10";
      default: return "text-slate-400 border-slate-700 bg-slate-800/50";
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 relative group h-full">
      <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">😊 Overall Sentiment</h4>
      <div className="space-y-6">
        <div className={`inline-flex px-4 py-1.5 rounded-full text-xs font-extrabold border shadow-sm ${getSentimentColor(sentiment.label)}`}>
          {sentiment.label.toUpperCase()}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/50">
            <p className="text-xl font-bold text-white">{sentiment.intensity}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Intensity</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/50">
            <p className="text-xl font-bold text-white">{sentiment.confidence}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">🎯 Confidence</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidence Score</span>
          <span className="text-sm font-black text-blue-400">{(sentiment.score * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
