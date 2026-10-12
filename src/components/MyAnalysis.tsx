import React, { useState, useRef, useEffect } from "react";
import {
  Brain,
  AlertCircle,
  Sparkles,
  Trash2,
  Upload,
  Globe,
  Link as LinkIcon,
  X,
  Clipboard,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  CheckCircle2,
  RotateCcw,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analysisService, AnalysisFile } from "../services/analysisService";
import { analysisSessionService } from "../services/analysisSessionService";
import { DashboardNavbar } from "./dashboard/DashboardNavbar";
import { User, ViewState, MultimodalAnalysisResult } from "../types";
import { AnalysisProcessing } from "./analysis/AnalysisProcessing";
import { AnalysisResults } from "./analysis/AnalysisResults";
import { LiveCameraCapture } from "./analysis/LiveCameraCapture";
import { SUPPORTED_LANGUAGES, LanguageOption, DEFAULT_LANGUAGE } from "../utils/languages";

const MAX_CHARACTERS = 5000;

interface MyAnalysisProps {
  user: User;
  onLogout: () => void;
  setView: (view: ViewState) => void;
  onViewAnalysis?: (analysisId: string) => void;
  onViewReport?: (reportId: string) => void;
}

export function MyAnalysis({ user, onLogout, setView, onViewAnalysis, onViewReport }: MyAnalysisProps) {
  // Unified Input State
  const [inputMode, setInputMode] = useState<"standard" | "camera">("standard");
  const [inputText, setInputText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<AnalysisFile[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(DEFAULT_LANGUAGE);

  // Execution State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [result, setResult] = useState<MultimodalAnalysisResult | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UX Feedback State
  const [pasteNotification, setPasteNotification] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const processFiles = async (files: File[]) => {
    const newFiles: AnalysisFile[] = [];

    for (const file of files) {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name);

      if (file.size > 50 * 1024 * 1024) {
        setError(`File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 50MB limit.`);
        continue;
      }

      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      newFiles.push({
        data: fileData,
        mimeType: file.type || (isVideo ? "video/mp4" : "application/octet-stream"),
        name: file.name,
        size: file.size
      });
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePastedFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const formattedFiles: File[] = files.map((file, idx) => {
      if (!file.name || file.name === "image.png" || file.name === "blob") {
        const ext = file.type.split("/")[1] || "png";
        return new File([file], `Pasted_Capture_${Date.now()}_${idx + 1}.${ext}`, { type: file.type });
      }
      return file;
    });

    await processFiles(formattedFiles);
    setPasteNotification(`Attached ${files.length} item${files.length > 1 ? "s" : ""} from clipboard`);
    setTimeout(() => setPasteNotification(null), 4000);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        const files: File[] = [];
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/") || type.startsWith("video/") || type === "application/pdf") {
              const blob = await item.getType(type);
              const ext = type.split("/")[1] || "png";
              const file = new File([blob], `Pasted_Media_${Date.now()}.${ext}`, { type });
              files.push(file);
            }
          }
        }
        if (files.length > 0) {
          await handlePastedFiles(files);
          return;
        }
      }

      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          if ((text.startsWith("http://") || text.startsWith("https://")) && !mediaUrl) {
            setMediaUrl(text.trim());
            setPasteNotification("Pasted link into Source URL");
          } else {
            setInputText(prev => prev ? `${prev}\n\n${text}` : text);
            setPasteNotification("Pasted text into composer");
          }
          setTimeout(() => setPasteNotification(null), 4000);
          return;
        }
      }

      setPasteNotification("Clipboard is empty or unsupported");
      setTimeout(() => setPasteNotification(null), 3000);
    } catch {
      setPasteNotification("Use Ctrl+V / Cmd+V to paste directly into the composer");
      setTimeout(() => setPasteNotification(null), 4000);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const clipboardFiles: File[] = [];

      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          clipboardFiles.push(e.clipboardData.files[i]);
        }
      } else if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.kind === "file") {
            const f = item.getAsFile();
            if (f) clipboardFiles.push(f);
          }
        }
      }

      if (clipboardFiles.length > 0) {
        e.preventDefault();
        handlePastedFiles(clipboardFiles);
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, []);

  const handleClear = () => {
    setInputText("");
    setMediaUrl("");
    setUploadedFiles([]);
    setResult(null);
    setError(null);
    setAnalysisStep("");
  };

  const handleAnalyze = async () => {
    const hasText = inputText.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;
    const hasUrl = mediaUrl.trim().length > 0;

    if (!hasText && !hasFiles && !hasUrl) {
      setError("Please enter text, upload a file, or provide a source link to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const hasVideo = uploadedFiles.some(
      f => f.mimeType?.toLowerCase().startsWith("video/") ||
           /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(f.name || "")
    );

    const videoSteps = [
      "Uploading & ingesting media stream...",
      "Extracting keyframes & audio resonance...",
      "Analyzing visual expressions & speech tone...",
      "Cross-referencing multimodal contextual signals...",
      "Synthesizing sentiment matrix & emotional spectrum..."
    ];

    const standardSteps = [
      "Ingesting content & parsing context...",
      "Evaluating linguistic sentiment & underlying tone...",
      "Mapping emotional intensity & cognitive signals...",
      "Generating structured insights & voice summary..."
    ];

    const steps = hasVideo ? videoSteps : standardSteps;
    let stepIdx = 0;
    setAnalysisStep(steps[0]);

    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setAnalysisStep(steps[stepIdx]);
      }
    }, hasVideo ? 6000 : 2200);

    try {
      // Build combined prompt context including media URL if provided
      let combinedPrompt = inputText.trim();
      if (hasUrl) {
        const urlPrefix = `[Source / Media Reference: ${mediaUrl.trim()}]`;
        combinedPrompt = combinedPrompt ? `${urlPrefix}\n\n${combinedPrompt}` : urlPrefix;
      }

      const data = await analysisService.analyzeMultimodal(combinedPrompt, uploadedFiles, selectedLanguage.name);

      clearInterval(stepInterval);
      setAnalysisStep("Analysis Complete");
      setResult(data);

      try {
        await analysisSessionService.createAnalysisSession({
          userId: user.id,
          result: data,
          rawText: combinedPrompt,
          fileNames: uploadedFiles.map(f => f.name)
        });
      } catch (saveErr) {
        console.error("Failed to save analysis session to history:", saveErr);
      }

    } catch (err: any) {
      clearInterval(stepInterval);
      console.error("Analysis caught error:", err);
      let errorMsg = "Analysis could not be completed right now. Please check your connection and try again.";
      if (typeof err === "string" && err.trim()) {
        errorMsg = err;
      } else if (typeof err?.message === "string" && err.message !== "[object Object]" && err.message.trim()) {
        errorMsg = err.message;
      } else if (err?.message && typeof err.message === "object") {
        errorMsg = err.message.message || err.message.code || JSON.stringify(err.message);
      } else if (typeof err?.error === "string") {
        errorMsg = err.error;
      } else if (err?.error && typeof err.error === "object") {
        errorMsg = err.error.message || err.error.code || JSON.stringify(err.error);
      }
      setError(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    const summaryText = `
Sentiment Analysis Result (SentimentAI)
-------------------------
ID: ${result.analysis_id}
Language: ${result.language || selectedLanguage.name}
Overall Sentiment: ${result.overall_sentiment.label} (${(result.overall_sentiment.score * 100).toFixed(0)}% Confidence)
Dominant Emotion: ${result.emotions.dominant.name}
Meaning: ${result.meaning}
Voice Summary: ${result.tts_summary}
    `.trim();

    try {
      await navigator.clipboard.writeText(summaryText);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getFileIcon = (mime: string, name: string) => {
    if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)) return ImageIcon;
    if (mime.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi)$/i.test(name)) return Video;
    if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(name)) return Music;
    return FileText;
  };

  const canAnalyze = inputText.trim().length > 0 || uploadedFiles.length > 0 || mediaUrl.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        onNavigate={setView}
        currentView="my-analysis"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {!result && !isAnalyzing && (
          <div className="mb-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-4 shadow-lg shadow-blue-500/5"
            >
              <Brain className="w-8 h-8 text-blue-400" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3"
            >
              Multimodal Analysis
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed"
            >
              Evaluate sentiment, emotion, tone, and hidden context across text, documents, images, video, and audio in one unified space.
            </motion.p>
          </div>
        )}

        {/* Main Content View */}
        <AnimatePresence mode="wait">
          {!result && !isAnalyzing ? (
            <motion.div
              key="unified-composer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative space-y-6"
            >
              {/* Notification Banner */}
              <AnimatePresence>
                {pasteNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{pasteNotification}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasteNotification(null)}
                      className="text-emerald-400 hover:text-emerald-200 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Mode Toggle */}
              <div className="flex justify-center mb-4">
                <div className="bg-slate-950/60 p-1 rounded-xl border border-slate-800 inline-flex">
                  <button
                    onClick={() => setInputMode("standard")}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      inputMode === "standard"
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Text & Upload
                    </div>
                  </button>
                  <button
                    onClick={() => setInputMode("camera")}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      inputMode === "camera"
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Live Camera
                    </div>
                  </button>
                </div>
              </div>

              {inputMode === "camera" ? (
                <LiveCameraCapture
                  onCapture={(file) => {
                    processFiles([file]);
                    setInputMode("standard"); // return to standard mode to see the file
                  }}
                  onCancel={() => setInputMode("standard")}
                />
              ) : (
                <>
                  {/* Language Selection Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Analysis & Voice Language
                    </span>
                    <p className="text-[11px] text-slate-500">Insights and voice report are synthesized in this language</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <select
                    value={selectedLanguage.code}
                    onChange={(e) => {
                      const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                      if (found) setSelectedLanguage(found);
                    }}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-200">
                        {lang.flag} {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text Input Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="content-input" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Text, Dialogue, or Transcript
                  </label>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>{inputText.length} / {MAX_CHARACTERS}</span>
                    {inputText && (
                      <button
                        type="button"
                        onClick={() => setInputText("")}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer font-sans"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  id="content-input"
                  value={inputText}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARACTERS) {
                      setInputText(e.target.value);
                      setError(null);
                    }
                  }}
                  placeholder="Type or paste text, dialogue, customer review, interview transcript, or document content..."
                  rows={5}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y transition-all leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-500">
                    Tip: You can also paste screenshots or text with <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Ctrl+V</kbd>
                  </p>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-blue-400" />
                    <span>Paste Clipboard</span>
                  </button>
                </div>
              </div>

              {/* Drag-and-Drop Unified Attachment Dropzone */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Media & Document Attachments
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isDragging
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.txt,.md,.docx,.srt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200 mb-1">
                    Drag & drop files here, or <span className="text-blue-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Supports images, video clips, PDFs, text documents, or audio files up to 50MB
                  </p>
                </div>

                {/* Attached Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-400">
                        Attached Files ({uploadedFiles.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles([])}
                        className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                      >
                        Remove All
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {uploadedFiles.map((file, idx) => {
                        const Icon = getFileIcon(file.mimeType, file.name);
                        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
                        return (
                          <div
                            key={idx}
                            className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-blue-400" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                                <span className="text-[10px] text-slate-500 font-mono">{sizeMb} MB</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(idx);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Web / Video Source Link */}
              <div className="space-y-2">
                <label htmlFor="media-url" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Optional Web or Media Link</span>
                </label>
                <div className="relative">
                  <input
                    id="media-url"
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => {
                      setMediaUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://... (e.g., YouTube, Vimeo, article, or blog URL)"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-16"
                  />
                  {mediaUrl && (
                    <button
                      type="button"
                      onClick={() => setMediaUrl("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze || isAnalyzing}
                  className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm shadow-xl shadow-blue-600/20 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Analyze Sentiment & Emotion</span>
                </button>

                {(inputText || uploadedFiles.length > 0 || mediaUrl) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              </>
              )}
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalysisProcessing currentStep={analysisStep} />
            </motion.div>
          ) : result ? (
            <div key="results" ref={resultsRef}>
              <AnalysisResults
                result={result}
                onNavigate={setView}
                onNewAnalysis={handleClear}
                onCopy={handleCopy}
                userId={user.id}
                user={user}
                isSaved={isSaved}
                onViewSavedFile={onViewAnalysis}
                onViewReport={onViewReport}
              />
            </div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
