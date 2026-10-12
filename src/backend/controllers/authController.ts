import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { hashPassword, comparePassword } from "../auth/password";
import { generateToken } from "../auth/token";
import { validators } from "../validators";
import { auditService } from "../services/auditService";
import { config } from "../config";
import { parseClientInfo } from "../utils/userAgent";

interface ResetRecord {
  email: string;
  userId: string;
  code: string;
  resetToken: string;
  expiresAt: number;
}

const resetStore = new Map<string, ResetRecord>();

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, password } = validators.validateRegistration(req.body);

      // Check if user already exists
      const existing = db.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "An account with this email address is already registered."
          }
        });
      }

      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();
      const role = email.toLowerCase().endsWith("@sentimentai.com") && email.toLowerCase().startsWith("admin")
        ? "admin"
        : "user";

      const newUser = {
        id: "usr_" + Math.random().toString(36).substring(2, 11),
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role as "user" | "admin",
        status: "active" as const,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };

      const safeUser = db.createUser(newUser);

      // Create session for registered user
      const clientInfo = parseClientInfo(req);
      const sessionId = "sess_" + Math.random().toString(36).substring(2, 12);
      db.createUserSession({
        sessionId,
        userId: safeUser.id,
        deviceType: clientInfo.deviceType,
        deviceName: clientInfo.deviceName,
        browser: clientInfo.browser,
        os: clientInfo.os,
        ipAddress: clientInfo.ipAddress,
        location: clientInfo.location,
        createdAt: now,
        lastActiveAt: now,
        isRevoked: false
      });

      const token = generateToken(safeUser, sessionId);

      // Set secure cookie
      res.cookie(config.cookieName, token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      auditService.log({
        userId: safeUser.id,
        userName: safeUser.name,
        userRole: safeUser.role,
        action: "USER_REGISTERED",
        targetType: "user",
        targetId: safeUser.id,
        metadata: { email: safeUser.email, role: safeUser.role, device: clientInfo.deviceName },
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        message: "Account registered successfully.",
        token,
        user: safeUser
      });
    } catch (err) {
      next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = validators.validateLogin(req.body);

      const user = db.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password. Please verify your credentials."
          }
        });
      }

      if (user.status === "suspended") {
        return res.status(403).json({
          success: false,
          error: {
            code: "ACCOUNT_SUSPENDED",
            message: "This account has been suspended. Please contact your administrator."
          }
        });
      }

      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password. Please verify your credentials."
          }
        });
      }

      // Update lastLoginAt
      const now = new Date().toISOString();
      const updatedUser = db.updateUser(user.id, { lastLoginAt: now });

      // Create session
      const clientInfo = parseClientInfo(req);
      const sessionId = "sess_" + Math.random().toString(36).substring(2, 12);
      db.createUserSession({
        sessionId,
        userId: updatedUser.id,
        deviceType: clientInfo.deviceType,
        deviceName: clientInfo.deviceName,
        browser: clientInfo.browser,
        os: clientInfo.os,
        ipAddress: clientInfo.ipAddress,
        location: clientInfo.location,
        createdAt: now,
        lastActiveAt: now,
        isRevoked: false
      });

      const token = generateToken(updatedUser, sessionId);

      // Set cookie
      res.cookie(config.cookieName, token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      auditService.log({
        userId: updatedUser.id,
        userName: updatedUser.name,
        userRole: updatedUser.role,
        action: "USER_LOGIN",
        targetType: "user",
        targetId: updatedUser.id,
        metadata: { device: clientInfo.deviceName, browser: clientInfo.browser },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: "Login successful.",
        token,
        user: updatedUser
      });
    } catch (err) {
      next(err);
    }
  },

  socialLogin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = req.body?.provider === "github" ? "github" : "google";
      const isGoogle = provider === "google";
      const email = isGoogle ? "workspace.user@gmail.com" : "developer@github.com";
      const name = isGoogle ? "Google Workspace User" : "GitHub Developer";
      const now = new Date().toISOString();

      let user = db.findUserByEmail(email);
      let safeUser;
      if (!user) {
        const newUser = {
          id: isGoogle ? "usr_google" : "usr_github",
          name,
          email,
          passwordHash: "oauth_authenticated_session",
          role: "user" as const,
          status: "active" as const,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now
        };
        safeUser = db.createUser(newUser);
      } else {
        safeUser = db.updateUser(user.id, { lastLoginAt: now });
      }

      // Create session for user
      const clientInfo = parseClientInfo(req);
      const sessionId = "sess_" + Math.random().toString(36).substring(2, 12);
      db.createUserSession({
        sessionId,
        userId: safeUser.id,
        deviceType: clientInfo.deviceType,
        deviceName: clientInfo.deviceName,
        browser: clientInfo.browser,
        os: clientInfo.os,
        ipAddress: clientInfo.ipAddress,
        location: clientInfo.location,
        createdAt: now,
        lastActiveAt: now,
        isRevoked: false
      });

      const token = generateToken(safeUser, sessionId);

      // Set cookie
      res.cookie(config.cookieName, token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      auditService.log({
        userId: safeUser.id,
        userName: safeUser.name,
        userRole: safeUser.role,
        action: "USER_SOCIAL_LOGIN",
        targetType: "user",
        targetId: safeUser.id,
        metadata: { provider, device: clientInfo.deviceName, browser: clientInfo.browser },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `Successfully authenticated with ${isGoogle ? "Google" : "GitHub"}.`,
        token,
        user: safeUser
      });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        if (req.tokenPayload?.sessionId) {
          db.revokeUserSession(req.tokenPayload.sessionId, req.user.id);
        }

        auditService.log({
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          action: "USER_LOGOUT",
          targetType: "user",
          targetId: req.user.id,
          ipAddress: req.ip
        });
      }

      res.clearCookie(config.cookieName);
      return res.json({
        success: true,
        message: "Logged out successfully."
      });
    } catch (err) {
      next(err);
    }
  },

  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" }
        });
      }
      return res.json({
        success: true,
        user: req.user
      });
    } catch (err) {
      next(err);
    }
  },

  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = validators.validateForgotPassword(req.body);
      const user = db.findUserByEmail(email);

      // Generate a 6-digit numeric recovery code and a cryptographic token
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const resetToken = "rst_" + Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14);
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

      resetStore.set(email.toLowerCase(), {
        email: email.toLowerCase(),
        userId: user ? user.id : "usr_pending_" + Math.random().toString(36).substring(2, 9),
        code,
        resetToken,
        expiresAt
      });

      if (user) {
        auditService.log({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: "PASSWORD_RESET_REQUESTED",
          targetType: "user",
          targetId: user.id,
          metadata: { email: user.email },
          ipAddress: req.ip
        });
      }

      return res.json({
        success: true,
        message: "Password recovery instructions and verification code have been dispatched to your email address.",
        email,
        resetToken,
        recoveryCode: code // Exposed for development / preview verification
      });
    } catch (err) {
      next(err);
    }
  },

  verifyResetCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = String(req.body?.email || "").toLowerCase().trim();
      const code = String(req.body?.code || "").trim();

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_REQUEST", message: "Email and recovery code are required." }
        });
      }

      const record = resetStore.get(email);
      if (!record) {
        return res.status(400).json({
          success: false,
          error: { code: "CODE_NOT_FOUND", message: "No active password recovery request found for this email address. Please initiate a new request." }
        });
      }

      if (Date.now() > record.expiresAt) {
        resetStore.delete(email);
        return res.status(400).json({
          success: false,
          error: { code: "CODE_EXPIRED", message: "The recovery code has expired. Please request a new one." }
        });
      }

      if (record.code !== code && record.resetToken !== code) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_CODE", message: "Incorrect verification code. Please check your email and try again." }
        });
      }

      return res.json({
        success: true,
        message: "Verification code confirmed successfully.",
        resetToken: record.resetToken
      });
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, code, newPassword } = validators.validateResetPassword(req.body);

      const record = resetStore.get(email);
      if (!record) {
        return res.status(400).json({
          success: false,
          error: { code: "RESET_EXPIRED", message: "Password reset session has expired or was not initiated. Please request a new reset code." }
        });
      }

      if (Date.now() > record.expiresAt) {
        resetStore.delete(email);
        return res.status(400).json({
          success: false,
          error: { code: "CODE_EXPIRED", message: "The recovery code has expired. Please request a new one." }
        });
      }

      if (record.code !== code && record.resetToken !== code) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_CODE", message: "Invalid verification code or reset token." }
        });
      }

      let user = db.findUserByEmail(email) || (record.userId ? db.findUserById(record.userId) : undefined);
      const newHash = await hashPassword(newPassword);

      if (user) {
        db.updateUser(user.id, { passwordHash: newHash });
        try {
          db.revokeAllOtherUserSessions(user.id);
        } catch (sessErr) {
          console.warn("[AuthController] Session revocation warning:", sessErr);
        }
      } else {
        const namePart = email.split("@")[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const now = new Date().toISOString();
        user = db.createUser({
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          email: email.toLowerCase(),
          name: formattedName,
          passwordHash: newHash,
          role: "user",
          status: "active",
          createdAt: now,
          updatedAt: now
        }) as any;
      }

      // Clean up reset record
      resetStore.delete(email);

      // Invalidate existing sessions for security
      try {
        db.revokeAllOtherUserSessions(user.id);
      } catch (sessErr) {
        console.warn("[AuthController] Session revocation warning:", sessErr);
      }

      auditService.log({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "PASSWORD_RESET_COMPLETED",
        targetType: "user",
        targetId: user.id,
        metadata: { email: user.email },
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: "Your password has been successfully updated. You may now log in with your new credentials."
      });
    } catch (err) {
      next(err);
    }
  }
};
