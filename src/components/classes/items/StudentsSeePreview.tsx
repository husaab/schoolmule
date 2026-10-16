// src/components/classes/items/StudentsSeePreview.tsx
// "Students see" (the Teacher-NewAssessment board): the row an assessment
// makes on a student's page, as it will read, and that there is nothing to
// turn in.
'use client'

import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { dayKeyLabel } from '@/lib/classStream'
import { isCalendarDate } from '@/lib/itemForm'

interface StudentsSeePreviewProps {
  title: string
  subject: string
  /** 'YYYY-MM-DD' or ''. */
  date: string
}

export default function StudentsSeePreview({ title, subject, date }: StudentsSeePreviewProps) {
  const when = date && isCalendarDate(date) ? dayKeyLabel(date) : null
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/70 bg-white p-5">
      <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">Students see</span>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100" aria-hidden="true">
          <ClipboardDocumentListIcon className="h-5 w-5 text-blue-800" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-slate-900">{title.trim() || 'Untitled assessment'}</span>
          <span className="text-xs text-slate-500">{[subject, when, 'in class'].filter(Boolean).join(' · ')}</span>
        </span>
      </div>
      <span className="text-[13px] text-slate-500">No Turn in button. The grade appears when you publish it.</span>
    </div>
  )
}
