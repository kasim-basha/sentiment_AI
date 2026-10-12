import React, { useState, useEffect, useCallback } from "react";
import {
  MoodTrackingSummary,
  SentimentTimelineItem,
  SentimentTrendPoint,
  EmotionTimelineData
} from "../../types";
import { moodTrackingService } from "../../services/moodTrackingService";
import {
  Smile,
  Heart,
  Activity,
  Sparkles,
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  ExternalLink,
  Layers,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from "recharts";

interface MoodTrackingViewProps {
  onViewAnalysis?: (id: string) => void;
}

const EMOTION_COLORS: Record<string, string> = {
  Happiness: "#10b981", // emerald
  Joy: "#06b6d4",       // cyan
  Excitement: "#3b82f6",// blue
  Calm: "#6366f1",      // indigo
  Gratitude: "#8b5cf6", // violet
  Surprise: "#ec4899",  // pink
  Confidence: "#14b8a6",// teal
  Sadness: "#64748b",   // slate
  Anger: "#ef4444",     // red
  Frustration: "#f97316",// orange
  Fear: "#a855f7",      // purple
  Confusion: "#eab308", // yellow
  Neutral: "#94a3b8"
};

export const MoodTrackingView: React.FC<MoodTrackingViewProps> = ({ onViewAnalysis }) => {
  const [dateRange, setDateRange] = useState<string>("last30");
  const [summary, setSummary] = useState<MoodTrackingSummary | null>(null);
  const [trendPoints, setTrendPoints] = useState<SentimentTrendPoint[]>([]);
  const [emotionData, setEmotionData] = useState<EmotionTimelineData | null>(null);
  const [timeline, setTimeline] = useState<SentimentTimelineItem[]>([]);
  const [totalTimeline, setTotalTimeline] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [summaryRes, trendRes, emoRes, timelineRes] = await Promise.all([
        moodTrackingService.getSummary({ dateRange }),
        moodTrackingService.getSentimentTrend({ dateRange }),
        moodTrackingService.getEmotionTimeline({ dateRange }),
        moodTrackingService.getTimeline({
          dateRange,
          sentiment: sentimentFilter,
          emotion: emotionFilter,
          page: currentPage,
          limit: 10
        })
      ]);

      setSummary(summaryRes);
      setTrendPoints(trendRes.points);
      setEmotionData(emoRes);
      setTimeline(timelineRes.timeline);
      setTotalTimeline(timelineRes.total);
      setTotalPages(timelineRes.totalPages || 1);
    } catch (err) {
      console.error("Failed to load mood tracking data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, sentimentFilter, emotionFilter, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCSV = () => {
    if (!summary) return;
    moodTrackingService.exportCSV(summary, timeline);
    setExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    if (!summary) return;
    moodTrackingService.exportPDF(summary, timeline);
    setExportMenuOpen(false);
  };

  const formatChartDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Top Controls: Timeframe selector & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Timeframe:</span>
          </span>
          {[
            { id: "last7", label: "7 Days" },
            { id: "last30", label: "30 Days" },
            { id: "last90", label: "90 Days" },
            { id: "last6months", label: "6 Months" },
            { id: "lastYear", label: "1 Year" },
            { id: "all", label: "All History" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                setDateRange(t.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                dateRange === t.id
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Export & Refresh */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
            title="Refresh Tracking Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Report</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 py-1.5 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={handleExportPDF}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-white cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Download PDF Report</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-white cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Download CSV Raw Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Recorded</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {summary.totalAnalyses}
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Across {summary.activeTrackingDays} active days
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Dominant Sentiment</span>
              <Smile className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
                {summary.mostCommonSentiment}
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">
                {summary.sentimentDistribution.Positive} Positive / {summary.sentimentDistribution.Neutral} Neutral
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Top Emotion Signal</span>
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-400 tracking-tight">
                {summary.mostCommonEmotion}
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Most frequent signal
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Confidence</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-400 tracking-tight">
                {summary.averageConfidence}%
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">
                High precision index
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Cadence</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">
                {summary.analysisFrequency}
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Analyses / week
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sentiment Trend Over Time */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Sentiment Pattern Over Time</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency distribution of recorded sentiments per analysis day
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {trendPoints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendPoints}>
                  <defs>
                    <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tickFormatter={formatChartDate} stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={formatChartDate}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Area type="monotone" dataKey="positive" name="Positive" stroke="#10b981" fillOpacity={1} fill="url(#colorPositive)" />
                  <Area type="monotone" dataKey="neutral" name="Neutral" stroke="#6366f1" fillOpacity={1} fill="url(#colorNeutral)" />
                  <Area type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" fillOpacity={1} fill="url(#colorNegative)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No sentiment data recorded in this period.
              </div>
            )}
          </div>
        </div>

        {/* Emotion Signals Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Emotion Signals Breakdown</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency of detected emotion cues across your analyses
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {emotionData && emotionData.detectedEmotions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionData.detectedEmotions.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12 }}
                    formatter={(val: any) => [`${val} occurrences`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {emotionData.detectedEmotions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.name] || "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No emotion signals detected in this period.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Chronological Timeline Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">

        {/* Timeline Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Sentiment & Emotion Timeline</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of verified multimodal analyses with detected sentiment and emotion markers
            </p>
          </div>

          {/* Sentiment & Emotion Dropdown Filters */}
          <div className="flex items-center gap-2.5">
            <select
              value={sentimentFilter}
              onChange={e => {
                setSentimentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
              <option value="mixed">Mixed</option>
            </select>

            <select
              value={emotionFilter}
              onChange={e => {
                setEmotionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Emotions</option>
              {emotionData?.detectedEmotions.map(e => (
                <option key={e.name} value={e.name}>{e.name} ({e.count})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline Items List */}
        <div className="mt-5 space-y-3">
          {timeline.length > 0 ? (
            timeline.map(item => {
              const sentLower = (item.sentiment || "").toLowerCase();
              const sentBadgeColor =
                sentLower === "positive" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                sentLower === "negative" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                sentLower === "mixed" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                "bg-blue-500/10 text-blue-400 border-blue-500/30";

              const emoColor = EMOTION_COLORS[item.dominantEmotion] || "#6366f1";

              return (
                <div
                  key={item.analysisId}
                  className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-400 font-mono">
                        {new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${sentBadgeColor}`}>
                        {item.sentiment} ({Math.round(item.sentimentScore * 100)}%)
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-white"
                        style={{ backgroundColor: `${emoColor}25`, border: `1px solid ${emoColor}50`, color: emoColor }}
                      >
                        {item.dominantEmotion} ({item.dominantEmotionIntensity})
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                        {item.modality}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {item.title}
                    </h4>

                    {item.secondaryEmotions && item.secondaryEmotions.length > 0 && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="text-slate-500">Secondary signals:</span>
                        <span>{item.secondaryEmotions.join(", ")}</span>
                      </p>
                    )}
                  </div>

                  {onViewAnalysis && (
                    <button
                      onClick={() => onViewAnalysis(item.analysisId)}
                      className="self-end sm:self-center inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1.5 px-3 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <span>View Analysis</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-xs text-slate-500 bg-slate-800/20 rounded-xl border border-slate-800">
              No matching timeline entries for current filters.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalTimeline} total records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Non-Diagnostic & Privacy Disclaimer */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-200">
            Private, Objective Analysis & Non-Diagnostic Notice
          </p>
          <p>
            All goals, sentiment trajectories, and emotion patterns are computed authoritatively from media files and text explicitly analyzed in your SentimentAI account. This data is private to you and is not shared publicly. SentimentAI is designed for communication, feedback, and productivity insights and does not provide clinical or mental-health diagnoses.
          </p>
        </div>
      </div>

    </div>
  );
};
