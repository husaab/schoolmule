'use client'

import { FC, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { RegisterRequest, RegisterResponse } from '@/services/types/auth'
import { register as registerUser, setToken } from '@/services/authService'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface SignUpFormInputs {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  school: string
  role: string
}

const benefits = [
  'Easy student and class management',
  'Automated report card generation',
  'Real-time grade tracking',
  'Seamless parent communication',
  'Comprehensive attendance tracking'
]

const SignupPage: FC = () => {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Navigation Bar */}
      <NavBar />

      {/* Left Side - Branding (full height, behind navbar) */}
      <div className="hidden lg:flex lg:w-5/12 fixed left-0 top-0 bottom-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-teal-300/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Join thousands of<br />
            <span className="text-emerald-200">educators</span>
          </h1>

          <p className="text-lg text-emerald-100 mb-10 max-w-md leading-relaxed">
            Create your free account and start managing your school more efficiently today.
          </p>

          {/* Benefits list */}
          <div className="space-y-4">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-4 h-4 text-emerald-200" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-7/12 lg:ml-[41.666667%] flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 pt-28">
          <Link href="/">
            <Image
              src="/logo/trimmedlogo.png"
              alt="SchoolMule"
              width={120}
              height={40}
              className="brightness-0 invert h-8 w-auto"
            />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8 pt-28 lg:pt-32 lg:px-12 bg-slate-50">
          <div className="w-full max-w-lg">
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Create your account
              </h2>
              <p className="text-slate-600">
                Get started with SchoolMule for free
              </p>
            </div>

            <SignUpForm />

            <p className="text-center mt-6 text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const SignUpForm: FC = () => {
  const router = useRouter()
  const showNotification = useNotificationStore(state => state.showNotification)
  const setUser = useUserStore.getState().setUser
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SignUpFormInputs>()

  const onSubmit: SubmitHandler<SignUpFormInputs> = async data => {
    const registrationData: RegisterRequest = {
      username: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role,
      school: data.school
    }
    try {
      const response: RegisterResponse = await registerUser(registrationData)
      showNotification(
        response.success ? 'Registration Successful' : 'Registration Failed',
        response.success ? 'success' : 'error'
      )
      if (response.success) {
        setToken(response.data.token)

        const user = {
          id: response.data.userId,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          school: response.data.school,
          isVerifiedEmail: response.data.isVerified,
          isVerifiedSchool: response.data.isVerifiedSchool,
          activeTerm: response.data.activeTerm
        }
        setUser(user)
        router.replace('/verify-email')
      }
    } catch {
      showNotification('Sign up failed', 'error')
    }
  }

  const schools = [
    { value: '', label: 'Select your school' },
    { value: 'ALHAADIACADEMY', label: 'Al Haadi Academy' },
    { value: 'ALRASOOLACADEMY', label: 'Al Rasool' },
    { value: 'JCC', label: 'Jaafari Community Centre (JCC)' },
    { value: 'PLAYGROUND', label: 'Playground Testing' }
  ]

  const inputClass = "w-full pl-12 pr-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
  const selectClass = "w-full pl-12 pr-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors appearance-none cursor-pointer"

  return (
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
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
        )}
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
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
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
              {showPassword ? (
                <EyeIcon className="w-5 h-5" />
              ) : (
                <EyeSlashIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
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

      {/* School & Role Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="school" className="block text-sm font-semibold text-slate-700 mb-2">
            School
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <BuildingLibraryIcon className="w-5 h-5 text-slate-400" />
            </div>
            <select
              id="school"
              defaultValue=""
              {...register('school', { required: 'Please select your school' })}
              className={selectClass}
            >
              <option value="" hidden>
                Select school
              </option>
              {schools.map(s => (
                <option key={s.value} value={s.value} disabled={!s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.school && (
            <p className="text-red-500 text-sm mt-1">{errors.school.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-2">
            Role
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserGroupIcon className="w-5 h-5 text-slate-400" />
            </div>
            <select
              id="role"
              defaultValue=""
              {...register('role', { required: 'Please select your role' })}
              className={selectClass}
            >
              <option value="" hidden>
                Select role
              </option>
              <option value="TEACHER">Teacher</option>
              <option value="PARENT">Parent</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.role && (
            <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
          )}
        </div>
      </div>

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

      <p className="text-xs text-slate-500 text-center mt-4">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-cyan-600 hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-cyan-600 hover:underline">
          Privacy Policy
        </Link>
      </p>
    </form>
  )
}

export default SignupPage
