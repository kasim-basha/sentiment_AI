import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  GoalItem,
  GoalCategory,
  GoalStatus,
  ViewState
} from "../../types";
import { goalService } from "../../services/goalService";
import { GoalCard } from "./GoalCard";
import { CreateGoalModal } from "./CreateGoalModal";
import { GoalDetailModal } from "./GoalDetailModal";
import { MoodTrackingView } from "./MoodTrackingView";
import {
  Target,
  TrendingUp,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Smile,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Activity,
  Layers,
  Heart,
  SlidersHorizontal
} from "lucide-react";

interface GoalsPageProps {
  user: User | null;
  onNavigate: (view: ViewState) => void;
  onViewAnalysis?: (id: string) => void;
  onViewReport?: (id: string) => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({
  user,
  onNavigate,
  onViewAnalysis,
  onViewReport
}) => {
  const [activeTab, setActiveTab] = useState<"goals" | "mood">("goals");
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [selectedGoalDetail, setSelectedGoalDetail] = useState<GoalItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await goalService.getGoals({
        category: categoryFilter,
        status: statusFilter,
        sort: sortBy
      });
      setGoals(data);
    } catch (err: any) {
      console.error("Failed to load goals:", err);
      showToast(err.message || "Failed to load goals");
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter, sortBy]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreateOrUpdateGoal = async (goalData: any) => {
    if (editingGoal) {
      const updated = await goalService.updateGoal(editingGoal._id, goalData);
      setGoals(prev => prev.map(g => g._id === updated._id ? updated : g));
      showToast("Goal updated successfully.");
    } else {
      const created = await goalService.createGoal(goalData);
      setGoals(prev => [created, ...prev]);
      showToast("New tracking goal created!");
    }
    setEditingGoal(null);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm("Are you sure you want to delete this goal and its tracking history?")) return;
    try {
      await goalService.deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g._id !== goalId));
      if (selectedGoalDetail?._id === goalId) setSelectedGoalDetail(null);
      showToast("Goal deleted.");
    } catch (err: any) {
      showToast(err.message || "Failed to delete goal");
    }
  };

  const handlePauseGoal = async (goalId: string) => {
    try {
      const paused = await goalService.pauseGoal(goalId);
      setGoals(prev => prev.map(g => g._id === goalId ? paused : g));
      if (selectedGoalDetail?._id === goalId) setSelectedGoalDetail(paused);
      showToast("Goal paused.");
    } catch (err: any) {
      showToast(err.message || "Failed to pause goal");
    }
  };

  const handleResumeGoal = async (goalId: string) => {
    try {
      const resumed = await goalService.resumeGoal(goalId);
      setGoals(prev => prev.map(g => g._id === goalId ? resumed : g));
      if (selectedGoalDetail?._id === goalId) setSelectedGoalDetail(resumed);
      showToast("Goal resumed and progress recalculated.");
    } catch (err: any) {
      showToast(err.message || "Failed to resume goal");
    }
  };

  // Filtered goals by search query
  const filteredGoals = goals.filter(g => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.title.toLowerCase().includes(q) || (g.description && g.description.toLowerCase().includes(q));
  });

  // Calculate high level stats
  const activeCount = goals.filter(g => g.status === "active").length;
  const completedCount = goals.filter(g => g.status === "completed").length;
  const avgCompletion = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress?.percentage || 0), 0) / goals.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Goals & Mood Tracking
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Set objective analysis goals and monitor sentiment/emotion trajectories from your verified history.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingGoal(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Goal</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Goals vs Mood Tracking */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-px">
          <button
            onClick={() => setActiveTab("goals")}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "goals"
                ? "border-indigo-500 text-white bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Goals Dashboard ({goals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("mood")}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === "mood"
                ? "border-indigo-500 text-white bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Mood & Sentiment Tracking</span>
          </button>
        </div>

        {/* TAB 1: GOALS DASHBOARD */}
        {activeTab === "goals" && (
          <div className="space-y-6">

            {/* High level metrics banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Goals
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {activeCount}
                </div>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Currently tracking
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Completed Goals
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
                  {completedCount}
                </div>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Targets attained
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Avg Goal Progress
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-indigo-400 tracking-tight">
                  {avgCompletion}%
                </div>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Across all active goals
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Calculation Engine
                </span>
                <div className="text-xs font-semibold text-purple-400 flex items-center gap-1.5 mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span>Authoritative</span>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  Derived from DB analyses
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search goals by title or keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Filters & Sort */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="activity">Activity Cadence</option>
                  <option value="sentiment">Sentiment Balance</option>
                  <option value="emotion">Emotion Signals</option>
                  <option value="confidence">Confidence Level</option>
                  <option value="multimodal">Multimodal Richness</option>
                  <option value="trend">Continuity</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="expired">Expired</option>
                  <option value="not_started">Upcoming</option>
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="deadline">Soonest Deadline</option>
                  <option value="progress">Highest Progress</option>
                  <option value="oldest">Oldest First</option>
                </select>

                <button
                  onClick={loadGoals}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
                  title="Refresh Goals"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Goals Grid */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Evaluating goal calculations against saved analyses...</p>
              </div>
            ) : filteredGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredGoals.map(goal => (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    onEdit={g => {
                      setEditingGoal(g);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={handleDeleteGoal}
                    onPause={handlePauseGoal}
                    onResume={handleResumeGoal}
                    onViewDetails={g => setSelectedGoalDetail(g)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl mx-auto flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-white">No tracking goals found</h3>
                  <p className="text-xs text-slate-400">
                    {searchQuery
                      ? "No goals match your search query or selected filters."
                      : "Create your first goal to begin tracking cadence, sentiment targets, or specific emotion signals."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingGoal(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Goal</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: MOOD & SENTIMENT TRACKING */}
        {activeTab === "mood" && (
          <MoodTrackingView onViewAnalysis={onViewAnalysis} />
        )}

      </div>

      {/* Create / Edit Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleCreateOrUpdateGoal}
        editingGoal={editingGoal}
      />

      {/* Goal Deep Dive Modal */}
      <GoalDetailModal
        goal={selectedGoalDetail}
        isOpen={Boolean(selectedGoalDetail)}
        onClose={() => setSelectedGoalDetail(null)}
        onEdit={g => {
          setSelectedGoalDetail(null);
          setEditingGoal(g);
          setIsCreateModalOpen(true);
        }}
        onDelete={handleDeleteGoal}
        onPause={handlePauseGoal}
        onResume={handleResumeGoal}
        onViewAnalysis={onViewAnalysis}
      />

    </div>
  );
};
