import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MultimodalAnalysisResult, ViewState, User } from '../../types';
import { AnalysisSessionSummary } from './AnalysisSessionSummary';
import { SentimentCard } from './SentimentCard';
import { EmotionAnalysisCard } from './EmotionAnalysisCard';
import { TextInsightCard } from './TextInsightCard';
import { ObservationsCard } from './ObservationsCard';
import { ListInsightCard } from './ListInsightCard';
import { RelationshipCard } from './RelationshipCard';
import { VoiceSummaryCard } from './VoiceSummaryCard';
import { LongVideoTimelineCard } from './LongVideoTimelineCard';
import { VeTimeSaverCard } from './VeTimeSaverCard';
import { ResultActions } from './ResultActions';
import { AnalysisSaveBar } from './AnalysisSaveBar';
import { SaveAnalysisModal } from './SaveAnalysisModal';
import { ShareModal } from '../share/ShareModal';
import { shareService } from '../../services/shareService';
import { FileContentInspectionCard } from './FileContentInspectionCard';
import { SentimentCoachingCard } from './SentimentCoachingCard';
import { ShareAnalysisDialog } from '../community/ShareAnalysisDialog';
import { ClarityAssistantModal } from '../clarity/ClarityAssistantModal';
import { Brain, Sparkles, HelpCircle } from 'lucide-react';

interface AnalysisResultsProps {
  result: MultimodalAnalysisResult;
  onNavigate: (view: ViewState) => void;
  onNewAnalysis: () => void;
  onCopy: () => void;
  userId?: string;
  user?: User;
  isSaved?: boolean;
  onViewSavedFile?: (analysisId: string) => void;
  onViewReport?: (analysisId: string) => void;
}

