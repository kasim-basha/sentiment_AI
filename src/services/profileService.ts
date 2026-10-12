import { UserProfile, ProfileStats } from '../types';
import { historyService } from './historyService';
import { reportService } from './reportService';

// Mock database for profiles
const profileDB: Record<string, UserProfile> = {};

const generateMockSessions = (): any[] => [
  {
    id: "sess-1",
    deviceType: "desktop",
    deviceName: "MacBook Pro",
    browser: "Chrome",
    location: "San Francisco, CA, USA",
    ipAddress: "192.168.1.42",
    lastActive: new Date().toISOString(),
    isCurrentSession: true
  },
  {
    id: "sess-2",
    deviceType: "mobile",
    deviceName: "iPhone 13",
    browser: "Safari",
    location: "San Francisco, CA, USA",
    ipAddress: "104.28.10.12",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    isCurrentSession: false
  },
  {
    id: "sess-3",
    deviceType: "desktop",
    deviceName: "Windows PC",
    browser: "Edge",
    location: "New York, NY, USA",
    ipAddress: "172.16.254.1",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    isCurrentSession: false
  }
];

export const profileService = {
  getCurrentUserProfile: async (userId: string, email: string, name: string): Promise<UserProfile> => {
    // Return existing or create new profile from User object details
    if (!profileDB[userId]) {
      profileDB[userId] = {
        userId: userId,
        fullName: name || "User",
        email: email || "user@example.com",
        phone: "",
        dateOfBirth: "",
        country: "",
        city: "",
        profilePicture: "",
        accountStatus: "active",
        createdAt: new Date().toISOString(), // Mocking creation date, ideally from auth provider
        lastLoginAt: new Date().toISOString(),
        recentSessions: generateMockSessions()
      };
    } else {
        // Update last login
        profileDB[userId].lastLoginAt = new Date().toISOString();

        // Update current session timestamp
        if (profileDB[userId].recentSessions) {
          const currentSession = profileDB[userId].recentSessions?.find(s => s.isCurrentSession);
          if (currentSession) {
            currentSession.lastActive = new Date().toISOString();
          }
        }
        // Fallbacks in case basic user info changed elsewhere
        if (!profileDB[userId].fullName && name) profileDB[userId].fullName = name;
        if (!profileDB[userId].email && email) profileDB[userId].email = email;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return { ...profileDB[userId] };
  },

  updateUserProfile: async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!profileDB[userId]) {
      throw new Error("Profile not found");
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    profileDB[userId] = {
      ...profileDB[userId],
      ...updates
    };

    return { ...profileDB[userId] };
  },

  getProfileStatistics: async (userId: string): Promise<ProfileStats> => {
    // Get real statistics from existing services
    const historyStats = await historyService.getHistoryStatistics(userId);
    const reportsList = await reportService.getReports(userId);

    // Find last analysis date
    const analyses = await historyService.getAnalyses(userId);
    const sortedAnalyses = analyses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const lastAnalysisDate = sortedAnalyses.length > 0
      ? new Date(sortedAnalyses[0].createdAt).toLocaleDateString()
      : undefined;

    return {
      totalAnalyses: historyStats.totalAnalyses || 0,
      totalReports: reportsList.length || 0,
      voiceSessions: undefined, // Feature not implemented yet
      lastAnalysis: lastAnalysisDate
    };
  }
};
