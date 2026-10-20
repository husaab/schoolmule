'use client'

import { FC, useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useNotificationStore } from '@/store/useNotificationStore'
import { GoogleAuthResponse, RegisterRequest, RegisterResponse } from '@/services/types/auth'
import { register as registerUser } from '@/services/authService'
import { isApiError } from '@/services/apiClient'
import { startSession } from '@/services/sessionSync'
import { homeFor } from '@/lib/authRouting'
import GoogleSignIn from '@/components/auth/GoogleSignIn'
import type { SignupSchool } from '@/lib/schoolUtils'
import type { SignupRole } from '@/services/types/adminApproval'
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface SignUpFormInputs {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  website?: string // Honeypot field
}

interface SignupFormProps {
  /** The school this signup is scoped to (chosen on the directory). */
  school: SignupSchool
  /** Fixed by the page the form sits on (/parent or /teacher). */
  role: SignupRole
}

const inputClass = 'w-full pl-12 pr-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400'
const noticeLink = 'font-semibold text-cyan-700 underline-offset-2 hover:underline'

// The server's refusals for an address that already has an account
// (EMAIL_TAKEN, ACCOUNT_INVITED, ACCOUNT_ARCHIVED), shown under the field.
type EmailNotice = 'taken' | 'invited' | 'archived'
const EMAIL_NOTICES: Record<string, EmailNotice> = {
  EMAIL_TAKEN: 'taken',
  ACCOUNT_INVITED: 'invited',
  ACCOUNT_ARCHIVED: 'archived',
}
const emailNoticeFor = (code: string | null): EmailNotice | null => (code && EMAIL_NOTICES[code]) || null

/**
 * Account form scoped to a single school and role. Both come from the route
 * (/signup/[school]/parent or /teacher), so this form only collects identity.
 * Submits through the existing registerUser flow and redirects to /verify-email.
 *
 * "Sign up with Google" sits above it. Google has already verified the
 * address, so that path skips /verify-email and lands on the approval wait
 * (or straight in, when the email already had an account).
 */
const SignupForm: FC<SignupFormProps> = ({ school, role }) => {
  const router = useRouter()
  const showNotification = useNotificationStore(state => state.showNotification)
  const [showPassword, setShowPassword] = useState(false)
  // The address already has an account: the way in that works for it.
  const [emailNotice, setEmailNotice] = useState<EmailNotice | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SignUpFormInputs>()
  const isParent = role === 'PARENT'

  // A grades email's "Create your account" carries the address it went to
  // (?email=): the one the school has, so the children match.
  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get('email')?.trim()
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setValue('email', email)
  }, [setValue])

  const onSubmit: SubmitHandler<SignUpFormInputs> = async data => {
    // Honeypot check - bots fill this hidden field, humans don't
    if (data.website) {
      showNotification('Registration Successful', 'success') // Fake success to not tip off bot
      return
    }

    const registrationData: RegisterRequest = {
      username: data.fullName,
      email: data.email,
      password: data.password,
      role,
      school: school.schoolCode
    }
    try {
      const response: RegisterResponse = await registerUser(registrationData)
      showNotification(
        response.success ? 'Registration Successful' : 'Registration Failed',
        response.success ? 'success' : 'error'
      )
      if (response.success) {
        startSession(response.data)
        router.replace('/verify-email')
      }
    } catch (err) {
      const notice = isApiError(err) ? emailNoticeFor(err.code) : null
      if (notice) {
        setEmailNotice(notice)
        return
      }
      // The server's words when it refuses for a reason the person can act on.
      showNotification(isApiError(err) && err.status < 500 && err.message ? err.message : 'Sign up failed', 'error')
    }
  }

  const onGoogleSignup = (data: GoogleAuthResponse['data']) => {
    const user = startSession(data)
    showNotification(
      data.accountCreated ? 'Account created' : 'You already have an account, so we signed you in',
      'success'
    )
    router.replace(homeFor(user))
  }

  return (
    <div className="space-y-5">
      {/* Above both options: children are matched by email either way. */}
      {isParent && (
        <p className="flex items-start gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3.5 py-2.5 text-[13px] leading-snug text-cyan-900">
          <InformationCircleIcon className="mt-px h-4 w-4 shrink-0 text-cyan-600" aria-hidden="true" />
          <span>Use the email you gave the school at registration so we can match you to your children.</span>
        </p>
      )}
      <GoogleSignIn
        intent="signup"
        school={school.schoolCode}
        role={role}
        dividerLabel="or sign up with email"
        onSignedIn={onGoogleSignup}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserIcon className="w-5 h-5 text-slate-400" />
            </div>
            <input
              id="fullName"
              type="text"
              {...register('fullName', { required: 'Full name is required' })}
              placeholder="John Doe"
              className={inputClass}
            />
          </div>
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <EnvelopeIcon className="w-5 h-5 text-slate-400" />
            </div>
            <input
              id="email"
              type="email"
              placeholder={isParent ? 'you@example.com' : 'you@school.edu'}
              {...register('email', { required: 'Email is required', onChange: () => setEmailNotice(null) })}
              className={inputClass}
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          {emailNotice && (
            <p role="alert" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] leading-snug text-amber-900">
              {emailNotice === 'taken' && (
                <>
                  You already have an account with this email.{' '}
                  <Link href="/login" className={noticeLink}>Sign in</Link>
                  {' '}or{' '}
                  <Link href="/forgot-password" className={noticeLink}>reset your password</Link>.
                </>
              )}
              {emailNotice === 'invited' && (
                <>
                  You&apos;ve already been invited with this email. Use the link in your invite email to set your
                  password, or{' '}
                  <Link href="/forgot-password" className={noticeLink}>get a new link</Link>.
                </>
              )}
              {emailNotice === 'archived' && (
                <>This account has been archived. Contact your school admin.</>
              )}
            </p>
          )}
        </div>

        {/* Password Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LockClosedIcon className="w-5 h-5 text-slate-400" />
              </div>
              <input
                id="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
                className="w-full pl-12 pr-10 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LockClosedIcon className="w-5 h-5 text-slate-400" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: value => value === watch('password') || 'Passwords do not match'
                })}
                className={inputClass}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Honeypot field - hidden from humans, bots will fill it */}
        <input
          type="text"
          {...register('website')}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>
    </div>
  )
}

export default SignupForm
