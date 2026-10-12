import { authService } from "./authService";
import {
  GlobalSearchResponse,
  SearchCategory,
  SearchSortOption,
  SearchSentimentOption,
  SearchInputTypeOption,
  SearchSuggestion,
  SearchHistoryItem
} from "../types";

export interface SearchQueryOptions {
  q?: string;
  category?: SearchCategory;
  sentiment?: SearchSentimentOption;
  inputType?: SearchInputTypeOption;
  sort?: SearchSortOption;
  page?: number;
  limit?: number;
}

class SearchServiceClient {
  private getHeaders(): HeadersInit {
    const token = authService.getStoredToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  // Global multi-category or single-category search
  async globalSearch(options: SearchQueryOptions): Promise<GlobalSearchResponse> {
    const params = new URLSearchParams();
    if (options.q) params.set("q", options.q);
    if (options.category && options.category !== "all") params.set("category", options.category);
    if (options.sentiment && options.sentiment !== "all") params.set("sentiment", options.sentiment);
    if (options.inputType && options.inputType !== "all") params.set("inputType", options.inputType);
    if (options.sort) params.set("sort", options.sort);
    if (options.page) params.set("page", options.page.toString());
    if (options.limit) params.set("limit", options.limit.toString());

    const res = await fetch(`/api/search?${params.toString()}`, {
      headers: this.getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      let msg = "Failed to perform search.";
      if (typeof err.error === "string") {
        msg = err.error;
      } else if (err.error && typeof err.error.message === "string") {
        msg = err.error.message;
      } else if (typeof err.message === "string") {
        msg = err.message;
      }
      throw new Error(msg);
    }

    return res.json();
  }

  // Quick typeahead suggestions
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query || !query.trim()) return [];
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.suggestions || [];
    } catch {
      return [];
    }
  }

  // Fetch recent search history
  async getHistory(): Promise<SearchHistoryItem[]> {
    try {
      const res = await fetch("/api/search/history", {
        headers: this.getHeaders()
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.history || [];
    } catch {
      return [];
    }
  }

  // Save a search query to history
  async saveHistory(query: string, category: string = "all"): Promise<SearchHistoryItem | null> {
    if (!query || !query.trim()) return null;
    try {
      const res = await fetch("/api/search/history", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ query: query.trim(), category })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.item || null;
    } catch {
      return null;
    }
  }

  // Remove single search history entry
  async deleteHistoryItem(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/search/history/${id}`, {
        method: "DELETE",
        headers: this.getHeaders()
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Clear all search history
  async clearHistory(): Promise<boolean> {
    try {
      const res = await fetch("/api/search/history", {
        method: "DELETE",
        headers: this.getHeaders()
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const searchService = new SearchServiceClient();
