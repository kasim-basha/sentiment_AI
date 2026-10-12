import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Globe,
  Users,
  Brain,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Paperclip,
  Trash2
} from "lucide-react";
import {
  CommunityPost,
  CommunityVisibility,
  HistoryRecord,
  User,
  CommunityFileAttachment
} from "../../types";
import { historyService } from "../../services/historyService";

interface PostComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    fileAttachment?: CommunityFileAttachment;
    analysisId?: string;
    visibility: CommunityVisibility;
  }) => Promise<void>;
  currentUser: User;
  editPost?: CommunityPost | null;
}

export function PostComposer({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  editPost
}: PostComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>("");
  const [visibility, setVisibility] = useState<CommunityVisibility>("community");
  const [fileAttachment, setFileAttachment] = useState<CommunityFileAttachment | undefined>(undefined);
  const [userAnalyses, setUserAnalyses] = useState<HistoryRecord[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title);
      setContent(editPost.content);
      setSelectedAnalysisId(editPost.analysisId || "");
      setVisibility(editPost.visibility);
      setFileAttachment(editPost.fileAttachment);
    } else {
      setTitle("");
      setContent("");
      setSelectedAnalysisId("");
      setVisibility("community");
      setFileAttachment(undefined);
    }
    setError(null);
  }, [editPost, isOpen]);

  // Load user's own analyses for the dropdown
  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      async function loadMyAnalyses() {
        setIsLoadingAnalyses(true);
        try {
          const list = await historyService.getAnalyses(currentUser.id);
          if (isMounted) {
            setUserAnalyses(list);
          }
        } catch (e) {
          console.error("Failed to load user analyses:", e);
        } finally {
          if (isMounted) setIsLoadingAnalyses(false);
        }
      }
      loadMyAnalyses();
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(mimeType, quality));
      };
      img.onerror = () => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleProcessFile = async (file: File) => {
    // Max file size 8MB
    if (file.size > 8 * 1024 * 1024) {
      setError("File size cannot exceed 8MB.");
      return;
    }

    try {
      let dataUrl: string;
      if (file.type.startsWith("image/")) {
        dataUrl = await compressImage(file);
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setFileAttachment({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl,
        previewUrl: file.type.startsWith("image/") ? dataUrl : undefined
      });
      setError(null);
    } catch (err) {
      console.error("Failed to process file:", err);
      setError("Failed to read file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-pink-400" />;
    if (mimeType.startsWith("video/")) return <Video className="w-5 h-5 text-purple-400" />;
    if (mimeType.startsWith("audio/")) return <Music className="w-5 h-5 text-emerald-400" />;
    return <FileText className="w-5 h-5 text-blue-400" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle) {
      setError("Post title is required.");
      return;
    }
    if (cleanTitle.length > 180) {
      setError("Post title must be 180 characters or fewer.");
      return;
    }
    if (!cleanContent) {
      setError("Post content is required.");
      return;
    }
    if (cleanContent.length > 3500) {
      setError("Post content must be 3,500 characters or fewer.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: cleanTitle,
        content: cleanContent,
        fileAttachment,
        analysisId: selectedAnalysisId ? selectedAnalysisId : undefined,
        visibility
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to publish post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📝</span>
            <div>
              <h2 id="composer-title" className="text-base sm:text-lg font-bold text-white leading-tight">
                {editPost ? "Edit Community Post" : "Publish to Community"}
              </h2>
              <p className="text-[11px] text-slate-400">
                Share analyses, files, feedback, and sentiment discoveries with the community
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Post Title */}
          <div>
            <label htmlFor="post-title" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Post Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Surprising tone variance across meeting transcripts..."
              maxLength={180}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
            <div className="flex justify-end text-[10px] text-slate-500 mt-1">
              <span>{title.length}/180</span>
            </div>
          </div>

          {/* Post Content */}
          <div>
            <label htmlFor="post-content" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Post Content & Insights <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your methodologies, emotional nuance discoveries, questions, or perspectives with the SentimentAI community..."
              rows={4}
              maxLength={3500}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y"
              required
            />
            <div className="flex justify-end text-[10px] text-slate-500 mt-1">
              <span>{content.length}/3500</span>
            </div>
          </div>

          {/* Attach Community File */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Attach Community File <span className="text-slate-500 font-normal">(Image, Document, Media)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.txt,.csv,.json,.doc,.docx"
            />

            {fileAttachment ? (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {fileAttachment.previewUrl ? (
                    <img
                      src={fileAttachment.previewUrl}
                      alt={fileAttachment.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0">
                      {getFileIcon(fileAttachment.type)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{fileAttachment.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatFileSize(fileAttachment.size)} • {fileAttachment.type}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFileAttachment(undefined);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                  title="Remove attached file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:bg-slate-950"
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <p className="text-xs font-medium text-slate-300">
                    Click to browse or drag and drop a file
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Supports PNG, JPG, PDF, TXT, CSV, Audio, Video (Up to 8MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Optional Analysis Selection */}
          {!editPost && (
            <div>
              <label htmlFor="post-analysis" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Attach Saved Analysis <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              {isLoadingAnalyses ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading your analyses...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="post-analysis"
                    value={selectedAnalysisId}
                    onChange={(e) => setSelectedAnalysisId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">No analysis attached (Standard post/file)</option>
                    {userAnalyses.map((an) => (
                      <option key={an.analysisId} value={an.analysisId}>
                        📊 {an.title || "Untitled Analysis"} ({an.overallSentiment?.label || "Analyzed"} • {new Date(an.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Visibility Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Visibility & Feed Target
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility("community")}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  visibility === "community"
                    ? "bg-blue-600/15 border-blue-500/40 text-white shadow-sm"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Users className={`w-4 h-4 mt-0.5 shrink-0 ${visibility === "community" ? "text-blue-400" : "text-slate-500"}`} />
                <div>
                  <div className="font-semibold text-xs text-white">Community Only</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Visible to logged-in SentimentAI members.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  visibility === "public"
                    ? "bg-blue-600/15 border-blue-500/40 text-white shadow-sm"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 shrink-0 ${visibility === "public" ? "text-blue-400" : "text-slate-500"}`} />
                <div>
                  <div className="font-semibold text-xs text-white">Public Feed</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Visible publicly across explore feeds & profiles.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{editPost ? "Save Changes" : "Publish"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
