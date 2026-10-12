/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, User as UserIcon, Check, X } from "lucide-react";
import { SentimentAILogo } from "./SentimentAILogo";
import { authService } from "../services/authService";
import { User } from "../types";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: (user: User) => void;
}

export function RegisterForm({ onSwitchToLogin, onRegisterSuccess }: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSocialRegister = async (provider: "google" | "github") => {
    setErrors({});
    setSuccessMessage(null);
    setSocialLoading(provider);

    try {
      const res = await authService.socialLogin(provider);
      if (res.user) {
        setSuccessMessage(`Account created via ${provider === "google" ? "Google" : "GitHub"}! Redirecting...`);
        setTimeout(() => {
          onRegisterSuccess(res.user!);
        }, 500);
      }
    } catch (err: any) {
      setErrors({ server: err?.message || `Failed to continue with ${provider === "google" ? "Google" : "GitHub"}.` });
    } finally {
      setSocialLoading(null);
    }
  };

  // Password validation logic
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (!isPasswordValid) {
      newErrors.password = "Password does not meet all requirements.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = "You must agree to the Terms of Service.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.register({ fullName, email, password });
      setSuccessMessage(response.message);

      if (response.user) {
        const user = {
          ...response.user,
          role: email.endsWith("@sentimentai.com") ? ("admin" as const) : ("user" as const),
          status: "active" as const
        };
        setTimeout(() => {
          onRegisterSuccess(user);
        }, 1500);
      }
    } catch (err: any) {
      setErrors({ server: err.message || "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="register-page-wrapper" className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center gap-3 mb-4">
          <SentimentAILogo className="w-10 h-10" />
          <span className="text-2xl font-bold tracking-tight text-white font-sans">
            SentimentAI
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-2">
          Create your account
        </h1>
        <p className="text-sm text-slate-400">
          Join SentimentAI to start analyzing emotions with intelligence.
        </p>
      </div>

      {/* Register Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
        {errors.server && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300" aria-live="polite">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errors.server}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300" aria-live="polite">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Social / SSO Buttons */}
        <div className="flex flex-col gap-2.5 mb-5">
          <button
            id="btn-google-register"
            type="button"
            disabled={isLoading || socialLoading !== null}
            onClick={() => handleSocialRegister("google")}
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
            id="btn-github-register"
            type="button"
            disabled={isLoading || socialLoading !== null}
            onClick={() => handleSocialRegister("github")}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="block text-xs font-medium text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className={`w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/70 border ${errors.fullName ? 'border-rose-500' : 'border-slate-700/80'} text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all`}
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
            </div>
            {errors.fullName && <p className="text-[10px] text-rose-400 ml-1">{errors.fullName}</p>}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={`w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/70 border ${errors.email ? 'border-rose-500' : 'border-slate-700/80'} text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all`}
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            {errors.email && <p className="text-[10px] text-rose-400 ml-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className={`w-full h-11 pl-10 pr-11 rounded-xl bg-slate-950/70 border ${errors.password ? 'border-rose-500' : 'border-slate-700/80'} text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all`}
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Criteria */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 ml-1">
              <div className={`flex items-center gap-1.5 text-[10px] ${passwordCriteria.minLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                {passwordCriteria.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                8+ characters
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] ${passwordCriteria.hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                {passwordCriteria.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                Uppercase letter
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] ${passwordCriteria.hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                {passwordCriteria.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                Lowercase letter
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] ${passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                Number
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] ${passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                {passwordCriteria.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                Special character
              </div>
            </div>
            {errors.password && <p className="text-[10px] text-rose-400 ml-1 mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/70 border ${errors.confirmPassword ? 'border-rose-500' : 'border-slate-700/80'} text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all`}
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            {errors.confirmPassword && <p className="text-[10px] text-rose-400 ml-1">{errors.confirmPassword}</p>}
          </div>

          {/* Terms & Conditions */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="peer appearance-none w-4 h-4 rounded bg-slate-950 border border-slate-700 text-blue-500 checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
                />
                <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-0.5 top-0.5 transition-opacity" />
              </div>
              <span className="text-[11px] leading-tight text-slate-400 group-hover:text-slate-300 transition-colors">
                I agree to the{" "}
                <a href="/terms" onClick={(e) => e.preventDefault()} className="text-blue-400 hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" onClick={(e) => e.preventDefault()} className="text-blue-400 hover:underline">Privacy Policy</a>.
              </span>
            </label>
            {errors.agreeTerms && <p className="text-[10px] text-rose-400 ml-1 mt-1">{errors.agreeTerms}</p>}
          </div>

          {/* Submit Button */}
          <button
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
                <span>Creating account...</span>
              </div>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Navigation to Login */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
