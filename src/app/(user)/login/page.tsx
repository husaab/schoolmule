'use client'

import React, { useState, FC } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import Link from 'next/link'
import Image from 'next/image'
import { login, setToken } from '@/services/authService'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface LoginFormInputs {
  email: string
  password: string
}

const features = [
  { icon: AcademicCapIcon, text: 'Student Management' },
  { icon: ChartBarIcon, text: 'Grade Tracking' },
  { icon: UserGroupIcon, text: 'Parent Portal' },
  { icon: DocumentTextIcon, text: 'Report Cards' }
]

const LoginPage: FC = () => {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Navigation Bar */}
      <NavBar />

      {/* Left Side - Branding (full height, behind navbar) */}
      <div className="hidden lg:flex lg:w-1/2 fixed left-0 top-0 bottom-0 bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-300/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
            {/* Logo */}

            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Welcome back to<br />
              <span className="text-cyan-200">SchoolMule</span>
            </h1>

            <p className="text-lg text-cyan-100 mb-10 max-w-md leading-relaxed">
              Sign in to access your dashboard, manage students, track grades, and connect with parents.
            </p>

            {/* Feature list */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3"
                >
                  <feature.icon className="w-5 h-5 text-cyan-200" />
                  <span className="text-sm font-medium text-white">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-8 pt-28">
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

        <div className="flex-1 flex items-center justify-center px-6 py-12 pt-28 lg:pt-32 lg:px-12 bg-slate-50">
            <div className="w-full max-w-md">
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Sign in to your account
                </h2>
                <p className="text-slate-600">
                  Enter your credentials to access your dashboard
                </p>
              </div>

              <LoginForm />

              <p className="text-center mt-8 text-sm text-slate-600">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-cyan-600 hover:text-cyan-700 font-semibold">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
    </div>
  )
}

const LoginForm: FC = () => {
  const router = useRouter()
  const showNotification = useNotificationStore(state => state.showNotification)
  const setUser = useUserStore.getState().setUser
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormInputs>()

  const onSubmit: SubmitHandler<LoginFormInputs> = async data => {
    try {
      const response = await login(data)
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
        showNotification('Logged in successfully', 'success')

        if (!user.isVerifiedEmail) {
          router.replace('/verify-email')
        } else if (user.isVerifiedEmail) {
          if (!user.isVerifiedSchool) {
            router.replace('/school-approval')
          } else {
            if (user.role == 'PARENT') {
              router.replace('/parent/dashboard')
            } else {
              router.replace('/dashboard')
            }
          }
        }
      }
    } catch {
      showNotification('Login failed, invalid email or password', 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email Field */}
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
            className="w-full pl-12 pr-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
          />
        </div>
        {errors.email && (
          <p className="text-red-500 text-sm mt-1.5">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
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
            {...register('password', { required: 'Password is required' })}
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
        {errors.password && (
          <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>
        )}
      </div>

      {/* Forgot Password Link */}
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
        >
          Forgot your password?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  )
}

export default LoginPage
