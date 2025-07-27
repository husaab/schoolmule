'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { resendVerificationEmail } from '@/services/authService'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import { logout } from '@/services/authService'

export default function VerifyEmailPage() {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const notify = useNotificationStore((s) => s.showNotification)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      router.replace('/login')
    }
  }, [user?.id, router])

  const handleResend = async () => {
    if (!user.email) return
    setLoading(true)
    try {
      await resendVerificationEmail({ email: user.email })
      notify('Verification email sent!', 'success')
    } catch {
      notify('Failed to resend email', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-1 items-center justify-center bg-blue-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Almost there!</h2>
          <p className="text-gray-700">
            We’ve sent a verification link to:
            <br />
            <strong>{user.email}</strong>
            <br />
            Please check your inbox (and spam folder).
          </p>
          <button
            onClick={handleResend}
            disabled={loading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Resending...' : 'Resend Verification Email'}
          </button>
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
