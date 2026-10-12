import { Request, Response, NextFunction } from "express";
import { searchService } from "../services/searchService";

export const searchController = {
  // GET /api/search
  globalSearch: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const query = (req.query.q as string) || (req.query.query as string) || "";
      const category = (req.query.category as string) || "all";
      const sentiment = req.query.sentiment as string;
      const inputType = req.query.inputType as string;
      const sort = req.query.sort as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const results = searchService.globalSearch(currentUserId, {
        query,
        category,
        sentiment,
        inputType,
        sort,
        page,
        limit
      });

      res.json({
        success: true,
        ...results
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/search/users
  searchUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const query = (req.query.q as string) || (req.query.query as string) || "";
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const data = searchService.searchUsers(currentUserId, { query, page, limit });
      res.json({
        success: true,
        category: "people",
        ...data
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/search/friends
  searchFriends: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const query = (req.query.q as string) || (req.query.query as string) || "";
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const data = searchService.searchFriends(currentUserId, { query, page, limit });
      res.json({
        success: true,
        category: "friends",
        ...data
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/search/analyses
  searchAnalyses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const query = (req.query.q as string) || (req.query.query as string) || "";
      const sentiment = req.query.sentiment as string;
      const inputType = req.query.inputType as string;
      const sort = req.query.sort as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const data = searchService.searchAnalyses(currentUserId, {
        query,
        sentiment,
        inputType,
        sort,
        page,
        limit
      });
      res.json({
        success: true,
        category: "analyses",
        ...data
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/search/reports
  searchReports: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const query = (req.query.q as string) || (req.query.query as string) || "";
      const sentiment = req.query.sentiment as string;
      const sort = req.query.sort as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const data = searchService.searchReports(currentUserId, {
        query,
        sentiment,
        sort,
        page,
        limit
      });
      res.json({
        success: true,
        category: "reports",
        ...data
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/search/community
  searchCommunity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const query = (req.query.q as string) || (req.query.query as string) || "";
      const sort = req.query.sort as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const data = searchService.searchCommunity(currentUserId, {
        query,
        sort,
        page,
        limit
      });
      res.json({
        success: true,
        category: "community",
        ...data
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/search/suggestions
  getSuggestions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const query = (req.query.q as string) || (req.query.query as string) || "";
      const suggestions = searchService.getSuggestions(currentUserId, query);
      res.json({
        success: true,
        suggestions
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/search/history
  getHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const history = searchService.getHistory(currentUserId);
      res.json({
        success: true,
        history
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/search/history
  addHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const { query, category } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ error: "Query is required." });
      }
      const item = searchService.addHistory(currentUserId, query, category);
      res.status(201).json({
        success: true,
        item
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/search/history/:id
  deleteHistoryItem: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      const { id } = req.params;
      const success = searchService.deleteHistoryItem(id, currentUserId);
      res.json({
        success,
        message: success ? "Search history item deleted." : "Item not found."
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/search/history
  clearHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;
      searchService.clearHistory(currentUserId);
      res.json({
        success: true,
        message: "All search history cleared."
      });
    } catch (err) {
      next(err);
    }
  }
};
