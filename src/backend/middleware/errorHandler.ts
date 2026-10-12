import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../validators";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // If headers are already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Validation Error
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: err.message,
        details: err.details
      }
    });
  }

  // 2. Syntax Error (e.g. malformed JSON in request body)
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MALFORMED_JSON",
        message: "The request body contains invalid JSON syntax."
      }
    });
  }

  // 3. Unauthorized / Forbidden Errors
  if (err.message && err.message.startsWith("Forbidden")) {
    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: err.message
      }
    });
  }

  if (err.message && err.message.startsWith("Unauthorized")) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: err.message
      }
    });
  }

  // 4. Default 500 Internal Error (Sanitized, no stack trace in response)
  const isDev = process.env.NODE_ENV !== "production";
  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err?.message || err);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred while processing your request. Please try again.",
      ...(isDev && err?.message ? { devHint: err.message } : {})
    }
  });
}
