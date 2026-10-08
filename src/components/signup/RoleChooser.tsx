'use client'

// Step 2 of signup: who are you? Parents are the common case, so that card is
// first and filled; teachers and staff get the quieter outlined one.

import { FC } from 'react'
import Link from 'next/link'
import { AcademicCapIcon, ArrowRightIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface RoleChooserProps {
  /** e.g. "/signup/alhaadiacademy" */
  basePath: string
}

const RoleChooser: FC<RoleChooserProps> = ({ basePath }) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold text-slate-700">I am a&hellip;</p>

    <Link
      href={`${basePath}/parent`}
      className="group flex items-center gap-4 rounded-2xl border-2 border-cyan-500 bg-cyan-50 p-5 shadow-sm transition-all hover:bg-cyan-100 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm">
        <UserGroupIcon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-slate-900">Parent or guardian</span>
        <span className="block text-sm text-slate-600">
          Follow your child&apos;s grades, attendance and report cards.
        </span>
      </span>
      <ArrowRightIcon className="h-5 w-5 flex-shrink-0 text-cyan-600 transition-transform group-hover:translate-x-0.5" />
    </Link>

    <Link
      href={`${basePath}/teacher`}
      className="group flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <AcademicCapIcon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-slate-900">Teacher or staff</span>
        <span className="block text-sm text-slate-600">
          Classes, gradebook, attendance and your schedule.
        </span>
      </span>
      <ArrowRightIcon className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
    </Link>

    <p className="pt-1 text-xs text-slate-400">
      Every account is approved by the school before it can be used.
    </p>
  </div>
)

export default RoleChooser
