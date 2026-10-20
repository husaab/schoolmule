'use client'

import { FC, useCallback, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { safeNextPath } from '@/lib/authRouting'
import { minPasswordLength, passwordRuleFrom, resetFailure, type PasswordRule } from '@/lib/passwordReset'

// checking → ready (the form), or one of three cards: a dead link, a school
// that signs in with Google only, or a check that never got an answer.
type LinkState =
  | { state: 'checking' }
  | { state: 'ready'; rule: PasswordRule }
  | { state: 'dead' }
  | { state: 'blocked'; message: string }
  | { state: 'unreachable'; message: string }

const UNREACHABLE = 'Check your connection and try again.'

const ResetPasswordPage: FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  // Admin-created accounts land here from their invite email to set a first password.
  const isInvite = searchParams.get('invite') === '1'
  // Guardian invites from a teacher's message land in that thread after login.
  const next = safeNextPath(searchParams.get('next')) ?? ''
  const notify = useNotificationStore(s => s.showNotification)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<LinkState>({ state: 'checking' })
  const rule: PasswordRule = link.state === 'ready' ? link.rule : 'standard'
  const minLength = minPasswordLength(rule)

  const checkLink = useCallback(async () => {
    if (!token) {
      setLink({ state: 'dead' })
      return
    }
    setLink({ state: 'checking' })
    try {
      const response = await validateResetToken(token)
      setLink({ state: 'ready', rule: passwordRuleFrom(response.data?.passwordRule) })
    } catch (err) {
      const failure = resetFailure(err)
      if (failure.kind === 'dead_link') setLink({ state: 'dead' })
      else if (failure.kind === 'blocked') setLink({ state: 'blocked', message: failure.message })
      else setLink({ state: 'unreachable', message: failure.kind === 'message' ? failure.message : UNREACHABLE })
    }
  }, [token])

  useEffect(() => {
    checkLink()
  }, [checkLink])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      notify('Passwords do not match.', 'error')
      return
    }

    if (newPassword.length < minLength) {
      notify(`Password must be at least ${minLength} characters.`, 'error')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, newPassword)
      notify(isInvite ? 'Password set. You can now log in.' : 'Password reset successfully. You can now log in.', 'success')
      router.push(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
    } catch (err) {
      // The link can die while the form is open (15 minutes, or used in
      // another tab); a refused password keeps the form and says why.
      const failure = resetFailure(err)
      if (failure.kind === 'dead_link') setLink({ state: 'dead' })
      else if (failure.kind === 'blocked') setLink({ state: 'blocked', message: failure.message })
      else notify(failure.kind === 'message' ? failure.message : 'Something went wrong. Please try again.', 'error')
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
            {link.state === 'checking' ? (
              // Loading state
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <KeyIcon className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600">{isInvite ? 'Checking your invite link...' : 'Validating your reset link...'}</p>
              </div>
            ) : link.state === 'blocked' ? (
              // A school that signs students in with Google: no password to set
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-6">
                  <KeyIcon className="w-10 h-10 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Sign in with Google
                </h2>
                <p className="text-slate-600 mb-6">{link.message}</p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg"
                >
                  Go to sign in
                </Link>
              </div>
            ) : link.state === 'unreachable' ? (
              // The check never got an answer; the link itself may be fine
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
                  <ExclamationTriangleIcon className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  We couldn&apos;t check your link
                </h2>
                <p className="text-slate-600 mb-6">{link.message}</p>
                <button
                  type="button"
                  onClick={checkLink}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : link.state === 'dead' ? (
              // Invalid token state
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                  <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Link Expired or Invalid
                </h2>
                <p className="text-slate-600 mb-6">
                  {isInvite
                    ? 'This invite link has expired or was replaced by a newer one. Ask your school admin to resend it, or request a password reset link.'
                    : 'This password reset link has expired or is invalid. Please request a new one.'}
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
                  {isInvite ? 'Welcome to School Mule' : 'Reset your password'}
                </h1>
                <p className="text-slate-600 text-center mb-8">
                  {isInvite ? 'Choose a password to finish setting up your account.' : 'Enter a new secure password for your account.'}
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
                        minLength={minLength}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                        autoComplete="new-password"
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
                      <CheckIcon className={`w-4 h-4 ${newPassword.length >= minLength ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <span className={newPassword.length >= minLength ? 'text-slate-700' : 'text-slate-400'}>
                        At least {minLength} characters
                      </span>
                    </div>
                    {rule === 'student' && (
                      <p className="mt-1.5 pl-6 text-sm text-slate-500">
                        Not your name, your email address or an easy word like &ldquo;password&rdquo;
                      </p>
                    )}
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
                      isInvite ? 'Set Password' : 'Reset Password'
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
