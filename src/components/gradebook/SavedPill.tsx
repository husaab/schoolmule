// src/components/gradebook/SavedPill.tsx
// The autosave state of the grades (D17), where a Save button used to be:
// "All changes saved", "Saving…", or "{n} changes didn't save · Retry ·
// Discard" (the failed cells are outlined in the grid). Discard drops what
// could not be saved, e.g. a score the server rejected, after a confirm.
'use client'

import { ArrowPathIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { AutosaveStatus } from '@/hooks/useScoreAutosave'

interface SavedPillProps {
  status: AutosaveStatus
  failedCount: number
  onRetry: () => void
  /** Forget what didn't save (asks first). */
  onDiscard?: () => void
  className?: string
}

export default function SavedPill({ status, failedCount, onRetry, onDiscard, className = '' }: SavedPillProps) {
  const base = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-medium ${className}`

  if (status === 'error' && failedCount > 0) {
    return (
      <span role="status" className={`${base} bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200`}>
        <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
        {failedCount} change{failedCount === 1 ? '' : 's'} didn&apos;t save ·{' '}
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer font-semibold underline underline-offset-2 hover:text-rose-900"
        >
          Retry
        </button>
        {onDiscard && (
          <>
            {' '}·{' '}
            <button
              type="button"
              onClick={() => {
                const what = `${failedCount} change${failedCount === 1 ? '' : 's'}`
                if (window.confirm(`Discard ${what} that didn't save? The saved values come back.`)) onDiscard()
              }}
              className="cursor-pointer font-medium underline underline-offset-2 hover:text-rose-900"
            >
              Discard
            </button>
          </>
        )}
      </span>
    )
  }

  if (status === 'saving') {
    return (
      <span role="status" className={`${base} bg-slate-100 text-slate-600`}>
        <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
        Saving…
      </span>
    )
  }

  return (
    <span role="status" className={`${base} bg-emerald-50 text-emerald-700`}>
      <CheckIcon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
      All changes saved
    </span>
  )
}
