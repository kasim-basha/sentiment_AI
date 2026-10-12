import { Plus } from "lucide-react";
import { ViewState } from "../../types";

interface WelcomeSectionProps {
  userName: string;
  onNavigate: (view: ViewState) => void;
}

export function WelcomeSection({ userName, onNavigate }: WelcomeSectionProps) {
  return (
    <section className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Welcome back, {userName}! 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm sm:text-base">
          Analyze your content and discover what it really means.
        </p>
      </div>

      <button
        onClick={() => onNavigate('my-analysis')}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer w-full sm:w-auto"
      >
        <Plus className="w-4 h-4" />
        + Start New Analysis
      </button>
    </section>
  );
}
