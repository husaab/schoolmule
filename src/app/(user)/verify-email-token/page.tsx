'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { confirmEmail } from '@/services/authService'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import { CheckBadgeIcon } from '@heroicons/react/24/outline'

export default function VerifyEmailTokenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const notify = useNotificationStore((s) => s.showNotification)

  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    if (!token) {
      notify('No token provided', 'error')
      return router.replace('/login')
    }

    confirmEmail(token)
      .then((res) => {
        if (res.success || res.status === 200) {
          notify("You've successfully verified your email, please login!", 'success')

          // Clear Zustand AND localStorage manually
          useUserStore.getState().clearUser()

          // Navigate after clearing
          setTimeout(() => {
            window.location.href = '/login'
          }, 500)
        } else {
          notify('Verification failed', 'error')
        }
      })
      .catch((err) => {
        console.error(err)
        notify(err.message || 'Verification error', 'error')
      })
  }, [token, notify, router])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-32">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            {/* Loading Animation */}
            <div className="relative mx-auto mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center mx-auto animate-pulse">
                <CheckBadgeIcon className="w-12 h-12 text-cyan-600" />
              </div>
              {/* Spinning ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Verifying your email...
            </h1>
            <p className="text-slate-600">
              Please wait while we confirm your email address.
            </p>

            <div className="mt-8 flex justify-center gap-2">
              <div className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
