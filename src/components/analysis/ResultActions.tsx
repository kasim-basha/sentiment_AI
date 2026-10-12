import React from 'react';
import { Home, RotateCcw, Clipboard, History, BarChart3, Save, FileCheck, Share2, Brain } from 'lucide-react';
import { ViewState } from '../../types';

interface ResultActionsProps {
  onNavigate: (view: ViewState) => void;
  onNewAnalysis: () => void;
  onCopy: () => void;
  onSaveAnalysis?: () => void;
  onViewSavedFile?: () => void;
  onShare?: () => void;
  onOpenClarityAssistant?: () => void;
  isSaved?: boolean;
}

export function ResultActions({
  onNavigate,
  onNewAnalysis,
  onCopy,
  onSaveAnalysis,
  onViewSavedFile,
  onShare,
  onOpenClarityAssistant,
  isSaved = true
}: ResultActionsProps) {
  return (
    <div className="pt-12 border-t border-slate-800/50 flex flex-wrap justify-center gap-4">
      {onOpenClarityAssistant && (
        <button
          onClick={onOpenClarityAssistant}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-3 active:scale-95 ring-1 ring-blue-400/40"
          title="Ask SentimentAI Assistant to explain this analysis in simple language"
        >
          <Brain className="w-5 h-5 text-blue-200 animate-pulse" />
          <span>🧠 Ask AI for Clarity</span>
        </button>
      )}

      {onSaveAnalysis && (
        <button
          onClick={onSaveAnalysis}
          className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-xl shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-3 active:scale-95"
        >
          <Save className="w-5 h-5" />
          <span>Save Analysis</span>
        </button>
      )}

      {onShare && (
        <button
          onClick={onShare}
          className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-3 active:scale-95"
          title="Share to WhatsApp, Facebook, Instagram, YouTube, and more"
        >
          <Share2 className="w-5 h-5" />
          <span>Share Analysis</span>
        </button>
      )}

      {onViewSavedFile && (
        <button
          onClick={onViewSavedFile}
          className="px-8 py-4 rounded-2xl bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-600/20 transition-all font-bold text-sm cursor-pointer flex items-center justify-center gap-3"
          title="Inspect the saved analysis file in History"
        >
          <FileCheck className="w-5 h-5" />
          <span>📁 View Saved File</span>
        </button>
      )}

      <button
        onClick={() => onNavigate('history')}
        className="px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold text-sm cursor-pointer flex items-center justify-center gap-3"
      >
        <History className="w-5 h-5" />
        <span>🕐 View History</span>
      </button>

      <button
        onClick={() => onNavigate('analytics')}
        className="px-8 py-4 rounded-2xl bg-slate-900 border border-sky-500/30 text-sky-400 hover:text-white hover:bg-sky-600/20 transition-all font-bold text-sm cursor-pointer flex items-center justify-center gap-3"
      >
        <BarChart3 className="w-5 h-5" />
        <span>📊 View Analytics</span>
      </button>

      <button
        onClick={() => onNavigate('reports')}
        className="px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold text-sm cursor-pointer flex items-center justify-center gap-3"
      >
        <BarChart3 className="w-5 h-5" />
        <span>📄 View Reports</span>
      </button>

      <button
        onClick={onNewAnalysis}
        className="px-8 py-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:text-white hover:bg-blue-600 transition-all font-bold text-sm cursor-center flex items-center justify-center gap-3 cursor-pointer"
      >
        <RotateCcw className="w-5 h-5" />
        <span>🆕 New Analysis</span>
      </button>

      <button
        onClick={onCopy}
        className="px-8 py-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 transition-all font-bold text-sm cursor-center flex items-center justify-center gap-3 cursor-pointer"
      >
        <Clipboard className="w-5 h-5" />
        <span>📋 Copy Analysis</span>
      </button>

      <button
        onClick={() => onNavigate('dashboard')}
        className="px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold text-sm cursor-pointer flex items-center justify-center gap-3"
      >
        <Home className="w-5 h-5" />
        <span>🏠 Dashboard</span>
      </button>
    </div>
  );
}
