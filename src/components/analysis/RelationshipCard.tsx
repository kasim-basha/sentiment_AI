import React from 'react';
import { Link2 } from 'lucide-react';

interface RelationshipCardProps {
  content?: string;
}

export function RelationshipCard({ content }: RelationshipCardProps) {
  if (!content) return null;

  const isPositive = content.toLowerCase().includes("support") || content.toLowerCase().includes("context");

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 ${isPositive ? 'bg-emerald-500/5' : 'bg-amber-500/5'} blur-3xl pointer-events-none group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-indigo-400">
          <Link2 className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">🔗 Multimodal Relationship</h4>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <p className="text-base text-slate-300 leading-relaxed font-medium">
            {content}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-center justify-center px-6 border-l border-slate-800/50">
          <span className="text-4xl">{isPositive ? '✅' : '⚠️'}</span>
          <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${isPositive ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isPositive ? 'Synced' : 'Conflict'}
          </span>
        </div>
      </div>
    </div>
  );
}
