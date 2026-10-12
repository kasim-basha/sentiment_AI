import React, { useState, useEffect, useCallback } from "react";
import {
  AnalyticsFilterParams,
  AIInsightsResponse,
  AIInsightSnapshot,
  User,
  InsightType
} from "../../types";
import { aiInsightsService } from "../../services/aiInsightsService";
import { InsightCard } from "./InsightCard";
import { RecommendationCard } from "./RecommendationCard";
import { InsightFilterBar } from "./InsightFilterBar";
import { InsightsSnapshotsModal } from "./InsightsSnapshotsModal";
import {
  Sparkles,
  Bot,
  ShieldCheck,
  Layers,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  AlertCircle,
  Calendar,
  CheckCircle2,
  SlidersHorizontal,
  Bookmark
} from "lucide-react";

interface InsightsPageProps {
  user: User | null;
  onNavigate: (view: any) => void;
}

const DEFAULT_FILTERS: AnalyticsFilterParams = {
  dateRange: "last30",
  sentiment: "all",
  emotion: "all",
  inputType: "all",
  confidence: "all",
};

export const InsightsPage: React.FC<InsightsPageProps> = ({ user, onNavigate }) => {
  const [filters, setFilters] = useState<AnalyticsFilterParams>(DEFAULT_FILTERS);
  const [data, setData] = useState<AIInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [snapshotsModalOpen, setSnapshotsModalOpen] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<AIInsightSnapshot[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadInsights = useCallback(async (currentFilters: AnalyticsFilterParams, force: boolean = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await aiInsightsService.getInsights(currentFilters, force);
      setData(result);
    } catch (err: any) {
      console.error("Failed to load AI insights:", err);
      setError(err?.message || "Failed to load AI insights.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInsights(filters);
  }, [filters, loadInsights]);

  const handleFilterChange = (newFilters: Partial<AnalyticsFilterParams>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleRefresh = () => {
    loadInsights(filters, true);
    showToast("AI insights re-analyzed with the latest session data.");
  };

  const handleSaveSnapshot = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      const saved = await aiInsightsService.saveSnapshot(data);
      setSnapshots(prev => [saved, ...prev.filter(s => s.id !== saved.id)]);
      showToast("Insight snapshot successfully saved.");
    } catch (err) {
      console.error("Save snapshot error:", err);
      showToast("Error saving snapshot.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSnapshots = async () => {
    try {
      const list = await aiInsightsService.getSavedSnapshots();
      setSnapshots(list);
      setSnapshotsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch snapshots:", err);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      await aiInsightsService.deleteSnapshot(id);
      setSnapshots(prev => prev.filter(s => s.id !== id));
      showToast("Snapshot deleted.");
    } catch (err) {
      console.error("Delete snapshot error:", err);
    }
  };

  const handleSelectSnapshot = (snapshot: AIInsightSnapshot) => {
    setData({
      summary: snapshot.summary,
      totalAnalyses: snapshot.totalAnalyses,
      confidenceScore: snapshot.confidenceScore,
      isInsufficientData: snapshot.isInsufficientData,
      insights: snapshot.insights,
      recommendations: snapshot.recommendations,
      generatedAt: snapshot.createdAt,
      dateRange: snapshot.dateRange,
      filters: snapshot.filters,
      cached: true
    });
    showToast(`Loaded snapshot from ${new Date(snapshot.createdAt).toLocaleDateString()}`);
  };

  const handleExportPDF = () => {
    if (!data) return;
    aiInsightsService.exportToPDF(data, user?.name || user?.email || "User");
    showToast("PDF report generated and downloaded.");
  };

  const handleExportTXT = () => {
    if (!data) return;
    aiInsightsService.exportToText(data);
    showToast("Text report downloaded.");
  };

  // Filter insights based on active category tab & search query
  const filteredInsights = (data?.insights || []).filter(item => {
    if (activeTab !== "all" && item.type !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.observation.toLowerCase().includes(q) ||
        item.interpretation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 px-4 sm:px-6 lg:px-8 py-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Toast Notification Banner */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-slideUp">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                AI Insights & Recommendations
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Personalized intelligence, emotional nuance trends, and communication strategies strictly grounded in your actual analysis history.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/40">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
              100% Data Grounded
            </span>

            {data && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {data.totalAnalyses} sessions evaluated
              </span>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <InsightFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
          onSaveSnapshot={handleSaveSnapshot}
          onOpenSnapshots={handleOpenSnapshots}
          onExportPDF={handleExportPDF}
          onExportTXT={handleExportTXT}
          isRefreshing={isRefreshing}
          isSaving={isSaving}
          isCached={data?.cached}
        />

        {/* Loading Spinner State */}
        {isLoading && !data && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Generating Data-Grounded AI Insights...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Synthesizing sentiment trends, emotional signals, and modality interactions from your recorded sessions.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <div className="font-semibold">Unable to load insights</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Insufficient Data State */}
        {data && data.isInsufficientData && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="max-w-xl mx-auto text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200/60 dark:border-amber-800/40">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Baseline Data Required for AI Discovery
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {data.summary}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Why are multiple sessions needed?</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li>AI patterns require at least 2 sessions to calculate variance, trend velocity, and emotional trajectory.</li>
                  <li>Ensures all recommendations are strictly grounded in your actual communication behavior.</li>
                  <li>No simulated or fake statistics are ever fabricated.</li>
                </ul>
              </div>

              {/* Recommended Actions for New Users */}
              <div className="pt-2">
                <button
                  id="go-to-analysis-from-empty"
                  onClick={() => onNavigate("my-analysis")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md transition-colors"
                >
                  <span>Start a New Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Guidance Recommendations */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Recommended Next Steps
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.recommendations.map(rec => (
                      <RecommendationCard key={rec.id} recommendation={rec} onNavigate={onNavigate} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Insights & Recommendations Content */}
        {data && !data.isInsufficientData && (
          <>
            {/* Executive AI Synthesis Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-sm border border-white/10">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Executive AI Synthesis
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {(data.confidenceScore || "High").toUpperCase()} AI Precision
                    </span>
                  </div>

                  <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
                    "{data.summary}"
                  </p>

                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>Generated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>Based on {data.totalAnalyses} analyzed records</span>
                    <span>•</span>
                    <span>Filtered by {filters.dateRange}</span>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2.5 shrink-0">
                  <button
                    onClick={handleExportPDF}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-md transition-colors"
                  >
                    Export AI Briefing (PDF)
                  </button>
                  <button
                    onClick={() => onNavigate("analytics")}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    View Analytics Charts
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Tab Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {[
                  { id: "all", label: "All Insights", count: data.insights?.length || 0 },
                  { id: "sentiment", label: "Sentiment", count: data.insights?.filter(i => i.type === "sentiment").length || 0 },
                  { id: "trend", label: "Trends", count: data.insights?.filter(i => i.type === "trend").length || 0 },
                  { id: "emotion", label: "Emotions", count: data.insights?.filter(i => i.type === "emotion").length || 0 },
                  { id: "multimodal", label: "Multimodal", count: data.insights?.filter(i => i.type === "multimodal").length || 0 },
                  { id: "confidence", label: "Certainty", count: data.insights?.filter(i => i.type === "confidence").length || 0 },
                  { id: "activity", label: "Cadence", count: data.insights?.filter(i => i.type === "activity").length || 0 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    id={`insights-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? "bg-primary-600 text-white shadow-sm"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search Within Insights */}
              <div className="relative w-full sm:w-64 shrink-0">
                <input
                  type="text"
                  id="insights-search-input"
                  placeholder="Filter insights by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Insights Section Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Discovered Sentiment Patterns & Nuances</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({filteredInsights.length} {filteredInsights.length === 1 ? "insight" : "insights"})
                  </span>
                </h2>
              </div>

              {/* Insights Card Grid */}
              {filteredInsights.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
                  No insights match the selected filter tab or search keyword.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInsights.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              )}
            </div>

            {/* Personalized Action Recommendations Section */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span>Personalized Action Recommendations</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Practical suggestions calculated directly from your communication history to enhance emotional clarity.
                  </p>
                </div>
              </div>

              {/* Recommendations Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data.recommendations || []).map(rec => (
                  <RecommendationCard key={rec.id} recommendation={rec} onNavigate={onNavigate} />
                ))}
              </div>
            </div>

            {/* Ethical, Non-Diagnostic & Supportive Intelligence Disclaimer Card */}
            <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Non-Diagnostic Supportive Intelligence Notice
                </div>
                <p className="leading-relaxed">
                  SentimentAI insights and recommendations are designed to foster self-awareness, improve interpersonal communication clarity, and highlight linguistic patterns. They do not constitute medical, psychological, or psychiatric diagnosis or therapeutic treatment.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Snapshots History Modal */}
        <InsightsSnapshotsModal
          isOpen={snapshotsModalOpen}
          onClose={() => setSnapshotsModalOpen(false)}
          snapshots={snapshots}
          onSelectSnapshot={handleSelectSnapshot}
          onDeleteSnapshot={handleDeleteSnapshot}
        />

      </div>
    </div>
  );
};
