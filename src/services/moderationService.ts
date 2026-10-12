import {
  CommunityReport,
  ReportReason,
  ModerationStatus
} from "../types";
import { postService, sanitizeContent } from "./postService";
import { commentService } from "./commentService";

const STORAGE_KEY = "sentimentai_community_reports_v1";

const INITIAL_REPORTS: CommunityReport[] = [
  {
    reportId: "rep_sample_01",
    postId: "post_sample_03",
    reporterId: "usr_elena_ai",
    reporterName: "Dr. Elena Rostova",
    reportedUserId: "usr_aisha_ux",
    reportedUserName: "Aisha Patel",
    reason: "Misleading Content",
    details: "Claims audio normalization always boosts confidence to 95% across arbitrary codecs.",
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    contentSnippet: "When testing multi-speaker video feeds, background ambient noise..."
  }
];

export const moderationService = {
  // Retrieve all moderation reports for Admin review
  getReports: async (): Promise<CommunityReport[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
        return INITIAL_REPORTS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load moderation reports:", e);
      return [];
    }
  },

  // Report a community post
  reportPost: async (data: {
    postId: string;
    reporterId: string;
    reporterName: string;
    reason: ReportReason;
    details?: string;
  }): Promise<CommunityReport> => {
    const post = await postService.getPostById(data.postId);
    const cleanedDetails = data.details ? sanitizeContent(data.details) : undefined;

    const newReport: CommunityReport = {
      reportId: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      postId: data.postId,
      reporterId: data.reporterId,
      reporterName: data.reporterName,
      reportedUserId: post?.userId || "unknown",
      reportedUserName: post?.userName || "Anonymous",
      reason: data.reason,
      details: cleanedDetails,
      status: "pending",
      createdAt: new Date().toISOString(),
      contentSnippet: post?.title || post?.content?.slice(0, 120) || "Post content"
    };

    const currentReports = await moderationService.getReports();
    const updated = [newReport, ...currentReports];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return newReport;
  },

  // Report a specific comment
  reportComment: async (data: {
    commentId: string;
    postId: string;
    reporterId: string;
    reporterName: string;
    reason: ReportReason;
    details?: string;
  }): Promise<CommunityReport> => {
    const comments = await commentService.getComments(data.postId);
    const comment = comments.find(c => c.commentId === data.commentId);
    const cleanedDetails = data.details ? sanitizeContent(data.details) : undefined;

    const newReport: CommunityReport = {
      reportId: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      postId: data.postId,
      commentId: data.commentId,
      reporterId: data.reporterId,
      reporterName: data.reporterName,
      reportedUserId: comment?.userId || "unknown",
      reportedUserName: comment?.userName || "Anonymous",
      reason: data.reason,
      details: cleanedDetails,
      status: "pending",
      createdAt: new Date().toISOString(),
      contentSnippet: comment?.content?.slice(0, 120) || "Comment text"
    };

    const currentReports = await moderationService.getReports();
    const updated = [newReport, ...currentReports];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return newReport;
  },

  // Admin: Update report status (pending | reviewed | resolved | dismissed)
  updateReportStatus: async (reportId: string, status: ModerationStatus): Promise<CommunityReport> => {
    const currentReports = await moderationService.getReports();
    const index = currentReports.findIndex(r => r.reportId === reportId);
    if (index === -1) throw new Error("Report not found.");

    currentReports[index].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentReports));
    return currentReports[index];
  },

  // Admin: Remove reported content
  removeReportedContent: async (report: CommunityReport, adminUserId: string): Promise<boolean> => {
    if (report.commentId) {
      // Remove comment
      await commentService.deleteComment(report.commentId, adminUserId, true);
    } else if (report.postId) {
      // Remove post
      await postService.deletePost(report.postId, adminUserId, true);
    }
    await moderationService.updateReportStatus(report.reportId, "resolved");
    return true;
  }
};
