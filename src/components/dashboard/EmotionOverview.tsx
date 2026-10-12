import { EmotionData } from "../../types";

interface EmotionOverviewProps {
  data: EmotionData[];
}

export function EmotionOverview({ data }: EmotionOverviewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-full hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Emotion Overview</h3>
        <button className="text-xs text-slate-500 hover:text-white transition-colors cursor-pointer">
          View Trends
        </button>
      </div>

      <div className="space-y-5 flex-1">
        {data.map((item) => (
          <div key={item.emotion} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-slate-300">{item.emotion}</span>
              <span className="text-slate-500">{item.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">Top Emotion</p>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: data[0].color }}
          >
            <span className="text-lg">✨</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{data[0].emotion}</p>
            <p className="text-xs text-slate-500">Highest recorded frequency</p>
          </div>
        </div>
      </div>
    </div>
  );
}
