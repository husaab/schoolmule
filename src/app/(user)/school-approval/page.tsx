'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useUserStore } from '@/store/useUserStore'
import { deleteUserAccount } from '@/services/userService'
import { logout } from '@/services/authService'
import { useNotificationStore } from '@/store/useNotificationStore'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import {
  ClockIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

export default function SchoolApprovalPage() {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const notify = useNotificationStore(state => state.showNotification)

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    try {
      await deleteUserAccount(user.id!)
      useUserStore.getState().clearUser()
      router.replace('/signup')
    } catch {
      notify('Failed to delete account', 'error')
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

  useEffect(() => {
    if (!user?.id) {
      router.replace('/login')
    }
  }, [user?.id, router])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-32">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            {/* Icon with pulse animation */}
            <div className="relative mx-auto mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto">
                <ClockIcon className="w-12 h-12 text-amber-600" />
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 border-4 border-amber-200 rounded-full animate-ping opacity-20" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Waiting for Approval
            </h1>
            <p className="text-slate-600 mb-6">
              Thanks for verifying your email, <strong className="text-slate-800">{user.username}</strong>!
            </p>

            {/* Status Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 mb-6 border border-amber-100">
              <div className="flex items-center justify-center gap-3 mb-3">
                <BuildingLibraryIcon className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-slate-800">{user.school}</span>
              </div>
              <p className="text-sm text-slate-600">
                Your account is pending approval from your school administrator.
              </p>
            </div>

            {/* What happens next */}
            <div className="text-left bg-slate-50 rounded-xl p-5 mb-6">
              <p className="text-sm font-semibold text-slate-700 mb-3">What happens next?</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600">Your school admin will review your request</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600">You&apos;ll receive an email once approved</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600">Then you can access your dashboard</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <p className="text-sm text-slate-500">
                Not your account?
              </p>
              <button
                onClick={handleLogout}
                className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm cursor-pointer"
              >
                Log out
              </button>

              <div className="pt-4">
                <button
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-2 text-red-500 hover:text-red-600 text-sm cursor-pointer transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete my account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
