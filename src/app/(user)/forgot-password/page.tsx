'use client'

import { FC, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useNotificationStore } from '@/store/useNotificationStore'
import { requestPasswordReset } from '@/services/passwordService'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const ForgotPasswordPage: FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const notify = useNotificationStore(s => s.showNotification)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await requestPasswordReset(email)
      if (response.success) {
        setSent(true)
        notify('Password reset email sent successfully.', 'success')
      } else {
        notify(response.message || 'Something went wrong.', 'error')
      }
    } catch {
      notify('Internal server error.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-32">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Back to login</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            {!sent ? (
              <>
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <EnvelopeIcon className="w-8 h-8 text-white" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                  Forgot your password?
                </h1>
                <p className="text-slate-600 text-center mb-8">
                  No worries! Enter your email and we&apos;ll send you a secure link to reset it.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <EnvelopeIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="you@school.edu"
                        className="w-full pl-12 pr-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
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
                        Send Reset Link
                        <PaperAirplaneIcon className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-xs text-slate-500 text-center mt-6">
                  The reset link will expire in 15 minutes for security.
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                {/* Success Icon */}
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Check your email
                </h2>
                <p className="text-slate-600 mb-6">
                  If an account exists for <strong className="text-slate-800">{email}</strong>, you&apos;ll receive a password reset link shortly.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-600">
                    Didn&apos;t receive an email? Check your spam folder or{' '}
                    <button
                      onClick={() => setSent(false)}
                      className="text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                      try again
                    </button>
                  </p>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Return to login
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ForgotPasswordPage
