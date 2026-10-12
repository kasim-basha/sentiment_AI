import { useState, useEffect } from "react";
import {
  Bell,
  Menu,
  X,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Zap,
  History,
  FileText,
  Shield,
  Globe,
  Users,
  Search,
  BarChart3,
  Sparkles,
  Bot,
  Target,
  Cloud
} from "lucide-react";
import { SentimentAILogo } from "../SentimentAILogo";
import { ViewState, User, UnreadCounts } from "../../types";
import { notificationService } from "../../services/notificationService";
import { realtimeClient } from "../../services/realtimeClient";
import { NotificationsDrawer } from "../notifications/NotificationsDrawer";
import { CloudStorageHubModal } from "../cloud/CloudStorageHubModal";
import { cloudStorageService, CloudSyncStatus } from "../../services/cloudStorageService";

interface DashboardNavbarProps {
  user: User;
  onLogout: () => void;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
  onViewAnalysis?: (id: string) => void;
  onViewReport?: (id: string) => void;
}

export function DashboardNavbar({
  user,
  onLogout,
  onNavigate,
  currentView,
  onViewAnalysis,
  onViewReport
}: DashboardNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>("synced");
  const [cloudStatusMsg, setCloudStatusMsg] = useState<string>("Automatic Cloud Storage active");
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    friendRequests: 0,
    unreadMessages: 0,
    missedCalls: 0,
    notifications: 0,
    total: 0
  });

  const fetchCounts = async () => {
    try {
      const counts = await notificationService.getUnreadCounts();
      setUnreadCounts(counts);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCounts();

    const unsubCloud = cloudStorageService.onSyncStatusChange((status, message) => {
      setCloudStatus(status);
      setCloudStatusMsg(message);
    });

    const unMsg = realtimeClient.on("new_message", fetchCounts);
    const unReq = realtimeClient.on("friend_request_received", fetchCounts);
    const unAccepted = realtimeClient.on("friend_request_accepted", fetchCounts);
    const unCall = realtimeClient.on("incoming_call", fetchCounts);

    return () => {
      unsubCloud();
      unMsg();
      unReq();
      unAccepted();
      unCall();
    };
  }, []);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, view: "dashboard" as ViewState },
    { name: "Search", icon: Search, view: "search" as ViewState },
    { name: "My Analysis", icon: Zap, view: "my-analysis" as ViewState },
    { name: "History", icon: History, view: "history" as ViewState },
    { name: "Analytics", icon: BarChart3, view: "analytics" as ViewState },
    { name: "AI Insights", icon: Bot, view: "insights" as ViewState },
    { name: "Goals", icon: Target, view: "goals" as ViewState },
    { name: "Reports", icon: FileText, view: "reports" as ViewState },
    { name: "Community", icon: Globe, view: "community" as ViewState },
    { name: "Gemini AI", icon: Sparkles, view: "chatbot" as ViewState },
    {
      name: "Friends & Messages",
      icon: Users,
      view: "friends" as ViewState,
      badge: unreadCounts.friendRequests + unreadCounts.unreadMessages
    },
  ];

  if (user?.role === "admin") {
    navItems.push({ name: "Admin", icon: Shield, view: "admin" as ViewState });
  }

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 mr-6">
              <SentimentAILogo className="w-8 h-8" />
              <span className="text-xl font-bold text-white tracking-tight">SentimentAI</span>
            </div>

            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => onNavigate(item.view)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer relative ${
                    currentView === item.view
                      ? "text-white bg-slate-800"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Quick Search Shortcut Button */}
            <button
              onClick={() => onNavigate("search")}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-xs mr-1"
              title="Global Search (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Quick Search...</span>
              <kbd className="px-1.5 py-0.2 bg-slate-900 border border-slate-700/60 rounded text-[10px] text-slate-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Automatic Cloud Storage Quick Button */}
            <button
              id="btn-navbar-cloud-storage"
              onClick={() => setIsCloudModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-lg text-xs text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs mr-1 group"
              title={`Automatic Cloud Storage: ${cloudStatusMsg}`}
            >
              <Cloud className={`w-3.5 h-3.5 ${cloudStatus === "syncing" ? "text-blue-400 animate-bounce" : "text-blue-400 group-hover:text-blue-300"}`} />
              <span className="hidden sm:inline text-[11px] font-medium">Cloud</span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                cloudStatus === "synced"
                  ? "bg-emerald-400 animate-pulse"
                  : cloudStatus === "syncing"
                  ? "bg-amber-400 animate-spin"
                  : "bg-slate-500"
              }`} />
            </button>

            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors relative cursor-pointer"
              title="Notifications & Activity"
            >
              <Bell className="w-5 h-5" />
              {unreadCounts.total > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold bg-indigo-500 text-white rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm">
                  {unreadCounts.total > 9 ? "9+" : unreadCounts.total}
                </span>
              )}
            </button>

            <div className="relative ml-2">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0) || '?'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white leading-none">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Premium Tier</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsProfileMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        onNavigate("search");
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-indigo-400" /> Global Search
                    </button>
                    <button
                      onClick={() => {
                        onNavigate("profile");
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4" /> Profile
                    </button>
                    <button
                      onClick={() => {
                        onNavigate("friends");
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4" /> Friends & Messages
                    </button>
                    <button
                      onClick={() => {
                        onNavigate("settings");
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button
                      id="btn-menu-cloud-storage-hub"
                      onClick={() => {
                        setIsCloudModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-slate-800 hover:text-blue-300 flex items-center gap-2 cursor-pointer"
                    >
                      <Cloud className="w-4 h-4 text-blue-400" /> Cloud Storage Hub
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => {
                          onNavigate("admin");
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Shield className="w-4 h-4" /> 🛡️ Admin Dashboard
                      </button>
                    )}
                    <div className="h-px bg-slate-800 my-1"></div>
                    <button
                      onClick={onLogout}
                      className="w-full px-4 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Drawer Modal */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          fetchCounts();
        }}
        onNavigate={onNavigate}
        onViewAnalysis={onViewAnalysis}
        onViewReport={onViewReport}
      />

      {/* Automatic Cloud Storage Hub Modal */}
      <CloudStorageHubModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                onNavigate(item.view);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer ${
                currentView === item.view
                  ? "text-white bg-slate-800"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-xs font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
          {user?.role === "admin" && (
            <button
              onClick={() => {
                onNavigate("admin");
                setIsMobileMenuOpen(false);
              }}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium text-blue-400 hover:bg-blue-500/10 flex items-center gap-3 cursor-pointer"
            >
              <Shield className="w-5 h-5" /> 🛡️ Admin Dashboard
            </button>
          )}
          <div className="h-px bg-slate-800 my-2"></div>
          <button
            onClick={onLogout}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 flex items-center gap-3 cursor-pointer"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
