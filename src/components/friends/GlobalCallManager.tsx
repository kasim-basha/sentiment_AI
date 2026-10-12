import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, Volume2 } from "lucide-react";
import { CallSessionItem, FriendUser, CallType, User } from "../../types";
import { callService } from "../../services/callService";
import { realtimeClient } from "../../services/realtimeClient";
import { CallModal } from "./CallModal";

interface GlobalCallManagerProps {
  currentUser: User;
}

export function GlobalCallManager({ currentUser }: GlobalCallManagerProps) {
  const [incomingCall, setIncomingCall] = useState<CallSessionItem | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<CallSessionItem | null>(null);
  const ringtoneOscillatorRef = useRef<any>(null);

  // Initialize Realtime WebSocket Connection & Listeners
  useEffect(() => {
    if (!currentUser?.id) return;

    realtimeClient.connect();

    // Listen for incoming calls
    const unIncoming = realtimeClient.on("incoming_call", (payload) => {
      if (payload.call) {
        setIncomingCall(payload.call);
        playRingtone();
      }
    });

    const unCallRejected = realtimeClient.on("call_rejected", (payload) => {
      if (incomingCall && incomingCall._id === payload.callId) {
        stopRingtone();
        setIncomingCall(null);
      }
    });

    const unCallEnded = realtimeClient.on("call_ended", (payload) => {
      if (incomingCall && incomingCall._id === payload.callId) {
        stopRingtone();
        setIncomingCall(null);
      }
    });

    return () => {
      unIncoming();
      unCallRejected();
      unCallEnded();
      stopRingtone();
    };
  }, [currentUser?.id, incomingCall?._id]);

  // Audio synthesize subtle ringtone without external assets
  const playRingtone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      ringtoneOscillatorRef.current = { audioCtx, osc };
    } catch {
      // Audio context policy safe catch
    }
  };

  const stopRingtone = () => {
    try {
      if (ringtoneOscillatorRef.current) {
        ringtoneOscillatorRef.current.osc.stop();
        ringtoneOscillatorRef.current.audioCtx.close();
        ringtoneOscillatorRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    stopRingtone();
    try {
      const session = await callService.acceptCall(incomingCall._id);
      if (session) {
        setActiveCallSession({
          ...session,
          caller: incomingCall.caller,
          peerUser: incomingCall.caller
        });
      }
    } catch {
      // ignore
    } finally {
      setIncomingCall(null);
    }
  };

  const handleRejectIncomingCall = async () => {
    if (!incomingCall) return;
    stopRingtone();
    try {
      await callService.rejectCall(incomingCall._id);
    } catch {
      // ignore
    } finally {
      setIncomingCall(null);
    }
  };

  return (
    <>
      {/* Incoming Call Popup Banner / Modal */}
      {incomingCall && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-2xl p-5 max-w-sm w-full backdrop-blur-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {incomingCall.caller?.name?.charAt(0) || "U"}
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm truncate">{incomingCall.caller?.name || "Friend"}</h4>
                <p className="text-xs text-indigo-300 font-medium capitalize flex items-center gap-1 mt-0.5">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  Incoming {incomingCall.type} call...
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleRejectIncomingCall}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Decline</span>
              </button>

              <button
                onClick={handleAcceptIncomingCall}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                {incomingCall.type === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                <span>Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Modal Overlay */}
      {activeCallSession && (
        <CallModal
          callSession={activeCallSession}
          currentUser={currentUser}
          onClose={() => setActiveCallSession(null)}
        />
      )}
    </>
  );
}
