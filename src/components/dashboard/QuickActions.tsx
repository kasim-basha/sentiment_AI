import { Brain, History, BarChart3, FileText, LineChart, Sparkles } from "lucide-react";
import { ViewState } from "../../types";

interface QuickActionsProps {
  onNavigate: (view: ViewState) => void;
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  const actions = [
    { name: "New Analysis", icon: Brain, color: "text-blue-400", view: 'my-analysis' as ViewState },
    { name: "Gemini AI Chatbot", icon: Sparkles, color: "text-cyan-400", view: 'chatbot' as ViewState },
    { name: "View History", icon: History, color: "text-slate-400", view: 'history' as ViewState },
    { name: "Advanced Analytics", icon: LineChart, color: "text-sky-400", view: 'analytics' as ViewState },
    { name: "View Reports", icon: FileText, color: "text-slate-400", view: 'reports' as ViewState },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
      <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.name}
            onClick={() => onNavigate(action.view)}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-left flex items-center gap-3 transition-all cursor-pointer group"
          >
            <div className={`w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
              <action.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{action.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
