// src/components/studentPortal/work/TypedAnswerBox.tsx
// The typed answer of a "typed answer" assignment (Student-Assignment board).
// It saves by itself while the student types (D17: no Save button) and says
// "Saved" / "Saving…" / "Couldn't save · Retry" beside the box. Once the work
// is turned in, graded, or seen by a parent it is shown as plain text. The
// saving itself (useDebouncedSave) lives in the card, which also needs it to
// save before Turn in; this only draws it.
'use client'

import { ArrowPathIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { DebouncedSaveStatus } from '@/lib/debouncedSaver'
import { workSavedLabel } from '@/lib/itemPageText'

export const TYPED_ANSWER_MAX = 20000

interface TypedAnswerBoxProps {
  value: string
  onChange: (value: string) => void
  /** Save at once (the box lost focus). */
  onBlur: () => void
  status: DebouncedSaveStatus
  onRetry: () => void
  /** Show the answer as text: turned in, graded, a parent looking, or a preview. */
  readOnly: boolean
  /** What to say when read-only and nothing was written. */
  emptyText?: string
}

export default function TypedAnswerBox({ value, onChange, onBlur, status, onRetry, readOnly, emptyText = 'No answer was written.' }: TypedAnswerBoxProps) {
  if (readOnly) {
    return (
      <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[15px] leading-relaxed text-slate-800">
        {value.trim() ? <p className="whitespace-pre-wrap break-words">{value}</p> : <p className="text-slate-500">{emptyText}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="typed-answer" className="sr-only">
        Your answer
      </label>
      <textarea
        id="typed-answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        maxLength={TYPED_ANSWER_MAX}
        rows={8}
        placeholder="Type your answer here…"
        className="min-h-[180px] w-full resize-y rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[16px] leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
      <div className="flex min-h-5 items-center justify-end gap-1.5 text-[13px]" role="status" aria-live="polite">
        {value.length === 0 && status === 'saved' ? null : status === 'error' ? (
          <span className="inline-flex items-center gap-1.5 text-rose-700">
            <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
            {workSavedLabel('error')} ·{' '}
            <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline underline-offset-2 hover:text-rose-900">
              Retry
            </button>
          </span>
        ) : status === 'saving' ? (
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            {workSavedLabel('saving')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <CheckIcon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
            {workSavedLabel('saved')}
          </span>
        )}
      </div>
    </div>
  )
}
