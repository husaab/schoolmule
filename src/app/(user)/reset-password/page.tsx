'use client'

import { FC, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useNotificationStore } from '@/store/useNotificationStore'
import { validateResetToken, resetPassword } from '@/services/passwordService'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  KeyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

const ResetPasswordPage: FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  const notify = useNotificationStore(s => s.showNotification)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await validateResetToken(token)
        setIsValidToken(response.success)
        if (!response.success) {
          notify(response.message || 'Invalid or expired token.', 'error')
        }
      } catch {
        setIsValidToken(false)
        notify('Something went wrong validating the token.', 'error')
      }
    }

    if (token) checkToken()
    else setIsValidToken(false)
  }, [token, notify])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      notify('Passwords do not match.', 'error')
      return
    }

    if (newPassword.length < 6) {
      notify('Password must be at least 6 characters.', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await resetPassword(token, newPassword)
      if (response.success) {
        notify('Password reset successfully. You can now log in.', 'success')
        router.push('/login')
      } else {
        notify(response.message || 'Failed to reset password.', 'error')
      }
    } catch {
      notify('Server error. Please try again later.', 'error')
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
            {isValidToken === null ? (
              // Loading state
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <KeyIcon className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600">Validating your reset link...</p>
              </div>
            ) : isValidToken === false ? (
              // Invalid token state
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                  <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Link Expired or Invalid
                </h2>
                <p className="text-slate-600 mb-6">
                  This password reset link has expired or is invalid. Please request a new one.
                </p>
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg"
                >
                  Request New Link
                </Link>
              </div>
            ) : (
              // Valid token - show form
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <KeyIcon className="w-8 h-8 text-white" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                  Reset your password
                </h1>
                <p className="text-slate-600 text-center mb-8">
                  Enter a new secure password for your account.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockClosedIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeIcon className="w-5 h-5" />
                        ) : (
                          <EyeSlashIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockClosedIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-500 text-sm mt-1.5">Passwords do not match</p>
                    )}
                  </div>

                  {/* Password requirements */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Password requirements:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckIcon className={`w-4 h-4 ${newPassword.length >= 6 ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <span className={newPassword.length >= 6 ? 'text-slate-700' : 'text-slate-400'}>
                        At least 6 characters
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || newPassword !== confirmPassword}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Resetting...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ResetPasswordPage
