import { db } from "../database";

export interface GlobalSearchParams {
  query?: string;
  category?: string;
  sentiment?: string;
  inputType?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export class SearchService {
  public globalSearch(currentUserId: string, params: GlobalSearchParams) {
    const q = (params.query || "").trim();
    return db.globalSearch(q, currentUserId, {
      category: params.category,
      sentiment: params.sentiment,
      inputType: params.inputType,
      sort: params.sort,
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 20
    });
  }

  public searchUsers(currentUserId: string, params: { query?: string; page?: number; limit?: number }) {
    const q = (params.query || "").trim();
    return db.searchUsersPaged(q, currentUserId, {
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 20
    });
  }

  public searchFriends(currentUserId: string, params: { query?: string; page?: number; limit?: number }) {
    const q = (params.query || "").trim();
    return db.searchFriends(q, currentUserId, {
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 20
    });
  }

  public searchAnalyses(
    currentUserId: string,
    params: {
      query?: string;
      sentiment?: string;
      inputType?: string;
      sort?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const q = (params.query || "").trim();
    return db.searchAnalyses(q, currentUserId, {
      sentiment: params.sentiment,
      inputType: params.inputType,
      sort: params.sort,
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 20
    });
  }

  public searchReports(
    currentUserId: string,
    params: {
      query?: string;
      sentiment?: string;
      sort?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const q = (params.query || "").trim();
    return db.searchReports(q, currentUserId, {
      sentiment: params.sentiment,
      sort: params.sort,
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 20
    });
  }

  public searchCommunity(
    currentUserId: string,
    params: {
      query?: string;
      sort?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const q = (params.query || "").trim();
    return db.searchCommunity(q, currentUserId, {
      sort: params.sort,
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 20
    });
  }

  public getSuggestions(currentUserId: string, query: string) {
    return db.getSearchSuggestions(query, currentUserId);
  }

  public getHistory(currentUserId: string) {
    return db.getSearchHistory(currentUserId);
  }

  public addHistory(currentUserId: string, query: string, category?: string) {
    return db.addSearchHistory(currentUserId, query, category);
  }

  public deleteHistoryItem(id: string, currentUserId: string) {
    return db.deleteSearchHistoryItem(id, currentUserId);
  }

  public clearHistory(currentUserId: string) {
    return db.clearSearchHistory(currentUserId);
  }
}

export const searchService = new SearchService();
