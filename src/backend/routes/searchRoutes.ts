import { Router } from "express";
import { searchController } from "../controllers/searchController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

// All search endpoints require authentication
router.use(authenticateUser);

// Main global search endpoint
router.get("/", searchController.globalSearch);

// Category specific search endpoints
router.get("/users", searchController.searchUsers);
router.get("/friends", searchController.searchFriends);
router.get("/analyses", searchController.searchAnalyses);
router.get("/reports", searchController.searchReports);
router.get("/community", searchController.searchCommunity);

// Typeahead suggestions
router.get("/suggestions", searchController.getSuggestions);

// Recent search history management
router.get("/history", searchController.getHistory);
router.post("/history", searchController.addHistory);
router.delete("/history/:id", searchController.deleteHistoryItem);
router.delete("/history", searchController.clearHistory);

export const searchRoutes = router;
