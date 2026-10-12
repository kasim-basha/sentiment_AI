import React, { useState, useEffect } from "react";
import { UserProfile } from "../../types";
import { shareService } from "../../services/shareService";
import { Copy, Check, QrCode, Download, ExternalLink, X, Share2 } from "lucide-react";

interface ProfileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export function ProfileShareModal({ isOpen, onClose, profile }: ProfileShareModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Generate a shareable URL (For demonstration, using the app's current origin and a simulated public profile route)
  const profileUrl = `${window.location.origin}/#/public/profile/${profile.userId}`;

  // Pre-generate QR Code when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsGeneratingQR(true);
      shareService.generateQRCode(profileUrl)
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error("QR Code error:", err))
        .finally(() => setIsGeneratingQR(false));
    }
  }, [isOpen, profileUrl]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `sentiment-ai-profile-qr-${profile.userId.slice(0, 6)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* MODAL HEADER */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-400" /> Share Profile
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
              Share your SentimentAI profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6">
          {/* Link Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-300">Public Profile Link</h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[13px] font-mono text-slate-400 truncate mr-4">
                {profileUrl}
              </div>
              <button
                type="button"
                onClick={() => handleCopy(profileUrl, "link")}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
              >
                {copiedKey === "link" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === "link" ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="space-y-4 text-center sm:text-left">
            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-300">
                  Instant Mobile QR Code
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Scan with any iOS or Android camera to instantly open your public profile on mobile.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-6 p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Profile QR Code"
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : isGeneratingQR ? (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                    QR Unavailable
                  </div>
                )}
              </div>

              <div className="space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Download & Share
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[200px]">
                    Use this QR code on business cards, presentations, or social media.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    disabled={!qrCodeUrl}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 truncate text-center sm:text-left">
            Anyone with this link or QR code can view your public profile.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 w-full sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
