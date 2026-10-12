import { AdminActivity } from "../types";

const AUDIT_LOG_STORAGE_KEY = "sentimentai_admin_audit_logs_v1";

const INITIAL_AUDIT_LOGS: AdminActivity[] = [
  {
    activityId: "act_101",
    adminId: "usr_admin_01",
    adminName: "System Admin",
    action: "USER_ROLE_CHANGED",
    targetId: "usr_002",
    targetName: "Sarah Jenkins",
    details: "Promoted user to Admin role for European division support",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
  },
  {
    activityId: "act_102",
    adminId: "usr_admin_01",
    adminName: "System Admin",
    action: "USER_SUSPENDED",
    targetId: "usr_003",
    targetName: "Marcus Vance",
    details: "Suspended account due to repeated automated API abuse",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3h ago
  },
  {
    activityId: "act_103",
    adminId: "usr_admin_01",
    adminName: "System Admin",
    action: "USER_ACTIVATED",
    targetId: "usr_004",
    targetName: "Elena Rostova",
    details: "Account reactivated following security verification",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    activityId: "act_104",
    adminId: "usr_admin_01",
    adminName: "System Admin",
    action: "REPORT_DELETED",
    targetId: "rep_sample_09",
    targetName: "Q2 Stakeholder Draft",
    details: "Removed outdated test report per compliance policy",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  }
];

export const auditLogService = {
  getActivities: async (limit: number = 20): Promise<AdminActivity[]> => {
    try {
      const stored = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
        return INITIAL_AUDIT_LOGS.slice(0, limit);
      }
      const parsed: AdminActivity[] = JSON.parse(stored);
      // Sort newest first
      parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return parsed.slice(0, limit);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      return INITIAL_AUDIT_LOGS.slice(0, limit);
    }
  },

  log: async (activity: Omit<AdminActivity, "activityId" | "createdAt">): Promise<AdminActivity> => {
    const newActivity: AdminActivity = {
      ...activity,
      activityId: "act_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36),
      createdAt: new Date().toISOString()
    };

    try {
      const stored = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
      const list: AdminActivity[] = stored ? JSON.parse(stored) : [...INITIAL_AUDIT_LOGS];
      list.unshift(newActivity);
      // Keep up to 200 logs
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(list.slice(0, 200)));
    } catch (err) {
      console.error("Failed to save audit log:", err);
    }

    return newActivity;
  }
};
