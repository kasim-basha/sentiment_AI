import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Copy,
  Share2,
  ExternalLink,
  QrCode,
  Download,
  Smartphone,
  MessageCircle,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Send,
  Mail,
  Code,
  Sparkles,
  Link,
  Layers,
  FileText
} from "lucide-react";
import { shareService, ShareData } from "../../services/shareService";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData;
}

type PlatformTab = "whatsapp" | "facebook" | "instagram" | "youtube" | "twitter" | "linkedin" | "qrcode" | "more";

export function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<PlatformTab>("whatsapp");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const shareUrl = shareService.getShareableUrl(data.type, data.id);
  const hasNativeShare = shareService.canNativeShare();

  // Pre-generate QR Code when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsGeneratingQR(true);
      shareService.generateQRCode(shareUrl)
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error("QR Code error:", err))
        .finally(() => setIsGeneratingQR(false));
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  const handleNativeShare = async () => {
    await shareService.triggerNativeShare(data);
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `sentiment-ai-qr-${data.id.slice(-6)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Channel share payloads
  const whatsApp = shareService.getWhatsAppShare(data);
  const facebook = shareService.getFacebookShare(data);
  const twitter = shareService.getTwitterShare(data);
  const linkedIn = shareService.getLinkedInShare(data);
  const instagram = shareService.getInstagramShare(data);
  const youtube = shareService.getYouTubeShare(data);
  const telegram = shareService.getTelegramShare(data);
  const email = shareService.getEmailShare(data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white truncate">
                  Share Analysis & Report
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  data.sentimentLabel === "Positive"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : data.sentimentLabel === "Negative"
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                }`}>
                  {data.sentimentLabel} ({data.sentimentScore}%)
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {data.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QUICK LINK BAR */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl flex-1">
            <Link className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-slate-300 font-mono focus:outline-none w-full truncate select-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCopy(shareUrl, "direct-link")}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {copiedKey === "direct-link" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {hasNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Open native device share sheet"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Device Share</span>
              </button>
            )}
          </div>
        </div>

        {/* CHANNEL TABS NAVIGATION */}
        <div className="px-6 pt-3 border-b border-slate-800/60 bg-slate-900/40 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("whatsapp")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "whatsapp"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("facebook")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "facebook"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Facebook className="w-4 h-4 text-blue-400" />
              <span>Facebook</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("instagram")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "instagram"
                  ? "bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Instagram className="w-4 h-4 text-pink-400" />
              <span>Instagram</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("youtube")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "youtube"
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Youtube className="w-4 h-4 text-red-400" />
              <span>YouTube</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("twitter")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "twitter"
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Twitter className="w-4 h-4 text-sky-400" />
              <span>X (Twitter)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("linkedin")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "linkedin"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Linkedin className="w-4 h-4 text-blue-400" />
              <span>LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("qrcode")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "qrcode"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <QrCode className="w-4 h-4 text-purple-400" />
              <span>QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("more")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "more"
                  ? "bg-slate-700/60 text-white border border-slate-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Layers className="w-4 h-4 text-slate-300" />
              <span>More...</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB: WHATSAPP */}
          {activeTab === "whatsapp" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">
                    Share to WhatsApp Direct Chat or Group
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pre-formats the full executive sentiment summary, emotional signals, key takeaway, and direct report link.
                  </p>
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    WhatsApp Message Preview
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(whatsApp.text, "whatsapp-text")}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "whatsapp-text" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "whatsapp-text" ? "Copied!" : "Copy Text"}</span>
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {whatsApp.text}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={whatsApp.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open WhatsApp & Send</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(whatsApp.text, "whatsapp-text")}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Formatted Message</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: FACEBOOK */}
          {activeTab === "facebook" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Facebook className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-300">
                    Share to Facebook Feed or Groups
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Opens Facebook's official share dialog with your analysis title, sentiment verdict, and quote attached.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Post Quote & Content
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(facebook.quote, "facebook-quote")}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "facebook-quote" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "facebook-quote" ? "Copied!" : "Copy Quote"}</span>
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  "{facebook.quote}"
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={facebook.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Share on Facebook</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(shareUrl, "fb-link")}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Report Link</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: INSTAGRAM */}
          {activeTab === "instagram" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-pink-950/20 border border-pink-500/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-pink-300">
                    Instagram Caption & Story Pack
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tailored with formatted bullet points, emotional tone tags, and curated hashtags ready to paste into Instagram Posts, Stories, or Reels.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Ready-to-Post Instagram Caption & Hashtags
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(instagram.caption, "insta-caption")}
                    className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "insta-caption" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "insta-caption" ? "Copied!" : "Copy Caption"}</span>
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {instagram.caption}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(instagram.caption, "insta-caption")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-pink-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedKey === "insta-caption" ? "Caption Copied!" : "Copy Full Caption & Tags"}</span>
                </button>

                <a
                  href={instagram.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <span>Open Instagram Web</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB: YOUTUBE */}
          {activeTab === "youtube" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-300">
                    YouTube Creator Description & Chapters
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pre-formatted for creators, reviewers, and video producers. Includes sentiment metrics, chapter markers, video highlights, and report links.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    YouTube Video Description Snippet
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(youtube.description, "yt-desc")}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "yt-desc" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "yt-desc" ? "Copied!" : "Copy Description"}</span>
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {youtube.description}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(youtube.description, "yt-desc")}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedKey === "yt-desc" ? "Description Copied!" : "Copy Description for YouTube"}</span>
                </button>

                <a
                  href={youtube.youtubeStudioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                  <span>Open YouTube Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB: TWITTER / X */}
          {activeTab === "twitter" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Twitter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-sky-300">
                    Post to X (Twitter)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Concise, high-impact post format with sentiment score, key finding, and analytics hashtags.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Post Text
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(twitter.tweetText, "tweet-text")}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "tweet-text" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "tweet-text" ? "Copied!" : "Copy Post"}</span>
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {twitter.tweetText}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={twitter.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Post on X (Twitter)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(twitter.tweetText, "tweet-text")}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Post Text</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: LINKEDIN */}
          {activeTab === "linkedin" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Linkedin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-300">
                    LinkedIn Executive Thought Leadership Post
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Formatted for business professionals, customer experience teams, and executive stakeholders.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    LinkedIn Article / Post Preview
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(linkedIn.postText, "linkedin-post")}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "linkedin-post" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "linkedin-post" ? "Copied!" : "Copy Post"}</span>
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {linkedIn.postText}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={linkedIn.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-700/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>Share on LinkedIn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(linkedIn.postText, "linkedin-post")}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy LinkedIn Text</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: QR CODE */}
          {activeTab === "qrcode" && (
            <div className="space-y-4 text-center sm:text-left">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-purple-300">
                    Instant Mobile QR Code Scanner
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Scan with any iOS or Android camera to instantly open and interact with this report on mobile.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Analysis QR Code"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  ) : isGeneratingQR ? (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                      Generating QR...
                    </div>
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                      QR Unavailable
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Scan to Open Analysis On Your Phone
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Perfect for mobile presentations, client meetings, or testing touch responsive dashboards.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      disabled={!qrCodeUrl}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR (PNG)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(shareUrl, "qr-link")}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedKey === "qr-link" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === "qr-link" ? "Copied!" : "Copy Target URL"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MORE (TELEGRAM, EMAIL, EMBED) */}
          {activeTab === "more" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Telegram Card */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Telegram</h4>
                      <p className="text-[11px] text-slate-400">Share to channel or contacts</p>
                    </div>
                  </div>
                  <a
                    href={telegram.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Send via Telegram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Email Card */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Email Briefing</h4>
                      <p className="text-[11px] text-slate-400">Send formatted email report</p>
                    </div>
                  </div>
                  <a
                    href={email.mailtoUrl}
                    className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Compose Email</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Embed Code Widget */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Embed Iframe Widget</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(`<iframe src="${shareUrl}" width="100%" height="600" frameborder="0" title="${data.title}"></iframe>`, "embed-code")}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "embed-code" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "embed-code" ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl text-[11px] font-mono text-slate-400 select-all overflow-x-auto">
                  {`<iframe src="${shareUrl}" width="100%" height="600" frameborder="0" title="${data.title}"></iframe>`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 truncate">
            Shared links remain accessible to all recipients via web browser.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
