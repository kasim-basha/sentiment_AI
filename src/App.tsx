import { useState, useEffect } from "react";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { Dashboard } from "./components/Dashboard";
import { MyAnalysis } from "./components/MyAnalysis";
import { History } from "./components/History";
import { Reports } from "./components/Reports";
import { AnalysisDetailView } from "./components/history/AnalysisDetailView";
import { ProfilePage } from "./components/profile/ProfilePage";
import { SettingsPage } from "./components/settings/SettingsPage";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AccessDenied } from "./components/admin/AccessDenied";
import { CommunityPage } from "./components/community/CommunityPage";
import { FriendsView } from "./components/friends/FriendsView";
import { SearchPage } from "./components/search/SearchPage";
import { AnalyticsPage } from "./components/analytics/AnalyticsPage";
import { InsightsPage } from "./components/insights/InsightsPage";
import { GoalsPage } from "./components/goals/GoalsPage";
import { GeminiChatbot } from "./components/chatbot/GeminiChatbot";
import { GeminiFloatingChat } from "./components/chatbot/GeminiFloatingChat";
import { GlobalCallManager } from "./components/friends/GlobalCallManager";
import { DashboardNavbar } from "./components/dashboard/DashboardNavbar";
import { Shield, Lock } from "lucide-react";
import { ViewState, User } from "./types";

