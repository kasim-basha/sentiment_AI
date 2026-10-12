import React from 'react';
import { BookOpen, BrainCircuit } from 'lucide-react';

interface TextInsightCardProps {
  title: string;
  content: string;
  icon: 'meaning' | 'context';
}

export function TextInsightCard({ title, content, icon }: TextInsightCardProps) {
  const Icon = icon === 'meaning' ? BookOpen : BrainCircuit;
  const emoji = icon === 'meaning' ? '📖' : '🧠';

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-blue-400">
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">{emoji} {title}</h4>
      </div>
      <p className="text-base text-slate-300 leading-relaxed font-medium">{content}</p>
    </div>
  );
}
