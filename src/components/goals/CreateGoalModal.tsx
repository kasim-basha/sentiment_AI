import React, { useState, useEffect } from "react";
import {
  GoalItem,
  GoalCategory,
  GoalMeasurementType
} from "../../types";
import {
  X,
  Target,
  Sparkles,
  Calendar,
  Smile,
  Heart,
  Activity,
  Layers,
  TrendingUp,
  Info,
  Check
} from "lucide-react";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: {
    title: string;
    description?: string;
    category: GoalCategory;
    measurementType: GoalMeasurementType;
    targetValue: number;
    targetEmotion?: string;
    targetConfidenceThreshold?: number;
    startDate: string;
    endDate: string;
  }) => Promise<void>;
  editingGoal?: GoalItem | null;
}

const CATEGORIES: Array<{ id: GoalCategory; label: string; icon: any; desc: string }> = [
  { id: "activity", label: "Activity Cadence", icon: Activity, desc: "Track total frequency of analysis recordings" },
  { id: "sentiment", label: "Sentiment Balance", icon: Smile, desc: "Monitor positive or constructive sentiment targets" },
  { id: "emotion", label: "Emotion Signals", icon: Heart, desc: "Track occurrences of specific emotional cues" },
  { id: "confidence", label: "Analysis Quality", icon: Sparkles, desc: "Target high-confidence analysis sessions" },
  { id: "multimodal", label: "Multimodal Richness", icon: Layers, desc: "Focus on multi-asset and video/image analysis" },
  { id: "trend", label: "Continuity", icon: TrendingUp, desc: "Maintain ongoing weekly analysis habits" }
];

const MEASUREMENT_TYPES: Array<{
  id: GoalMeasurementType;
  label: string;
  category: GoalCategory;
  defaultTarget: number;
  unit: string;
  requiresEmotion?: boolean;
}> = [
  { id: "analysis_count", label: "Total Completed Analyses", category: "activity", defaultTarget: 20, unit: "analyses" },
  { id: "positive_count", label: "Positive Sentiment Analyses Count", category: "sentiment", defaultTarget: 15, unit: "sessions" },
  { id: "positive_percentage", label: "Positive Sentiment Ratio (%)", category: "sentiment", defaultTarget: 75, unit: "%" },
  { id: "avg_sentiment_score", label: "Average Sentiment Score (0-100)", category: "sentiment", defaultTarget: 80, unit: "pts" },
  { id: "emotion_count", label: "Specific Emotion Signal Count", category: "emotion", defaultTarget: 10, unit: "sessions", requiresEmotion: true },
  { id: "emotion_percentage", label: "Specific Emotion Signal Ratio (%)", category: "emotion", defaultTarget: 30, unit: "%", requiresEmotion: true },
  { id: "avg_confidence", label: "Average Confidence Level (%)", category: "confidence", defaultTarget: 85, unit: "%" },
  { id: "multimodal_count", label: "Multimodal Analyses Count", category: "multimodal", defaultTarget: 10, unit: "analyses" }
];

