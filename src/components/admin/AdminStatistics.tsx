import React, { useState, useEffect } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { AdminStats } from "../../types";
import { adminService } from "../../services/adminService";
import { AdminCharts } from "./AdminCharts";
import { AdminChartSkeleton } from "./AdminSkeleton";

export function AdminStatistics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [analysesOverTime, setAnalysesOverTime] = useState<Array<{ date: string; count: number }>>([]);
  const [sentimentData, setSentimentData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [emotionData, setEmotionData] = useState<Array<{ name: string; count: number; color?: string }>>([]);
  const [inputTypeData, setInputTypeData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [userGrowthData, setUserGrowthData] = useState<Array<{ date: string; users: number }>>([]);
  const [reportGenData, setReportGenData] = useState<Array<{ date: string; reports: number }>>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminStats, analyses, reports, users] = await Promise.all([
        adminService.getAdminStatistics(),
        adminService.getAnalyses(),
        adminService.getReports(),
        adminService.getUsers()
      ]);

      setStats(adminStats);

      // 1. Analyses Over Time (group real analyses by date)
      const dateMap: Record<string, number> = {};
      const last7Days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dateMap[key] = 0;
        last7Days.push(key);
      }

      analyses.forEach(a => {
        const key = new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (dateMap[key] !== undefined) {
          dateMap[key]++;
        }
      });

      const overTime = last7Days.map(date => ({
        date,
        count: dateMap[date] || 0
      }));
      setAnalysesOverTime(overTime);

      // 2. Sentiment Distribution
      setSentimentData([
        { name: "Positive", value: adminStats.sentimentDistribution.positive, color: "#10b981" },
        { name: "Negative", value: adminStats.sentimentDistribution.negative, color: "#f43f5e" },
        { name: "Neutral", value: adminStats.sentimentDistribution.neutral, color: "#3b82f6" },
        { name: "Mixed", value: adminStats.sentimentDistribution.mixed, color: "#f59e0b" },
      ]);

      // 3. Emotion Distribution (from real analyses)
      const emotionCounts: Record<string, number> = {};
      analyses.forEach(a => {
        const em = a.dominantEmotion || "Neutral";
        emotionCounts[em] = (emotionCounts[em] || 0) + 1;
      });

      const emotionColors: Record<string, string> = {
        Joy: "#10b981",
        Trust: "#06b6d4",
        Fear: "#8b5cf6",
        Surprise: "#f59e0b",
        Sadness: "#3b82f6",
        Disgust: "#ec4899",
        Anger: "#f43f5e",
        Anticipation: "#14b8a6",
        Neutral: "#64748b"
      };

      const emotionArr = Object.entries(emotionCounts).map(([name, count]) => ({
        name,
        count,
        color: emotionColors[name] || "#3b82f6"
      }));
      setEmotionData(emotionArr);

      // 4. Input Type Distribution
      let textCount = 0;
      let imageCount = 0;
      let videoCount = 0;
      let mixedCount = 0;

      analyses.forEach(a => {
        if (!a.inputTypes || a.inputTypes.length === 0) {
          textCount++;
        } else if (a.inputTypes.length > 1) {
          mixedCount++;
        } else if (a.inputTypes[0] === "image") {
          imageCount++;
        } else if (a.inputTypes[0] === "video") {
          videoCount++;
        } else {
          textCount++;
        }
      });

      setInputTypeData([
        { name: "Text", value: textCount, color: "#3b82f6" },
        { name: "Image", value: imageCount, color: "#f59e0b" },
        { name: "Video", value: videoCount, color: "#f43f5e" },
        { name: "Mixed", value: mixedCount, color: "#a855f7" }
      ]);

      // 5. User Growth (based on registered dates of users)
      const userDateMap: Record<string, number> = {};
      last7Days.forEach(d => { userDateMap[d] = 0; });
      users.forEach(u => {
        const key = new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (userDateMap[key] !== undefined) {
          userDateMap[key]++;
        }
      });

      let cumulative = Math.max(users.length - 2, 1);
      const userGrowth = last7Days.map(date => {
        cumulative += (userDateMap[date] || 0);
        return {
          date,
          users: cumulative
        };
      });
      setUserGrowthData(userGrowth);

      // 6. Report Generation
      const reportDateMap: Record<string, number> = {};
      last7Days.forEach(d => { reportDateMap[d] = 0; });
      reports.forEach(r => {
        const key = new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (reportDateMap[key] !== undefined) {
          reportDateMap[key]++;
        }
      });

      const reportGen = last7Days.map(date => ({
        date,
        reports: reportDateMap[date] || 0
      }));
      setReportGenData(reportGen);

    } catch (err) {
      console.error("Failed to load statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            📊 Platform Statistics & Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time visual telemetry derived strictly from platform database records.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <AdminChartSkeleton />
          <AdminChartSkeleton />
        </div>
      ) : (
        <AdminCharts
          analysesOverTime={analysesOverTime}
          sentimentData={sentimentData}
          emotionData={emotionData}
          inputTypeData={inputTypeData}
          userGrowthData={userGrowthData}
          reportGenerationData={reportGenData}
        />
      )}
    </div>
  );
}
