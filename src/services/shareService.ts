import QRCode from "qrcode";
import { MultimodalAnalysisResult, HistoryRecord, ReportRecord } from "../types";

export interface ShareData {
  id: string;
  title: string;
  type: "analysis" | "report";
  sentimentLabel: "Positive" | "Negative" | "Neutral" | "Mixed" | string;
  sentimentScore: number;
  confidence: string;
  summary: string;
  topTakeaway?: string;
  inputTypes?: string[];
  keyEmotions?: string[];
}

export const shareService = {
  // Build direct shareable URL
  getShareableUrl: (type: "analysis" | "report", id: string): string => {
    try {
      const origin = window.location.origin;
      const path = window.location.pathname.replace(/\/$/, "");
      const prefix = type === "report" ? "reports" : "analysis";
      return `${origin}${path}/#${prefix}/${id}`;
    } catch {
      return `https://sentimentai.app/#${type}/${id}`;
    }
  },

  // Extract ShareData from MultimodalAnalysisResult
  fromAnalysisResult: (result: MultimodalAnalysisResult, title?: string): ShareData => {
    const topTakeaway = result.key_insights?.[0] || result.executive_takeaways?.[0] || result.meaning;
    const emotionsList: string[] = [];
    if (result.emotions?.dominant?.name) {
      emotionsList.push(`${result.emotions.dominant.name} (${result.emotions.dominant.intensity || "High"})`);
    }
    if (result.emotions?.secondary && Array.isArray(result.emotions.secondary)) {
      result.emotions.secondary.slice(0, 2).forEach(sec => {
        emotionsList.push(sec.name);
      });
    }

    const inputTypes: string[] = [];
    if (result.input_summary?.has_direct_text || result.input_summary?.text_count) inputTypes.push("Text");
    if (result.input_summary?.image_count) inputTypes.push("Images");
    if (result.input_summary?.video_count) inputTypes.push("Video");

    return {
      id: result.analysis_id,
      title: title || `Sentiment Analysis #${result.analysis_id.slice(-6)}`,
      type: "analysis",
      sentimentLabel: result.overall_sentiment.label,
      sentimentScore: Math.round(result.overall_sentiment.score * 100),
      confidence: result.overall_sentiment.confidence,
      summary: result.tts_summary || result.meaning,
      topTakeaway,
      inputTypes,
      keyEmotions: emotionsList
    };
  },

  // Extract ShareData from HistoryRecord
  fromHistoryRecord: (record: HistoryRecord): ShareData => {
    return {
      id: record.analysisId,
      title: record.title,
      type: "analysis",
      sentimentLabel: record.overallSentiment.label,
      sentimentScore: Math.round(record.overallSentiment.score * 100),
      confidence: record.overallSentiment.confidence,
      summary: record.summary,
      inputTypes: record.inputTypes,
      keyEmotions: record.dominantEmotion ? [record.dominantEmotion] : []
    };
  },

  // Extract ShareData from ReportRecord
  fromReportRecord: (report: ReportRecord): ShareData => {
    const keyEmotions: string[] = [];
    if (report.dominantEmotion) keyEmotions.push(report.dominantEmotion);
    if (report.secondaryEmotions && Array.isArray(report.secondaryEmotions)) {
      keyEmotions.push(...report.secondaryEmotions);
    }

    return {
      id: report.reportId || report.analysisId,
      title: report.title,
      type: "report",
      sentimentLabel: report.overallSentiment.label,
      sentimentScore: Math.round(report.overallSentiment.score * 100),
      confidence: report.overallSentiment.confidence,
      summary: report.summary,
      inputTypes: report.inputTypes,
      keyEmotions
    };
  },

  // WhatsApp Message
  getWhatsAppShare: (data: ShareData) => {
    const url = shareService.getShareableUrl(data.type, data.id);
    const emojiMap: Record<string, string> = {
      Positive: "🟢",
      Negative: "🔴",
      Neutral: "⚪",
      Mixed: "🟡"
    };
    const emoji = emojiMap[data.sentimentLabel] || "📊";

    const text = [
      `*${data.title}* - AI Sentiment Analysis`,
      ``,
      `${emoji} *Overall Sentiment:* ${data.sentimentLabel} (${data.sentimentScore}% score, ${data.confidence} confidence)`,
      ``,
      `📝 *Summary:*`,
      `"${data.summary}"`,
      data.topTakeaway ? `\n💡 *Key Takeaway:*\n${data.topTakeaway}` : "",
      data.keyEmotions && data.keyEmotions.length > 0 ? `\n🎭 *Emotions:* ${data.keyEmotions.join(", ")}` : "",
      ``,
      `🔗 *View Full Interactive Report:*`,
      url
    ].filter(Boolean).join("\n");

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    return { text, shareUrl };
  },

  // Facebook Share
  getFacebookShare: (data: ShareData) => {
    const url = shareService.getShareableUrl(data.type, data.id);
    const quote = `AI Multimodal Sentiment Analysis: ${data.title} (${data.sentimentLabel} - ${data.sentimentScore}%). "${data.summary}"`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`;
    return { quote, shareUrl, url };
  },

  // Twitter / X Share
  getTwitterShare: (data: ShareData) => {
    const url = shareService.getShareableUrl(data.type, data.id);
    const emojiMap: Record<string, string> = {
      Positive: "📈✨",
      Negative: "📉⚠️",
      Neutral: "⚖️",
      Mixed: "🔀"
    };
    const emoji = emojiMap[data.sentimentLabel] || "📊";

    // Keep within Twitter character limits
    const maxSummaryLen = 140;
    const truncatedSummary = data.summary.length > maxSummaryLen
      ? `${data.summary.slice(0, maxSummaryLen)}...`
      : data.summary;

    const tweetText = `📊 SentimentAI Report: "${data.title}"\n${emoji} Sentiment: ${data.sentimentLabel} (${data.sentimentScore}%)\n\n"${truncatedSummary}"`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}&hashtags=SentimentAI,AI,Analytics,CustomerExperience`;

    return { tweetText, shareUrl, url };
  },

  // LinkedIn Share
  getLinkedInShare: (data: ShareData) => {
    const url = shareService.getShareableUrl(data.type, data.id);
    const postText = [
      `🚀 Multimodal AI Sentiment Insights: "${data.title}"`,
      ``,
      `Our multimodal AI analysis evaluated this content across text, visual expressions, and audio cues:`,
      `• Overall Sentiment: ${data.sentimentLabel} (${data.sentimentScore}% score, ${data.confidence} confidence)`,
      data.keyEmotions ? `• Key Emotional Tones: ${data.keyEmotions.join(", ")}` : "",
      ``,
      `📌 Executive Summary:`,
      `"${data.summary}"`,
      data.topTakeaway ? `\n💡 Strategic Finding:\n${data.topTakeaway}` : "",
      ``,
      `Explore the full detailed breakdown and multimodal metrics here: ${url}`,
      ``,
      `#AI #SentimentAnalysis #CustomerInsights #MultimodalAI #DataAnalytics`
    ].filter(Boolean).join("\n");

    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    return { postText, shareUrl, url };
  },

  // Instagram Caption & Story Snippet
  getInstagramShare: (data: ShareData) => {
    const url = shareService.getShareableUrl(data.type, data.id);
    const caption = [
      `✨ AI SENTIMENT REPORT: ${data.title.toUpperCase()} ✨`,
      ``,
      `📊 Overall Sentiment: ${data.sentimentLabel.toUpperCase()} (${data.sentimentScore}%)`,
      `🎯 Confidence: ${data.confidence}`,
      data.keyEmotions ? `🎭 Emotional Signals: ${data.keyEmotions.join(" • ")}` : "",
      ``,
      `💭 The Breakdown:`,
      `"${data.summary}"`,
      data.topTakeaway ? `\n💡 Key Insight:\n${data.topTakeaway}` : "",
      ``,
      `🔗 Link in bio to access the full interactive multimodal analysis:`,
      `${url}`,
      ``,
      `— — —`,
      `#SentimentAnalysis #ArtificialIntelligence #MachineLearning #TechTrends #CustomerExperience #ContentCreator #VisualAI #Analytics #DigitalStrategy`
    ].filter(Boolean).join("\n");

    return {
      caption,
      instagramUrl: "https://www.instagram.com",
      url
    };
  },

  // YouTube Description & Timestamps Snippet
  getYouTubeShare: (data: ShareData) => {
    const url = shareService.getShareableUrl(data.type, data.id);
    const description = [
      `📊 Sentiment & Reaction Analysis for "${data.title}"`,
      ``,
      `In this video analysis, multimodal AI was used to detect and quantify tone, audience emotional responses, and sentiment trajectory.`,
      ``,
      `📌 Summary of Findings:`,
      `${data.summary}`,
      ``,
      `📈 Sentiment Score: ${data.sentimentScore}/100 (${data.sentimentLabel})`,
      `🎯 Analysis Confidence: ${data.confidence}`,
      data.keyEmotions ? `🎭 Key Detected Emotions: ${data.keyEmotions.join(", ")}` : "",
      data.topTakeaway ? `\n💡 Creator Takeaway:\n${data.topTakeaway}` : "",
      ``,
      `⏱️ Analysis Chapters & Highlights:`,
      `00:00 - Introduction & Setup`,
      `00:45 - Key Reaction Points`,
      `01:30 - Sentiment Shift & Tone`,
      `02:15 - Final Takeaways & Recommendations`,
      ``,
      `🔗 Full Interactive Multimodal Sentiment Report:`,
      `${url}`,
      ``,
      `#SentimentAI #VideoAnalysis #CreatorTools #AI #AudienceReaction`
    ].filter(Boolean).join("\n");

    return {
      description,
      youtubeStudioUrl: "https://studio.youtube.com",
      youtubeUrl: "https://www.youtube.com",
      url
    };
  },

  // Telegram Share
  getTelegramShare: (data: ShareData) => {
    const url = shareService.getShareableUrl(data.type, data.id);
    const text = `📊 *${data.title}*\nSentiment: ${data.sentimentLabel} (${data.sentimentScore}%)\n\n"${data.summary}"`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    return { text, shareUrl, url };
  },

  // Email Share
  getEmailShare: (data: ShareData) => {
    const url = shareService.getShareableUrl(data.type, data.id);
    const subject = `AI Sentiment Analysis Report: ${data.title} (${data.sentimentLabel})`;
    const body = [
      `Hello,`,
      ``,
      `Please find the Multimodal Sentiment Analysis findings for: ${data.title}`,
      ``,
      `SUMMARY OF FINDINGS:`,
      `• Overall Sentiment: ${data.sentimentLabel} (${data.sentimentScore}% score, ${data.confidence} confidence)`,
      data.keyEmotions ? `• Key Emotions: ${data.keyEmotions.join(", ")}` : "",
      data.inputTypes ? `• Analyzed Modalities: ${data.inputTypes.join(", ")}` : "",
      ``,
      `EXECUTIVE OVERVIEW:`,
      `"${data.summary}"`,
      data.topTakeaway ? `\nKEY STRATEGIC TAKEAWAY:\n${data.topTakeaway}` : "",
      ``,
      `You can review the full interactive multimodal charts and complete report here:`,
      url,
      ``,
      `Generated by SentimentAI Multimodal Analytics Engine.`
    ].filter(Boolean).join("\n");

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { subject, body, mailtoUrl, url };
  },

  // Interactive QR Code Generator (Data URL)
  generateQRCode: async (url: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        },
        errorCorrectionLevel: "H"
      });
    } catch (err) {
      console.error("Failed to generate QR code via QRCode library:", err);
      // Fallback to public QR server
      return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(url)}`;
    }
  },

  // Native Web Share API (mobile/desktop browsers)
  canNativeShare: (): boolean => {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
  },

  triggerNativeShare: async (data: ShareData): Promise<boolean> => {
    if (!shareService.canNativeShare()) return false;
    try {
      const url = shareService.getShareableUrl(data.type, data.id);
      await navigator.share({
        title: data.title,
        text: `SentimentAI Analysis: ${data.sentimentLabel} (${data.sentimentScore}%) - "${data.summary.slice(0, 100)}..."`,
        url
      });
      return true;
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("Native share failed:", e);
      }
      return false;
    }
  }
};
