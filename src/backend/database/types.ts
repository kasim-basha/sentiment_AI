/**
 * SentimentAI Database Models & Schema Types
 */

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended";

export interface UserTable {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastLoginAt?: string; // ISO 8601
}

export type SafeUser = Omit<UserTable, "passwordHash">;

export type InputType = "text" | "image" | "video";

export interface AnalysisInputTable {
  inputId: string;
  analysisId: string;
  inputType: InputType;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  textContentReference?: string;
  processingStatus: "pending" | "processed" | "failed";
  createdAt: string;
}

export interface AnalysisSessionTable {
  analysisId: string;
  userId: string;
  title?: string;
  inputSummary: {
    textCount: number;
    imageCount: number;
    videoCount: number;
    totalFiles: number;
    hasDirectText: boolean;
  };
  overallSentiment: {
    label: "Positive" | "Negative" | "Neutral" | "Mixed";
    intensity?: string;
    confidence: "Low" | "Medium" | "High";
    score: number;
  };
  confidence: "Low" | "Medium" | "High";
  score: number;
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
  emotionalContext: string;
  visualObservations?: string;
  audioContext?: string;
  multimodalRelationship?: string;
  keyInsights: string[];
  positiveSignals: string[];
  concerns: string[];
  voiceSummary: string;
  status: "completed" | "processing" | "failed";
  language?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResultTable {
  resultId: string;
  analysisId: string;
  fullResultJson: any; // Complete multimodal analysis schema result
  exactFileContents?: string;
  fileContentItems?: string[];
  coachingData?: any;
  timelineBreakdown?: any[];
  turningPoints?: any[];
  videoMetadata?: any;
  documentMetadata?: any;
  timeSavedSummary?: any;
  executiveTakeaways?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportTable {
  reportId: string;
  userId: string;
  analysisId: string;
  title: string;
  summary: string;
  format?: "standard" | "executive" | "detailed";
  status?: "completed" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface VoiceSessionTable {
  sessionId: string;
  userId: string;
  analysisId?: string;
  title: string;
  transcript: string;
  audioSummary: string;
  durationSeconds: number;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSessionTable {
  sessionId: string;
  userId: string;
  deviceType: "desktop" | "mobile" | "tablet";
  deviceName: string;
  browser: string;
  os?: string;
  ipAddress: string;
  location?: string;
  createdAt: string; // ISO 8601
  lastActiveAt: string; // ISO 8601
  isRevoked?: boolean;
}

export interface UserSettingsTable {
  userId: string;
  appearance: {
    theme: "system" | "dark" | "light" | "matrix" | "twilight" | "ocean" | "forest" | "rose" | "amethyst";
    nightLight: boolean;
    compactView?: boolean;
  };
  notifications: {
    emailAlerts?: boolean;
    weeklyDigest?: boolean;
    sentimentAnomalies?: boolean;
    communityUpdates?: boolean;
    analysisComplete?: boolean;
    reportGenerated?: boolean;
    voiceAssistant?: boolean;
    system?: boolean;
  };
  privacy: {
    saveAnalysisHistory?: boolean;
    autoDeleteHistory?: "never" | "after_use" | "after_24h";
    saveReports?: boolean;
    personalizedExperience?: boolean;
    saveClarityConversations?: boolean;
    saveGoalTracking?: boolean;
    saveSearchHistory?: boolean;
    communityVisibility?: "private" | "community" | "public";
    allowAnalytics?: boolean;
    dataRetentionDays?: number;
    profilePublic?: boolean;
  };
  language: string;
  updatedAt: string;
}

export interface UserProfileTable {
  userId: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  title?: string;
  organization?: string;
  location?: string;
  phone?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  updatedAt: string;
}

export type PostPrivacy = "private" | "community" | "public";

export interface PostTable {
  postId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  content: string;
  privacy: PostPrivacy;
  sentimentBadge?: {
    label: "Positive" | "Negative" | "Neutral" | "Mixed";
    dominantEmotion: string;
    score: number;
  };
  metrics?: {
    confidence: string;
    inputTypes: string[];
  };
  analysisId?: string;
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentTable {
  commentId: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface LikeTable {
  likeId: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export type CommunityReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface CommunityReportTable {
  reportId: string;
  reporterId: string;
  reporterName: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: string;
  details?: string;
  status: CommunityReportStatus;
  actionTaken?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface AuditLogTable {
  id: string;
  userId: string;
  userName?: string;
  userRole?: UserRole;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: string; // ISO 8601
}

// --- Step 16: Communication Models (MongoDB collections) ---

export type FriendRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface FriendRequestTable {
  _id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface FriendshipTable {
  _id: string;
  userId: string;
  friendId: string;
  createdAt: string; // ISO 8601
}

export interface ConversationTable {
  _id: string;
  type: "private";
  members: string[]; // [userId1, userId2]
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMemberTable {
  _id: string;
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadAt?: string;
}

export type MessageStatus = "sent" | "delivered" | "read";

export interface MessageTable {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  messageType: "text";
  content: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export type CallType = "audio" | "video";
export type CallStatus = "ringing" | "accepted" | "rejected" | "missed" | "ended" | "failed";

export interface CallSessionTable {
  _id: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  duration: number; // in seconds
  createdAt: string;
}

export interface CallParticipantTable {
  _id: string;
  callId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string;
}

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "new_message"
  | "incoming_call"
  | "missed_call"
  | "analysis_complete"
  | "report_ready"
  | "post_like"
  | "post_comment"
  | "goal_completed"
  | "goal_progress"
  | "goal_ending_soon"
  | "system";

export interface NotificationTable {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface BlockTable {
  _id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface SearchHistoryTable {
  _id: string;
  userId: string;
  query: string;
  category?: string;
  createdAt: string;
}

// --- Step 19: GenAI Clarity Assistant Models ---

export interface ClarityConversationTable {
  _id: string;
  userId: string;
  analysisId: string;
  title?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ClarityMessageReference {
  section: string;
  label: string;
}

export interface ClarityStructuredResponse {
  conversationId: string;
  messageId: string;
  answer: string;
  explanationType: "simple" | "detailed" | "section" | "general";
  references?: ClarityMessageReference[];
  confidenceNote?: string;
  disclaimer?: string;
}

export interface ClarityMessageTable {
  _id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  explanationType?: "simple" | "detailed" | "section" | "general";
  references?: ClarityMessageReference[];
  confidenceNote?: string;
  disclaimer?: string;
  structuredResponse?: ClarityStructuredResponse;
  createdAt: string; // ISO 8601
}

// Step 21: AI Insights & Recommendations Types
export type InsightType =
  | "trend"
  | "sentiment"
  | "emotion"
  | "multimodal"
  | "confidence"
  | "activity"
  | "attention"
  | "pattern";

export type InsightConfidence = "high" | "medium" | "low";

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
  type: "tracking" | "review" | "modalities" | "history" | "attention" | "general";
  title: string;
  description: string;
  reason: string;
  actionHint?: string;
}

export interface AIInsightSnapshotTable {
  _id: string;
  userId: string;
  dateRange: string;
  filters?: {
    dateRange?: string;
    customStartDate?: string;
    customEndDate?: string;
    sentiment?: string;
    emotion?: string;
    inputType?: string;
    confidence?: string;
  };
  analyticsVersion: string;
  insights: AIInsightItem[];
  recommendations: AIRecommendationItem[];
  summary: string;
  totalAnalyses: number;
  confidenceScore: InsightConfidence;
  isInsufficientData?: boolean;
  createdAt: string; // ISO 8601
}

export interface DatabaseSchema {
  version: number;
  users: UserTable[];
  analysisSessions: AnalysisSessionTable[];
  analysisInputs: AnalysisInputTable[];
  analysisResults: AnalysisResultTable[];
  reports: ReportTable[];
  voiceSessions: VoiceSessionTable[];
  userSettings: UserSettingsTable[];
  userProfiles: UserProfileTable[];
  posts: PostTable[];
  comments: CommentTable[];
  likes: LikeTable[];
  communityReports: CommunityReportTable[];
  auditLogs: AuditLogTable[];
  // Step 16 Collections
  friendRequests: FriendRequestTable[];
  friendships: FriendshipTable[];
  conversations: ConversationTable[];
  conversationMembers: ConversationMemberTable[];
  messages: MessageTable[];
  callSessions: CallSessionTable[];
  callParticipants: CallParticipantTable[];
  notifications: NotificationTable[];
  blocks: BlockTable[];
  // Step 18 Collection
  searchHistory?: SearchHistoryTable[];
  // Step 19 Collections (GenAI Clarity Assistant)
  clarityConversations?: ClarityConversationTable[];
  clarityMessages?: ClarityMessageTable[];
  // Step 21 Collection (AI Insights & Recommendations)
  aiInsightSnapshots?: AIInsightSnapshotTable[];
  // Step 22 Collections (Goals & Mood Tracking)
  goals?: GoalTable[];
  goalProgress?: GoalProgressHistoryTable[];
  // Step 23 Collection (Advanced Privacy & Security)
  userSessions?: UserSessionTable[];
}

export type GoalCategory =
  | "activity"
  | "sentiment"
  | "emotion"
  | "confidence"
  | "trend"
  | "multimodal";

export type GoalMeasurementType =
  | "analysis_count"
  | "positive_count"
  | "positive_percentage"
  | "avg_sentiment_score"
  | "emotion_count"
  | "emotion_percentage"
  | "avg_confidence"
  | "multimodal_count";

export type GoalStatus =
  | "not_started"
  | "active"
  | "completed"
  | "expired"
  | "paused";

export interface GoalTable {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  measurementType: GoalMeasurementType;
  targetValue: number;
  targetEmotion?: string;
  targetConfidenceThreshold?: number; // 0.0 - 1.0 (e.g. 0.8 for High)
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  status: GoalStatus;
  isPaused?: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

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

export interface GoalWithProgress extends GoalTable {
  progress: GoalProgressCalculation;
}

export interface GoalProgressHistoryTable {
  _id: string;
  goalId: string;
  userId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  calculatedAt: string;
}
