'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/prefooter/Footer';
import { deleteUserAccount } from '@/services/userService';
import { logout } from '@/services/authService';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function SchoolApprovalPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const notify = useNotificationStore(state => state.showNotification);

  const handleDeleteAccount = async () => {
  try {
    await deleteUserAccount(user.id!); // API call
    useUserStore.getState().clearUser();
    router.replace('/signup'); // or /goodbye
  } catch {
    console.error('Failed to delete account', 'error');
  }
};

  useEffect(() => {
    if (!user?.id) {
      router.replace('/login');
    }
  }, [user?.id, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-blue-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Waiting for School Approval</h2>
          <p className="text-gray-700">
            Thanks for verifying your email, <strong>{user.username}</strong>!
            <br />
            Your account is now pending approval from your school admin at:
            <br />
            <strong>{user.school}</strong>
          </p>
          <p className="text-sm text-gray-600 mt-4">
            Not your account?{' '}
            <button
              onClick={async () => {
                try {
                  await logout(); // ✅ Wait for cookies to clear
                  useUserStore.getState().clearUser(); // ✅ Clear Zustand
                  router.replace('/login'); // ✅ Redirect
                } catch {
                  notify('Logout failed. Please try again.', 'error');
                }
              }}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Log out
            </button>
          </p>

          <button
            onClick={handleDeleteAccount}
            className="text-sm text-red-600 hover:underline cursor-pointer"
          >
            Delete My Account
          </button>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}
