'use client';

import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import Spinner from '@/components/Spinner';
import { useUserStore } from '@/store/useUserStore';
import { useEffect, useState } from 'react';
import {
  fetchPendingApprovals,
  approveUser,
  declineUserForSchool
} from '@/services/adminService';
import { PendingApprovalUser } from '@/services/types/admin';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  CheckCircleIcon,
  CheckIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const roleStyles: Record<string, string> = {
  TEACHER: 'bg-purple-50 text-purple-700',
  PARENT: 'bg-cyan-50 text-cyan-700',
  ADMIN: 'bg-amber-50 text-amber-700',
};

const ApprovalsPage = () => {
  const user = useUserStore((state) => state.user);
  const notify = useNotificationStore((s) => s.showNotification);
  const [pendingUsers, setPendingUsers] = useState<PendingApprovalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const loadApprovals = async () => {
      if (!user.school || user.school === 'null') return;

      try {
        const res = await fetchPendingApprovals(user.school);
        setPendingUsers(res.users);
      } catch {
        notify('Failed to load pending approvals', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadApprovals();
  }, [user.school, notify]);

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      await approveUser({ userId });
      setPendingUsers((prev) => prev.filter((u) => u.user_id !== userId));
      notify('User approved successfully', 'success');
    } catch {
      notify('Failed to approve user', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (userId: string) => {
    setProcessingId(userId);
    try {
      await declineUserForSchool({ userId });
      setPendingUsers((prev) => prev.filter((u) => u.user_id !== userId));
      notify('User declined and notified by email', 'success');
    } catch {
      notify('Failed to decline user', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Pending Approvals</h1>
            <p className="text-slate-500 mt-1">
              {loading
                ? 'Review new account requests for your school'
                : `${pendingUsers.length} request${pendingUsers.length !== 1 ? 's' : ''} awaiting review`}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up</h3>
              <p className="text-sm text-slate-500">
                No users are awaiting approval. New signup requests will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-2">
              {pendingUsers.map((pending) => {
                const processing = processingId === pending.user_id;
                return (
                  <div
                    key={pending.user_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-cyan-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-900">
                            {pending.first_name} {pending.last_name}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                              roleStyles[pending.role?.toUpperCase()] ?? 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {pending.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {pending.email}
                          {pending.created_at &&
                            ` · Requested ${new Date(pending.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(pending.user_id)}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
                      >
                        <CheckIcon className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(pending.user_id)}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ApprovalsPage;