export function AnalysisResults({
  result,
  onNavigate,
  onNewAnalysis,
  onCopy,
  userId = "user_default",
  user,
  isSaved = true,
  onViewSavedFile,
  onViewReport
}: AnalysisResultsProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommunityShareOpen, setIsCommunityShareOpen] = useState(false);
  const [isClarityAssistantOpen, setIsClarityAssistantOpen] = useState(false);
  const [clarityInitialQuestion, setClarityInitialQuestion] = useState<string | undefined>();
  const [clarityInitialMode, setClarityInitialMode] = useState<"simple" | "detailed" | "general">("general");
  const [clarityInitialSection, setClarityInitialSection] = useState<string | undefined>();

  const effectiveUser: User = user || {
    id: userId,
    name: "SentimentAI Analyst",
    email: "",
    role: "user",
    status: "active"
  };

  const handleOpenClarityAssistant = (
    initialQuestion?: string,
    mode: "simple" | "detailed" | "general" = "general",
    section?: string
  ) => {
    setClarityInitialQuestion(initialQuestion);
    setClarityInitialMode(mode);
    setClarityInitialSection(section);
    setIsClarityAssistantOpen(true);
  };

  const handleOpenSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Analysis Results</h2>
        <p className="text-slate-400 text-base sm:text-lg font-medium">
          Comprehensive Multimodal Sentiment & Emotion Discovery
        </p>
      </div>

      {/* Prominent Save & File Inspection Toolbar */}
      <AnalysisSaveBar
        result={result}
        isSaved={isSaved}
        onOpenSaveModal={handleOpenSaveModal}
        onViewSavedFile={onViewSavedFile}
        onViewReport={onViewReport}
        onShare={handleOpenShareModal}
        onShareToCommunity={() => setIsCommunityShareOpen(true)}
        onOpenClarityAssistant={handleOpenClarityAssistant}
      />

      {/* Step 19: AI Clarity Assistant Callout Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/30 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Don't understand your analysis?</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                💡 AI Clarity Assistant
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Ask questions in simple words or switch between Simple and Detailed explanation modes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenClarityAssistant("Can you explain this entire analysis in simple terms?", "simple")}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explain in Simple Words</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenClarityAssistant()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Ask a Question</span>
          </button>
        </div>
      </div>

      <AnalysisSessionSummary summary={result.input_summary} />

      {/* Factual File Content Breakdown */}
      {(result.exact_file_contents || (result.file_content_items && result.file_content_items.length > 0)) && (
        <FileContentInspectionCard
          exactFileContents={result.exact_file_contents}
          fileContentItems={result.file_content_items}
        />
      )}

      {/* VE Time-Saver Card (Executive Digest, Hours/Pages Saved, Section Synthesis) */}
      {(result.time_saved_summary || result.document_metadata || result.section_breakdown || result.executive_takeaways) && (
        <VeTimeSaverCard
          timeSavedSummary={result.time_saved_summary}
          documentMetadata={result.document_metadata}
          videoMetadata={result.video_metadata}
          sectionBreakdown={result.section_breakdown}
          executiveTakeaways={result.executive_takeaways}
        />
      )}

      {result.timeline_breakdown && result.timeline_breakdown.length > 0 && (
        <LongVideoTimelineCard
          timeline={result.timeline_breakdown}
          turningPoints={result.turning_points}
          videoMetadata={result.video_metadata}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <SentimentCard sentiment={result.overall_sentiment} />
        </div>
        <div className="md:col-span-7">
          <EmotionAnalysisCard emotions={result.emotions} />
        </div>
      </div>

      {/* Actionable Sentiment Coaching Guidance */}
      {result.sentiment_coaching && (
        <SentimentCoachingCard
          sentimentLabel={result.overall_sentiment.label}
          coaching={result.sentiment_coaching}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TextInsightCard title="Meaning" content={result.meaning} icon="meaning" />
        <TextInsightCard title="Emotional Context" content={result.emotional_context} icon="context" />
      </div>

      <ObservationsCard visual={result.visual_observations} audio={result.audio_context} />

      <RelationshipCard content={result.multimodal_relationship} />

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-8">
        <ListInsightCard title="Key Insights" items={result.key_insights} type="insights" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ListInsightCard title="Positive Signals" items={result.positive_signals} type="positive" />
        <ListInsightCard title="Concerns" items={result.concerns} type="concerns" />
      </div>

      <VoiceSummaryCard summary={result.tts_summary} initialLanguage={result.language || "English"} />

      <ResultActions
        onNavigate={onNavigate}
        onNewAnalysis={onNewAnalysis}
        onCopy={onCopy}
        onSaveAnalysis={handleOpenSaveModal}
        onViewSavedFile={onViewSavedFile ? () => onViewSavedFile(result.analysis_id) : undefined}
        onShare={handleOpenShareModal}
        onOpenClarityAssistant={() => handleOpenClarityAssistant()}
        isSaved={isSaved}
      />

      {/* Step 19: GenAI Clarity Assistant Modal */}
      <ClarityAssistantModal
        isOpen={isClarityAssistantOpen}
        onClose={() => setIsClarityAssistantOpen(false)}
        analysisId={result.analysis_id}
        analysisTitle={result.meaning?.split(".")[0]?.slice(0, 50) || "Multimodal Analysis"}
        analysisResult={result}
        initialQuestion={clarityInitialQuestion}
        initialMode={clarityInitialMode}
        initialSection={clarityInitialSection}
        user={effectiveUser}
      />

      {/* Save Analysis Modal */}
      <SaveAnalysisModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        result={result}
        userId={userId}
        onViewSavedFile={onViewSavedFile}
        onViewReport={onViewReport}
      />

      {/* Social & Multimodal Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={shareService.fromAnalysisResult(result)}
      />

      {/* SentimentAI Community Share Dialog */}
      <ShareAnalysisDialog
        isOpen={isCommunityShareOpen}
        onClose={() => setIsCommunityShareOpen(false)}
        analysisId={result.analysis_id}
        defaultTitle={result.meaning?.split(".")[0]?.slice(0, 80) || "Multimodal Sentiment Analysis"}
        defaultDescription={result.tts_summary || "Key insights, tone dynamics, and emotional trajectory discovered in this session."}
        user={effectiveUser}
        onSharedSuccess={() => {
          // Optional callback after successfully sharing
        }}
      />
    </motion.div>
  );
}
