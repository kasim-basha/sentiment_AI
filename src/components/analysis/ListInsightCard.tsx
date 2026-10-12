import React from 'react';
import { Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ListInsightCardProps {
  title: string;
  items: string[];
  type: 'insights' | 'positive' | 'concerns';
}

export function ListInsightCard({ title, items, type }: ListInsightCardProps) {
  if (items.length === 0) return null;

  const config = {
    insights: {
      emoji: '💡',
      icon: Lightbulb,
      bgColor: 'bg-slate-900/40',
      borderColor: 'border-slate-800/60',
      iconColor: 'text-blue-400',
      textColor: 'text-slate-300/80',
      dotColor: 'text-blue-500'
    },
    positive: {
      emoji: '✅',
      icon: CheckCircle2,
      bgColor: 'bg-emerald-950/10',
      borderColor: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      textColor: 'text-emerald-300/80',
      dotColor: 'text-emerald-500'
    },
    concerns: {
      emoji: '⚠️',
      icon: AlertTriangle,
      bgColor: 'bg-rose-950/10',
      borderColor: 'border-rose-500/20',
      iconColor: 'text-rose-400',
      textColor: 'text-rose-300/80',
      dotColor: 'text-rose-500'
    }
  }[type];

  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-[2.5rem] p-8 h-full`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <h4 className={`text-sm font-bold uppercase tracking-widest ${config.iconColor}`}>{config.emoji} {title}</h4>
      </div>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className={`flex gap-3 text-sm font-medium ${config.textColor} leading-relaxed`}>
            <span className={`${config.dotColor} shrink-0 font-bold`}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
