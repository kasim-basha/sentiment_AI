import React from "react";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { ConfidenceAnalyticsData } from "../../types";

interface ConfidenceAnalyticsProps {
  confidence: ConfidenceAnalyticsData;
  total: number;
}

export const ConfidenceAnalytics: React.FC<ConfidenceAnalyticsProps> = ({ confidence, total }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            AI Confidence Analytics
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {confidence.averageConfidencePct}% Avg
          </span>
        </div>

        {total === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No confidence ratings available.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Confidence Meter */}
            <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-teal-900 dark:text-teal-200">
                  Mean Model Certainty
                </span>
                <span className="font-bold text-teal-700 dark:text-teal-300 text-sm">
                  {confidence.averageConfidencePct}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-teal-100 dark:bg-teal-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${confidence.averageConfidencePct}%` }}
                />
              </div>
            </div>

            {/* High / Medium / Low tiers */}
            <div className="space-y-2.5">
              {/* High */}
              <div className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    High Confidence (&ge;80%)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {confidence.highCount} ({confidence.highPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${confidence.highPct}%` }} />
                </div>
              </div>

              {/* Medium */}
              <div className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    Medium Confidence (60-79%)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {confidence.mediumCount} ({confidence.mediumPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${confidence.mediumPct}%` }} />
                </div>
              </div>

              {/* Low */}
              <div className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    Low Confidence (&lt;60%)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {confidence.lowCount} ({confidence.lowPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${confidence.lowPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
