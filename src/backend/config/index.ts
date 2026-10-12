import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "4173", 10),
  appUrl: process.env.APP_URL || "http://localhost:4173",

  // Security
  authSecret: process.env.AUTH_SECRET || "sentimentai-default-jwt-secret-key-replace-in-production-2026",
  jwtExpiresIn: "7d",
  cookieName: "sentimentai_auth_token",

  // Database & Storage
  dataDir: path.join(process.cwd(), "data"),
  dbFilePath: process.env.DATABASE_FILE || path.join(process.cwd(), "data", "sentimentai.json"),
  uploadsDir: process.env.STORAGE_PATH || path.join(process.cwd(), "data", "uploads"),

  // AI Keys
  geminiApiKey: process.env.GEMINI_API_KEY || "",

  // Rate Limiting Config
  rateLimit: {
    authWindowMs: 15 * 60 * 1000, // 15 mins
    authMaxRequests: 30, // 30 attempts per 15 min
    apiWindowMs: 60 * 1000, // 1 min
    apiMaxRequests: 120, // 120 requests per min
    aiWindowMs: 60 * 1000,
    aiMaxRequests: 20 // 20 AI analyses per min
  }
};
