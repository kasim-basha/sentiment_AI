/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: "active" | "suspended" | "inactive";
  avatar?: string;
}

export interface AuthResponse {
  status: "success" | "error";
  message: string;
  user?: User;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export type ViewState = "login" | "register" | "dashboard" | "my-analysis" | "history" | "reports" | "analysis-detail" | "report-detail" | "profile" | "settings" | "admin" | "community" | "friends" | "search" | "analytics" | "insights" | "goals" | "chatbot";

export interface UserPrivacySettings {
  saveAnalysisHistory: boolean;
  autoDeleteHistory: "never" | "after_use" | "after_24h";
  saveReports: boolean;
  personalizedExperience: boolean;
  saveClarityConversations: boolean;
  saveGoalTracking: boolean;
  saveSearchHistory: boolean;
  communityVisibility: "private" | "community" | "public";
  allowAnalytics?: boolean;
  dataRetentionDays?: number;
  profilePublic?: boolean;
}

export interface UserSettings {
  userId: string;
  appearance: {
    theme: "light" | "dark" | "ocean" | "forest" | "rose" | "amethyst";
    nightLight: boolean;
  };
  notifications: {
    analysisComplete: boolean;
    reportGenerated: boolean;
    voiceAssistant: boolean;
    system: boolean;
  };
  language: string;
  privacy: UserPrivacySettings;
}

export interface UserActiveSession {
  sessionId: string;
  userId: string;
  deviceType: "desktop" | "mobile" | "tablet";
  deviceName: string;
  browser: string;
  os?: string;
  ipAddress: string;
  location?: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrentSession: boolean;
}

export interface SecurityActivityEvent {
  id: string;
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface UserDataExportSummary {
  exportedAt: string;
  userId: string;
  user: {
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  };
  profile?: any;
  settings?: UserSettings;
  analysisCount: number;
  reportCount: number;
  goalCount: number;
  clarityConversationCount: number;
  searchHistoryCount: number;
  communityPostCount: number;
  analyses: any[];
  reports: any[];
  goals: any[];
  clarityConversations: any[];
  searchHistory: any[];
  communityPosts: any[];
  notifications: any[];
}

export interface LoginSession {
  id: string;
  deviceType: "desktop" | "mobile" | "tablet";
  deviceName: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrentSession: boolean;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  role?: "user" | "admin";
  phone?: string;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  profilePicture?: string;
  accountStatus: "active" | "inactive" | "suspended";
  createdAt: string;
  lastLoginAt: string;
  recentSessions?: LoginSession[];
}

export interface ProfileStats {
  totalAnalyses: number;
  totalReports: number;
  voiceSessions?: number;
  lastAnalysis?: string;
}


export interface MultimodalAnalysisResult {
  analysis_id: string;
  input_summary: {
    text_count: number;
    image_count: number;
    video_count: number;
    total_files: number;
    has_direct_text: boolean;
  };
  overall_sentiment: {
    label: "Positive" | "Negative" | "Neutral" | "Mixed";
    intensity: string;
    confidence: "Low" | "Medium" | "High";
    score: number;
  };
  emotions: {
    dominant: {
      name: string;
      intensity: string;
      reason: string;
    };
    secondary: Array<{
      name: string;
      intensity: string;
      reason: string;
    }>;
  };
  meaning: string;
  emotional_context: string;
  visual_observations?: string;
  audio_context?: string;
  multimodal_relationship?: string;
  key_insights: string[];
  positive_signals: string[];
  concerns: string[];
  tts_summary: string;
  language?: string;
  created_at: number;
  exact_file_contents?: string;
  file_content_items?: string[];
  sentiment_coaching?: {
    current_tone_evaluation: string;
    target_goal: string;
    actionable_steps: string[];
    suggested_positive_rewrite?: string;
    positive_reframing_tips: string[];
  };
  video_metadata?: {
    duration_hours?: number;
    title?: string;
    total_segments?: number;
    video_url?: string;
    viewing_time_saved?: string;
  };
  document_metadata?: {
    file_name?: string;
    page_count?: number;
    file_type?: string;
    reading_time_saved?: string;
  };
  time_saved_summary?: {
    estimated_time_saved: string;
    executive_digest: string;
    original_duration_or_length: string;
  };
  section_breakdown?: Array<{
    section_title: string;
    time_or_page: string;
    sentiment: "Positive" | "Negative" | "Neutral" | "Mixed";
    summary: string;
    emotional_tone: string;
  }>;
  executive_takeaways?: string[];
  timeline_breakdown?: Array<{
    timestamp: string;
    label: string;
    sentiment: "Positive" | "Negative" | "Neutral" | "Mixed";
    score: number;
    dominant_emotion: string;
    key_event: string;
  }>;
  turning_points?: Array<{
    timestamp: string;
    event: string;
    impact: string;
  }>;
}

export interface AnalysisHistoryItem {
  id: string;
  userId: string;
  inputType: "multimodal";
  inputs: {
    text?: string;
    files: Array<{
      name: string;
      type: "text" | "image" | "video";
      size: number;
    }>;
  };
  result: MultimodalAnalysisResult;
  timestamp: number;
}

export interface DashboardStats {
  totalAnalyses: number;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

export interface SentimentData {
  label: string;
  value: number;
  color: string;
}

export interface EmotionData {
  emotion: string;
  percentage: number;
  color: string;
}

export interface AnalysisRecord {
  id: string;
  title: string;
  type: "Text" | "Image" | "Video" | "Mixed";
  sentiment: "Positive" | "Negative" | "Neutral" | "Mixed";
  date: string;
}

export type HistoryInputType = "text" | "image" | "video";
export type OverallSentimentLabel = "Positive" | "Negative" | "Neutral" | "Mixed";
export type AnalysisStatus = "completed" | "failed" | "processing";

export interface HistoryInputSummary {
  textCount: number;
  imageCount: number;
  videoCount: number;
  totalFiles: number;
}

export interface HistoryOverallSentiment {
  label: OverallSentimentLabel;
  score: number;
  confidence: "Low" | "Medium" | "High";
}

export interface HistoryRecord {
  analysisId: string;
  userId: string;
  title: string;
  createdAt: string; // ISO 8601 string
  status: AnalysisStatus;
  inputSummary: HistoryInputSummary;
  inputTypes: HistoryInputType[];
  fileNames?: string[];
  overallSentiment: HistoryOverallSentiment;
  dominantEmotion: string;
  summary: string;
  resultReference?: string;
  fullResult?: MultimodalAnalysisResult;
}

export interface HistoryStatistics {
  totalAnalyses: number;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

export interface HistoryFilters {
  inputType: "all" | "text" | "image" | "video" | "mixed";
  sentiment: "all" | "Positive" | "Negative" | "Neutral" | "Mixed";
  date: "all" | "today" | "last7" | "last30" | "custom";
  customStartDate?: string;
  customEndDate?: string;
  status: "all" | "completed" | "failed" | "processing";
}

export type HistorySortOption = "newest" | "oldest" | "most_positive" | "most_negative";

export type ReportSortOption = "newest" | "oldest" | "most_positive" | "most_negative";

export interface ReportInputSummary {
  textCount: number;
  imageCount: number;
  videoCount: number;
  totalFiles: number;
}

export interface ReportOverallSentiment {
  label: OverallSentimentLabel;
  score: number;
  confidence: "Low" | "Medium" | "High";
}

export interface ReportRecord {
  reportId: string;
  analysisId: string;
  userId: string;
  title: string;
  createdAt: string; // ISO 8601 string
  status?: AnalysisStatus;
  inputSummary: ReportInputSummary;
  inputTypes?: HistoryInputType[];
  fileNames?: string[];
  overallSentiment: ReportOverallSentiment;
  dominantEmotion: string;
  secondaryEmotions?: string[];
  summary: string;
  resultReference?: string;
  fullResult?: MultimodalAnalysisResult;
}

export interface ReportStatistics {
  totalReports: number;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

export interface ReportFilters {
  inputType: "all" | "text" | "image" | "video" | "mixed";
  sentiment: "all" | "Positive" | "Negative" | "Neutral" | "Mixed";
  format: "all" | "pdf" | "txt";
  date: "all" | "today" | "last7" | "last30" | "custom";
  customStartDate?: string;
  customEndDate?: string;
}

export interface AdminActivity {
  activityId: string;
  adminId: string;
  adminName: string;
  action: "USER_ROLE_CHANGED" | "USER_SUSPENDED" | "USER_ACTIVATED" | "REPORT_DELETED" | "ANALYSIS_DELETED";
  targetId: string;
  targetName: string;
  details?: string;
  createdAt: string;
}

export interface SystemStatus {
  app: "operational" | "degraded" | "down";
  database: "operational" | "degraded" | "down";
  aiService: "operational" | "degraded" | "down";
  storage: "operational" | "degraded" | "down";
}

export interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  totalReports: number;
  voiceSessions: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  growth: {
    usersToday: number;
    analysesToday: number;
    analysesThisWeek: number;
    reportsToday: number;
  };
}

// ==========================================
// Community & Social Module Types
// ==========================================

export type CommunityVisibility = "community" | "public" | "private";

export interface CommunitySharedAnalysis {
  analysisId: string;
  title: string;
  sentiment: "Positive" | "Negative" | "Neutral" | "Mixed";
  dominantEmotion: string;
  confidence: number;
  inputType: "text" | "image" | "video" | "mixed";
  meaningSummary?: string;
}

export interface CommunityFileAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  previewUrl?: string;
}

export type PostStatus = "published" | "draft" | "hidden";

export interface CommunityPost {
  postId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  title: string;
  content: string;
  fileAttachment?: CommunityFileAttachment;
  analysisId?: string;
  sharedAnalysis?: CommunitySharedAnalysis;
  visibility: "community" | "public";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  likeCount: number;
  commentCount: number;
  status: PostStatus;
}

export interface CommunityComment {
  commentId: string;
  postId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityLike {
  likeId: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export type ReportReason = "Spam" | "Harassment" | "Inappropriate Content" | "Misleading Content" | "Other";
export type ModerationStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface CommunityReport {
  reportId: string;
  postId: string;
  commentId?: string;
  reporterId: string;
  reporterName?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reason: ReportReason;
  details?: string;
  status: ModerationStatus;
  createdAt: string;
  contentSnippet?: string;
}

export type CommunityFeedFilter = "recent" | "popular" | "analyses" | "files" | "discussions";

// Step 16: Friends, Messages, Calls & Notifications Interfaces
export interface FriendUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  status?: string;
  isOnline?: boolean;
  relationshipStatus?: "none" | "friends" | "request_sent" | "request_received" | "blocked";
  requestId?: string;
  friendshipId?: string;
  friendsSince?: string;
}

export interface FriendRequestItem {
  _id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  createdAt: string;
  user?: FriendUser;
}

export interface ConversationItem {
  _id: string;
  type: "direct";
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  updatedAt: string;
  friend?: FriendUser;
}

export interface ChatMessageItem {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "system" | "image";
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export type CallStatus = "initiating" | "ringing" | "connected" | "ended" | "missed" | "rejected" | "busy";
export type CallType = "audio" | "video";

export interface CallSessionItem {
  _id: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  createdAt: string;
  caller?: FriendUser;
  receiver?: FriendUser;
  peerUser?: FriendUser;
}

export interface BlockedUserItem {
  _id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
  user?: FriendUser;
}

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "friend_accept"
  | "new_message"
  | "incoming_call"
  | "missed_call"
  | "analysis_complete"
  | "report_ready"
  | "post_like"
  | "post_comment"
  | "system";

export interface NotificationItem {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  body?: string;
  data?: Record<string, any>;
  read: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface UnreadCounts {
  friendRequests: number;
  unreadMessages: number;
  missedCalls: number;
  notifications: number;
  total: number;
}

// -------------------------------------------------------------
// STEP 18: GLOBAL SEARCH TYPES
// -------------------------------------------------------------

export type SearchCategory = "all" | "people" | "analyses" | "reports" | "community" | "friends";
export type SearchSortOption = "newest" | "oldest" | "relevant" | "popular";
export type SearchSentimentOption = "all" | "Positive" | "Negative" | "Neutral" | "Mixed";
export type SearchInputTypeOption = "all" | "text" | "image" | "video" | "multimodal";

export interface SearchUserResult {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: "self" | "blocked" | "friends" | "pending_sent" | "pending_received" | "none";
}

export interface SearchFriendResult {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: "active" | "suspended" | "inactive";
  friendshipId: string;
  friendedAt: string;
  conversationId?: string | null;
}

export interface SearchAnalysisResult {
  analysisId: string;
  title: string;
  inputType: "text" | "image" | "video" | "multimodal";
  sentiment: string;
  sentimentScore: number;
  dominantEmotion: string;
  dominantEmotionReason?: string;
  meaning: string;
  status: "completed" | "processing" | "failed";
  createdAt: string;
}

export interface SearchReportResult {
  reportId: string;
  analysisId: string;
  title: string;
  fileType: string;
  sentiment: string;
  summary: string;
  createdAt: string;
}

export interface SearchCommunityResult {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  privacy: "public" | "community" | "private";
  createdAt: string;
}

export interface SearchSuggestion {
  type: "user" | "analysis" | "community" | "history" | "friend";
  text: string;
  subtext?: string;
  id?: string;
}

export interface SearchHistoryItem {
  _id: string;
  userId: string;
  query: string;
  category?: string;
  createdAt: string;
}

export interface GlobalSearchResponse {
  success: boolean;
  category: SearchCategory;
  query?: string;
  total: number;
  page?: number;
  limit?: number;
  results?: Array<SearchUserResult | SearchFriendResult | SearchAnalysisResult | SearchReportResult | SearchCommunityResult>;
  groups?: {
    people: { results: SearchUserResult[]; total: number };
    friends: { results: SearchFriendResult[]; total: number };
    analyses: { results: SearchAnalysisResult[]; total: number };
    reports: { results: SearchReportResult[]; total: number };
    community: { results: SearchCommunityResult[]; total: number };
  };
}

// --- Step 19: GenAI Clarity Assistant Types ---

export type ClarityExplanationType = "simple" | "detailed" | "section" | "general";

export interface ClarityMessageReference {
  section: string;
  label: string;
}

export interface ClarityStructuredResponse {
  conversationId: string;
  messageId: string;
  answer: string;
  explanationType: ClarityExplanationType;
  references?: ClarityMessageReference[];
  confidenceNote?: string;
  disclaimer?: string;
}

export interface ClarityMessage {
  _id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  explanationType?: ClarityExplanationType;
  references?: ClarityMessageReference[];
  confidenceNote?: string;
  disclaimer?: string;
  structuredResponse?: ClarityStructuredResponse;
  createdAt: string;
}

export interface ClarityConversation {
  _id: string;
  userId: string;
  analysisId: string;
  title?: string;
  messages?: ClarityMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ClarityQuickExplainRequest {
  analysisId: string;
  mode?: ClarityExplanationType;
  section?: string;
  language?: string;
  question?: string;
}

export interface ClarityQuickExplainResponse {
  success: boolean;
  explanation: {
    answer: string;
    explanationType: ClarityExplanationType;
    references: ClarityMessageReference[];
    confidenceNote: string;
    disclaimer: string;
  };
}

// ============================================================
// ADVANCED ANALYTICS INTERFACES
// ============================================================

export type AnalyticsDateRangePreset = "last7" | "last30" | "last90" | "last6months" | "lastYear" | "custom";

export interface AnalyticsFilterParams {
  dateRange: AnalyticsDateRangePreset;
  customStartDate?: string;
  customEndDate?: string;
  sentiment?: "all" | "Positive" | "Negative" | "Neutral" | "Mixed";
  emotion?: string;
  inputType?: "all" | "text" | "image" | "video" | "multimodal";
  confidence?: "all" | "High" | "Medium" | "Low";
}

export interface AnalyticsOverviewStats {
  totalAnalyses: number;
  positiveCount: number;
  positivePct: number;
  neutralCount: number;
  neutralPct: number;
  negativeCount: number;
  negativePct: number;
  mixedCount: number;
  mixedPct: number;
  avgConfidenceScore: number;
  avgConfidenceLabel: "High" | "Medium" | "Low";
  avgSentimentScore: number;
  mostDetectedEmotion: {
    name: string;
    count: number;
    percentage: number;
  } | null;
  mostActiveDay: {
    dayName: string;
    dateFormatted?: string;
    count: number;
  } | null;
}

export interface SentimentTrendPoint {
  date: string;
  label?: string;
  total?: number;
  positive: number;
  neutral: number;
  negative: number;
  mixed?: number;
  avgScore?: number;
  averageScore?: number;
}

export interface EmotionDistributionItem {
  name: string;
  count: number;
  percentage: number;
  ranking: number;
  isDominant: boolean;
  color?: string;
}

export interface InputTypeDistributionItem {
  type: "text" | "image" | "video" | "multimodal";
  label: string;
  icon: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface ConfidenceAnalyticsData {
  highCount: number;
  highPct: number;
  mediumCount: number;
  mediumPct: number;
  lowCount: number;
  lowPct: number;
  averageConfidencePct: number;
}

export interface SentimentDistributionData {
  positive: { count: number; percentage: number };
  neutral: { count: number; percentage: number };
  negative: { count: number; percentage: number };
  mixed: { count: number; percentage: number };
}

export interface AnalysisActivityData {
  totalActiveDays: number;
  analysesPerActiveDay: number;
  mostActiveDay: { date: string; dayName: string; count: number } | null;
  leastActiveDay: { date: string; dayName: string; count: number } | null;
  activityByDayOfWeek: Array<{ day: string; count: number }>;
  timeline: Array<{ date: string; count: number }>;
}

export interface MultimodalInsightsData {
  totalMultimodal: number;
  multimodalPercentage: number;
  avgSentimentScore: number;
  dominantEmotion: string;
  combinations: Array<{
    comboKey: string;
    labels: string[];
    count: number;
    percentage: number;
  }>;
}

export interface PeriodComparisonData {
  hasEnoughData: boolean;
  currentPeriod: {
    totalAnalyses: number;
    positivePct: number;
    negativePct: number;
    neutralPct: number;
    mixedPct: number;
    avgSentimentScore: number;
    avgConfidence: number;
    dominantEmotion: string;
  };
  previousPeriod?: {
    totalAnalyses: number;
    positivePct: number;
    negativePct: number;
    neutralPct: number;
    mixedPct: number;
    avgSentimentScore: number;
    avgConfidence: number;
    dominantEmotion: string;
  };
  changes?: {
    totalAnalyses: number;
    positivePct: number;
    negativePct: number;
    neutralPct: number;
    mixedPct: number;
    avgSentimentScore: number;
    avgConfidence: number;
    dominantEmotionChanged: boolean;
  };
}

export interface AnalyticsFullDashboardData {
  filters: AnalyticsFilterParams;
  overview: AnalyticsOverviewStats;
  trend: SentimentTrendPoint[];
  emotions: EmotionDistributionItem[];
  topEmotions: EmotionDistributionItem[];
  inputTypes: InputTypeDistributionItem[];
  confidence: ConfidenceAnalyticsData;
  sentimentDistribution: SentimentDistributionData;
  activity: AnalysisActivityData;
  multimodal: MultimodalInsightsData;
  comparison: PeriodComparisonData;
  summaryText: string;
  generatedAt: string;
}

// ==========================================
// Step 21: AI Insights & Recommendations Types
// ==========================================

export type InsightType = "trend" | "sentiment" | "emotion" | "multimodal" | "confidence" | "activity" | "attention" | "pattern";
export type InsightConfidence = "high" | "medium" | "low";
export type RecommendationType = "tracking" | "review" | "modalities" | "history" | "attention" | "general";

export interface AIInsightItem {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  observation: string;
  interpretation: string;
  supportingData: {
    metric: string;
    value: number | string;
    previousValue?: number | string;
    label?: string;
    details?: string;
  };
  confidence: InsightConfidence;
}

export interface AIRecommendationItem {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  reason: string;
  actionHint?: string;
}

export interface AIInsightsResponse {
  summary: string;
  totalAnalyses: number;
  confidenceScore: InsightConfidence;
  isInsufficientData?: boolean;
  insights: AIInsightItem[];
  recommendations: AIRecommendationItem[];
  generatedAt: string;
  dateRange?: string;
  filters?: any;
  cached?: boolean;
}

export interface AIInsightSnapshot {
  id: string;
  userId: string;
  createdAt: string;
  dateRange: string;
  filters: any;
  analyticsVersion: string;
  insights: AIInsightItem[];
  recommendations: AIRecommendationItem[];
  summary: string;
  totalAnalyses: number;
  confidenceScore: InsightConfidence;
  isInsufficientData?: boolean;
}

// -------------------------------------------------------------
// STEP 22: GOALS & MOOD TRACKING TYPES
// -------------------------------------------------------------

export type GoalCategory = "activity" | "sentiment" | "emotion" | "confidence" | "trend" | "multimodal";

export type GoalMeasurementType =
  | "analysis_count"
  | "positive_count"
  | "positive_percentage"
  | "avg_sentiment_score"
  | "emotion_count"
  | "emotion_percentage"
  | "avg_confidence"
  | "multimodal_count";

export type GoalStatus = "active" | "completed" | "paused" | "expired" | "not_started";

export interface GoalProgressCalculation {
  goalId: string;
  currentValue: number;
  targetValue: number;
  remainingValue: number;
  percentage: number;
  daysRemaining: number;
  status: GoalStatus;
  contributingAnalysisIds: string[];
  totalEligibleAnalyses: number;
  lastEvaluatedAt: string;
}

export interface GoalItem {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  measurementType: GoalMeasurementType;
  targetValue: number;
  targetEmotion?: string;
  targetConfidenceThreshold?: number;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
  progress: GoalProgressCalculation;
}

export interface GoalProgressHistoryItem {
  _id: string;
  goalId: string;
  userId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  calculatedAt: string;
}

export interface MoodTrackingSummary {
  totalAnalyses: number;
  mostCommonSentiment: string;
  mostCommonEmotion: string;
  averageSentimentScore: number;
  averageConfidence: number;
  analysisFrequency: number;
  activeTrackingDays: number;
  sentimentDistribution: {
    Positive: number;
    Neutral: number;
    Negative: number;
    Mixed: number;
  };
  topEmotionSignals: Array<{
    name: string;
    count: number;
  }>;
  startDate: string;
  endDate: string;
}

export interface SentimentTimelineItem {
  analysisId: string;
  date: string;
  title: string;
  sentiment: string;
  sentimentScore: number;
  dominantEmotion: string;
  dominantEmotionIntensity: string;
  secondaryEmotions: string[];
  confidence: string;
  modality: "text" | "image" | "video" | "multimodal";
  inputSummary?: any;
  meaning?: string;
}

export interface EmotionTimelineData {
  detectedEmotions: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  timelinePoints: Array<{
    date: string;
    emotions: Record<string, number>;
  }>;
  totalAnalyses: number;
  startDate: string;
  endDate: string;
}
