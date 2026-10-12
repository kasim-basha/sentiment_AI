import React, { useState, useEffect } from 'react';
import { Loader2, Video, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalysisProcessingProps {
  currentStep: string;
}

export function AnalysisProcessing({ currentStep }: AnalysisProcessingProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isVideoRelated = currentStep.toLowerCase().includes("video") || currentStep.toLowerCase().includes("track");

  return (
    <div className="py-16 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative inline-block"
      >
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full border-2 border-blue-500/30 bg-slate-900/60 flex items-center justify-center shadow-xl">
          {isVideoRelated ? (
            <div className="relative">
              <Video className="w-9 h-9 text-blue-400 animate-pulse" />
              <div className="absolute -top-1 -right-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              </div>
            </div>
          ) : (
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          )}
        </div>
      </motion.div>

      <motion.h3
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 text-2xl font-bold text-white tracking-tight"
      >
        {currentStep}
      </motion.h3>

      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
          Elapsed: {seconds}s
        </span>
        {seconds > 15 && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" /> Deep Multimodal Analysis
          </span>
        )}
      </div>

      <p className="mt-3 text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
        SentimentAI is evaluating visual frames, facial expressions, speech tone, and narrative subtext...
      </p>
    </div>
  );
}