export default function App() {
  const [view, setView] = useState<ViewState>("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Sync with browser hash / path changes for /history, /my-analysis, /analysis/:id, /reports, /reports/:id, /profile, /admin
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      const pathname = window.location.pathname.replace(/^\//, "");
      const target = hash || pathname;

      if (target === "admin" || target.startsWith("admin/")) {
        setView("admin");
        return;
      }

      if (target.startsWith("analysis/")) {
        const id = target.split("/")[1];
        if (id) {
          setSelectedAnalysisId(id);
          setView("analysis-detail");
          return;
        }
      }

      if (target.startsWith("reports/")) {
        const id = target.split("/")[1];
        if (id) {
          setSelectedReportId(id);
          setView("reports");
          return;
        }
      }

      if (target === "history") {
        setView("history");
      } else if (target === "my-analysis") {
        setView("my-analysis");
      } else if (target === "dashboard") {
        setView("dashboard");
      } else if (target === "reports") {
        setSelectedReportId(null);
        setView("reports");
      } else if (target === "profile") {
        setView("profile");
      } else if (target === "settings") {
        setView("settings");
      } else if (target === "community" || target.startsWith("community")) {
        setView("community");
      } else if (target === "friends" || target.startsWith("friends")) {
        setView("friends");
      } else if (target === "search" || target.startsWith("search")) {
        setView("search");
      } else if (target === "analytics" || target.startsWith("analytics")) {
        setView("analytics");
      } else if (target === "insights" || target.startsWith("insights")) {
        setView("insights");
      } else if (target === "goals" || target.startsWith("goals")) {
        setView("goals");
      } else if (target === "chatbot" || target === "chat" || target.startsWith("chatbot")) {
        setView("chatbot");
      }
    };

    handleLocationChange();
    window.addEventListener("hashchange", handleLocationChange);

    // Check Firebase Auth state & stored session on mount
    import("./services/authService").then(({ authService }) => {
      const stored = authService.getStoredUser();
      if (stored) {
        handleLogin(stored);
      }
    });

    let unsubscribeFb: (() => void) | undefined;
    import("./services/firebaseAuthService").then(({ firebaseAuthService }) => {
      unsubscribeFb = firebaseAuthService.onAuthStateChanged((fbUser) => {
        if (fbUser) {
          handleLogin(fbUser);
        }
      });
    });

    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      if (unsubscribeFb) unsubscribeFb();
    };
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (view === "login" || view === "register") {
      setView("dashboard");
      window.location.hash = "#dashboard";
    }

    // Apply user settings immediately on login
    import("./services/settingsService").then(({ settingsService }) => {
      settingsService.getUserSettings(user.id).then(settings => {
        settingsService.applyTheme(settings.appearance.theme, settings.appearance.nightLight);
      });
    });
  };

  const handleLogout = () => {
    import("./services/authService").then(({ authService }) => {
      authService.logout().catch(() => {});
    });
    setCurrentUser(null);
    setSelectedAnalysisId(null);
    setView("login");
    window.location.hash = "#login";
  };

  const handleNavigate = (nextView: ViewState) => {
    setView(nextView);
    if (nextView !== "analysis-detail") {
      window.location.hash = `#${nextView}`;
    }
  };

  const handleViewAnalysis = (id: string) => {
    setSelectedAnalysisId(id);
    setView("analysis-detail");
    window.location.hash = `#analysis/${id}`;
  };

  const handleViewReport = (id: string) => {
    setSelectedReportId(id);
    setView("reports");
    window.location.hash = `#reports/${id}`;
  };

  const renderAuthenticatedContent = () => {
    if (!currentUser) return null;

    if (view === "analysis-detail" && selectedAnalysisId) {
      return (
        <AnalysisDetailView
          analysisId={selectedAnalysisId}
          user={currentUser}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onViewReport={handleViewReport}
          onBackToHistory={() => {
            setView("history");
            window.location.hash = "#history";
          }}
        />
      );
    }

    if (view === "dashboard") {
      return (
        <Dashboard
          user={currentUser}
          onLogout={handleLogout}
          setView={handleNavigate}
          onViewAnalysis={handleViewAnalysis}
        />
      );
    }

    if (view === "my-analysis") {
      return (
        <MyAnalysis
          user={currentUser}
          onLogout={handleLogout}
          setView={handleNavigate}
          onViewAnalysis={handleViewAnalysis}
          onViewReport={handleViewReport}
        />
      );
    }

    if (view === "history") {
      return (
        <History
          user={currentUser}
          onLogout={handleLogout}
          setView={handleNavigate}
          onViewAnalysis={handleViewAnalysis}
          onViewReport={handleViewReport}
        />
      );
    }

    if (view === "reports") {
      return (
        <Reports
          user={currentUser}
          onLogout={handleLogout}
          setView={handleNavigate}
          initialReportId={selectedReportId}
        />
      );
    }

    if (view === "profile") {
      return (
        <ProfilePage
          user={currentUser}
          onLogout={handleLogout}
          setView={handleNavigate}
        />
      );
    }

    if (view === "settings") {
      return (
        <SettingsPage
          user={currentUser}
          onLogout={handleLogout}
          setView={handleNavigate}
        />
      );
    }

    if (view === "admin") {
      if (currentUser.role !== "admin") {
        return (
          <AccessDenied
            onBackToDashboard={() => {
              setView("dashboard");
              window.location.hash = "#dashboard";
            }}
          />
        );
      }
      return (
        <AdminDashboard
          user={currentUser}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      );
    }

    if (view === "community") {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between">
          <DashboardNavbar
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            currentView={view}
          />
          <main className="flex-1">
            <CommunityPage
              currentUser={currentUser}
              onNavigateToDashboard={() => handleNavigate("dashboard")}
              onViewAnalysis={handleViewAnalysis}
            />
          </main>
        </div>
      );
    }

    if (view === "friends") {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between">
          <DashboardNavbar
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            currentView={view}
          />
          <main className="flex-1">
            <FriendsView currentUser={currentUser} />
          </main>
        </div>
      );
    }

    if (view === "search") {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between">
          <DashboardNavbar
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            currentView={view}
            onViewAnalysis={handleViewAnalysis}
            onViewReport={handleViewReport}
          />
          <main className="flex-1">
            <SearchPage
              currentUser={currentUser}
              onNavigateToDashboard={() => handleNavigate("dashboard")}
              onViewAnalysis={handleViewAnalysis}
              onViewReport={handleViewReport}
              onViewPost={() => handleNavigate("community")}
            />
          </main>
        </div>
      );
    }

    if (view === "analytics") {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between">
          <DashboardNavbar
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            currentView={view}
            onViewAnalysis={handleViewAnalysis}
            onViewReport={handleViewReport}
          />
          <main className="flex-1">
            <AnalyticsPage
              user={currentUser as any}
              onNavigate={handleNavigate}
            />
          </main>
        </div>
      );
    }

    if (view === "insights") {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between">
          <DashboardNavbar
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            currentView={view}
            onViewAnalysis={handleViewAnalysis}
            onViewReport={handleViewReport}
          />
          <main className="flex-1">
            <InsightsPage
              user={currentUser as any}
              onNavigate={handleNavigate}
            />
          </main>
        </div>
      );
    }

    if (view === "goals") {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between">
          <DashboardNavbar
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            currentView={view}
            onViewAnalysis={handleViewAnalysis}
            onViewReport={handleViewReport}
          />
          <main className="flex-1">
            <GoalsPage
              user={currentUser}
              onNavigate={handleNavigate}
              onViewAnalysis={handleViewAnalysis}
              onViewReport={handleViewReport}
            />
          </main>
        </div>
      );
    }

    if (view === "chatbot") {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between">
          <DashboardNavbar
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            currentView={view}
            onViewAnalysis={handleViewAnalysis}
            onViewReport={handleViewReport}
          />
          <main className="flex-1">
            <GeminiChatbot
              currentUser={currentUser}
              onNavigate={handleNavigate}
            />
          </main>
        </div>
      );
    }

    return (
      <Dashboard
        user={currentUser}
        onLogout={handleLogout}
        setView={handleNavigate}
        onViewAnalysis={handleViewAnalysis}
      />
    );
  };

  if (currentUser && view !== "login" && view !== "register") {
    return (
      <>
        {renderAuthenticatedContent()}
        <GlobalCallManager currentUser={currentUser} />
        {view !== "chatbot" && (
          <GeminiFloatingChat
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        )}
      </>
    );
  }

  return (
    <div
      id="sentimentai-app-root"
      className="min-h-screen w-full flex flex-col justify-between font-sans bg-[#020617] text-slate-100 antialiased selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden"
    >
      {/* Sleek radial dot grid texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#334155 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Atmospheric ambient lighting */}
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[650px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top minimal status bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-6 pb-2 flex items-center justify-end text-xs text-slate-400">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Platform Online • SentimentAI v2.4</span>
        </div>
      </header>

      {/* Main Single-Screen Login/Register Container */}
      <main id="main-content" className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        {view === "login" ? (
          <LoginForm
            onSwitchToRegister={() => setView("register")}
            onLogin={handleLogin}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={() => setView("login")}
            onRegisterSuccess={handleLogin}
          />
        )}
      </main>

      {/* Bottom Minimal Footer */}
      <footer id="app-footer" className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <span>© 2026 SentimentAI Technologies Inc. All rights reserved.</span>
        <div className="flex items-center gap-5">
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-300 transition-colors">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-300 transition-colors">
            Terms of Service
          </a>
          <span>•</span>
          <a href="#security" onClick={(e) => e.preventDefault()} className="hover:text-slate-300 transition-colors flex items-center gap-1.5 text-blue-400">
            <Shield className="w-3.5 h-3.5" />
            <span>SOC2 Type II Certified</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
