import React from "react";
import { Shield } from "lucide-react";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
}

export function AdminHeader({
  title = "Admin Dashboard",
  subtitle = "Monitor and manage the SentimentAI platform.",
  badge = "Enterprise Admin",
  children
}: AdminHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {badge}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          {title}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {subtitle}
        </p>
      </div>

      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </header>
  );
}
