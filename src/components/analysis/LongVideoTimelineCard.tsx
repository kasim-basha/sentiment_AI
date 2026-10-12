import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, TrendingUp, Sparkles, Zap, ChevronRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { MultimodalAnalysisResult } from '../../types';

interface LongVideoTimelineCardProps {
  timeline?: MultimodalAnalysisResult['timeline_breakdown'];
  turningPoints?: MultimodalAnalysisResult['turning_points'];
  videoMetadata?: MultimodalAnalysisResult['video_metadata'];
}

export function LongVideoTimelineCard({ timeline, turningPoints, videoMetadata }: LongVideoTimelineCardProps) {
  const [selectedHour, setSelectedHour] = useState<number>(0);

  if (!timeline || timeline.length === 0) return null;

  const currentSegment = timeline[selectedHour] || timeline[0];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          bar: 'bg-emerald-500'
        };
      case 'Negative':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          bar: 'bg-rose-500'
        };
      case 'Mixed':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          bar: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          bar: 'bg-blue-500'
        };
    }
  };

  const durationHours = videoMetadata?.duration_hours || timeline.length;
  const colors = getSentimentColor(currentSegment.sentiment);

  return (
    <div id="long-video-timeline-card" className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Clock className="w-4 h-4" />
            <span>Full {durationHours}-Hour Continuous Chronological Breakdown</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">
            {videoMetadata?.title || `${durationHours}-Hour Timeline Sentiment Map`}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            {timeline.length} Chronological Hourly Phases
          </span>
        </div>
      </div>

      {/* Interactive 12-Hour Timeline Track */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-medium">
          <span>00:00:00 (Start)</span>
          <span className="text-slate-500">Click any hour to inspect detailed findings</span>
          <span>{String(durationHours).padStart(2, '0')}:00:00 (End)</span>
        </div>

        {/* Hourly Grid / Stepper */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
          {timeline.map((seg, idx) => {
            const isSelected = selectedHour === idx;
            const segColor = getSentimentColor(seg.sentiment);
            return (
              <button
                key={idx}
                onClick={() => setSelectedHour(idx)}
                className={`flex flex-col items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? `${segColor.bg} ${segColor.border} ring-2 ring-blue-400/50 shadow-lg scale-105 z-10`
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
                title={`Hour ${idx + 1}: ${seg.sentiment} (${Math.round(seg.score * 100)}%)`}
              >
                <span className="text-[10px] font-mono font-bold text-slate-400">H{idx + 1}</span>
                <div className="w-full h-8 my-1 rounded-md bg-slate-900/80 flex items-end p-1 overflow-hidden">
                  <div
                    className={`w-full rounded-sm ${segColor.bar} transition-all`}
                    style={{ height: `${Math.max(25, Math.round(seg.score * 100))}%` }}
                  />
                </div>
                <span className={`text-[9px] font-bold truncate max-w-full ${segColor.text}`}>
                  {seg.sentiment.substring(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Phase Details Card */}
      <div className={`mt-6 p-5 sm:p-6 rounded-2xl border ${colors.bg} ${colors.border} transition-all`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${colors.badge} border`}>
              {selectedHour + 1}
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-slate-400">
                {currentSegment.timestamp}
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                {currentSegment.label}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
              {currentSegment.sentiment} ({Math.round(currentSegment.score * 100)}% Confidence)
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-300 border border-slate-800">
              {currentSegment.dominant_emotion}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed font-medium mt-2">
          {currentSegment.key_event}
        </p>
      </div>

      {/* Major Turning Points Across the 12 Hours */}
      {turningPoints && turningPoints.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">
            <Zap className="w-4 h-4" />
            <span>Key Emotional Turning Points Across The Full Timeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {turningPoints.map((tp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-amber-300">{tp.timestamp}</span>
                  </div>
                  <h5 className="text-sm font-bold text-white mb-1">{tp.event}</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">{tp.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
