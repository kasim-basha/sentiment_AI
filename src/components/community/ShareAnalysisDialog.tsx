import React, { useState } from "react";
import { X, Lock, Users, Globe, Check, AlertCircle, Loader2 } from "lucide-react";
import { CommunityVisibility, User } from "../../types";
import { communityService } from "../../services/communityService";

interface ShareAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  defaultTitle?: string;
  defaultDescription?: string;
  user: User;
  onSharedSuccess?: (postId: string) => void;
}

export function ShareAnalysisDialog({
  isOpen,
  onClose,
  analysisId,
  defaultTitle = "",
  defaultDescription = "",
  user,
  onSharedSuccess
}: ShareAnalysisDialogProps) {
  const [title, setTitle] = useState(defaultTitle || "Multimodal Sentiment Analysis");
  const [description, setDescription] = useState(defaultDescription || "Key insights, tone dynamics, and emotional trajectory discovered in this session.");
  // Strict Default: 🔒 Private!
  const [visibility, setVisibility] = useState<CommunityVisibility>("private");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isShareable = visibility === "community" || visibility === "public";

  const handleInitiateShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isShareable) {
      setError("Please select 'Community Only' or 'Public' to share this analysis. Analyses marked 'Private' cannot be published.");
      return;
    }
    setError(null);
    setIsConfirming(true);
  };

  const handleConfirmPublish = async () => {
    setIsPublishing(true);
    setError(null);
    try {
      const createdPost = await communityService.shareAnalysis({
        analysisId,
        visibility,
        title: title.trim(),
        description: description.trim(),
        user
      });
      setIsConfirming(false);
      setSuccessMessage("✅ Analysis shared successfully.");
      if (onSharedSuccess) {
        onSharedSuccess(createdPost.postId);
      }
    } catch (err: any) {
      setIsConfirming(false);
      setError(err.message || "Failed to share analysis.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-analysis-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <h2 id="share-analysis-title" className="text-base font-bold text-white">
              Share Analysis to Community
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {successMessage ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center text-2xl">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {successMessage}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your analysis is now published with {visibility === "public" ? "Public" : "Community"} visibility.
              </p>
            </div>
            <div className="pt-3 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : isConfirming ? (
          /* Step 6: Sharing Confirmation Dialog */
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🌐</span> Share this analysis?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This analysis will become visible according to your selected privacy setting (
                <strong className="text-blue-300 font-bold capitalize">{visibility}</strong>).
              </p>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div><strong>Title:</strong> {title}</div>
              <div><strong>Selected Audience:</strong> {visibility === "public" ? "Public (Everyone)" : "Community Only (Verified Members)"}</div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={isPublishing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isPublishing}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : (
                  <span>Share</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Form for Title, Description, Visibility */
          <form onSubmit={handleInitiateShare} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="share-title" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Title
              </label>
              <input
                id="share-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your shared analysis a descriptive title..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="share-desc" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Description / Context
              </label>
              <textarea
                id="share-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add context or interesting findings for community members..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Visibility - Default Private */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Visibility <span className="text-slate-500 font-normal">(Default: Private)</span>
              </label>
              <div className="space-y-2">
                {/* 🔒 Private */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    visibility === "private"
                      ? "bg-slate-800/80 border-slate-600 text-white"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-200">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>🔒 Private</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Only visible to you. Will not be posted to the community feed.
                    </p>
                  </div>
                </label>

                {/* 👥 Community Only */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    visibility === "community"
                      ? "bg-blue-600/15 border-blue-500/40 text-white"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="community"
                    checked={visibility === "community"}
                    onChange={() => setVisibility("community")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>👥 Community Only</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Visible exclusively to signed-in SentimentAI members.
                    </p>
                  </div>
                </label>

                {/* 🌐 Public */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    visibility === "public"
                      ? "bg-blue-600/15 border-blue-500/40 text-white"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>🌐 Public</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Visible across public community feeds, search, and profiles.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {!isShareable ? "Select Community Only or Public to share" : "Ready to share"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isShareable}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Share Analysis</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
