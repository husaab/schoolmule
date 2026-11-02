// One student's report card comment details (src/lib/reportCardDetails.ts),
// opened under their row on Report card comments. Every detail is optional
// and one tap; tapping the chosen option again clears it. The two SchoolMule
// can suggest from the data (achievement from the mark, completion from
// missing work) are outlined in violet and saved only when tapped. Nothing
// here prints on the report card: it only helps the AI write the comment.
'use client'

import React from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { RatingButtons } from './RatingButtons'
import {
  DETAIL_NOTE_MAX,
  REPORT_CARD_DETAILS,
  detailSuggestions,
  type CommentDetails,
  type DetailGroup,
} from '@/lib/reportCardDetails'

interface Coverage {
  missing: number
  assessed: number
}

export function ReportCardDetailsPanel({
  studentId,
  subject,
  details,
  pct,
  coverage,
  disabled,
  onChange,
  onFlush,
  onWriteWithAi,
  aiDisabled,
  aiBusy,
  confirming,
  onConfirmReplace,
  onCancelReplace,
  onNext,
}: {
  studentId: string
  subject: string
  details: CommentDetails
  pct: number | null | undefined
  coverage: Coverage | null | undefined
  disabled: boolean
  onChange: (next: CommentDetails) => void
  onFlush: () => void
  onWriteWithAi: () => void
  aiDisabled: boolean
  aiBusy: boolean
  /** The AI draft waits on "Replace" (shown here too: the comment cell is often scrolled out of view). */
  confirming: boolean
  onConfirmReplace: () => void
  onCancelReplace: () => void
  onNext: (() => void) | null
}) {
  const suggestions = detailSuggestions(pct, coverage)
  const caption = (key: string): string | null => {
    if (details.picks[key] || !suggestions[key]) return null
    if (key === 'achievement' && typeof pct === 'number') return `Suggested from ${pct.toFixed(1)}%`
    if (key === 'completion' && coverage) return `Suggested: ${coverage.missing} of ${coverage.assessed} missing`
    return null
  }
  const pick = (key: string, value: string) => {
    const picks = { ...details.picks }
    if (value) picks[key] = value
    else delete picks[key]
    onChange({ ...details, picks })
    onFlush()
  }

  const group = (g: DetailGroup, title: string) => (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-800">{title}</h4>
      <div className="flex flex-col gap-3">
        {REPORT_CARD_DETAILS.filter((it) => it.group === g).map((it) => {
          const note = caption(it.key)
          return (
            <div key={it.key} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
              <div className="pt-1.5 text-sm text-slate-600">
                {it.label}
                {note && <span className="block text-xs text-violet-600">{note}</span>}
              </div>
              <RatingButtons
                label={it.label}
                options={it.options.map((o) => ({ value: o.key, label: o.label }))}
                value={details.picks[it.key] ?? ''}
                suggested={suggestions[it.key] ?? null}
                disabled={disabled}
                onChange={(v) => pick(it.key, v)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )

  const noteId = `details-note-${studentId}`
  return (
    <div className="flex flex-col gap-4 border-l-4 border-teal-500 bg-slate-50 px-5 py-4">
      <p className="text-sm text-slate-600">Used only to write the comment. Nothing here prints on the report card.</p>
      <div className="flex flex-col gap-4">
        {group('subject', `In ${subject}`)}
        {group('skills', 'Learning skills and work habits')}
      </div>
      <div>
        <label htmlFor={noteId} className="mb-1 block text-sm font-medium text-slate-800">
          Anything specific to mention? <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id={noteId}
          value={details.note}
          maxLength={DETAIL_NOTE_MAX}
          disabled={disabled}
          rows={2}
          onChange={(e) => onChange({ ...details, note: e.target.value })}
          onBlur={onFlush}
          placeholder="e.g. strong at mental math, rushes word problems"
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>Don&apos;t include medical or family details.</span>
          <span className="tabular-nums">
            {details.note.length} / {DETAIL_NOTE_MAX}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {confirming && (
          <div className="mr-auto flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-700">Replace your comment with a new AI draft?</span>
            <button
              type="button"
              onClick={onConfirmReplace}
              className="cursor-pointer rounded-md bg-violet-600 px-2.5 py-1 font-medium text-white hover:bg-violet-700"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onCancelReplace}
              className="cursor-pointer rounded-md px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onWriteWithAi}
          disabled={aiDisabled || aiBusy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          title={aiDisabled ? 'Pick Work Habits and Behavior first' : undefined}
        >
          <SparklesIcon className="h-4 w-4" />
          {aiBusy ? 'Writing…' : 'Write with AI'}
        </button>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Next student →
          </button>
        )}
      </div>
    </div>
  )
}
