import React from "react";
import { Layers } from "lucide-react";
import { InputTypeDistributionItem } from "../../types";

interface InputTypeDistributionProps {
  inputTypes: InputTypeDistributionItem[];
  total: number;
}

export const InputTypeDistribution: React.FC<InputTypeDistributionProps> = ({ inputTypes, total }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            Input Type & Modality
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {total} Total
          </span>
        </div>

        {total === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No input records available.
          </div>
        ) : (
          <div className="space-y-4">
            {inputTypes.map((item) => (
              <div key={item.type} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {item.count} {item.count === 1 ? "session" : "sessions"}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white min-w-[32px] text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color || "#10b981"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
