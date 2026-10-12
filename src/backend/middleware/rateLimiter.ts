import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(windowMs: number, maxRequests: number, message?: string) {
  const hits = new Map<string, RateLimitRecord>();

  // Cleanup old entries periodically (every 5 mins)
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key based on IP or user ID if authenticated
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const key = req.user ? `usr_${req.user.id}` : `ip_${ip}`;

    const now = Date.now();
    let record = hits.get(key);
    if (!record) {
      record = { timestamps: [] };
      hits.set(key, record);
    }

    // Filter to current window
    record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const resetTime = Math.ceil((windowMs - (now - oldest)) / 1000);
      res.setHeader("Retry-After", resetTime);
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: message || "Too many requests. Please slow down and try again shortly.",
          retryAfterSeconds: resetTime
        }
      });
    }

    record.timestamps.push(now);
    next();
  };
}

// Pre-configured rate limiters
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  30,
  "Too many authentication attempts. Please wait 15 minutes before trying again."
);

export const apiRateLimiter = createRateLimiter(
  60 * 1000,
  120,
  "API rate limit exceeded. Please throttle your requests."
);

export const aiRateLimiter = createRateLimiter(
  60 * 1000,
  25,
  "Multimodal AI processing rate limit reached. Please wait a minute before submitting another analysis."
);

export const sensitiveSecurityRateLimiter = createRateLimiter(
  10 * 60 * 1000,
  15,
  "Too many security-sensitive requests. Please wait a few minutes before trying again."
);

export const fileUploadRateLimiter = createRateLimiter(
  60 * 1000,
  30,
  "File upload rate limit reached. Please throttle your uploads."
);
