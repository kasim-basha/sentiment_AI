import { Request } from "express";

export interface ParsedClientInfo {
  deviceType: "desktop" | "mobile" | "tablet";
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
}

export function parseClientInfo(req: Request): ParsedClientInfo {
  const ua = req.headers["user-agent"] || "";
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
             req.socket.remoteAddress ||
             req.ip ||
             "127.0.0.1";

  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  let os = "Unknown OS";
  let browser = "Unknown Browser";

  // Detect OS
  if (/iPad|Tablet/i.test(ua)) {
    deviceType = "tablet";
    os = "iPadOS / Tablet";
  } else if (/iPhone/i.test(ua)) {
    deviceType = "mobile";
    os = "iOS";
  } else if (/Android/i.test(ua)) {
    deviceType = /Mobile/i.test(ua) ? "mobile" : "tablet";
    os = "Android";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = "desktop";
    os = "macOS";
  } else if (/Windows NT/i.test(ua)) {
    deviceType = "desktop";
    os = "Windows";
  } else if (/Linux/i.test(ua)) {
    deviceType = "desktop";
    os = "Linux";
  }

  // Detect Browser
  if (/Edg\//i.test(ua)) {
    browser = "Microsoft Edge";
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = "Safari";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox";
  } else if (/Opera|OPR\//i.test(ua)) {
    browser = "Opera";
  }

  const deviceName = `${browser} on ${os}`;

  // Clean up IP and location label
  const isLocal = ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.");
  const location = isLocal ? "Local / Secure Network" : "Active Location (Cloud)";

  return {
    deviceType,
    deviceName,
    browser,
    os,
    ipAddress: ip,
    location
  };
}
