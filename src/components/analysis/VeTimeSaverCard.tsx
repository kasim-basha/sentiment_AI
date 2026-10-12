import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FileText,
  Video,
  Zap,
  TrendingUp,
  Bookmark,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MultimodalAnalysisResult } from '../../types';

interface VeTimeSaverCardProps {
  timeSavedSummary?: MultimodalAnalysisResult['time_saved_summary'];
  documentMetadata?: MultimodalAnalysisResult['document_metadata'];
  videoMetadata?: MultimodalAnalysisResult['video_metadata'];
  sectionBreakdown?: MultimodalAnalysisResult['section_breakdown'];
  executiveTakeaways?: MultimodalAnalysisResult['executive_takeaways'];
}

export function VeTimeSaverCard({
  timeSavedSummary,
  documentMetadata,
  videoMetadata,
  sectionBreakdown,
  executiveTakeaways
}: VeTimeSaverCardProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  if (!timeSavedSummary && !documentMetadata && !sectionBreakdown && !executiveTakeaways) {
    return null;
  }

  const isDoc = Boolean(documentMetadata || (sectionBreakdown && sectionBreakdown.length > 0));

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Negative':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Mixed':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div id="ve-time-saver-card" className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-indigo-950/40">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with VE Feature Branding & Time Saved Metric */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>VE Feature</span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Video & Document Express Time-Saver
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            {isDoc ? (
              <FileText className="w-7 h-7 text-indigo-400 shrink-0" />
            ) : (
              <Video className="w-7 h-7 text-blue-400 shrink-0" />
            )}
            <span className="truncate">
              {documentMetadata?.file_name || videoMetadata?.title || 'Executive Time-Saver Synthesis'}
            </span>
          </h3>
        </div>

        {/* Time Saved Hero Metric */}
        {timeSavedSummary?.estimated_time_saved && (
          <div className="shrink-0 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3.5 shadow-lg shadow-emerald-950/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Productivity Gain
              </div>
              <div className="text-lg font-black text-white">
                {timeSavedSummary.estimated_time_saved}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Original: {timeSavedSummary.original_duration_or_length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video URL Link if present */}
      {videoMetadata?.video_url && (
        <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <Video className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-semibold text-slate-400">Analyzed Video Link:</span>
            <span className="font-mono text-blue-300 truncate">{videoMetadata.video_url}</span>
          </div>
          <a
            href={videoMetadata.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 ml-2 px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Executive Digest */}
      {timeSavedSummary?.executive_digest && (
        <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-indigo-500/20 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>60-Second Executive Digest (No need to read/watch all)</span>
          </div>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
            {timeSavedSummary.executive_digest}
          </p>
        </div>
      )}

      {/* Executive Actionable Takeaways */}
      {executiveTakeaways && executiveTakeaways.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>Core Actionable Takeaways & Decisions</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {executiveTakeaways.map((takeaway, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-colors flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  {idx + 1}
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {takeaway}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section-by-Section Cross-Page Breakdown for Large PDFs & Docs */}
      {sectionBreakdown && sectionBreakdown.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <Layers className="w-4 h-4" />
              <span>Multi-Page Section Synthesis (Replaces Page-By-Page Reading)</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {sectionBreakdown.length} Structural Sections Synthesized
            </span>
          </div>

          <div className="space-y-3">
            {sectionBreakdown.map((sec, idx) => {
              const isExpanded = expandedSection === idx;
              const badgeClass = getSentimentBadge(sec.sentiment);
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : idx)}
                    className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-slate-900/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                            {sec.time_or_page}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                            {sec.sentiment}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">
                          {sec.section_title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline text-xs font-semibold text-slate-400">
                        {sec.emotional_tone}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-900 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/30">
                      <p className="font-medium">{sec.summary}</p>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="font-semibold text-indigo-400">Dominant Tone:</span>
                        <span>{sec.emotional_tone}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
