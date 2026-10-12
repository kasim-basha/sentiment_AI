import React from "react";

export function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-6 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
              <div className="space-y-2">
                <div className="w-48 sm:w-64 h-5 bg-slate-800 rounded-md" />
                <div className="w-32 h-3 bg-slate-800/60 rounded-md" />
              </div>
            </div>
            <div className="w-24 h-4 bg-slate-800/60 rounded-md" />
          </div>

          <div className="flex gap-2 mb-4">
            <div className="w-20 h-6 bg-slate-800 rounded-full" />
            <div className="w-24 h-6 bg-slate-800 rounded-full" />
            <div className="w-28 h-6 bg-slate-800 rounded-full" />
          </div>

          <div className="w-full h-12 bg-slate-950/60 rounded-xl mb-4" />

          <div className="flex justify-between pt-3 border-t border-slate-800/60">
            <div className="flex gap-2">
              <div className="w-20 h-8 bg-slate-800 rounded-xl" />
              <div className="w-20 h-8 bg-slate-800 rounded-xl" />
            </div>
            <div className="w-16 h-8 bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
