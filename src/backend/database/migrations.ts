import { DatabaseSchema } from "./types";

export interface Migration {
  version: number;
  name: string;
  up: (schema: DatabaseSchema) => DatabaseSchema;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: "001_initial_sentimentai_tables",
    up: (schema: DatabaseSchema): DatabaseSchema => {
      // Ensure all 13 core collections are initialized
      if (!schema.users) schema.users = [];
      if (!schema.analysisSessions) schema.analysisSessions = [];
      if (!schema.analysisInputs) schema.analysisInputs = [];
      if (!schema.analysisResults) schema.analysisResults = [];
      if (!schema.reports) schema.reports = [];
      if (!schema.voiceSessions) schema.voiceSessions = [];
      if (!schema.userSettings) schema.userSettings = [];
      if (!schema.userProfiles) schema.userProfiles = [];
      if (!schema.posts) schema.posts = [];
      if (!schema.comments) schema.comments = [];
      if (!schema.likes) schema.likes = [];
      if (!schema.communityReports) schema.communityReports = [];
      if (!schema.auditLogs) schema.auditLogs = [];
      schema.version = 1;
      return schema;
    }
  },
  {
    version: 2,
    name: "002_integrity_checks_and_indexes",
    up: (schema: DatabaseSchema): DatabaseSchema => {
      // Deduplicate likes if any
      const uniqueLikes = new Map<string, (typeof schema.likes)[0]>();
      for (const like of schema.likes || []) {
        const key = `${like.postId}_${like.userId}`;
        if (!uniqueLikes.has(key)) {
          uniqueLikes.set(key, like);
        }
      }
      schema.likes = Array.from(uniqueLikes.values());
      schema.version = 2;
      return schema;
    }
  },
  {
    version: 3,
    name: "003_friends_messages_calls_collections",
    up: (schema: DatabaseSchema): DatabaseSchema => {
      if (!schema.friendRequests) schema.friendRequests = [];
      if (!schema.friendships) schema.friendships = [];
      if (!schema.conversations) schema.conversations = [];
      if (!schema.conversationMembers) schema.conversationMembers = [];
      if (!schema.messages) schema.messages = [];
      if (!schema.callSessions) schema.callSessions = [];
      if (!schema.callParticipants) schema.callParticipants = [];
      if (!schema.notifications) schema.notifications = [];
      if (!schema.blocks) schema.blocks = [];
      schema.version = 3;
      return schema;
    }
  },
  {
    version: 4,
    name: "004_search_history_collection",
    up: (schema: DatabaseSchema): DatabaseSchema => {
      if (!schema.searchHistory) schema.searchHistory = [];
      schema.version = 4;
      return schema;
    }
  },
  {
    version: 5,
    name: "005_clarity_assistant_collections",
    up: (schema: DatabaseSchema): DatabaseSchema => {
      if (!schema.clarityConversations) schema.clarityConversations = [];
      if (!schema.clarityMessages) schema.clarityMessages = [];
      schema.version = 5;
      return schema;
    }
  },
  {
    version: 6,
    name: "006_goals_and_mood_tracking_collections",
    up: (schema: DatabaseSchema): DatabaseSchema => {
      if (!schema.goals) schema.goals = [];
      if (!schema.goalProgress) schema.goalProgress = [];
      schema.version = 6;
      return schema;
    }
  },
  {
    version: 7,
    name: "007_user_sessions_and_privacy_settings",
    up: (schema: DatabaseSchema): DatabaseSchema => {
      if (!schema.userSessions) schema.userSessions = [];
      if (schema.userSettings) {
        for (const s of schema.userSettings) {
          if (!s.privacy) {
            s.privacy = {
              saveAnalysisHistory: true,
              autoDeleteHistory: "never",
              saveReports: true,
              personalizedExperience: true,
              saveClarityConversations: true,
              saveGoalTracking: true,
              saveSearchHistory: true,
              communityVisibility: "private"
            };
          } else {
            if (s.privacy.saveAnalysisHistory === undefined) s.privacy.saveAnalysisHistory = true;
            if (s.privacy.autoDeleteHistory === undefined) s.privacy.autoDeleteHistory = "never";
            if (s.privacy.saveReports === undefined) s.privacy.saveReports = true;
            if (s.privacy.personalizedExperience === undefined) s.privacy.personalizedExperience = true;
            if (s.privacy.saveClarityConversations === undefined) s.privacy.saveClarityConversations = true;
            if (s.privacy.saveGoalTracking === undefined) s.privacy.saveGoalTracking = true;
            if (s.privacy.saveSearchHistory === undefined) s.privacy.saveSearchHistory = true;
            if (s.privacy.communityVisibility === undefined) s.privacy.communityVisibility = "private";
          }
        }
      }
      schema.version = 7;
      return schema;
    }
  }
];

export function runMigrations(currentSchema: DatabaseSchema): DatabaseSchema {
  let schema = { ...currentSchema };
  const currentVersion = schema.version || 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`[Database Migration] Applying ${migration.version}: ${migration.name}`);
      schema = migration.up(schema);
      schema.version = migration.version;
    }
  }

  return schema;
}
