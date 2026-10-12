import { UserSettings } from '../types';

const defaultSettings: Omit<UserSettings, 'userId'> = {
  appearance: {
    theme: "dark",
    nightLight: false,
  },
  notifications: {
    analysisComplete: true,
    reportGenerated: true,
    voiceAssistant: true,
    system: true,
  },
  language: "en",
  privacy: {
    saveAnalysisHistory: true,
    autoDeleteHistory: "never",
    saveReports: true,
    personalizedExperience: true,
    saveClarityConversations: true,
    saveGoalTracking: true,
    saveSearchHistory: true,
    communityVisibility: "private"
  }
};

const getStorageKey = (userId: string) => `sentiment_ai_settings_${userId}`;

export const settingsService = {
  getUserSettings: async (userId: string): Promise<UserSettings> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultSettings, ...parsed, userId }; // merge in case of missing keys
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    return { ...defaultSettings, userId };
  },

  updateUserSettings: async (settings: UserSettings): Promise<UserSettings> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.setItem(getStorageKey(settings.userId), JSON.stringify(settings));
    return settings;
  },

  updateAppearance: async (userId: string, theme: UserSettings['appearance']['theme']): Promise<UserSettings> => {
    const current = await settingsService.getUserSettings(userId);
    const updated = { ...current, appearance: { ...current.appearance, theme } };
    return settingsService.updateUserSettings(updated);
  },

  updateNotifications: async (userId: string, notifications: UserSettings['notifications']): Promise<UserSettings> => {
    const current = await settingsService.getUserSettings(userId);
    const updated = { ...current, notifications: { ...current.notifications, ...notifications } };
    return settingsService.updateUserSettings(updated);
  },

  updateLanguage: async (userId: string, language: string): Promise<UserSettings> => {
    const current = await settingsService.getUserSettings(userId);
    const updated = { ...current, language };
    return settingsService.updateUserSettings(updated);
  },

  updatePrivacy: async (userId: string, privacy: UserSettings['privacy']): Promise<UserSettings> => {
    const current = await settingsService.getUserSettings(userId);
    const updated = { ...current, privacy: { ...current.privacy, ...privacy } };
    return settingsService.updateUserSettings(updated);
  },

  resetSettings: async (userId: string): Promise<UserSettings> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const reset = { ...defaultSettings, userId };
    localStorage.setItem(getStorageKey(userId), JSON.stringify(reset));
    return reset;
  },

  applyTheme: (theme: UserSettings['appearance']['theme'], nightLight?: boolean) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'ocean', 'forest', 'rose', 'amethyst');

    root.classList.add(theme);

    // Apply Night Light Overlay
    let overlay = document.getElementById('night-light-overlay');
    if (nightLight) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'night-light-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(255, 147, 41, 0.12)';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
      }
    } else {
      if (overlay) overlay.remove();
    }
  }
};
