import { db } from "../database";
import { UserRole } from "../database/types";

export interface LogActionParams {
  userId: string;
  userName?: string;
  userRole?: UserRole;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export const auditService = {
  log: (params: LogActionParams) => {
    try {
      // Ensure no passwords or authorization tokens leak into metadata
      const sanitizedMeta = params.metadata ? { ...params.metadata } : {};
      delete sanitizedMeta.password;
      delete sanitizedMeta.passwordHash;
      delete sanitizedMeta.token;
      delete sanitizedMeta.authHeader;

      return db.createAuditLog({
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: Object.keys(sanitizedMeta).length > 0 ? sanitizedMeta : undefined,
        ipAddress: params.ipAddress
      });
    } catch (err) {
      console.error("[AuditService] Failed to record audit log:", err);
      return null;
    }
  },

  list: (options: { limit?: number; action?: string; userId?: string } = {}) => {
    return db.listAuditLogs(options);
  }
};
