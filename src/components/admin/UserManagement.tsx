import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { User } from "../../types";
import { adminService, ExtendedUser } from "../../services/adminService";
import { auditLogService } from "../../services/auditLogService";
import { UserTable } from "./UserTable";
import { UserDetails } from "./UserDetails";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { AdminTableSkeleton } from "./AdminSkeleton";

interface UserManagementProps {
  admin: User;
}

export function UserManagement({ admin }: UserManagementProps) {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected user for details modal
  const [selectedUserDetailed, setSelectedUserDetailed] = useState<any | null>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "suspend" | "activate" | "role" | null;
    user: ExtendedUser | null;
  }>({
    isOpen: false,
    type: null,
    user: null
  });

  // Feedback banner / toast
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
      setFeedback({ message: "Failed to load platform users.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Show auto-dismissing toast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // View user details
  const handleViewDetails = async (targetUser: ExtendedUser) => {
    try {
      const details = await adminService.getUserProfile(targetUser.id || targetUser.userId);
      setSelectedUserDetailed(details);
    } catch (err) {
      console.error("Failed to load user details:", err);
    }
  };

  // Trigger suspend confirmation
  const handlePromptSuspend = (targetUser: ExtendedUser) => {
    setConfirmDialog({
      isOpen: true,
      type: "suspend",
      user: targetUser
    });
  };

  // Trigger activate confirmation
  const handlePromptActivate = (targetUser: ExtendedUser) => {
    setConfirmDialog({
      isOpen: true,
      type: "activate",
      user: targetUser
    });
  };

  // Trigger change role confirmation
  const handlePromptRole = (targetUser: ExtendedUser) => {
    setConfirmDialog({
      isOpen: true,
      type: "role",
      user: targetUser
    });
  };

  // Execute confirmed action
  const handleConfirmAction = async () => {
    if (!confirmDialog.user || !confirmDialog.type) return;

    const targetUser = confirmDialog.user;
    const actionType = confirmDialog.type;
    const targetId = targetUser.id || targetUser.userId;
    const targetName = targetUser.fullName || targetUser.name;

    try {
      if (actionType === "suspend") {
        const ok = await adminService.suspendUser(targetId);
        if (ok) {
          await auditLogService.log({
            adminId: admin.id,
            adminName: admin.name,
            action: "USER_SUSPENDED",
            targetId,
            targetName,
            details: `Suspended account access for ${targetName}`
          });
          showToast("✅ User suspended successfully.");
        }
      } else if (actionType === "activate") {
        const ok = await adminService.activateUser(targetId);
        if (ok) {
          await auditLogService.log({
            adminId: admin.id,
            adminName: admin.name,
            action: "USER_ACTIVATED",
            targetId,
            targetName,
            details: `Reactivated account access for ${targetName}`
          });
          showToast("✅ User activated successfully.");
        }
      } else if (actionType === "role") {
        const newRole = targetUser.role === "admin" ? "user" : "admin";
        const ok = await adminService.updateUserRole(targetId, newRole);
        if (ok) {
          await auditLogService.log({
            adminId: admin.id,
            adminName: admin.name,
            action: "USER_ROLE_CHANGED",
            targetId,
            targetName,
            details: `Updated role from ${targetUser.role.toUpperCase()} to ${newRole.toUpperCase()}`
          });
          showToast(`✅ User role updated to ${newRole.toUpperCase()} successfully.`);
        }
      }

      await loadUsers();
    } catch (err) {
      console.error("Action execution error:", err);
      showToast("Operation failed. Please try again.", "error");
    } finally {
      setConfirmDialog({ isOpen: false, type: null, user: null });
    }
  };

  // Filtered and searched users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q)) ||
      (u.userId && u.userId.toLowerCase().includes(q));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            👥 User Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authenticated user roles, platform access statuses, and permissions.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Toast message if present */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold transition-all ${
          feedback.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="🔍 Search users by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <AdminTableSkeleton rows={5} cols={9} />
        ) : (
          <UserTable
            users={filteredUsers}
            admin={admin}
            onViewDetails={handleViewDetails}
            onSuspendUser={handlePromptSuspend}
            onActivateUser={handlePromptActivate}
            onChangeRole={handlePromptRole}
          />
        )}
      </div>

      {/* Detailed User Modal */}
      <UserDetails
        user={selectedUserDetailed}
        onClose={() => setSelectedUserDetailed(null)}
      />

      {/* Confirmation Dialogs for Actions */}
      {confirmDialog.type === "suspend" && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title="Suspend this user?"
          description={`The user ${confirmDialog.user?.fullName || confirmDialog.user?.name} will no longer be able to access the application.`}
          confirmLabel="Suspend User"
          variant="danger"
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmDialog({ isOpen: false, type: null, user: null })}
        />
      )}

      {confirmDialog.type === "activate" && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title="Activate this user?"
          description={`Reactivate ${confirmDialog.user?.fullName || confirmDialog.user?.name} to restore normal platform access.`}
          confirmLabel="Activate User"
          variant="success"
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmDialog({ isOpen: false, type: null, user: null })}
        />
      )}

      {confirmDialog.type === "role" && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title="Change user role?"
          description="This will change the user's access permissions."
          confirmLabel="Confirm"
          variant="warning"
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmDialog({ isOpen: false, type: null, user: null })}
        />
      )}
    </div>
  );
}
