'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotificationStore } from '@/store/useNotificationStore'
import { confirmEmail } from '@/services/authService'
import { signOutLocally } from '@/services/sessionSync'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import { CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function VerifyEmailTokenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const notify = useNotificationStore((s) => s.showNotification)
  // A failure must leave the user a way out, not a spinner under a toast.
  const [error, setError] = useState<string | null>(null)

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
          notify(
            res.data?.alreadyVerified
              ? 'Your email is already verified, please login!'
              : "You've successfully verified your email, please login!",
            'success'
          )

          // Sign out fully: a token left behind would make AuthGuard sign
          // them straight back in while this page sends them to /login.
          signOutLocally()

          // Navigate after clearing
          setTimeout(() => {
            window.location.href = '/login'
          }, 500)
        } else {
          setError('Verification failed')
        }
      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'Verification error')
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
            {error ? (
              <>
                <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                  <ExclamationTriangleIcon className="w-12 h-12 text-amber-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  We couldn&apos;t verify your email
                </h1>
                <p className="text-slate-600 mb-8">{error}</p>

                <Link
                  href="/login"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Go to sign in
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
