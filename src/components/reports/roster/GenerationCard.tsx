// src/components/reports/roster/GenerationCard.tsx
// The term's report generation on a roster page: one card however many runs
// are behind it. While anything runs, how far it has got, with Stop (and who
// started it, when that's someone else). Once it's done, what's ready and who
// was skipped, until someone dismisses it: See details, Email these
// families, Try again. The server does the work, so leaving the page stops
// nothing. The words come from generationCardText (shared with the app).
'use client'

import { useState } from 'react'
import { ArrowPathIcon, CheckIcon, DocumentPlusIcon, EnvelopeIcon, ExclamationTriangleIcon, StopIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { generationCardText, type GenerationSummary } from '@/lib/reportGeneration'
import type { ReportDoc } from '../reportDocs'

interface Props {
  doc: ReportDoc
  summary: Pick<GenerationSummary, 'active' | 'finished'>
  /** Students the finished runs made whose new report hasn't been emailed. */
  emailableCount: number
  onStop: () => Promise<void>
  onRetry: () => Promise<void>
  onDismiss: () => Promise<void>
  onSeeDetails: () => void
  onEmailFamilies: () => void
}

const smallButton =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-wait disabled:opacity-60'
const plainButton = `${smallButton} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
const tintButton = `${smallButton} border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100`
const quietButton =
  'inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-wait disabled:opacity-60'

type Busy = 'stop' | 'retry' | 'dismiss' | null

export default function GenerationCard({ doc, summary, emailableCount, onStop, onRetry, onDismiss, onSeeDetails, onEmailFamilies }: Props) {
  const [busy, setBusy] = useState<Busy>(null)
  const { active, finished } = summary
  if (!active && !finished) return null
  const text = generationCardText(doc, summary)

  const run = (which: Exclude<Busy, null>, fn: () => Promise<void>) => async () => {
    setBusy(which)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }

  if (active) {
    const pct = active.total > 0 ? Math.round((active.done / active.total) * 100) : 0
    return (
      <section aria-label={`Generating ${doc.nouns}`} className="rounded-2xl border border-cyan-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700" aria-hidden="true">
              <DocumentPlusIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-slate-900" role="status" aria-live="polite">
                {text.title}
              </p>
              {active.startedBy.length > 0 && <p className="text-sm text-slate-500">Started by {active.startedBy.join(' and ')}</p>}
            </div>
          </div>
          <button type="button" onClick={run('stop', onStop)} disabled={busy !== null} className={`${plainButton} self-start sm:self-auto`}>
            <StopIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
            {busy === 'stop' ? 'Stopping…' : 'Stop'}
          </button>
        </div>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label={`${doc.nouns} generated`}
          aria-valuemin={0}
          aria-valuemax={active.total}
          aria-valuenow={active.done}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${active.stalled ? 'bg-amber-400' : 'bg-cyan-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={`mt-2 text-sm ${active.stalled ? 'text-amber-800' : 'text-slate-500'}`}>
          {text.detail}
          {active.failed > 0 && !active.stalled ? ` ${active.failed} skipped so far.` : ''}
        </p>
      </section>
    )
  }

  const skipped = finished!.failed.length
  const tone = skipped > 0 ? 'amber' : 'teal'
  return (
    <section aria-label={`${doc.nouns} generated`} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'}`}
            aria-hidden="true"
          >
            {tone === 'amber' ? <ExclamationTriangleIcon className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-slate-900" role="status" aria-live="polite">
              {text.title}
            </p>
            <p className="text-sm text-slate-500">{text.detail}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onSeeDetails} className={plainButton}>
            See details
          </button>
          {emailableCount > 0 && (
            <button type="button" onClick={onEmailFamilies} className={tintButton}>
              <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
              Email {emailableCount === 1 ? 'this family' : 'these families'}
            </button>
          )}
          {skipped > 0 && (
            <button type="button" onClick={run('retry', onRetry)} disabled={busy !== null} className={plainButton}>
              <ArrowPathIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
              {busy === 'retry' ? 'Starting…' : skipped === 1 ? 'Try it again' : `Try the ${skipped} again`}
            </button>
          )}
          <button type="button" onClick={run('dismiss', onDismiss)} disabled={busy !== null} className={quietButton}>
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            Dismiss
          </button>
        </div>
      </div>
    </section>
  )
}
