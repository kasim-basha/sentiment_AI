import React from 'react';
import { Eye, Volume2 } from 'lucide-react';

interface ObservationsCardProps {
  visual?: string;
  audio?: string;
}

export function ObservationsCard({ visual, audio }: ObservationsCardProps) {
  if (!visual && !audio) return null;

  return (
    <div className="space-y-8">
      {visual && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">👁️ Visual Observations</h4>
          </div>
          <p className="text-base text-slate-300 leading-relaxed font-medium">{visual}</p>
          <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Note: Visual data is based on physical observations only.</p>
        </div>
      )}

      {audio && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-violet-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">🎙️ Speech / Audio Context</h4>
          </div>
          <p className="text-base text-slate-300 leading-relaxed font-medium">{audio}</p>
        </div>
      )}
    </div>
  );
}
