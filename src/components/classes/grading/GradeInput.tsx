// src/components/classes/grading/GradeInput.tsx
// The grade box (Teacher-Grading board): "[ 8 ] / 10", then the line that
// says whether it is a draft or already published, then Mark missing and
// Excuse. Typing a score saves by itself (a draft until Publish on an
// unpublished column); a typed score clears Missing. Excused takes the box
// out of play until the excuse is lifted.
'use client'

import { useState } from 'react'
import { clampScoreInput, type CellValue } from '@/lib/scoreAutosaveQueue'
import { formatScore } from '@/lib/gradingView'
import type { GradeStatus } from '@/services/types/grading'

interface GradeInputProps {
  studentName: string
  /** The score shown when the panel opened (draft, else published). */
  initialScore: number | null
  status: GradeStatus | null
  maxScore: number | null
  hint: string
  disabled: boolean
  /** A status change is on its way to the server. */
  busy: boolean
  onScore: (value: CellValue) => void
  onCommit: () => void
  onMarkMissing: () => void
  onClearMissing: () => void
  onExcuse: (excused: boolean) => void
}

const toggleClass = (on: boolean, tone: 'rose' | 'slate') =>
  `cursor-pointer rounded-[10px] border px-[11px] py-[7px] text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    on
      ? tone === 'rose'
        ? 'border-rose-200 bg-rose-50 font-medium text-rose-700 hover:bg-rose-100'
        : 'border-slate-300 bg-slate-100 font-medium text-slate-700 hover:bg-slate-200'
      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
  }`

export default function GradeInput({
  studentName,
  initialScore,
  status,
  maxScore,
  hint,
  disabled,
  busy,
  onScore,
  onCommit,
  onMarkMissing,
  onClearMissing,
  onExcuse,
}: GradeInputProps) {
  const max = maxScore && maxScore > 0 ? maxScore : 100
  const [text, setText] = useState(initialScore === null ? '' : formatScore(initialScore))
  const missing = status === 'missing'
  const excused = status === 'excused'

  const change = (raw: string) => {
    if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return
    const value = clampScoreInput(raw, max)
    // A number past the maximum shows as the maximum, as the grid does.
    setText(value !== null && Number(raw) !== value ? formatScore(value) : raw)
    onScore(value)
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="grading-score" className="text-[13px] font-medium text-slate-600">
        Grade
      </label>
      <div className="flex items-baseline gap-2.5">
        <input
          id="grading-score"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${studentName}'s grade, out of ${formatScore(max)}`}
          value={excused ? '' : text}
          placeholder={missing ? '0' : excused ? '—' : ''}
          disabled={disabled || excused}
          onChange={(e) => change(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommit()
          }}
          className="font-display w-[84px] rounded-xl border-2 border-cyan-400 bg-white px-3 py-2.5 text-center text-[28px] font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <span className="font-display text-[22px] text-slate-500">/ {formatScore(max)}</span>
      </div>
      {missing && <span className="text-[13px] font-medium text-rose-700">Missing, counts as 0. Type a score to grade it.</span>}
      {excused && <span className="text-[13px] font-medium text-slate-600">Excused, doesn&apos;t count.</span>}
      <span className="text-[13px] text-slate-600">{hint}</span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={missing}
          disabled={disabled || busy || excused}
          onClick={() => (missing ? onClearMissing() : onMarkMissing())}
          title={missing ? 'Clear Missing' : 'Counts as 0, and shows to the student and parents at once'}
          className={toggleClass(missing, 'rose')}
        >
          {missing ? 'Missing' : 'Mark missing'}
        </button>
        <button
          type="button"
          aria-pressed={excused}
          disabled={disabled || busy}
          onClick={() => onExcuse(!excused)}
          title={excused ? 'Lift the excuse' : "Doesn't count, and shows to the student and parents at once"}
          className={toggleClass(excused, 'slate')}
        >
          {excused ? 'Excused' : 'Excuse'}
        </button>
      </div>
    </div>
  )
}
