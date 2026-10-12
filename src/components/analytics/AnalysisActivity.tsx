import React from "react";
import { Calendar, CalendarCheck, Zap, Activity } from "lucide-react";
import { AnalysisActivityData } from "../../types";

interface AnalysisActivityProps {
  activity: AnalysisActivityData;
}

export const AnalysisActivity: React.FC<AnalysisActivityProps> = ({ activity }) => {
  const maxDayCount = Math.max(...activity.activityByDayOfWeek.map(d => d.count), 1);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" />
            Analysis Activity & Frequency
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {activity.totalActiveDays} Active Days
          </span>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Active Days
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {activity.totalActiveDays}
              </span>
              <span className="text-[11px] text-slate-400">
                ({activity.analysesPerActiveDay}/day)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Peak Day
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-cyan-600 dark:text-cyan-400 truncate">
                {activity.mostActiveDay?.dayName || "N/A"}
              </span>
              {activity.mostActiveDay && (
                <span className="text-[11px] text-slate-400">
                  ({activity.mostActiveDay.count}x)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Day of Week Bars */}
        <div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
            Activity by Day of Week
          </span>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {activity.activityByDayOfWeek.map((d) => {
              const heightPct = Math.max(Math.round((d.count / maxDayCount) * 100), 8);
              const isPeak = activity.mostActiveDay?.dayName === d.day && d.count > 0;

              return (
                <div key={d.day} className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {d.count}
                  </span>
                  <div className="w-full h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-end p-1 justify-center">
                    <div
                      className={`w-full rounded-md transition-all duration-500 ${
                        isPeak
                          ? "bg-cyan-500 shadow-sm shadow-cyan-500/30"
                          : d.count > 0
                            ? "bg-sky-400 dark:bg-sky-500"
                            : "bg-slate-200 dark:bg-slate-700/50"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
                    {d.day.substring(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
