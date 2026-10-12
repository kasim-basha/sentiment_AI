import { useState, useEffect, type FormEvent } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  ChevronLeft,
  RefreshCw,
  Check,
  Sparkles,
  MailCheck,
  Send
} from "lucide-react";
import { SentimentAILogo } from "./SentimentAILogo";
import { User } from "../types";
import { authService } from "../services/authService";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onLogin: (user: User) => void;
}

export function LoginForm({ onSwitchToRegister, onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password & reset workflow state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"request" | "email_sent" | "verify" | "success">("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [serverRecoveryCode, setServerRecoveryCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Sign up / Request access modal state
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessRequested, setAccessRequested] = useState(false);

  // Countdown timer for code resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleOpenForgotPassword = () => {
    setResetEmail(email.trim());
    setForgotStep("request");
    setResetCode("");
    setServerRecoveryCode(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetErrorMessage(null);
    setResetSuccessMessage(null);
    setShowForgotPassword(true);
  };

  const handleRequestReset = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    const targetEmail = resetEmail.trim();
    if (!targetEmail || !targetEmail.includes("@") || !targetEmail.includes(".")) {
      setResetErrorMessage("Please provide a valid corporate or personal email address.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await authService.requestPasswordReset(targetEmail);
      setServerRecoveryCode(res.recoveryCode || null);
      if (res.recoveryCode) {
        setResetCode(res.recoveryCode);
      }
      setResetSuccessMessage(
        res.firebaseSent
          ? `Password reset email dispatched to ${targetEmail} via Firebase Auth.`
          : res.message || `Recovery instructions dispatched to ${targetEmail}.`
      );
      setForgotStep("email_sent");
      setResendCountdown(60);
    } catch (err: any) {
      setResetErrorMessage(err?.message || "Failed to initiate password recovery. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCompleteReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    if (!resetCode.trim()) {
      setResetErrorMessage("Please enter the 6-digit recovery code from your email.");
      return;
    }

    if (newPassword.length < 8) {
      setResetErrorMessage("Password must be at least 8 characters long for security.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetErrorMessage("The passwords do not match. Please verify your entries.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await authService.completePasswordReset(resetEmail.trim(), resetCode.trim(), newPassword);
      setResetSuccessMessage(res.message || "Password updated successfully.");
      setForgotStep("success");
    } catch (err: any) {
      setResetErrorMessage(err?.message || "Failed to reset password. Please check your recovery code and try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleFinishReset = () => {
    setEmail(resetEmail);
    setPassword("");
    setShowForgotPassword(false);
    setSuccessMessage("Password reset successfully. Please sign in with your new password.");
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
    if (score === 2 || score === 3) return { score: 2, label: "Medium", color: "bg-amber-500", text: "text-amber-400" };
    return { score: 3, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSocialAuth = async (provider: "google" | "github") => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSocialLoading(provider);

    try {
      const res = await authService.socialLogin(provider);
      if (res.user) {
        setSuccessMessage(`Welcome! Authenticated via ${provider === "google" ? "Google" : "GitHub"}. Redirecting to workspace...`);
        setTimeout(() => {
          onLogin(res.user!);
        }, 350);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to authenticate with ${provider === "google" ? "Google" : "GitHub"}.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your work or personal email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your account password.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid email address format.");
      return;
    }

    setIsLoading(true);

    authService.login(email.trim(), password)
      .then(res => {
        setIsLoading(false);
        if (res.user) {
          setSuccessMessage(`Welcome back! Authenticated as ${res.user.email}. Redirecting to workspace...`);
          setTimeout(() => {
            onLogin(res.user!);
          }, 350);
        }
      })
      .catch(err => {
        setIsLoading(false);
        setErrorMessage(err?.message || "Invalid credentials. Please verify your email and password.");
      });
  };

  const handleRequestAccessSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!accessEmail.trim() || !accessEmail.includes("@")) {
      return;
    }
    setAccessRequested(true);
    setTimeout(() => {
      setAccessRequested(false);
      setShowRequestAccess(false);
      setAccessEmail("");
    }, 3000);
  };

  return (
    <div id="login-page-wrapper" className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center gap-3 mb-5">
          <SentimentAILogo className="w-11 h-11" />
          <span id="brand-name" className="text-2xl font-bold tracking-tight text-white font-sans">
            SentimentAI
          </span>
        </div>

        {/* Main Page Title */}
        <h1 id="main-page-title" className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2.5">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">SentimentAI</span>
        </h1>

        {/* Tagline */}
        <p id="brand-tagline" className="text-xl sm:text-2xl text-slate-200 font-medium mb-3">
          Understand Every Emotion.
        </p>

        {/* Short supporting text */}
        <p id="brand-supporting-text" className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
          Analyze text, images, and videos to discover sentiment, emotions, meaning, and insights with AI.
        </p>
      </div>

      {/* Sleek Login Card */}
      <div
        id="login-card-container"
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative"
      >
        {/* Social / SSO Buttons */}
        <div className="flex flex-col gap-2.5 mb-5">
          <button
            id="btn-google-login"
            type="button"
            disabled={isLoading || socialLoading !== null}
            onClick={() => handleSocialAuth("google")}
            className="w-full h-11 flex items-center justify-center gap-3 px-4 border border-slate-700/80 rounded-xl hover:bg-slate-800/80 hover:border-slate-600 transition-all bg-slate-950/60 text-slate-200 text-sm font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {socialLoading === "google" ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{socialLoading === "google" ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          <button
            id="btn-github-login"
            data-testid="btn-sso-login"
            type="button"
            disabled={isLoading || socialLoading !== null}
            onClick={() => handleSocialAuth("github")}
            className="w-full h-11 flex items-center justify-center gap-3 px-4 border border-slate-700/80 rounded-xl hover:bg-slate-800/80 hover:border-slate-600 transition-all bg-slate-950/60 text-slate-200 text-sm font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {socialLoading === "github" ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
            )}
            <span>{socialLoading === "github" ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-slate-900 text-slate-400 uppercase tracking-wider font-mono">
              or with email
            </span>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div id="login-error-alert" className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div id="login-success-alert" className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form id="sentimentai-login-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="input-email" className="block text-xs font-medium text-slate-300 mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <input
                id="input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-password" className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <button
                id="btn-forgot-password-link"
                type="button"
                onClick={handleOpenForgotPassword}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="input-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <button
                id="btn-toggle-password-visibility"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400">
              <input
                id="checkbox-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-blue-500/40 focus:ring-offset-0 focus:ring-1 transition-colors cursor-pointer accent-blue-500"
              />
              <span>Remember for 30 days</span>
            </label>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-2 flex items-center justify-center gap-2 px-4 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Prompt */}
        <p className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <button
            id="btn-request-access-toggle"
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer ml-1"
          >
            Sign up for free
          </button>
        </p>
      </div>

      {/* Forgot Password & Recovery Workflow Modal */}
      {showForgotPassword && (
        <div id="modal-forgot-password" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative text-left overflow-hidden">
            {/* Top Accent Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  {forgotStep === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : forgotStep === "email_sent" ? (
                    <MailCheck className="w-5 h-5 text-emerald-400" />
                  ) : forgotStep === "verify" ? (
                    <Shield className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <KeyRound className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    {forgotStep === "request" && "Password Reset"}
                    {forgotStep === "email_sent" && "Check Your Email"}
                    {forgotStep === "verify" && "Verify & Set Password"}
                    {forgotStep === "success" && "Password Reset Complete"}
                    {forgotStep === "request" && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                        Firebase Auth
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {forgotStep === "request" && "Trigger an email-based password reset via Firebase Auth"}
                    {forgotStep === "email_sent" && `Reset link dispatched to ${resetEmail}`}
                    {forgotStep === "verify" && `Enter verification code and choose a new password`}
                    {forgotStep === "success" && "Your credentials have been securely updated"}
                  </p>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className={`w-2 h-2 rounded-full ${forgotStep === "request" ? "bg-blue-500" : "bg-blue-500/40"}`} />
                <span className={`w-2 h-2 rounded-full ${forgotStep === "email_sent" ? "bg-emerald-500" : forgotStep === "verify" || forgotStep === "success" ? "bg-emerald-500/40" : "bg-slate-700"}`} />
                <span className={`w-2 h-2 rounded-full ${forgotStep === "verify" ? "bg-indigo-500" : forgotStep === "success" ? "bg-indigo-500/40" : "bg-slate-700"}`} />
                <span className={`w-2 h-2 rounded-full ${forgotStep === "success" ? "bg-emerald-500" : "bg-slate-700"}`} />
              </div>
            </div>

            {/* Status alerts */}
            {resetErrorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{resetErrorMessage}</span>
              </div>
            )}

            {resetSuccessMessage && forgotStep !== "success" && forgotStep !== "email_sent" && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            {/* Step 1: Request Email */}
            {forgotStep === "request" && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label htmlFor="input-reset-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Registered Email address
                  </label>
                  <div className="relative">
                    <input
                      id="input-reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      autoFocus
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    We will trigger a secure password reset email dispatched via Firebase Authentication.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    id="btn-cancel-reset"
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-send-reset-code"
                    type="submit"
                    disabled={resetLoading || !resetEmail.trim()}
                    className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reset Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step: Email Sent via Firebase Auth */}
            {forgotStep === "email_sent" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <MailCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Reset Link Dispatched</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-mono">
                          Firebase Auth
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                        {resetEmail}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    We've triggered an official password reset email for your account using Firebase Authentication. Please check your inbox and follow the instructions to securely reset your password.
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <p>• The reset link is valid for 60 minutes.</p>
                    <p>• Check your spam/junk folder if the message does not appear in a few minutes.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="text-slate-400">Didn't receive the email?</span>
                  <button
                    type="button"
                    disabled={resendCountdown > 0 || resetLoading}
                    onClick={() => handleRequestReset()}
                    className="text-blue-400 hover:text-blue-300 disabled:text-slate-500 font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCountdown > 0 ? `Resend email in ${resendCountdown}s` : "Resend Email"}
                  </button>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    id="btn-return-login"
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Back to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="btn-switch-to-code-verify"
                    type="button"
                    onClick={() => {
                      setForgotStep("verify");
                      setResetErrorMessage(null);
                    }}
                    className="w-full h-9 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Enter 6-digit verification code manually instead</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Verification Code & New Password */}
            {forgotStep === "verify" && (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                {/* Target email and change button */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300 truncate">
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate font-medium">{resetEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep("request");
                      setResetErrorMessage(null);
                    }}
                    className="text-blue-400 hover:text-blue-300 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>

                {/* Simulation / Demo helper notice */}
                {serverRecoveryCode && (
                  <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-blue-300">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Demo Code: <strong className="font-mono text-white tracking-wider">{serverRecoveryCode}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetCode(serverRecoveryCode)}
                      className="px-2 py-0.5 rounded-md bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                {/* 6-digit Code input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-reset-code" className="block text-xs font-medium text-slate-300">
                      Verification Code
                    </label>
                    <button
                      type="button"
                      disabled={resendCountdown > 0 || resetLoading}
                      onClick={() => handleRequestReset()}
                      className="text-[11px] text-blue-400 hover:text-blue-300 disabled:text-slate-500 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="input-reset-code"
                      type="text"
                      maxLength={8}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.trim())}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full h-11 pl-10 pr-4 font-mono tracking-widest text-center text-base rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* New Password input */}
                <div>
                  <label htmlFor="input-new-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="input-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Security strength:</span>
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 transition-all rounded-full ${strength.score >= 1 ? strength.color : "bg-slate-800"}`} />
                        <div className={`h-full flex-1 transition-all rounded-full ${strength.score >= 2 ? strength.color : "bg-slate-800"}`} />
                        <div className={`h-full flex-1 transition-all rounded-full ${strength.score >= 3 ? strength.color : "bg-slate-800"}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password input */}
                <div>
                  <label htmlFor="input-confirm-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="input-confirm-password"
                      type={showNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                      className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    {confirmPassword && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {newPassword === confirmPassword ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-[11px] text-rose-400">Passwords do not match.</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep("request")}
                    className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    id="btn-submit-reset-password"
                    type="submit"
                    disabled={resetLoading || !resetCode || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="flex-1 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success Confirmation */}
            {forgotStep === "success" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Password Successfully Updated</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Your new credentials have been saved and all previous sessions have been invalidated for security. You can now log into your workspace.
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    id="btn-back-to-login"
                    type="button"
                    onClick={handleFinishReset}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Access / Sign up Modal */}
      {showRequestAccess && (
        <div id="modal-request-access" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-left">
            <h3 className="text-lg font-bold text-white mb-1.5">Sign Up for SentimentAI</h3>
            <p className="text-xs text-slate-400 mb-4">
              Get started with multimodal sentiment intelligence for your team or organization.
            </p>

            {accessRequested ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Thank you! Your workspace invite will be sent to {accessEmail}.</span>
              </div>
            ) : (
              <form onSubmit={handleRequestAccessSubmit} className="space-y-4">
                <input
                  id="input-access-email"
                  type="email"
                  value={accessEmail}
                  onChange={(e) => setAccessEmail(e.target.value)}
                  placeholder="your.name@company.com"
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestAccess(false)}
                    className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
