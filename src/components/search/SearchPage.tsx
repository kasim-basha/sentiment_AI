import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  SearchCategory,
  SearchSortOption,
  SearchSentimentOption,
  SearchInputTypeOption,
  SearchSuggestion,
  SearchHistoryItem,
  GlobalSearchResponse,
  SearchUserResult,
  SearchFriendResult,
  SearchAnalysisResult,
  SearchReportResult,
  SearchCommunityResult
} from "../../types";
import { searchService } from "../../services/searchService";
import { friendService } from "../../services/friendService";
import { SearchBar } from "./SearchBar";
import { SearchSuggestions } from "./SearchSuggestions";
import { SearchFilters } from "./SearchFilters";
import { RecentSearches } from "./RecentSearches";
import { SearchEmptyState } from "./SearchEmptyState";
import { UserSearchResult } from "./UserSearchResult";
import { FriendSearchResult } from "./FriendSearchResult";
import { AnalysisSearchResult } from "./AnalysisSearchResult";
import { ReportSearchResult } from "./ReportSearchResult";
import { CommunitySearchResult } from "./CommunitySearchResult";
import { SearchResultGroup } from "./SearchResultGroup";
import {
  Users,
  Brain,
  FileText,
  Globe,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2
} from "lucide-react";

interface SearchPageProps {
  currentUser: User;
  initialQuery?: string;
  initialCategory?: SearchCategory;
  onNavigateToDashboard?: () => void;
  onViewAnalysis?: (analysisId: string) => void;
  onViewReport?: (reportId: string) => void;
  onViewPost?: (postId: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  currentUser,
  initialQuery = "",
  initialCategory = "all",
  onNavigateToDashboard,
  onViewAnalysis,
  onViewReport,
  onViewPost
}) => {
  // Parse URL hash search parameters if any e.g. #search?q=rahul&category=people
  const getHashParams = () => {
    const hash = window.location.hash || "";
    if (hash.includes("?")) {
      const qs = hash.split("?")[1];
      const params = new URLSearchParams(qs);
      return {
        q: params.get("q") || initialQuery,
        category: (params.get("category") as SearchCategory) || initialCategory
      };
    }
    return { q: initialQuery, category: initialCategory };
  };

  const initialParams = getHashParams();

  // Search State
  const [query, setQuery] = useState(initialParams.q);
  const [category, setCategory] = useState<SearchCategory>(initialParams.category);
  const [sentiment, setSentiment] = useState<SearchSentimentOption>("all");
  const [inputType, setInputType] = useState<SearchInputTypeOption>("all");
  const [sort, setSort] = useState<SearchSortOption>("newest");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Results State
  const [searchResults, setSearchResults] = useState<GlobalSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestions & History
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Action status messages
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load Search History on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const items = await searchService.getHistory();
      setHistory(items);
    } catch (e) {
      console.error("Failed to load search history", e);
    }
  };

  // Perform search
  const executeSearch = useCallback(
    async (
      searchQuery: string,
      searchCategory: SearchCategory = category,
      searchPage: number = 1
    ) => {
      setIsLoading(true);
      setError(null);
      setIsSuggestionsOpen(false);

      try {
        const response = await searchService.globalSearch({
          q: searchQuery,
          category: searchCategory,
          sentiment,
          inputType,
          sort,
          page: searchPage,
          limit
        });

        setSearchResults(response);

        // Update URL hash without reload
        const hashParams = new URLSearchParams();
        if (searchQuery) hashParams.set("q", searchQuery);
        if (searchCategory !== "all") hashParams.set("category", searchCategory);
        window.location.hash = hashParams.toString() ? `#search?${hashParams.toString()}` : "#search";

        // Save to search history if there's a real query
        if (searchQuery.trim()) {
          await searchService.saveHistory(searchQuery, searchCategory);
          loadHistory();
        }
      } catch (err: any) {
        const errorMsg = typeof err === "string"
          ? err
          : err?.message && typeof err.message === "string"
            ? err.message
            : typeof err?.error === "string"
              ? err.error
              : "An error occurred while searching.";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [category, sentiment, inputType, sort]
  );

  // Trigger search on query change or filters change
  useEffect(() => {
    if (query.trim()) {
      const timer = setTimeout(() => {
        executeSearch(query, category, page);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Empty query: fetch category empty view or clear
      setSearchResults(null);
      setIsLoading(false);
    }
  }, [query, category, sentiment, inputType, sort, page, executeSearch]);

  // Debounced Suggestions while typing
  useEffect(() => {
    if (!query.trim() || !isSuggestionsOpen) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const list = await searchService.getSuggestions(query.trim());
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isSuggestionsOpen]);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim()) executeSearch(query, category, 1);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
      } else if (query.trim()) {
        executeSearch(query, category, 1);
      }
    } else if (e.key === "Escape") {
      setIsSuggestionsOpen(false);
    }
  };

  const handleSelectSuggestion = (item: SearchSuggestion) => {
    setQuery(item.text);
    setIsSuggestionsOpen(false);
    setSelectedSuggestionIndex(-1);

    if (item.type === "analysis" && item.id && onViewAnalysis) {
      onViewAnalysis(item.id);
      return;
    }

    if (item.type === "user") {
      setCategory("people");
      executeSearch(item.text, "people", 1);
      return;
    }

    if (item.type === "community") {
      setCategory("community");
      executeSearch(item.text, "community", 1);
      return;
    }

    executeSearch(item.text, category, 1);
  };

  const handleClearSearch = () => {
    setQuery("");
    setSearchResults(null);
    setIsSuggestionsOpen(false);
    window.location.hash = "#search";
  };

  const handleResetFilters = () => {
    setSentiment("all");
    setInputType("all");
    setSort("newest");
    setPage(1);
  };

  // Search History Actions
  const handleDeleteHistoryItem = async (id: string) => {
    await searchService.deleteHistoryItem(id);
    setHistory((prev) => prev.filter((h) => h._id !== id));
  };

  const handleClearAllHistory = async () => {
    await searchService.clearHistory();
    setHistory([]);
  };

  // Friend Request Action
  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      const res = await friendService.sendRequest(targetUserId);
      if (res.success) {
        setActionSuccess("Friend request sent successfully!");
        setTimeout(() => setActionSuccess(null), 3000);
        // Refresh current search to update relationship badges
        executeSearch(query, category, page);
      } else {
        setError(res.message || "Failed to send friend request.");
        setTimeout(() => setError(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send friend request.");
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleOpenChat = (targetUserId: string) => {
    window.location.hash = `#friends?chat=${targetUserId}`;
  };

  const handleStartCall = (targetUserId: string, type: "audio" | "video") => {
    window.location.hash = `#friends?call=${targetUserId}&type=${type}`;
  };

  const handleViewAnalysisClick = (analysisId: string) => {
    if (onViewAnalysis) {
      onViewAnalysis(analysisId);
    } else {
      window.location.hash = `#analysis/${analysisId}`;
    }
  };

  const handleViewReportClick = (reportId: string) => {
    if (onViewReport) {
      onViewReport(reportId);
    } else {
      window.location.hash = `#reports/${reportId}`;
    }
  };

  const handleViewPostClick = (postId: string) => {
    if (onViewPost) {
      onViewPost(postId);
    } else {
      window.location.hash = `#community`;
    }
  };

  // Category counts extraction for badges
  const categoryCounts = searchResults?.groups
    ? {
        people: searchResults.groups.people.total,
        friends: searchResults.groups.friends.total,
        analyses: searchResults.groups.analyses.total,
        reports: searchResults.groups.reports.total,
        community: searchResults.groups.community.total
      }
    : undefined;

  const totalResultsCount = searchResults?.total ?? 0;
  const totalPages = Math.ceil(totalResultsCount / limit);

  return (
    <div className="min-h-[85vh] bg-[#020617] text-slate-100 p-4 sm:p-6 lg:p-8" id="global-search-page">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Dashboard
              </button>
              <span>/</span>
              <span className="text-slate-300 font-medium">Global Search</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Search SentimentAI</span>
            </h1>
          </div>

          {searchResults && query && (
            <div className="text-xs text-slate-400 sm:text-right">
              Found <span className="text-white font-bold">{totalResultsCount}</span> {totalResultsCount === 1 ? "result" : "results"} for &ldquo;<span className="text-indigo-300 font-medium">{query}</span>&rdquo;
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Central Search Bar & Suggestions Container */}
        <div className="relative z-30">
          <SearchBar
            value={query}
            onChange={(val) => {
              setQuery(val);
              setIsSuggestionsOpen(true);
            }}
            onSearch={(val) => {
              setQuery(val);
              executeSearch(val, category, 1);
            }}
            onClear={handleClearSearch}
            isLoading={isLoading}
            onFocus={() => setIsSuggestionsOpen(true)}
            onBlur={() => {
              // Delay closing to allow clicking suggestions
              setTimeout(() => setIsSuggestionsOpen(false), 200);
            }}
            onKeyDown={handleKeyDown}
          />

          <SearchSuggestions
            suggestions={suggestions}
            isOpen={isSuggestionsOpen}
            onSelect={handleSelectSuggestion}
            selectedIndex={selectedSuggestionIndex}
          />
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <SearchFilters
            selectedCategory={category}
            onCategoryChange={(newCat) => {
              setCategory(newCat);
              setPage(1);
            }}
            sentiment={sentiment}
            onSentimentChange={(s) => {
              setSentiment(s);
              setPage(1);
            }}
            inputType={inputType}
            onInputTypeChange={(t) => {
              setInputType(t);
              setPage(1);
            }}
            sort={sort}
            onSortChange={(so) => {
              setSort(so);
              setPage(1);
            }}
            counts={categoryCounts}
            onReset={handleResetFilters}
          />
        </div>

        {/* No Query State: Show Recent Searches & Discovery Topics */}
        {!query.trim() && (
          <div className="space-y-6">
            <RecentSearches
              history={history}
              onSelect={(q, cat) => {
                setQuery(q);
                if (cat) setCategory(cat as SearchCategory);
                executeSearch(q, (cat as SearchCategory) || "all", 1);
              }}
              onDeleteItem={handleDeleteHistoryItem}
              onClearAll={handleClearAllHistory}
            />

            <SearchEmptyState
              type="no_query"
              onSelectSuggestion={(q, cat) => {
                setQuery(q);
                if (cat) setCategory(cat as SearchCategory);
                executeSearch(q, (cat as SearchCategory) || "all", 1);
              }}
            />
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && query.trim() && !searchResults && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Scanning sentiment intelligence database...</p>
          </div>
        )}

        {/* Results Sections */}
        {searchResults && query.trim() && (
          <div className="space-y-8" id="search-results-wrapper">
            {/* View: "all" with Grouped Categories */}
            {category === "all" && searchResults.groups && (
              <>
                {totalResultsCount === 0 ? (
                  <SearchEmptyState
                    type="no_results"
                    query={query}
                    category="all"
                    onResetFilters={handleResetFilters}
                  />
                ) : (
                  <div className="space-y-8">
                    {/* People Group */}
                    <SearchResultGroup
                      title="People & Profiles"
                      category="people"
                      icon={<Users className="w-4 h-4" />}
                      count={searchResults.groups.people.total}
                      onViewAll={(c) => {
                        setCategory(c);
                        setPage(1);
                      }}
                    >
                      {searchResults.groups.people.results.map((u) => (
                        <UserSearchResult
                          key={u.id}
                          user={u}
                          onSendFriendRequest={handleSendFriendRequest}
                          onOpenChat={handleOpenChat}
                        />
                      ))}
                    </SearchResultGroup>

                    {/* Friends Group */}
                    <SearchResultGroup
                      title="My Friends"
                      category="friends"
                      icon={<UserCheck className="w-4 h-4" />}
                      count={searchResults.groups.friends.total}
                      onViewAll={(c) => {
                        setCategory(c);
                        setPage(1);
                      }}
                    >
                      {searchResults.groups.friends.results.map((f) => (
                        <FriendSearchResult
                          key={f.id}
                          friend={f}
                          onOpenChat={handleOpenChat}
                          onStartCall={handleStartCall}
                        />
                      ))}
                    </SearchResultGroup>

                    {/* Analyses Group */}
                    <SearchResultGroup
                      title="Emotion & Tone Analyses"
                      category="analyses"
                      icon={<Brain className="w-4 h-4" />}
                      count={searchResults.groups.analyses.total}
                      onViewAll={(c) => {
                        setCategory(c);
                        setPage(1);
                      }}
                    >
                      {searchResults.groups.analyses.results.map((a) => (
                        <AnalysisSearchResult
                          key={a.analysisId}
                          analysis={a}
                          onViewAnalysis={handleViewAnalysisClick}
                        />
                      ))}
                    </SearchResultGroup>

                    {/* Reports Group */}
                    <SearchResultGroup
                      title="Executive Reports"
                      category="reports"
                      icon={<FileText className="w-4 h-4" />}
                      count={searchResults.groups.reports.total}
                      onViewAll={(c) => {
                        setCategory(c);
                        setPage(1);
                      }}
                    >
                      {searchResults.groups.reports.results.map((r) => (
                        <ReportSearchResult
                          key={r.reportId}
                          report={r}
                          onViewReport={handleViewReportClick}
                        />
                      ))}
                    </SearchResultGroup>

                    {/* Community Group */}
                    <SearchResultGroup
                      title="Community Discussions"
                      category="community"
                      icon={<Globe className="w-4 h-4" />}
                      count={searchResults.groups.community.total}
                      onViewAll={(c) => {
                        setCategory(c);
                        setPage(1);
                      }}
                    >
                      {searchResults.groups.community.results.map((p) => (
                        <CommunitySearchResult
                          key={p.postId}
                          post={p}
                          onViewPost={handleViewPostClick}
                        />
                      ))}
                    </SearchResultGroup>
                  </div>
                )}
              </>
            )}

            {/* View: Specific Category List */}
            {category !== "all" && (
              <div className="space-y-4">
                {(!searchResults.results || searchResults.results.length === 0) ? (
                  <SearchEmptyState
                    type="no_results"
                    query={query}
                    category={category}
                    onResetFilters={handleResetFilters}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {category === "people" &&
                      (searchResults.results as SearchUserResult[]).map((u) => (
                        <UserSearchResult
                          key={u.id}
                          user={u}
                          onSendFriendRequest={handleSendFriendRequest}
                          onOpenChat={handleOpenChat}
                        />
                      ))}

                    {category === "friends" &&
                      (searchResults.results as SearchFriendResult[]).map((f) => (
                        <FriendSearchResult
                          key={f.id}
                          friend={f}
                          onOpenChat={handleOpenChat}
                          onStartCall={handleStartCall}
                        />
                      ))}

                    {category === "analyses" &&
                      (searchResults.results as SearchAnalysisResult[]).map((a) => (
                        <AnalysisSearchResult
                          key={a.analysisId}
                          analysis={a}
                          onViewAnalysis={handleViewAnalysisClick}
                        />
                      ))}

                    {category === "reports" &&
                      (searchResults.results as SearchReportResult[]).map((r) => (
                        <ReportSearchResult
                          key={r.reportId}
                          report={r}
                          onViewReport={handleViewReportClick}
                        />
                      ))}

                    {category === "community" &&
                      (searchResults.results as SearchCommunityResult[]).map((p) => (
                        <CommunitySearchResult
                          key={p.postId}
                          post={p}
                          onViewPost={handleViewPostClick}
                        />
                      ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400">
                      Showing Page <span className="text-white font-bold">{page}</span> of{" "}
                      <span className="text-white font-bold">{totalPages}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
