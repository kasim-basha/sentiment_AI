import React from "react";
import { ShieldX, ArrowLeft } from "lucide-react";

interface AccessDeniedProps {
  onBackToDashboard: () => void;
}

export function AccessDenied({ onBackToDashboard }: AccessDeniedProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-5">
          <ShieldX className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight flex items-center justify-center gap-2">
          <span>🚫</span> Access Denied
        </h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          You do not have permission to access the Admin Dashboard. Only authenticated platform administrators are allowed into this area.
        </p>

        <button
          onClick={onBackToDashboard}
          className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
