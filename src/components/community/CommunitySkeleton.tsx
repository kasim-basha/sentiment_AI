import React from "react";

export function CommunitySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading community posts">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 animate-pulse space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800" />
            <div className="space-y-2">
              <div className="w-32 h-3.5 bg-slate-800 rounded-md" />
              <div className="w-20 h-2.5 bg-slate-800/80 rounded-md" />
            </div>
          </div>

          <div className="w-3/4 h-5 bg-slate-800 rounded-md" />

          <div className="space-y-2">
            <div className="w-full h-3.5 bg-slate-800/60 rounded" />
            <div className="w-5/6 h-3.5 bg-slate-800/60 rounded" />
          </div>

          <div className="h-24 bg-slate-950/60 border border-slate-800/60 rounded-xl" />

          <div className="flex items-center gap-4 pt-3 border-t border-slate-800/60">
            <div className="w-14 h-7 bg-slate-800/60 rounded-lg" />
            <div className="w-14 h-7 bg-slate-800/60 rounded-lg" />
            <div className="w-14 h-7 bg-slate-800/60 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
