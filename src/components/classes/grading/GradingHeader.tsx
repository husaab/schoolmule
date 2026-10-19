// src/components/classes/grading/GradingHeader.tsx
// The grading view's header (Teacher-Grading board): back, the item's title
// and "{Grade} {Subject} · due … · out of … · {category}", the three counts
// (Turned in, Missing, Graded = drafts waiting), the Saved pill and the one
// release action, "Publish to N students". A quiz also links to its
// questions (a changed answer key regrades).
'use client'

import type { MouseEvent } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import SavedPill from '@/components/gradebook/SavedPill'
import type { DebouncedSaveStatus } from '@/hooks/useDebouncedSave'
import { publishAllLabel } from '@/lib/gradingView'
import type { GradingCounts } from '@/services/types/grading'

interface GradingHeaderProps {
  title: string
  subline: string
  backHref: string
  backLabel: string
  /** Saves what is typed first; the link is followed only when that worked. */
  onBack: (e: MouseEvent<HTMLAnchorElement>) => void
  counts: GradingCounts
  saveStatus: DebouncedSaveStatus
  failedCount: number
  onRetry: () => void
  onDiscard: () => void
  onPublishAll: () => void
  publishing: boolean
  canEdit: boolean
  /** A quiz: its questions in the builder. */
  questionsHref?: string | null
  /** Drafts left out of "Publish to N students": new work came in after them (Fable I1). */
  gradedEarlierCount?: number
}

function Stat({ value, label, tone = 'text-slate-900' }: { value: number; label: string; tone?: string }) {
  return (
    <span className="flex flex-col items-center text-[13px] text-slate-600">
      <strong className={`font-display text-[22px] font-semibold leading-tight tabular-nums ${tone}`}>{value}</strong>
      {label}
    </span>
  )
}

export default function GradingHeader({
  title,
  subline,
  backHref,
  backLabel,
  onBack,
  counts,
  saveStatus,
  failedCount,
  onRetry,
  onDiscard,
  onPublishAll,
  publishing,
  canEdit,
  questionsHref = null,
  gradedEarlierCount = 0,
}: GradingHeaderProps) {
  const publishTitle =
    counts.drafts > 0
      ? undefined
      : gradedEarlierCount > 0
        ? `${gradedEarlierCount === 1 ? '1 draft waits' : `${gradedEarlierCount} drafts wait`} for you to check new work and save the grade again.`
        : 'No drafts are waiting to be published.'
  return (
    <header className="z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-8 lg:sticky lg:top-0">
      <div className="flex min-w-0 items-center gap-3.5">
        <Link
          href={backHref}
          onClick={onBack}
          aria-label={backLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
        >
          <ArrowLeftIcon className="h-5 w-5" strokeWidth={2} />
        </Link>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
          <span className="truncate text-[13px] text-slate-500">{subline}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex gap-5">
          <Stat value={counts.turnedIn} label="Turned in" />
          <Stat value={counts.missing} label="Missing" tone={counts.missing > 0 ? 'text-rose-700' : 'text-slate-900'} />
          <Stat value={counts.drafts} label="Graded" />
        </div>
        <SavedPill status={saveStatus} failedCount={failedCount} onRetry={onRetry} onDiscard={onDiscard} />
        {questionsHref && (
          // The grading saver lives for the session: leaving by this link still sends what is typed.
          <Link
            href={questionsHref}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-[10px] text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            Questions
          </Link>
        )}
        <button
          type="button"
          onClick={onPublishAll}
          disabled={!canEdit || counts.drafts === 0 || publishing}
          title={publishTitle}
          className="cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-[18px] py-[11px] text-[15px] font-medium text-white shadow-sm transition-colors hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {publishing ? 'Publishing…' : publishAllLabel(counts.drafts)}
        </button>
      </div>
    </header>
  )
}
