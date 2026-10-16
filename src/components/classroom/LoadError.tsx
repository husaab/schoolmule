// src/components/classroom/LoadError.tsx
// What a student or parent page shows when its data would not load: what went
// wrong, and a button to try again. Used on both portals, so it takes a tone.
'use client'

import type { ReactNode } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface LoadErrorProps {
  title: string
  message: string
  onRetry?: () => void
  tone?: 'student' | 'parent'
  /** Something to offer instead of (or beside) retrying, e.g. a link home. */
  children?: ReactNode
}

const BUTTON = {
  student: 'bg-indigo-600 text-white hover:bg-indigo-700',
  parent: 'bg-amber-700 text-white hover:bg-amber-800',
}

export default function LoadError({ title, message, onRetry, tone = 'student', children }: LoadErrorProps) {
  return (
    <section
      role="alert"
      className="flex flex-col items-start gap-4 rounded-[18px] border border-rose-100 bg-white p-6 md:flex-row md:items-center md:p-8"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50">
        <ExclamationCircleIcon className="h-6 w-6 text-rose-600" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{message}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold ${BUTTON[tone]}`}
          >
            Try again
          </button>
        )}
        {children}
      </div>
    </section>
  )
}
