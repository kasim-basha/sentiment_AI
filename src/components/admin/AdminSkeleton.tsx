import React from "react";

export function AdminCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 animate-pulse flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-800" />
            <div className="w-14 h-4 rounded bg-slate-800" />
          </div>
          <div className="space-y-2">
            <div className="w-24 h-7 rounded-lg bg-slate-800" />
            <div className="w-32 h-3.5 rounded bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl animate-pulse">
      <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="w-48 h-8 rounded-xl bg-slate-800" />
        <div className="w-32 h-8 rounded-xl bg-slate-800" />
      </div>
      <div className="divide-y divide-slate-800/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800/60 rounded w-1/2" />
              </div>
            </div>
            {Array.from({ length: cols - 2 }).map((_, c) => (
              <div key={c} className="hidden sm:block w-20 h-4 bg-slate-800/70 rounded" />
            ))}
            <div className="w-16 h-8 bg-slate-800 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminChartSkeleton() {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="w-40 h-6 bg-slate-800 rounded" />
        <div className="w-20 h-4 bg-slate-800/60 rounded" />
      </div>
      <div className="h-64 rounded-2xl bg-slate-950/60 border border-slate-800/50 flex items-end justify-between p-6 gap-2">
        {[40, 65, 30, 85, 55, 75, 45].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className="w-full bg-slate-800/80 rounded-t-lg"
          />
        ))}
      </div>
    </div>
  );
}
