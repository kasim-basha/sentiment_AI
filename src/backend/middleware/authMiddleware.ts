import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../auth/token";
import { db } from "../database";
import { SafeUser } from "../database/types";
import { config } from "../config";

// Extend Express Request interface with user
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      tokenPayload?: TokenPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // Also check cookie if available
  if (req.cookies && req.cookies[config.cookieName]) {
    return req.cookies[config.cookieName];
  }

  // Also check custom header
  if (req.headers["x-access-token"]) {
    return String(req.headers["x-access-token"]).trim();
  }

  return null;
}

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token is missing. Please log in."
      }
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Your session has expired or the token is invalid. Please log in again."
      }
    });
  }

  const user = db.findUserById(payload.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "The user account associated with this token no longer exists."
      }
    });
  }

  if (user.status === "suspended") {
    return res.status(403).json({
      success: false,
      error: {
        code: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended by an administrator. Please contact support."
      }
    });
  }

  // Check if session has been explicitly revoked
  if (payload.sessionId && db.isSessionRevoked(payload.sessionId)) {
    return res.status(401).json({
      success: false,
      error: {
        code: "SESSION_REVOKED",
        message: "Your session was signed out. Please log in again."
      }
    });
  }

  // Touch session lastActiveAt if valid session
  if (payload.sessionId) {
    db.touchUserSession(payload.sessionId);
  }

  req.user = db.toSafeUser(user);
  req.tokenPayload = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  authenticateUser(req, res, () => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN_ADMIN_ONLY",
          message: "Administrative privileges are required to access this resource."
        }
      });
    }
    next();
  });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = db.findUserById(payload.userId);
      if (user && user.status === "active") {
        req.user = db.toSafeUser(user);
        req.tokenPayload = payload;
      }
    }
  }
  next();
}
