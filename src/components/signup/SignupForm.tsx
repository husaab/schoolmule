'use client'

import { FC, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { RegisterRequest, RegisterResponse } from '@/services/types/auth'
import { register as registerUser, setToken } from '@/services/authService'
import type { SignupSchool } from '@/lib/schoolUtils'
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface SignUpFormInputs {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role: string
  website?: string // Honeypot field
}

interface SignupFormProps {
  /** The school this signup is scoped to (chosen on the directory). */
  school: SignupSchool
}

const ROLES = [
  { value: 'TEACHER', label: 'Teacher', icon: AcademicCapIcon, hint: 'Manage classes & grades' },
  { value: 'PARENT', label: 'Parent', icon: UserGroupIcon, hint: "Follow your child's progress" }
] as const

const inputClass = 'w-full pl-12 pr-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400'

/**
 * Account form scoped to a single school. The school comes from the route, so
 * this form only collects role + identity. Submits through the existing
 * registerUser flow and preserves the redirect to /verify-email.
 */
const SignupForm: FC<SignupFormProps> = ({ school }) => {
  const router = useRouter()
  const showNotification = useNotificationStore(state => state.showNotification)
  const setUser = useUserStore.getState().setUser
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SignUpFormInputs>({ defaultValues: { role: 'TEACHER' } })

  // Register role so RHF validates it; the value is driven by the role cards below.
  register('role', { required: 'Please select your role' })
  const selectedRole = watch('role')

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
      role: data.role,
      school: school.schoolCode
    }
    try {
      const response: RegisterResponse = await registerUser(registrationData)
      showNotification(
        response.success ? 'Registration Successful' : 'Registration Failed',
        response.success ? 'success' : 'error'
      )
      if (response.success) {
        setToken(response.data.token)

        setUser({
          id: response.data.userId,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          school: response.data.school,
          isVerifiedEmail: response.data.isVerified,
          isVerifiedSchool: response.data.isVerifiedSchool,
          activeTerm: response.data.activeTerm
        })

        const { useSchoolYearStore } = await import('@/store/useSchoolYearStore')
        useSchoolYearStore.getState().setYears(response.data.schoolYears ?? [])
        useSchoolYearStore.getState().selectYear(response.data.activeSchoolYear?.schoolYearId ?? null)

        router.replace('/verify-email')
      }
    } catch {
      showNotification('Sign up failed', 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Role selector */}
      <div>
        <span className="block text-sm font-semibold text-slate-700 mb-2">I am a&hellip;</span>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(({ value, label, icon: Icon, hint }) => {
            const active = selectedRole === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('role', value, { shouldValidate: true })}
                aria-pressed={active}
                className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  active
                    ? 'border-cyan-500 bg-cyan-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'text-cyan-600' : 'text-slate-400'}`} />
                <span className="font-semibold text-slate-800">{label}</span>
                <span className="text-xs text-slate-500">{hint}</span>
              </button>
            )
          })}
        </div>
        {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
      </div>

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
            placeholder="you@school.edu"
            {...register('email', { required: 'Email is required' })}
            className={inputClass}
          />
        </div>
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
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
  )
}

export default SignupForm
