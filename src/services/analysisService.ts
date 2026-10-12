import { MultimodalAnalysisResult } from "../types";

export interface AnalysisFile {
  data: string;
  mimeType: string;
  name: string;
  size: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token") || localStorage.getItem("sentimentai_auth_token") || localStorage.getItem("authToken") || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function extractErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      const errData = await response.json();
      if (typeof errData === "string") return errData;
      if (typeof errData.error === "string") return errData.error;
      if (errData.error && typeof errData.error === "object") {
        return errData.error.message || errData.error.code || JSON.stringify(errData.error);
      }
      if (typeof errData.message === "string") return errData.message;
    } catch {}
  } else {
    try {
      const text = await response.text();
      if (text && text.trim()) return text.substring(0, 300);
    } catch {}
  }
  return defaultMessage;
}

export const analysisService = {
  analyzeMultimodal: async (text: string, files: AnalysisFile[], language: string = "English"): Promise<MultimodalAnalysisResult> => {
    const hasVideo = files.some(
      f => f.mimeType?.toLowerCase().startsWith("video/") ||
           /\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i.test(f.name || "")
    );
    // Allocate 300 seconds (5 minutes) for videos, 150 seconds for text/images
    const timeoutMs = hasVideo ? 300000 : 150000;

    let didTimeout = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      try {
        controller.abort();
      } catch {}
    }, timeoutMs);

    try {
      const response = await fetch("/api/analyze/multimodal", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text,
          files: files.map(f => ({
            data: f.data,
            mimeType: f.mimeType,
            name: f.name
          })),
          language
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response, "Failed to analyze content");
        throw new Error(errorMessage);
      }

      if (!contentType || !contentType.includes("application/json")) {
        console.log("Non-JSON content type received:", contentType);
        throw new Error("Unable to parse server response. Please try again.");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (didTimeout || error?.name === "AbortError" || error?.message?.toLowerCase().includes("aborted")) {
        console.log("Request was aborted/timed out:", error?.message);
        if (hasVideo) {
          throw new Error("Video analysis timed out. Processing high-resolution or long video files requires extra time. Please try a shorter video clip (under 60 seconds) or a smaller file size.");
        }
        throw new Error("The analysis request timed out. Please check your network and try again.");
      }

      console.log("Analysis request status:", error?.message || error);
      throw error;
    }
  },

  analyzeLongVideo: async (
    title: string,
    durationHours: number,
    transcript: string,
    chapters?: string,
    language: string = "English"
  ): Promise<MultimodalAnalysisResult> => {
    const timeoutMs = 180000; // 3 minutes for deep long-video processing
    let didTimeout = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      try {
        controller.abort();
      } catch {}
    }, timeoutMs);

    try {
      const response = await fetch("/api/analyze/long-video", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          durationHours,
          transcript,
          chapters,
          language
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errMsg = await extractErrorMessage(response, "Failed to analyze long video timeline");
        throw new Error(errMsg);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (didTimeout || error?.name === "AbortError" || error?.message?.toLowerCase().includes("aborted")) {
        throw new Error("12-Hour video analysis timed out. Please check network connection and try again.");
      }
      throw error;
    }
  },

  analyzeVeExpress: async (params: {
    sourceType: "video_link" | "video_file" | "pdf_document" | "transcript_log";
    title?: string;
    durationHours?: number;
    videoUrl?: string;
    files?: AnalysisFile[];
    transcript?: string;
    chapters?: string;
    language?: string;
  }): Promise<MultimodalAnalysisResult> => {
    const timeoutMs = 180000;
    let didTimeout = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      try {
        controller.abort();
      } catch {}
    }, timeoutMs);

    try {
      const response = await fetch("/api/analyze/ve-express", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errMsg = await extractErrorMessage(response, "Failed to run VE Express time-saving analysis");
        throw new Error(errMsg);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (didTimeout || error?.name === "AbortError" || error?.message?.toLowerCase().includes("aborted")) {
        throw new Error("VE Express analysis timed out. Please check network connection and try again.");
      }
      throw error;
    }
  },

  translateSummary: async (summary: string, targetLanguage: string): Promise<string> => {
    try {
      const response = await fetch("/api/translate/summary", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ summary, targetLanguage }),
      });

      if (!response.ok) {
        throw new Error("Translation request failed");
      }

      const data = await response.json();
      return data.translatedSummary || summary;
    } catch (err) {
      console.log("Translation service error:", err);
      return summary;
    }
  }
};
