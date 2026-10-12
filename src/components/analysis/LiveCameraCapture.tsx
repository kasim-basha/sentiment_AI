import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, Video, StopCircle, X, RefreshCw, CheckCircle2 } from "lucide-react";

interface LiveCameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function LiveCameraCapture({ onCapture, onCancel }: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Timer interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === "video" // only request audio if in video mode
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setError("Failed to access camera/microphone. Please check permissions.");
      console.error("Camera access error:", err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]); // Restart camera when mode changes to get/drop audio track

  const handleCapturePhoto = () => {
    if (!videoRef.current || !stream) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `Camera_Capture_${Date.now()}.png`, { type: "image/png" });
        onCapture(file);
      }
    }, "image/png");
  };

  const handleStartRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `Video_Capture_${Date.now()}.webm`, { type: "video/webm" });
      onCapture(file);
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {mode === "photo" ? <Camera className="w-5 h-5 text-blue-400" /> : <Video className="w-5 h-5 text-rose-400" />}
          Live Capture
        </h3>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => { if (!isRecording) setMode("photo"); }}
          disabled={isRecording}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
            mode === "photo" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          } ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Camera className="w-4 h-4" /> Photo
        </button>
        <button
          onClick={() => { if (!isRecording) setMode("video"); }}
          disabled={isRecording}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
            mode === "video" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          } ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Video className="w-4 h-4" /> Video
        </button>
      </div>

      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {error ? (
          <div className="text-center p-6 space-y-4">
            <p className="text-rose-400 text-sm font-medium">{error}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white font-semibold flex items-center gap-2 mx-auto transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted // ALWAYS mute preview to avoid echo
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }} // mirror for natural feel
          />
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-rose-500/30">
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-rose-100 text-sm font-mono font-medium">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        {!error && stream && (
          <>
            {mode === "photo" ? (
              <button
                onClick={handleCapturePhoto}
                className="w-16 h-16 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-xl shadow-blue-500/20 transition-transform active:scale-95"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            ) : (
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-xl transition-all active:scale-95 ${
                  isRecording ? "bg-slate-800 hover:bg-slate-700 shadow-slate-900/50" : "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20"
                }`}
              >
                {isRecording ? <StopCircle className="w-6 h-6 text-rose-500" /> : <Video className="w-6 h-6 text-white" />}
              </button>
            )}
          </>
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        Captured media will be automatically attached to your analysis.
      </p>
    </div>
  );
}
