'use client'

import { FC, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import { MagnifyingGlassIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

const NotFoundPage: FC = () => {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const isLoggedIn = Boolean(user?.id)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Redirect based on login status
          if (isLoggedIn) {
            router.push('/dashboard')
          } else {
            router.push('/')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLoggedIn, router])

  const redirectPath = isLoggedIn ? '/dashboard' : '/'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 pt-32">
        <div className="max-w-lg w-full text-center">
          {/* Icon */}
          <div className="relative mx-auto mb-8">
            {/* Background decoration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-cyan-100/50 rounded-full blur-2xl" />
            </div>

            {/* 404 Display */}
            <div className="relative">
              <div className="text-[120px] sm:text-[150px] font-bold leading-none bg-gradient-to-br from-cyan-500 to-teal-600 bg-clip-text text-transparent select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <MagnifyingGlassIcon className="w-10 h-10 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Page{' '}
            <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
              Not Found
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 mb-4 leading-relaxed">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Countdown */}
          <p className="text-sm text-slate-500 mb-8">
            Redirecting to {isLoggedIn ? 'dashboard' : 'homepage'} in{' '}
            <span className="inline-flex items-center justify-center w-8 h-8 bg-cyan-100 text-cyan-700 font-bold rounded-full">
              {countdown}
            </span>{' '}
            seconds...
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={redirectPath}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <HomeIcon className="w-5 h-5" />
              {isLoggedIn ? 'Go to Dashboard' : 'Go to Homepage'}
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:text-cyan-600 transition-all duration-300 cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Go Back
            </button>
          </div>

          {/* Help text */}
          <p className="mt-10 text-sm text-slate-500">
            Need help?{' '}
            <Link href="/contact" className="text-cyan-600 hover:text-cyan-700 font-medium underline underline-offset-2">
              Contact our support team
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default NotFoundPage
