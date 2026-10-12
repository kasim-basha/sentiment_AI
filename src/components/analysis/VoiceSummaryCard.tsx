import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Globe,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Gauge
} from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  LanguageOption,
  findLanguage,
  speakSpeechSynthesis,
  stopSpeechSynthesis
} from '../../utils/languages';
import { analysisService } from '../../services/analysisService';

interface VoiceSummaryCardProps {
  summary: string;
  initialLanguage?: string;
}

export function VoiceSummaryCard({ summary, initialLanguage = "English" }: VoiceSummaryCardProps) {
  const [currentSummary, setCurrentSummary] = useState(summary);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(() => findLanguage(initialLanguage));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [copied, setCopied] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Keep internal summary in sync if parent summary changes
  useEffect(() => {
    setCurrentSummary(summary);
  }, [summary]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
    };
  }, []);

  const handleLanguageChange = async (lang: LanguageOption) => {
    if (lang.code === selectedLanguage.code) return;

    // Stop any ongoing speech
    stopSpeechSynthesis();
    setIsPlaying(false);
    setIsPaused(false);
    setSelectedLanguage(lang);
    setAudioError(null);

    // If English is selected and original summary was in English, or to translate
    setIsTranslating(true);
    try {
      const translated = await analysisService.translateSummary(summary, lang.name);
      setCurrentSummary(translated);
    } catch (err) {
      console.log("Translation failed, using original summary:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTogglePlay = () => {
    setAudioError(null);

    if (isPlaying) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          setIsPaused(true);
          return;
        } else if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
          return;
        }
      }
      stopSpeechSynthesis();
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);

    speakSpeechSynthesis(
      currentSummary,
      selectedLanguage.code,
      playbackRate,
      () => {
        setIsPlaying(true);
        setIsPaused(false);
      },
      () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
      (err) => {
        console.log("Speech synthesis notification:", err);
        setIsPlaying(false);
        setIsPaused(false);
        setAudioError("Audio playback not supported in this browser window. You can read the narration below.");
      }
    );
  };

  const handleRestartAudio = () => {
    stopSpeechSynthesis();
    setIsPlaying(false);
    setIsPaused(false);
    setTimeout(() => {
      handleTogglePlay();
    }, 100);
  };

  const togglePlaybackRate = () => {
    const rates = [0.8, 1.0, 1.25, 1.5];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);

    // If already playing, restart with new rate
    if (isPlaying) {
      stopSpeechSynthesis();
      speakSpeechSynthesis(
        currentSummary,
        selectedLanguage.code,
        newRate,
        () => setIsPlaying(true),
        () => {
          setIsPlaying(false);
          setIsPaused(false);
        }
      );
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.log("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-600/10 via-slate-900/50 to-indigo-600/10 border border-blue-500/20 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl ${isPlaying ? 'bg-blue-500/30 border-blue-400 shadow-lg shadow-blue-500/30 animate-pulse' : 'bg-blue-600/20 border-blue-500/30'} border flex items-center justify-center transition-all`}>
            {isPlaying ? (
              <Volume2 className="w-7 h-7 text-blue-400 animate-bounce" />
            ) : (
              <Volume2 className="w-7 h-7 text-blue-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xl font-black tracking-tight text-white">Voice Assistant Summary</h4>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
                <Sparkles className="w-3 h-3" /> AI TTS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-1">
              Multimodal Speech Narration • {selectedLanguage.flag} {selectedLanguage.nativeName}
            </p>
          </div>
        </div>

        {/* Action Controls & Language Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl px-3 py-2 text-xs">
            <Globe className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-slate-400 font-medium hidden sm:inline">Voice:</span>
            <select
              value={selectedLanguage.code}
              onChange={(e) => {
                const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                if (found) handleLanguageChange(found);
              }}
              disabled={isTranslating}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer pr-2 text-xs"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white py-1">
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
            {isTranslating && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
          </div>

          {/* Speed Button */}
          <button
            onClick={togglePlaybackRate}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Speech Speed"
          >
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span>{playbackRate}x</span>
          </button>

          {/* Replay Button (visible when playing or paused) */}
          {(isPlaying || isPaused) && (
            <button
              onClick={handleRestartAudio}
              className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Primary Listen / Pause Button */}
          <button
            onClick={handleTogglePlay}
            disabled={isTranslating}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2.5 cursor-pointer shadow-lg active:scale-95 ${
              isPlaying && !isPaused
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : isPaused
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>🔊 Listen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Language Switcher Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Globe className="w-3 h-3 text-slate-400" /> Quick Voice:
        </span>
        {[
          SUPPORTED_LANGUAGES.find(l => l.code === "en-US")!,
          SUPPORTED_LANGUAGES.find(l => l.code === "es-ES")!,
          SUPPORTED_LANGUAGES.find(l => l.code === "fr-FR")!,
          SUPPORTED_LANGUAGES.find(l => l.code === "de-DE")!,
          SUPPORTED_LANGUAGES.find(l => l.code === "hi-IN")!,
          SUPPORTED_LANGUAGES.find(l => l.code === "ar-SA")!,
          SUPPORTED_LANGUAGES.find(l => l.code === "ja-JP")!,
          SUPPORTED_LANGUAGES.find(l => l.code === "te-IN")!,
        ].filter(Boolean).map((lang) => {
          const isCurrent = selectedLanguage.code === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang)}
              disabled={isTranslating}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          );
        })}
      </div>

      {/* Active Audio Waveform Visualizer */}
      {isPlaying && !isPaused && (
        <div className="mb-4 flex items-center justify-between px-6 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold text-blue-300">
              Speaking in {selectedLanguage.flag} {selectedLanguage.name}...
            </span>
          </div>

          <div className="flex items-end gap-1 h-5">
            {[40, 75, 100, 60, 90, 45, 80, 100, 70, 50, 85, 60].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-blue-400 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.4 + (i % 5) * 0.15}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Narration Quote Container */}
      <div className="bg-slate-950/70 rounded-3xl p-6 sm:p-8 border border-blue-500/15 shadow-inner relative group">
        {isTranslating ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm font-bold">Translating voice narration into {selectedLanguage.flag} {selectedLanguage.name}...</p>
          </div>
        ) : (
          <>
            <p className="text-lg sm:text-xl text-slate-200 font-serif italic leading-relaxed select-text" dir={selectedLanguage.dir || "ltr"}>
              "{currentSummary}"
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Language: <strong className="text-slate-400 font-bold">{selectedLanguage.name} ({selectedLanguage.nativeName})</strong>
              </span>

              <button
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                title="Copy Narration Text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Narration"}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {audioError && (
        <div className="mt-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          {audioError}
        </div>
      )}
    </div>
  );
}
