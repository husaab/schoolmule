// src/components/classroom/SaveStatusPill.tsx
// The small "Saved" pill of an autosaved page (the quiz builder's questions,
// a student's quiz answers): "Saved", "Saving…", or "Couldn't save · Retry".
// The tone follows the page (staff cyan/emerald, student indigo/emerald).
'use client'

import { ArrowPathIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { DebouncedSaveStatus } from '@/lib/debouncedSaver'

interface SaveStatusPillProps {
  status: DebouncedSaveStatus
  onRetry: () => void
  className?: string
}

export default function SaveStatusPill({ status, onRetry, className = '' }: SaveStatusPillProps) {
  const base = `inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] ${className}`
  if (status === 'error') {
    return (
      <span role="status" className={`${base} font-medium text-rose-700`}>
        <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
        Couldn&apos;t save ·
        <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline underline-offset-2 hover:text-rose-900">
          Retry
        </button>
      </span>
    )
  }
  if (status === 'saving') {
    return (
      <span role="status" className={`${base} text-slate-500`}>
        <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
        Saving…
      </span>
    )
  }
  return (
    <span role="status" className={`${base} text-emerald-700`}>
      <CheckIcon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
      Saved
    </span>
  )
}
