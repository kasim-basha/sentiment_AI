import { useState, useEffect } from "react";
import { DashboardNavbar } from "./dashboard/DashboardNavbar";
import { WelcomeSection } from "./dashboard/WelcomeSection";
import { StatisticsCards } from "./dashboard/StatisticsCards";
import { SentimentOverview } from "./dashboard/SentimentOverview";
import { EmotionOverview } from "./dashboard/EmotionOverview";
import { DailySentimentChart } from "./dashboard/DailySentimentChart";
import { RecentAnalyses } from "./dashboard/RecentAnalyses";
import { QuickActions } from "./dashboard/QuickActions";
import { useToast } from "./common/ToastProvider";
import { User, ViewState } from "../types";
import {
  dashboardStats as initialDashboardStats,
  sentimentData as initialSentimentData,
  emotionData as initialEmotionData
} from "../data/dashboardData";
import { historyService } from "../services/historyService";
import { firestoreService, StoredAnalysisRecord } from "../services/firestoreService";
import { AlertCircle, RefreshCcw, Plus } from "lucide-react";
import { AnalysisRecord, DashboardStats, SentimentData, EmotionData } from "../types";

interface DashboardProps {
  user: User;
  onLogout: () => void;
  setView: (view: ViewState) => void;
  onViewAnalysis?: (id: string) => void;
}

export function Dashboard({ user, onLogout, setView, onViewAnalysis }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [recentRecords, setRecentRecords] = useState<AnalysisRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>(initialDashboardStats);
  const [sentimentChartData, setSentimentChartData] = useState<SentimentData[]>(initialSentimentData);
  const [emotionChartData, setEmotionChartData] = useState<EmotionData[]>(initialEmotionData);
  const [dailySentimentRecords, setDailySentimentRecords] = useState<StoredAnalysisRecord[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [records, historyStats, allAnalyses, dailyRecords] = await Promise.all([
          historyService.getRecentAnalysesForDashboard(4, user.id),
          historyService.getHistoryStatistics(user.id),
          historyService.getAnalyses(user.id),
          firestoreService.getUserAnalysesLastDays(user.id, 7)
        ]);

        if (isMounted) {
          setRecentRecords(records);
          setStats(historyStats);
          setDailySentimentRecords(dailyRecords);

          // Check for low sentiment
          const latestRecord = dailyRecords[dailyRecords.length - 1];
          if (latestRecord && latestRecord.score < -0.3) {
            addToast(`Your average sentiment score is low (${latestRecord.score.toFixed(2)}). Consider taking a break.`, "warning");
          }

          if (historyStats.totalAnalyses > 0) {
            const total = historyStats.totalAnalyses;
            setSentimentChartData([
              { label: "Positive", value: Math.round((historyStats.positive / total) * 100), color: "#10b981" },
              { label: "Negative", value: Math.round((historyStats.negative / total) * 100), color: "#f43f5e" },
              { label: "Neutral", value: Math.round((historyStats.neutral / total) * 100), color: "#64748b" },
              { label: "Mixed", value: Math.round((historyStats.mixed / total) * 100), color: "#8b5cf6" },
            ]);

            // Count emotions from all user analyses
            const emotionCounts: Record<string, number> = {};
            for (const item of allAnalyses) {
              const emo = item.dominantEmotion || "Curiosity";
              emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
            }

            const colors = ["#0ea5e9", "#10b981", "#6366f1", "#f59e0b", "#f43f5e"];
            const emotionList: EmotionData[] = Object.entries(emotionCounts)
              .slice(0, 5)
              .map(([name, count], idx) => ({
                emotion: name,
                percentage: Math.round((count / total) * 100),
                color: colors[idx % colors.length]
              }));

            if (emotionList.length > 0) {
              setEmotionChartData(emotionList);
            }
          } else {
            setSentimentChartData(initialSentimentData);
            setEmotionChartData(initialEmotionData);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (isMounted) {
          setRecentRecords([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [user.id]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
        <DashboardNavbar
          user={user}
          onLogout={onLogout}
          onNavigate={setView}
          currentView="dashboard"
        />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-slate-900 rounded-2xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-48 bg-slate-900 rounded-2xl"></div>
              <div className="h-48 bg-slate-900 rounded-2xl"></div>
              <div className="h-48 bg-slate-900 rounded-2xl"></div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="h-24 bg-slate-900 rounded-2xl"></div>
              <div className="h-24 bg-slate-900 rounded-2xl"></div>
              <div className="h-24 bg-slate-900 rounded-2xl"></div>
              <div className="h-24 bg-slate-900 rounded-2xl"></div>
              <div className="h-24 bg-slate-900 rounded-2xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 text-rose-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Unable to load your dashboard</h2>
        <p className="text-slate-400 mb-8 max-w-sm">
          Something went wrong while fetching your analysis data. Please try again.
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
        <DashboardNavbar
          user={user}
          onLogout={onLogout}
          onNavigate={setView}
          currentView="dashboard"
        />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
            <Plus className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No analyses yet</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            Start your first analysis to see your sentiment and emotion insights here.
          </p>
          <button className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer">
            Start New Analysis
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        onNavigate={setView}
        currentView="dashboard"
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <WelcomeSection
          userName={user.name.split(' ')[0]}
          onNavigate={setView}
        />

        <StatisticsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SentimentOverview data={sentimentChartData} />
              <EmotionOverview data={emotionChartData} />
            </div>
            <DailySentimentChart data={dailySentimentRecords} />
            <RecentAnalyses
              records={recentRecords}
              onViewAll={() => setView('history')}
              onViewAnalysis={onViewAnalysis}
            />
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4">
            <QuickActions onNavigate={setView} />

            {/* Future Additions: Help section, etc. */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/10">
              <h4 className="font-bold mb-2">Pro Tip</h4>
              <p className="text-sm text-blue-50/80 leading-relaxed mb-4">
                Multimodal analysis allows you to cross-reference text with visual cues for 98% accuracy.
              </p>
              <button className="text-xs font-bold px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors cursor-pointer">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
