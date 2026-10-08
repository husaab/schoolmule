'use client'

import React from 'react'
import Link from 'next/link'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import type { AssessmentContext, SenderRole } from '@/services/types/messaging'
import { toneClasses, type Tone } from './tones'

interface ThreadContextCardProps {
  context: AssessmentContext | null
  title: string
  classId: string
  classSubject: string
  tone: Tone
  role: SenderRole
}

const formatDate = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

/**
 * The strip that keeps the score next to the chat. Parents see "Not shared
 * yet" until the assessment is published; staff always see the mark and the
 * class average, with a jump back to the gradebook.
 */
const ThreadContextCard: React.FC<ThreadContextCardProps> = ({ context, title, classId, classSubject, tone, role }) => {
  const t = toneClasses(tone)
  const isParent = role === 'PARENT'
  const href = isParent ? '/parent/grades' : classId ? `/gradebook/${encodeURIComponent(classId)}` : '/gradebook'
  const meta = context
    ? [
        classSubject,
        formatDate(context.date) ? `Published ${formatDate(context.date)}` : null,
        context.weightPoints != null ? `Weight ${context.weightPoints}` : null,
      ]
    : [classSubject, 'Assessment no longer exists']

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-xl px-3.5 py-3 ${t.context}`}>
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/70 bg-white">
        <ClipboardDocumentCheckIcon className={`h-5 w-5 ${t.contextLabel}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.contextLabel}`}>Assessment</p>
        <p className="truncate text-sm font-medium text-slate-900">{context?.name ?? title}</p>
        <p className="truncate text-xs text-slate-500">{meta.filter(Boolean).join(' · ')}</p>
      </div>
      <div className="text-right">
        {context && context.score != null && context.maxScore != null ? (
          <>
            <p className={`text-xl font-semibold ${t.contextValue}`}>
              {context.score} / {context.maxScore}
            </p>
            <p className="text-xs text-slate-500">
              {context.pct != null ? `${context.pct}%` : ''}
              {context.classAvgPct != null ? ` · class avg ${context.classAvgPct}%` : ''}
            </p>
          </>
        ) : context && !context.isPublished && isParent ? (
          <p className="text-xs font-medium text-slate-500">Not shared yet</p>
        ) : context ? (
          <p className="text-xs font-medium text-slate-500">Not graded</p>
        ) : null}
      </div>
      <Link
        href={href}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${t.secondary} whitespace-nowrap`}
      >
        {isParent ? 'View in Grades' : 'Open gradebook'}
      </Link>
    </div>
  )
}

export default ThreadContextCard
