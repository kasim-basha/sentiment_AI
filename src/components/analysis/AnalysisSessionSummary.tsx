import React from 'react';
import { BarChart3, FileText, Image as ImageIcon, Video, Check } from 'lucide-react';
import { MultimodalAnalysisResult } from '../../types';

interface AnalysisSessionSummaryProps {
  summary: MultimodalAnalysisResult['input_summary'];
}

export function AnalysisSessionSummary({ summary }: AnalysisSessionSummaryProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-xl font-bold text-white tracking-tight">📊 Analysis Session</h4>
          <p className="text-slate-400 font-medium mt-1">
            {summary.total_files + (summary.has_direct_text ? 1 : 0)} items analyzed
          </p>
          <div className="flex flex-wrap gap-4 mt-3">
            {summary.has_direct_text && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300">
                📝 1 Text
              </span>
            )}
            {summary.image_count > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300">
                🖼️ {summary.image_count} Image(s)
              </span>
            )}
            {summary.video_count > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300">
                🎥 {summary.video_count} Video(s)
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-center sm:text-right bg-emerald-500/5 border border-emerald-500/20 px-6 py-4 rounded-2xl">
        <p className="text-xl font-black text-emerald-400 tracking-tight flex items-center gap-2 justify-center sm:justify-end">
          <Check className="w-5 h-5" />
          Analysis Complete
        </p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Status: Success</p>
      </div>
    </div>
  );
}
