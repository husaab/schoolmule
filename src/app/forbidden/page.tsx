'use client'

import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShieldExclamationIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

const ForbiddenPage: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 flex flex-col">
      {/* Simple Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-block">
            <Image
              src="/logo/trimmedlogo.png"
              alt="SchoolMule"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {/* Icon */}
          <div className="relative mx-auto mb-8">
            {/* Background decoration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-red-100/50 rounded-full blur-2xl" />
            </div>

            {/* Shield icon */}
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-xl shadow-red-500/20">
              <ShieldExclamationIcon className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Error Code */}
          <div className="mb-4">
            <span className="inline-block px-4 py-1.5 bg-red-50 text-red-600 text-sm font-semibold rounded-full">
              Error 403
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Access{' '}
            <span className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
              Denied
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Sorry, you don&apos;t have permission to access this page.
            This might be because your session expired or you need additional permissions.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <HomeIcon className="w-5 h-5" />
              Go to Homepage
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

      {/* Simple Footer */}
      <footer className="py-6 px-4 border-t border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SchoolMule. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default ForbiddenPage
