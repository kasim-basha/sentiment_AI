export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  public details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[] = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export const validators = {
  isValidEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  isValidPassword(password: string): boolean {
    if (!password || typeof password !== "string") return false;
    return password.length >= 6 && password.length <= 100;
  },

  isValidName(name: string): boolean {
    if (!name || typeof name !== "string") return false;
    return name.trim().length >= 2 && name.trim().length <= 70;
  },

  validateRegistration(body: any): { email: string; name: string; password: string } {
    const details: ValidationErrorDetail[] = [];
    const email = body?.email ? String(body.email).trim() : "";
    const name = body?.name ? String(body.name).trim() : (body?.fullName ? String(body.fullName).trim() : "");
    const password = body?.password ? String(body.password) : "";

    if (!this.isValidEmail(email)) {
      details.push({ field: "email", message: "Please provide a valid email address." });
    }
    if (!this.isValidName(name)) {
      details.push({ field: "name", message: "Full name must be between 2 and 70 characters." });
    }
    if (!this.isValidPassword(password)) {
      details.push({ field: "password", message: "Password must be at least 6 characters long." });
    }

    if (details.length > 0) {
      throw new ValidationError("Invalid registration parameters.", details);
    }

    return { email, name, password };
  },

  validateLogin(body: any): { email: string; password: string } {
    const details: ValidationErrorDetail[] = [];
    const email = body?.email ? String(body.email).trim() : "";
    const password = body?.password ? String(body.password) : "";

    if (!email || !this.isValidEmail(email)) {
      details.push({ field: "email", message: "Valid email is required." });
    }
    if (!password) {
      details.push({ field: "password", message: "Password is required." });
    }

    if (details.length > 0) {
      throw new ValidationError("Invalid login credentials format.", details);
    }

    return { email, password };
  },

  validateForgotPassword(body: any): { email: string } {
    const details: ValidationErrorDetail[] = [];
    const email = body?.email ? String(body.email).trim() : "";

    if (!email || !this.isValidEmail(email)) {
      details.push({ field: "email", message: "A valid email address is required to reset your password." });
    }

    if (details.length > 0) {
      throw new ValidationError("Invalid password reset request.", details);
    }

    return { email: email.toLowerCase() };
  },

  validateResetPassword(body: any): { email: string; code: string; newPassword: string } {
    const details: ValidationErrorDetail[] = [];
    const email = body?.email ? String(body.email).trim() : "";
    const code = body?.code ? String(body.code).trim() : (body?.resetToken ? String(body.resetToken).trim() : "");
    const newPassword = body?.newPassword ? String(body.newPassword) : "";

    if (!email || !this.isValidEmail(email)) {
      details.push({ field: "email", message: "A valid email address is required." });
    }
    if (!code || code.length < 4) {
      details.push({ field: "code", message: "A valid recovery code or reset token is required." });
    }
    if (!this.isValidPassword(newPassword)) {
      details.push({ field: "newPassword", message: "New password must be at least 6 characters long." });
    }

    if (details.length > 0) {
      throw new ValidationError("Invalid password reset parameters.", details);
    }

    return { email: email.toLowerCase(), code, newPassword };
  },

  validateMultimodalInput(body: any): { text?: string; files: any[]; language: string } {
    const text = body?.text ? String(body.text).trim() : undefined;
    const files = Array.isArray(body?.files) ? body.files : [];
    const language = body?.language ? String(body.language).trim() : "English";

    if (!text && files.length === 0) {
      throw new ValidationError("At least one input (text message or media file) is required for analysis.");
    }

    // Validate uploaded file constraints
    if (files.length > 10) {
      throw new ValidationError("Maximum 10 files allowed per analysis session.");
    }

    const allowedMimeTypes = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/webm", "video/quicktime", "video/x-matroska",
      "application/pdf", "text/plain", "text/csv"
    ];

    const dangerousExtensions = [
      ".exe", ".bat", ".cmd", ".sh", ".php", ".phtml", ".js", ".mjs", ".vbs",
      ".py", ".msi", ".dll", ".scr", ".jar", ".html", ".htm", ".xhtml", ".cgi"
    ];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f || typeof f !== "object") {
        throw new ValidationError(`File at index ${i} is invalid.`);
      }

      const fileName = String(f.name || "");
      // Prevent path traversal & null bytes in file names
      if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\") || fileName.includes("\0")) {
        throw new ValidationError(`Invalid or potentially malicious file name detected: ${fileName}`);
      }

      // Check dangerous extensions
      const lowerName = fileName.toLowerCase();
      if (dangerousExtensions.some(ext => lowerName.endsWith(ext))) {
        throw new ValidationError(`Executable or script file type rejected for security: ${fileName}`);
      }

      if (f.mimeType && !allowedMimeTypes.some(m => f.mimeType.toLowerCase().startsWith(m.split("/")[0]) || f.mimeType === m)) {
        // Warning: proceed if standard image or video, else reject dangerous executable types
        const lower = f.mimeType.toLowerCase();
        if (lower.includes("javascript") || lower.includes("executable") || lower.includes("html") || lower.includes("php")) {
          throw new ValidationError(`Dangerous file type rejected for file: ${f.name || i}`);
        }
      }
    }

    return { text, files, language };
  },

  validatePasswordChange(body: any): { currentPassword: string; newPassword: string; confirmPassword: string } {
    const details: ValidationErrorDetail[] = [];
    const currentPassword = body?.currentPassword ? String(body.currentPassword) : "";
    const newPassword = body?.newPassword ? String(body.newPassword) : "";
    const confirmPassword = body?.confirmPassword ? String(body.confirmPassword) : "";

    if (!currentPassword) {
      details.push({ field: "currentPassword", message: "Current password is required." });
    }

    if (!newPassword || newPassword.length < 8) {
      details.push({ field: "newPassword", message: "New password must be at least 8 characters long." });
    } else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      details.push({ field: "newPassword", message: "New password must contain both letters and numbers." });
    }

    if (newPassword !== confirmPassword) {
      details.push({ field: "confirmPassword", message: "Password confirmation does not match the new password." });
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      details.push({ field: "newPassword", message: "New password must be different from your current password." });
    }

    if (details.length > 0) {
      throw new ValidationError("Password validation failed.", details);
    }

    return { currentPassword, newPassword, confirmPassword };
  },

  validatePrivacySettings(body: any): any {
    const privacy: any = {};

    if (typeof body?.saveAnalysisHistory === "boolean") {
      privacy.saveAnalysisHistory = body.saveAnalysisHistory;
    }
    if (["never", "after_use", "after_24h"].includes(body?.autoDeleteHistory)) {
      privacy.autoDeleteHistory = body.autoDeleteHistory;
    }
    if (typeof body?.saveReports === "boolean") {
      privacy.saveReports = body.saveReports;
    }
    if (typeof body?.personalizedExperience === "boolean") {
      privacy.personalizedExperience = body.personalizedExperience;
    }
    if (typeof body?.saveClarityConversations === "boolean") {
      privacy.saveClarityConversations = body.saveClarityConversations;
    }
    if (typeof body?.saveGoalTracking === "boolean") {
      privacy.saveGoalTracking = body.saveGoalTracking;
    }
    if (typeof body?.saveSearchHistory === "boolean") {
      privacy.saveSearchHistory = body.saveSearchHistory;
    }
    if (["private", "community", "public"].includes(body?.communityVisibility)) {
      privacy.communityVisibility = body.communityVisibility;
    }
    if (typeof body?.allowAnalytics === "boolean") {
      privacy.allowAnalytics = body.allowAnalytics;
    }
    if (typeof body?.dataRetentionDays === "number" && body.dataRetentionDays > 0 && body.dataRetentionDays <= 365) {
      privacy.dataRetentionDays = body.dataRetentionDays;
    }
    if (typeof body?.profilePublic === "boolean") {
      privacy.profilePublic = body.profilePublic;
    }

    return privacy;
  },

  validateAccountDeletion(body: any): { confirmation: string } {
    const confirmation = body?.confirmation ? String(body.confirmation).trim() : "";
    if (!confirmation) {
      throw new ValidationError("Confirmation is required to delete your account.");
    }
    return { confirmation };
  },

  validatePost(body: any): { content: string; privacy: "private" | "community" | "public"; tags?: string[]; analysisId?: string } {
    const content = body?.content ? String(body.content).trim() : "";
    const privacy = ["private", "community", "public"].includes(body?.privacy) ? body.privacy : "community";
    const tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [];
    const analysisId = body?.analysisId ? String(body.analysisId).trim() : undefined;

    if (!content || content.length < 3) {
      throw new ValidationError("Post content must be at least 3 characters long.");
    }
    if (content.length > 5000) {
      throw new ValidationError("Post content exceeds maximum length of 5000 characters.");
    }

    return { content, privacy, tags, analysisId };
  },

  validateComment(body: any): { content: string } {
    const content = body?.content ? String(body.content).trim() : "";
    if (!content || content.length < 1) {
      throw new ValidationError("Comment cannot be empty.");
    }
    if (content.length > 2000) {
      throw new ValidationError("Comment cannot exceed 2000 characters.");
    }
    return { content };
  },

  validateCommunityReport(body: any): { targetType: "post" | "comment"; targetId: string; reason: string; details?: string } {
    const targetType = body?.targetType === "comment" ? "comment" : "post";
    const targetId = body?.targetId ? String(body.targetId).trim() : "";
    const reason = body?.reason ? String(body.reason).trim() : "";
    const details = body?.details ? String(body.details).trim() : undefined;

    if (!targetId) throw new ValidationError("Target ID is required.");
    if (!reason) throw new ValidationError("Violation reason is required.");

    return { targetType, targetId, reason, details };
  }
};
