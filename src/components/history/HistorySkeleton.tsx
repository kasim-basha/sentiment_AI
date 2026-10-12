import React from "react";

export function HistorySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800" />
              <div className="space-y-1.5">
                <div className="h-5 w-48 bg-slate-800 rounded-md" />
                <div className="h-3 w-28 bg-slate-800/60 rounded-md" />
              </div>
            </div>
            <div className="h-3 w-24 bg-slate-800 rounded-md" />
          </div>

          <div className="flex gap-2">
            <div className="h-6 w-20 bg-slate-800 rounded-full" />
            <div className="h-6 w-24 bg-slate-800 rounded-full" />
            <div className="h-6 w-28 bg-slate-800 rounded-full" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-800/80 rounded-md" />
            <div className="h-4 w-3/4 bg-slate-800/60 rounded-md" />
          </div>

          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
            <div className="h-8 w-28 bg-slate-800 rounded-xl" />
            <div className="h-8 w-16 bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