const COMMON_EMOTIONS = [
  "Happiness",
  "Joy",
  "Excitement",
  "Calm",
  "Gratitude",
  "Surprise",
  "Confidence",
  "Sadness",
  "Anger",
  "Frustration",
  "Fear",
  "Confusion"
];

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingGoal
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("activity");
  const [measurementType, setMeasurementType] = useState<GoalMeasurementType>("analysis_count");
  const [targetValue, setTargetValue] = useState<number>(20);
  const [targetEmotion, setTargetEmotion] = useState<string>("Happiness");
  const [customEmotion, setCustomEmotion] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description || "");
      setCategory(editingGoal.category);
      setMeasurementType(editingGoal.measurementType);
      setTargetValue(editingGoal.targetValue);
      setTargetEmotion(editingGoal.targetEmotion || "Happiness");
      setStartDate(editingGoal.startDate.substring(0, 10));
      setEndDate(editingGoal.endDate.substring(0, 10));
    } else {
      // Default dates: Today to end of current month (or +30 days)
      const now = new Date();
      const startStr = now.toISOString().substring(0, 10);
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const endStr = endMonth.toISOString().substring(0, 10);

      setTitle("Complete 20 analyses this month");
      setDescription("Maintain a consistent weekly analysis workflow for all communication reviews.");
      setCategory("activity");
      setMeasurementType("analysis_count");
      setTargetValue(20);
      setTargetEmotion("Happiness");
      setCustomEmotion("");
      setStartDate(startStr);
      setEndDate(endStr);
    }
    setFormError(null);
  }, [editingGoal, isOpen]);

  // When category changes, auto select sensible measurement type
  const handleCategoryChange = (cat: GoalCategory) => {
    setCategory(cat);
    const validMeasurement = MEASUREMENT_TYPES.find(m => m.category === cat) || MEASUREMENT_TYPES[0];
    setMeasurementType(validMeasurement.id);
    setTargetValue(validMeasurement.defaultTarget);

    if (cat === "activity") setTitle("Complete 20 analyses this month");
    else if (cat === "sentiment") setTitle("Achieve 15 positive sentiment analyses");
    else if (cat === "emotion") setTitle("Track 10 Happiness emotion signals");
    else if (cat === "multimodal") setTitle("Record 10 multimodal analyses");
    else if (cat === "confidence") setTitle("Maintain 85% average analysis confidence");
  };

  const handleMeasurementChange = (mType: GoalMeasurementType) => {
    setMeasurementType(mType);
    const def = MEASUREMENT_TYPES.find(m => m.id === mType);
    if (def) {
      setTargetValue(def.defaultTarget);
    }
  };

  const applyPresetDates = (days: number) => {
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 3600 * 1000);
    setStartDate(now.toISOString().substring(0, 10));
    setEndDate(end.toISOString().substring(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Please provide a descriptive goal title.");
      return;
    }

    if (!startDate || !endDate) {
      setFormError("Both start date and target end date are required.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setFormError("The target end date must be after the start date.");
      return;
    }

    if (targetValue <= 0) {
      setFormError("Target value must be greater than zero.");
      return;
    }

    const finalEmotion = customEmotion.trim() || targetEmotion;
    const isEmotionType = measurementType === "emotion_count" || measurementType === "emotion_percentage";
    if (isEmotionType && !finalEmotion) {
      setFormError("Please select or enter an emotion signal to track.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        measurementType,
        targetValue: Number(targetValue),
        targetEmotion: isEmotionType ? finalEmotion : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to save goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentMeasurement = MEASUREMENT_TYPES.find(m => m.id === measurementType);
  const requiresEmotion = currentMeasurement?.requiresEmotion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-white animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {editingGoal ? "Edit Tracking Goal" : "Create Personal Tracking Goal"}
              </h2>
              <p className="text-xs text-slate-400">
                Authoritatively tracked from your actual SentimentAI analysis history.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Goal Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map(c => {
                const isSelected = category === c.id;
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCategoryChange(c.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-indigo-500/15 border-indigo-500 text-white ring-1 ring-indigo-500/30"
                        : "bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <span className="text-xs font-medium text-white block">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                2. Goal Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Complete 20 analyses this month"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description & Purpose (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Explain why this goal matters to your communication workflow..."
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Measurement Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              3. Measurement Type
            </label>
            <select
              value={measurementType}
              onChange={e => handleMeasurementChange(e.target.value as GoalMeasurementType)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500 transition-all cursor-pointer"
            >
              {MEASUREMENT_TYPES.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Target Emotion Selector (if required) */}
          {requiresEmotion && (
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-2.5">
              <label className="block text-xs font-semibold text-rose-300 uppercase tracking-wider">
                Target Emotion Signal
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_EMOTIONS.map(emo => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => {
                      setTargetEmotion(emo);
                      setCustomEmotion("");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      targetEmotion === emo && !customEmotion
                        ? "bg-rose-500 text-white font-semibold shadow-xs"
                        : "bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {emo}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customEmotion}
                onChange={e => setCustomEmotion(e.target.value)}
                placeholder="Or type custom emotion (e.g. Relief, Empathy)..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
              />
            </div>
          )}

          {/* Target Value & Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Value ({currentMeasurement?.unit || "value"})
              </label>
              <input
                type="number"
                min="1"
                max={measurementType.includes("percentage") ? 100 : 10000}
                value={targetValue}
                onChange={e => setTargetValue(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500 transition-all font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Quick Range:</span>
            <button
              type="button"
              onClick={() => applyPresetDates(7)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => applyPresetDates(14)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
            >
              14 Days
            </button>
            <button
              type="button"
              onClick={() => applyPresetDates(30)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => applyPresetDates(90)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
            >
              90 Days
            </button>
          </div>

          {/* Notice */}
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              Goal progress is evaluated exclusively by backend algorithms based on verified completed analyses in your account.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  <span>{editingGoal ? "Save Changes" : "Create Goal"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
