import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StoredAnalysisRecord } from "../../services/firestoreService";

interface DailySentimentChartProps {
  data: StoredAnalysisRecord[];
}

export function DailySentimentChart({ data }: DailySentimentChartProps) {
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const dailyData: Record<string, { totalScore: number; count: number }> = {};

    data.forEach((record) => {
      if (!record || typeof record !== "object") {
        return;
      }

      const createdAt = typeof record.createdAt === "string" ? record.createdAt : "";
      const normalizedDate = createdAt.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
      const score = typeof record.score === "number" ? record.score : Number(record.score);

      if (!normalizedDate || Number.isNaN(score)) {
        return;
      }

      if (!dailyData[normalizedDate]) {
        dailyData[normalizedDate] = { totalScore: 0, count: 0 };
      }

      dailyData[normalizedDate].totalScore += score;
      dailyData[normalizedDate].count += 1;
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, { totalScore, count }]) => {
        const parsedDate = new Date(date);
        const safeLabel = Number.isNaN(parsedDate.getTime())
          ? date
          : parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        return {
          date: safeLabel,
          averageScore: Number((totalScore / count).toFixed(2)),
        };
      });
  }, [data]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Daily Average Sentiment (Past 7 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData.length > 0 ? chartData : [{ date: "No data", averageScore: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} domain={[-1, 1]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Line
              type="monotone"
              dataKey="averageScore"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
