import React from "react";
import {
  Eye,
  UserMinus,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Calendar,
  AlertCircle
} from "lucide-react";
import { ExtendedUser } from "../../services/adminService";
import { User } from "../../types";

interface UserTableProps {
  users: ExtendedUser[];
  admin: User;
  onViewDetails: (user: ExtendedUser) => void;
  onSuspendUser: (user: ExtendedUser) => void;
  onActivateUser: (user: ExtendedUser) => void;
  onChangeRole: (user: ExtendedUser) => void;
}

export function UserTable({
  users,
  admin,
  onViewDetails,
  onSuspendUser,
  onActivateUser,
  onChangeRole
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-medium">No users found matching your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[850px]" aria-label="Users Table">
        <thead>
          <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th scope="col" className="px-5 py-3.5">User</th>
            <th scope="col" className="px-5 py-3.5">Email</th>
            <th scope="col" className="px-5 py-3.5">Role</th>
            <th scope="col" className="px-5 py-3.5">Status</th>
            <th scope="col" className="px-5 py-3.5">Created Date</th>
            <th scope="col" className="px-5 py-3.5">Last Login</th>
            <th scope="col" className="px-5 py-3.5 text-center">Analyses</th>
            <th scope="col" className="px-5 py-3.5 text-center">Reports</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm">
          {users.map((u) => {
            const isCurrentAdmin = u.id === admin.id || u.userId === admin.id;

            return (
              <tr key={u.id || u.userId} className="hover:bg-slate-800/30 transition-colors">
                {/* User Column */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                      {(u.fullName || u.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate max-w-[140px]">
                        {u.fullName || u.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {u.userId || u.id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Email Column */}
                <td className="px-5 py-4 text-slate-300 text-xs font-mono">
                  {u.email}
                </td>

                {/* Role Column */}
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                    u.role === "admin"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  }`}>
                    <ShieldCheck className="w-3 h-3" />
                    {u.role}
                  </span>
                </td>

                {/* Status Column */}
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                    u.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      u.status === "active" ? "bg-emerald-400" : "bg-rose-400"
                    }`} />
                    {u.status}
                  </span>
                </td>

                {/* Created Date Column */}
                <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                  </div>
                </td>

                {/* Last Login Column */}
                <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Never"}
                  </div>
                </td>

                {/* Analyses Count */}
                <td className="px-5 py-4 text-center">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {u.analysesCount ?? 0}
                  </span>
                </td>

                {/* Reports Count */}
                <td className="px-5 py-4 text-center">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {u.reportsCount ?? 0}
                  </span>
                </td>

                {/* Actions Column */}
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View User Details */}
                    <button
                      onClick={() => onViewDetails(u)}
                      title="View user details"
                      aria-label={`View details for ${u.fullName || u.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Change Role Button */}
                    {!isCurrentAdmin ? (
                      <button
                        onClick={() => onChangeRole(u)}
                        title={`Change role to ${u.role === 'admin' ? 'user' : 'admin'}`}
                        aria-label={`Change role for ${u.fullName || u.name}`}
                        className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    ) : (
                      <span
                        title="Cannot change role of currently logged in admin"
                        className="p-1.5 text-slate-600 cursor-not-allowed opacity-40"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                    )}

                    {/* Suspend / Activate Button */}
                    {!isCurrentAdmin ? (
                      u.status === "active" ? (
                        <button
                          onClick={() => onSuspendUser(u)}
                          title="Suspend user"
                          aria-label={`Suspend ${u.fullName || u.name}`}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onActivateUser(u)}
                          title="Activate user"
                          aria-label={`Activate ${u.fullName || u.name}`}
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )
                    ) : (
                      <span
                        title="Cannot suspend currently logged in admin"
                        className="p-1.5 text-slate-600 cursor-not-allowed opacity-40"
                      >
                        <UserMinus className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
