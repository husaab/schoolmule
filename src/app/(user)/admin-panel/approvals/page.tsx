'use client';

import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useUserStore } from '@/store/useUserStore';
import { useEffect, useState } from 'react';
import {
  fetchPendingApprovals,
  approveUser,
  declineUserForSchool
} from '@/services/adminService';
import { PendingApprovalUser } from '@/services/types/admin';
import { useNotificationStore } from '@/store/useNotificationStore';

const ApprovalsPage = () => {
  const user = useUserStore((state) => state.user);
  const notify = useNotificationStore((s) => s.showNotification);
  const [pendingUsers, setPendingUsers] = useState<PendingApprovalUser[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      await approveUser({ userId });
      setPendingUsers((prev) => prev.filter((u) => u.user_id !== userId));
      notify('User approved successfully', 'success');
    } catch {
      notify('Failed to approve user', 'error');
    }
  };

  const handleDecline = async (userId: string) => {
    try {
      await declineUserForSchool({ userId });
      setPendingUsers((prev) => prev.filter((u) => u.user_id !== userId));
      notify('User declined and notified by email', 'success');
    } catch {
      notify('Failed to decline user', 'error');
    }
  };


  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-40 bg-white min-h-screen p-4 lg:p-10 text-black">
        <h1 className="text-3xl font-bold mb-6 text-center">{user.school} - Pending Approvals</h1>

        {loading ? (
          <p>Loading...</p>
        ) : pendingUsers.length === 0 ? (
          <p className="text-gray-600">No users awaiting approval.</p>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex justify-between items-center border border-cyan-200 rounded-lg p-4 shadow-sm hover:shadow transition"
              >
                <div>
                  <p className="font-semibold">{user.first_name} {user.last_name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">Role: {user.role}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(user.user_id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecline(user.user_id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default ApprovalsPage;
