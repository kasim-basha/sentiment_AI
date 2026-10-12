import React, { useState, useEffect, useRef } from "react";
import { User, UserProfile, ProfileStats, ViewState } from "../../types";
import { profileService } from "../../services/profileService";
import { profileImageService } from "../../services/profileImageService";
import {
  User as UserIcon, Mail, Phone, Calendar, MapPin, Globe,
  Camera, Trash2, Edit2, CheckCircle2, XCircle, AlertCircle,
  Activity, FileText, Mic, Clock, ShieldCheck, Share2,
  Monitor, Smartphone, Tablet, LogOut
} from "lucide-react";
import { DashboardNavbar } from "../dashboard/DashboardNavbar";
import { ProfileShareModal } from "./ProfileShareModal";

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  setView: (view: ViewState) => void;
}

export function ProfilePage({ user, onLogout, setView }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Share State
  const [showShareModal, setShowShareModal] = useState(false);

  // Image Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfileData();
  }, [user.id]);

  const loadProfileData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [userProfile, userStats] = await Promise.all([
        profileService.getCurrentUserProfile(user.id, user.email, user.name),
        profileService.getProfileStatistics(user.id)
      ]);
      setProfile(userProfile);
      setStats(userStats);
      setEditForm(userProfile);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Unable to load your profile. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    setHasUnsavedChanges(true);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      setIsEditing(false);
    }
  };

  const handleDiscardChanges = () => {
    setEditForm(profile || {});
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setError(null);
    try {
      const updated = await profileService.updateUserProfile(user.id, editForm);
      setProfile(updated);
      setIsEditing(false);
      setHasUnsavedChanges(false);
      // Optional: show success toast here
    } catch (err) {
      setError("Unable to update your profile. Please try again.");
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setImageError(null);
    setIsUploadingImage(true);

    try {
      const base64Image = await profileImageService.uploadImage(file);
      const updated = await profileService.updateUserProfile(user.id, { profilePicture: base64Image });
      setProfile(updated);
      setEditForm(prev => ({ ...prev, profilePicture: base64Image }));
    } catch (err: any) {
      setImageError(err.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!profile) return;
    try {
      const updated = await profileService.updateUserProfile(user.id, { profilePicture: "" });
      setProfile(updated);
      setEditForm(prev => ({ ...prev, profilePicture: "" }));
    } catch (err) {
      setImageError("Failed to remove image.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#020617]">
        <DashboardNavbar user={user} onLogout={onLogout} onNavigate={setView} currentView="profile" />
        <div className="flex-1 flex flex-col items-center p-6 mt-10">
          <div className="w-full max-w-5xl space-y-8 animate-pulse">
            <div className="h-10 w-48 bg-slate-800 rounded-lg"></div>
            <div className="h-48 w-full bg-slate-800/50 rounded-3xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-96 bg-slate-800/50 rounded-3xl"></div>
              <div className="h-96 bg-slate-800/50 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#020617]">
        <DashboardNavbar user={user} onLogout={onLogout} onNavigate={setView} currentView="profile" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{error || "Unable to load profile"}</h2>
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={loadProfileData}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => setView("dashboard")}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#020617]">
      <DashboardNavbar user={user} onLogout={onLogout} onNavigate={setView} currentView="profile" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 relative z-10">

        {/* Page Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <UserIcon className="w-8 h-8 text-blue-500" /> My Profile
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Manage your personal information and account details.
            </p>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-sm font-semibold transition-colors self-start sm:self-center"
          >
            <Share2 className="w-4 h-4" /> Share Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 flex flex-col gap-8">

            {/* Profile Picture Card */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-blue-900/20 to-transparent"></div>

              <div className="relative group z-10 mt-4 mb-6">
                <div className={`w-32 h-32 rounded-full border-4 border-slate-900 shadow-xl overflow-hidden bg-slate-800 flex items-center justify-center ${isUploadingImage ? 'animate-pulse' : ''}`}>
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-bold text-slate-500">{profile.fullName.charAt(0)}</span>
                  )}
                </div>

                {/* Image Upload Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                  <button onClick={handleImageClick} className="text-white hover:text-blue-400 transition-colors p-2" title="Change Photo">
                    <Camera className="w-6 h-6" />
                  </button>
                  {profile.profilePicture && (
                    <button onClick={handleRemoveImage} className="text-rose-400 hover:text-rose-300 transition-colors p-2" title="Remove Photo">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              {imageError && (
                <p className="text-rose-400 text-xs mt-2 mb-4 text-center">{imageError}</p>
              )}

              <h2 className="text-xl font-bold text-white tracking-tight">{profile.fullName}</h2>
              <p className="text-slate-400 text-sm mt-1">{profile.email}</p>

              <div className="mt-6 flex flex-col w-full gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span>Account Status</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Member Since</span>
                  <span className="text-slate-300">{formatDate(profile.createdAt).split(' ')[1]} {formatDate(profile.createdAt).split(' ')[2]}</span>
                </div>
              </div>
            </div>

            {/* Profile Statistics Card */}
            {stats && (
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Statistics
                </h3>

                <div className="space-y-4">
                  <div className="bg-slate-950/50 border border-slate-800/40 rounded-2xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">Total Analyses</span>
                    </div>
                    <span className="text-lg font-bold text-white">{stats.totalAnalyses}</span>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/40 rounded-2xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">Total Reports</span>
                    </div>
                    <span className="text-lg font-bold text-white">{stats.totalReports}</span>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/40 rounded-2xl p-4 flex justify-between items-center opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Mic className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">Voice Sessions</span>
                    </div>
                    <span className="text-sm font-medium text-slate-500 italic">Not available</span>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-8">

            {/* Personal Information */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  👤 Personal Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="fullName"
                        value={editForm.fullName || ""}
                        onChange={handleEditChange}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    ) : (
                      <div className="flex items-center gap-3 text-slate-200 font-medium px-4 py-3 bg-slate-950/30 rounded-xl border border-transparent">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        {profile.fullName || <span className="text-slate-500 italic">Not provided</span>}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                    <div className="flex items-center gap-3 text-slate-400 font-medium px-4 py-3 bg-slate-950/50 rounded-xl border border-slate-800/50 cursor-not-allowed">
                      <Mail className="w-4 h-4 text-slate-500" />
                      {profile.email}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone || ""}
                        onChange={handleEditChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="+1 (555) 000-0000"
                      />
                    ) : (
                      <div className="flex items-center gap-3 text-slate-200 font-medium px-4 py-3 bg-slate-950/30 rounded-xl border border-transparent">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {profile.phone || <span className="text-slate-500 italic">Not provided</span>}
                      </div>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={editForm.dateOfBirth || ""}
                        onChange={handleEditChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
                      />
                    ) : (
                      <div className="flex items-center gap-3 text-slate-200 font-medium px-4 py-3 bg-slate-950/30 rounded-xl border border-transparent">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : <span className="text-slate-500 italic">Not provided</span>}
                      </div>
                    )}
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Country</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="country"
                        value={editForm.country || ""}
                        onChange={handleEditChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="e.g. United States"
                      />
                    ) : (
                      <div className="flex items-center gap-3 text-slate-200 font-medium px-4 py-3 bg-slate-950/30 rounded-xl border border-transparent">
                        <Globe className="w-4 h-4 text-slate-400" />
                        {profile.country || <span className="text-slate-500 italic">Not provided</span>}
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="city"
                        value={editForm.city || ""}
                        onChange={handleEditChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="e.g. San Francisco"
                      />
                    ) : (
                      <div className="flex items-center gap-3 text-slate-200 font-medium px-4 py-3 bg-slate-950/30 rounded-xl border border-transparent">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {profile.city || <span className="text-slate-500 italic">Not provided</span>}
                      </div>
                    )}
                  </div>

                </div>

                {/* Edit Form Actions */}
                {isEditing && (
                  <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!hasUnsavedChanges}
                      className={`px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 ${
                        hasUnsavedChanges
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-900/50 text-blue-300/50 cursor-not-allowed"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Account Information */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-8">
                <ShieldCheck className="w-6 h-6 text-indigo-400" /> Account Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/40 p-6 rounded-3xl border border-slate-800/50">

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">User ID</span>
                  <div className="text-sm font-mono text-slate-300 break-all">{profile.userId}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Account Status</span>
                  <div className="text-sm font-medium text-emerald-400 capitalize">{profile.accountStatus}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Account Created</span>
                  <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> {formatDate(profile.createdAt)}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Login</span>
                  <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {formatDate(profile.lastLoginAt)}
                  </div>
                </div>

              </div>
            </div>

            {/* Login Sessions & Devices */}
            {profile.recentSessions && profile.recentSessions.length > 0 && (
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Monitor className="w-6 h-6 text-emerald-400" /> Active Sessions & Devices
                  </h2>
                </div>

                <div className="space-y-4">
                  {profile.recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors ${
                        session.isCurrentSession
                          ? 'bg-slate-900 border-emerald-500/30'
                          : 'bg-slate-950/40 border-slate-800/50 hover:border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${session.isCurrentSession ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/50 text-slate-400'}`}>
                          {session.deviceType === 'mobile' ? <Smartphone className="w-6 h-6" /> :
                           session.deviceType === 'tablet' ? <Tablet className="w-6 h-6" /> :
                           <Monitor className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-white">{session.deviceName}</h4>
                            {session.isCurrentSession && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{session.browser} • {session.ipAddress}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {session.location}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDate(session.lastActive)}</span>
                          </div>
                        </div>
                      </div>

                      {!session.isCurrentSession && (
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-transparent hover:border-rose-500/20 rounded-xl text-xs font-semibold transition-colors">
                          <LogOut className="w-3.5 h-3.5" /> Sign out
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowUnsavedDialog(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Unsaved changes</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              You have unsaved profile changes. Are you sure you want to leave without saving? Your changes will be lost.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowUnsavedDialog(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleDiscardChanges}
                className="px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 rounded-xl font-semibold transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Profile Modal */}
      <ProfileShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        profile={profile}
      />
    </div>
  );
}
