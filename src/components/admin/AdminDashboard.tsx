import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Brain,
  FileText,
  BarChart3,
  Settings,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ShieldAlert
} from "lucide-react";
import { User, ViewState } from "../../types";
import { UserManagement } from "./UserManagement";
import { AnalysisManagement } from "./AnalysisManagement";
import { ReportManagement } from "./ReportManagement";
import { AdminStatistics } from "./AdminStatistics";
import { SystemStatus } from "./SystemStatus";
import { AdminDashboardHome } from "./AdminDashboardHome";
import { AccessDenied } from "./AccessDenied";
import { AdminHeader } from "./AdminHeader";
import { CommunityModerationManagement } from "./CommunityModerationManagement";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (view: ViewState) => void;
}

export type AdminSubView = "dashboard" | "users" | "analyses" | "reports" | "statistics" | "system" | "community";

export function AdminDashboard({ user, onLogout, onNavigate }: AdminDashboardProps) {
  // Derive initial subview from URL hash if present (e.g., #admin/users)
  const getSubViewFromHash = (): AdminSubView => {
    const hash = window.location.hash.replace("#", "");
    if (hash.startsWith("admin/")) {
      const sub = hash.split("/")[1];
      if (["users", "analyses", "reports", "statistics", "system", "community"].includes(sub)) {
        return sub as AdminSubView;
      }
    }
    return "dashboard";
  };

  const [activeSubView, setActiveSubView] = useState<AdminSubView>(getSubViewFromHash());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync activeSubView with URL hash
  useEffect(() => {
    const onHashChange = () => {
      setActiveSubView(getSubViewFromHash());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleSubViewChange = (subView: AdminSubView) => {
    setActiveSubView(subView);
    setIsMobileMenuOpen(false);
    if (subView === "dashboard") {
      window.location.hash = "#admin";
    } else {
      window.location.hash = `#admin/${subView}`;
    }
  };

  // Section 2: Role-Based Access Control
  if (!user || user.role !== "admin") {
    return <AccessDenied onBackToDashboard={() => onNavigate("dashboard")} />;
  }

  const navItems = [
    { id: "dashboard" as AdminSubView, label: "Admin Dashboard", icon: LayoutDashboard, emoji: "🛡️" },
    { id: "users" as AdminSubView, label: "Users", icon: Users, emoji: "👥" },
    { id: "analyses" as AdminSubView, label: "Analyses", icon: Brain, emoji: "🧠" },
    { id: "reports" as AdminSubView, label: "Reports", icon: FileText, emoji: "📄" },
    { id: "statistics" as AdminSubView, label: "Statistics", icon: BarChart3, emoji: "📊" },
    { id: "system" as AdminSubView, label: "System", icon: Settings, emoji: "⚙️" },
    { id: "community" as AdminSubView, label: "Community Moderation", icon: ShieldAlert, emoji: "🚩" },
  ];

  const getSubViewHeaderMeta = () => {
    switch (activeSubView) {
      case "dashboard":
        return {
          title: "Admin Dashboard",
          subtitle: "Monitor and manage the SentimentAI platform.",
          badge: "Enterprise Admin"
        };
      case "users":
        return {
          title: "User Management",
          subtitle: "Manage accounts, roles, access authorizations, and user statistics.",
          badge: "Access Control"
        };
      case "analyses":
        return {
          title: "Analysis Management",
          subtitle: "Review, filter, inspect, and audit multimodal intelligence records.",
          badge: "Intelligence Audit"
        };
      case "reports":
        return {
          title: "Report Management",
          subtitle: "Inspect, download, and manage enterprise intelligence dockets.",
          badge: "Document Control"
        };
      case "statistics":
        return {
          title: "Platform Statistics",
          subtitle: "Deep telemetry and sentiment trend visual distribution.",
          badge: "Analytics Core"
        };
      case "system":
        return {
          title: "System Management",
          subtitle: "Real-time health monitoring of platform infrastructure and services.",
          badge: "Infrastructure"
        };
      case "community":
        return {
          title: "Community Moderation",
          subtitle: "Review reported posts, comments, community violations, and take enforcement actions.",
          badge: "Trust & Safety"
        };
    }
  };

  const headerMeta = getSubViewHeaderMeta();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-blue-500/30">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#020617]/85 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 lg:hidden rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40 text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-none flex items-center gap-1.5">
                  SentimentAI <span className="text-blue-400 font-extrabold">ADMIN</span>
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                  Unified Intelligence Platform
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                {(user.name || "A").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-300">{user.name}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                ADMIN
              </span>
            </div>

            <button
              onClick={() => {
                window.location.hash = "#dashboard";
                onNavigate("dashboard");
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
              title="Return to user workspace"
            >
              <LogOut className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full relative">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-64px)] w-64 border-r border-slate-800 bg-[#020617] z-40 transition-transform duration-300 lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}>
          <nav className="p-4 space-y-1.5" aria-label="Admin Navigation">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Admin Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSubView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSubViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <span className="text-base shrink-0">{item.emoji}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">System State</span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300">Verified Operational</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile menu */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto">
          {/* Top Admin Header with Title and Subtitle */}
          <AdminHeader
            title={headerMeta.title}
            subtitle={headerMeta.subtitle}
            badge={headerMeta.badge}
          />

          {/* Subview Rendering */}
          {activeSubView === "dashboard" && (
            <AdminDashboardHome
              onNavigateSubView={handleSubViewChange}
              onBackToDashboard={() => onNavigate("dashboard")}
            />
          )}

          {activeSubView === "users" && (
            <UserManagement admin={user} />
          )}

          {activeSubView === "analyses" && (
            <AnalysisManagement
              admin={user}
              onNavigateToAnalysis={(id) => {
                window.location.hash = `#analysis/${id}`;
                onNavigate("analysis-detail");
              }}
            />
          )}

          {activeSubView === "reports" && (
            <ReportManagement
              admin={user}
              onNavigateToReport={(id) => {
                window.location.hash = `#reports/${id}`;
                onNavigate("report-detail");
              }}
            />
          )}

          {activeSubView === "statistics" && (
            <AdminStatistics />
          )}

          {activeSubView === "system" && (
            <SystemStatus />
          )}

          {activeSubView === "community" && (
            <CommunityModerationManagement admin={user} />
          )}
        </main>
      </div>
    </div>
  );
}
