import { DashboardStats, SentimentData, EmotionData, AnalysisRecord } from "../types";

export const dashboardStats: DashboardStats = {
  totalAnalyses: 0,
  positive: 0,
  negative: 0,
  neutral: 0,
  mixed: 0,
};

export const sentimentData: SentimentData[] = [
  { label: "Positive", value: 0, color: "#10b981" }, // emerald-500
  { label: "Negative", value: 0, color: "#f43f5e" }, // rose-500
  { label: "Neutral", value: 0, color: "#64748b" }, // slate-500
  { label: "Mixed", value: 0, color: "#8b5cf6" }, // violet-500
];

export const emotionData: EmotionData[] = [
  { emotion: "Optimism", percentage: 0, color: "#0ea5e9" }, // sky-500
  { emotion: "Confidence", percentage: 0, color: "#10b981" }, // emerald-500
  { emotion: "Curiosity", percentage: 0, color: "#6366f1" }, // indigo-500
  { emotion: "Caution", percentage: 0, color: "#f59e0b" }, // amber-500
  { emotion: "Concern", percentage: 0, color: "#f43f5e" }, // rose-500
];

export const recentAnalyses: AnalysisRecord[] = [];
