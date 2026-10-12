import { GoalItem, GoalCategory, GoalMeasurementType, GoalProgressCalculation, GoalProgressHistoryItem } from "../types";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-access-token"] = token;
  }
  return headers;
}

export const goalService = {
  getGoals: async (filters?: { status?: string; category?: string; sort?: string }): Promise<GoalItem[]> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") params.set("status", filters.status);
    if (filters?.category && filters.category !== "all") params.set("category", filters.category);
    if (filters?.sort) params.set("sort", filters.sort);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`/api/goals${qs}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to fetch goals");
    }

    const data = await res.json();
    return data.data || [];
  },

  getGoalById: async (goalId: string): Promise<GoalItem & { history?: GoalProgressHistoryItem[] }> => {
    const res = await fetch(`/api/goals/${goalId}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to fetch goal");
    }

    const data = await res.json();
    return data.data;
  },

  createGoal: async (goalData: {
    title: string;
    description?: string;
    category: GoalCategory;
    measurementType: GoalMeasurementType;
    targetValue: number;
    targetEmotion?: string;
    targetConfidenceThreshold?: number;
    startDate: string;
    endDate: string;
  }): Promise<GoalItem> => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(goalData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to create goal");
    }

    const data = await res.json();
    return data.data;
  },

  updateGoal: async (
    goalId: string,
    updateData: Partial<{
      title: string;
      description: string;
      category: GoalCategory;
      measurementType: GoalMeasurementType;
      targetValue: number;
      targetEmotion: string;
      targetConfidenceThreshold: number;
      startDate: string;
      endDate: string;
    }>
  ): Promise<GoalItem> => {
    const res = await fetch(`/api/goals/${goalId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to update goal");
    }

    const data = await res.json();
    return data.data;
  },

  deleteGoal: async (goalId: string): Promise<boolean> => {
    const res = await fetch(`/api/goals/${goalId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to delete goal");
    }

    return true;
  },

  pauseGoal: async (goalId: string): Promise<GoalItem> => {
    const res = await fetch(`/api/goals/${goalId}/pause`, {
      method: "POST",
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to pause goal");
    }

    const data = await res.json();
    return data.data;
  },

  resumeGoal: async (goalId: string): Promise<GoalItem> => {
    const res = await fetch(`/api/goals/${goalId}/resume`, {
      method: "POST",
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to resume goal");
    }

    const data = await res.json();
    return data.data;
  },

  getGoalProgress: async (goalId: string): Promise<{ progress: GoalProgressCalculation; history: GoalProgressHistoryItem[] }> => {
    const res = await fetch(`/api/goals/${goalId}/progress`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to fetch goal progress");
    }

    const data = await res.json();
    return data.data;
  }
};
