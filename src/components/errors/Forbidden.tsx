'use client'

import { FC } from 'react'
import Link from 'next/link'
import { ShieldExclamationIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

interface ForbiddenProps {
  title?: string
  message?: string
  showBackButton?: boolean
}

const Forbidden: FC<ForbiddenProps> = ({
  title = 'Access Denied',
  message = "Sorry, you don't have permission to access this resource. Please contact your administrator if you believe this is an error.",
  showBackButton = true
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="relative mx-auto mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-red-100/50 rounded-full blur-2xl" />
          </div>
          <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldExclamationIcon className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Error Badge */}
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
            403 Forbidden
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          {title}
        </h2>

        {/* Message */}
        <p className="text-slate-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <HomeIcon className="w-4 h-4" />
            Go to Dashboard
          </Link>
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:text-cyan-600 transition-all duration-300 cursor-pointer"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Forbidden
