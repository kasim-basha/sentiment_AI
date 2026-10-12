import { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Shield,
  Sparkles,
  Maximize2,
  Minimize2
} from "lucide-react";
import { CallSessionItem, FriendUser } from "../../types";
import { callService } from "../../services/callService";
import { webrtcManager } from "../../services/webrtcService";
import { realtimeClient } from "../../services/realtimeClient";

interface CallModalProps {
  callSession: CallSessionItem;
  currentUser: { id: string; name: string };
  onClose: () => void;
}

export function CallModal({ callSession, currentUser, onClose }: CallModalProps) {
  const isCaller = callSession.callerId === currentUser.id;
  const peerUser: FriendUser | undefined = callSession.peerUser || (isCaller ? callSession.receiver : callSession.caller);

  const [callStatus, setCallStatus] = useState<string>(callSession.status);
  const [duration, setDuration] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(callSession.type === "audio");
  const [isConnecting, setIsConnecting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("excellent");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<any>(null);

  // Handle incoming / initial connection setup
  useEffect(() => {
    let mounted = true;

    async function initMediaAndRTC() {
      try {
        const stream = await webrtcManager.startLocalMedia(callSession.type);
        if (localVideoRef.current && stream && callSession.type === "video") {
          localVideoRef.current.srcObject = stream;
        }

        const targetId = isCaller ? callSession.receiverId : callSession.callerId;

        await webrtcManager.initializePeerConnection(
          callSession._id,
          targetId,
          isCaller,
          (remoteStream) => {
            if (!mounted) return;
            if (remoteVideoRef.current && callSession.type === "video") {
              remoteVideoRef.current.srcObject = remoteStream;
            }
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
            }
          },
          (state) => {
            if (!mounted) return;
            if (state === "connected") {
              setCallStatus("connected");
              setIsConnecting(false);
            } else if (state === "disconnected" || state === "failed" || state === "closed") {
              setConnectionQuality("poor");
            }
          }
        );
      } catch (err) {
        console.error("Failed to initialize WebRTC call:", err);
      }
    }

    initMediaAndRTC();

    // Listen for call acceptance or rejection
    const unCallAccepted = realtimeClient.on("call_accepted", (msg) => {
      if (msg.callId === callSession._id) {
        setCallStatus("connected");
        setIsConnecting(false);
      }
    });

    const unCallRejected = realtimeClient.on("call_rejected", (msg) => {
      if (msg.callId === callSession._id) {
        setCallStatus("rejected");
        setTimeout(handleEndCall, 1500);
      }
    });

    const unCallEnded = realtimeClient.on("call_ended", (msg) => {
      if (msg.callId === callSession._id) {
        setCallStatus("ended");
        setTimeout(handleEndCall, 1500);
      }
    });

    return () => {
      mounted = false;
      unCallAccepted();
      unCallRejected();
      unCallEnded();
      if (timerRef.current) clearInterval(timerRef.current);
      webrtcManager.cleanup();
    };
  }, [callSession._id]);

  // Duration Timer
  useEffect(() => {
    if (callStatus === "connected") {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const handleToggleAudio = () => {
    const muted = webrtcManager.toggleAudio();
    setIsAudioMuted(muted);
  };

  const handleToggleVideo = () => {
    const muted = webrtcManager.toggleVideo();
    setIsVideoMuted(muted);
  };

  const handleEndCall = async () => {
    try {
      await callService.endCall(callSession._id);
    } catch {
      // ignore
    } finally {
      webrtcManager.cleanup();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <audio ref={remoteAudioRef} autoPlay />

      <div className={`relative w-full ${isFullscreen ? 'h-full max-w-none' : 'max-w-4xl h-[650px]'} bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300`}>

        {/* Top Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              {peerUser?.name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-base">{peerUser?.name || "Friend"}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                  {callSession.type} Call
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${callStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-400 animate-ping"}`} />
                {callStatus === "connected" ? (
                  <span className="font-mono text-emerald-400">{formatDuration(duration)}</span>
                ) : callStatus === "rejected" ? (
                  <span className="text-rose-400">Call Declined</span>
                ) : callStatus === "ended" ? (
                  <span className="text-slate-400">Call Ended</span>
                ) : (
                  <span className="text-amber-400">{isCaller ? "Ringing..." : "Connecting..."}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>End-to-End Encrypted</span>
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video / Visual Stage */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {callSession.type === "video" ? (
            <>
              {/* Remote Video (Main) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Fallback avatar if remote video track has not started yet */}
              {callStatus !== "connected" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl animate-pulse">
                      {peerUser?.name?.charAt(0) || "U"}
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-400/40 animate-ping pointer-events-none" />
                  </div>
                  <h4 className="text-white text-xl font-medium mt-6">{peerUser?.name}</h4>
                  <p className="text-slate-400 text-sm mt-1">{isCaller ? "Calling friend..." : "Connecting video feed..."}</p>
                </div>
              )}

              {/* Local Video Picture-in-Picture */}
              <div className="absolute bottom-24 right-4 z-20 w-44 h-32 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
                />
                {isVideoMuted && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                    <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                    <span className="text-[10px]">Camera off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[10px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
                  You
                </div>
              </div>
            </>
          ) : (
            /* Audio Call Atmosphere & Waveform Visualizer */
            <div className="flex flex-col items-center justify-center text-center p-8 z-10">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-5xl font-bold text-white shadow-2xl">
                  {peerUser?.name?.charAt(0) || "U"}
                </div>
                {callStatus === "connected" && (
                  <div className="absolute -inset-3 rounded-full border-2 border-indigo-400/40 animate-pulse pointer-events-none" />
                )}
              </div>

              <h4 className="text-2xl font-bold text-white mb-2">{peerUser?.name}</h4>
              <p className="text-sm text-slate-400 mb-8">{peerUser?.email}</p>

              {/* Dynamic Animated Waveform Bars */}
              {callStatus === "connected" ? (
                <div className="flex items-center gap-1.5 h-12">
                  {[40, 75, 100, 60, 30, 85, 95, 45, 70, 80, 50, 90].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className={`w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 transition-all duration-300 animate-pulse`}
                      style-extra={{ animationDelay: `${i * 100}ms` } as any}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-indigo-400 text-sm animate-pulse">
                  <Volume2 className="w-4 h-4" />
                  <span>Connecting secure voice channel...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-20 p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            SentimentAI HD Audio/Video
          </div>

          <div className="flex items-center gap-4 mx-auto sm:mx-0">
            {/* Audio Mute/Unmute */}
            <button
              onClick={handleToggleAudio}
              className={`p-3.5 rounded-full transition-all shadow-lg ${
                isAudioMuted
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              }`}
              title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Camera On/Off (for video calls) */}
            {callSession.type === "video" && (
              <button
                onClick={handleToggleVideo}
                className={`p-3.5 rounded-full transition-all shadow-lg ${
                  isVideoMuted
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                }`}
                title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
              >
                {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Call</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">HD Quality</span>
          </div>
        </div>

      </div>
    </div>
  );
}
