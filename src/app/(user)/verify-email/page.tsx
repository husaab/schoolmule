'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { resendVerificationEmail, logout } from '@/services/authService'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import {
  EnvelopeIcon,
  ArrowPathIcon,
  InboxIcon
} from '@heroicons/react/24/outline'

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

  const handleLogout = async () => {
    try {
      await logout()
      useUserStore.getState().clearUser()
      router.replace('/login')
    } catch {
      notify('Logout failed. Please try again.', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-32">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            {/* Animated Email Icon */}
            <div className="relative mx-auto mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center mx-auto">
                <InboxIcon className="w-12 h-12 text-cyan-600" />
              </div>
              {/* Floating envelope animation */}
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center animate-bounce">
                <EnvelopeIcon className="w-5 h-5 text-amber-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Almost there!
            </h1>
            <p className="text-slate-600 mb-6">
              We&apos;ve sent a verification link to:
            </p>

            <div className="bg-slate-50 rounded-xl py-3 px-4 mb-6">
              <p className="font-semibold text-slate-800 break-all">
                {user.email}
              </p>
            </div>

            <p className="text-sm text-slate-500 mb-8">
              Click the link in your email to verify your account.
              Don&apos;t forget to check your spam folder!
            </p>

            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-5 h-5" />
                  Resend Verification Email
                </>
              )}
            </button>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-2">
                Not your account?
              </p>
              <button
                onClick={handleLogout}
                className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm cursor-pointer"
              >
                Log out and try again
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
