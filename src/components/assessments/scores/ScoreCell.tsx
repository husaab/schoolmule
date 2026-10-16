'use client'

// One editable score cell with four states:
//   blank   — empty dashed input, placeholder "—": not yet graded, no weight
//   graded  — a number (0 is a real 0)
//   missing — red "M" pill: counts as 0
//   excused — grey "Excused" pill: never counts
// A hover/focus "…" control switches between them; on a focused cell `m`
// marks missing, `x` excuses, and Backspace/Delete on a pill clears it.
// Renders the <td> itself so the grids stay thin.
//
// Scores autosave (D17): every keystroke reports the clamped value through
// onValue, and leaving the cell (blur, Enter, Tab, an arrow key) calls
// onCommit so the save goes out at once. A cell whose save failed is
// outlined until Retry succeeds.
//
// On a turn-in column (an assignment or quiz, spec D3) the grid's classwork
// layer marks the cell (`mark`, Teacher-Grades board): a draft only the
// teacher sees is grey and italic, work turned in with no grade yet reads
// "In" in cyan, and work past due with nothing turned in gets a rose dot.

import React, { KeyboardEvent } from 'react'
import { inputClass } from '@/components/shared/modalKit'
import type { ScoreStatus } from '@/lib/gradeEngine'
import { clampScoreInput, type CellValue } from '@/lib/scoreAutosaveQueue'
import StatusControl from './StatusControl'

interface ScoreCellProps {
  /** DOM id used by useScoreGridNav to move focus (input or pill). */
  inputId: string
  /** Accessible name, e.g. "Student A score for Quiz 1". */
  label: string
  /** What the cell shows (the newest local value, else the saved one); null is blank. */
  value: CellValue
  maxScore: number
  status: ScoreStatus
  /** This cell's status round trip is in flight. */
  isToggling: boolean
  /** Some cell's round trip is in flight, so no second one may start. */
  toggleDisabled: boolean
  /** The typed score, clamped to [0, maxScore]; null when the cell is emptied. */
  onValue: (value: CellValue) => void
  /** The teacher left the cell: save now. */
  onCommit: () => void
  /** This cell's last save failed. */
  failed?: boolean
  onSetStatus: (status: ScoreStatus) => void
  /** Arrow-key navigation; receives keys the cell did not handle itself. */
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void
  className?: string
  /** Rendered in the top-left corner, e.g. the parent-conversation chip. */
  corner?: React.ReactNode
  /** The classwork layer's marks for a turn-in column. */
  mark?: ScoreCellMark
}

export interface ScoreCellMark {
  /** The value is a draft: only the teacher sees it until Publish. */
  draft?: boolean
  /** Turned in, not graded yet: a blank cell reads "In". */
  turnedIn?: boolean
  /** Turned in late. */
  late?: boolean
  /** Past due with nothing turned in (nothing is written): a rose dot. */
  derivedMissing?: boolean
}

// The input's own colours, swapped (not stacked) so a mark always wins.
const BASE_TONE = { bg: 'bg-slate-50', text: 'text-slate-900', placeholder: 'placeholder:text-slate-400' }
const DRAFT_TONE = { bg: 'bg-slate-100', text: 'text-slate-500 italic', placeholder: 'placeholder:text-slate-400' }
const IN_TONE = { bg: 'bg-cyan-100', text: 'text-cyan-800', placeholder: 'placeholder:text-cyan-800' }
const toned = (tone: typeof BASE_TONE) =>
  inputClass.replace(BASE_TONE.bg, tone.bg).replace(BASE_TONE.text, tone.text).replace(BASE_TONE.placeholder, tone.placeholder)

export const pillClass: Record<Exclude<ScoreStatus, 'graded'>, string> = {
  missing: 'bg-rose-100 text-rose-700 ring-rose-200',
  excused: 'bg-slate-100 text-slate-500 ring-slate-200',
}

/** Shortcut keys shared by the input and the pills. Returns true when handled. */
const statusShortcut = (e: KeyboardEvent<HTMLElement>, onSetStatus: (s: ScoreStatus) => void): boolean => {
  if (e.metaKey || e.ctrlKey || e.altKey) return false
  if (e.key === 'm' || e.key === 'M') {
    e.preventDefault()
    onSetStatus('missing')
    return true
  }
  if (e.key === 'x' || e.key === 'X') {
    e.preventDefault()
    onSetStatus('excused')
    return true
  }
  return false
}

// Keys that leave the cell; the save goes out before focus moves.
const LEAVE_KEYS = new Set(['Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

const ScoreCell: React.FC<ScoreCellProps> = ({
  inputId,
  label,
  value,
  maxScore,
  status,
  isToggling,
  toggleDisabled,
  onValue,
  onCommit,
  failed = false,
  onSetStatus,
  onKeyDown,
  className = '',
  corner,
  mark,
}) => {
  const isDraft = Boolean(mark?.draft)
  const isIn = Boolean(mark?.turnedIn) && value == null
  const pastDue = Boolean(mark?.derivedMissing) && value == null && status === 'graded'
  const guarded = (next: ScoreStatus) => {
    if (toggleDisabled) return
    onSetStatus(next)
  }

  return (
    <td className={`group relative px-2 py-1.5 text-center ${className}`}>
      <StatusControl
        label={label}
        status={status}
        busy={isToggling}
        disabled={toggleDisabled}
        onSetStatus={onSetStatus}
      />
      {corner}

      {status !== 'graded' ? (
        <div className="flex items-center justify-center">
          <button
            type="button"
            id={inputId}
            aria-label={`${label}: ${status === 'missing' ? 'missing, counts as 0' : 'excused, not counted'}`}
            title={
              (status === 'missing'
                ? 'Missing — counts as 0. Backspace clears.'
                : 'Excused — not counted. Backspace clears.') + (isDraft ? ' A draft: only you see it until you publish.' : '')
            }
            onKeyDown={(e) => {
              if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault()
                guarded('graded')
                return
              }
              if (statusShortcut(e, guarded)) return
              onKeyDown(e)
            }}
            className={`cursor-default rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${pillClass[status]} ${isDraft ? 'italic' : ''}`}
          >
            {status === 'missing' ? 'M' : 'Excused'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1">
          <div className={`w-16 rounded-xl ${failed ? 'ring-2 ring-rose-400' : ''}`}>
            <input
              id={inputId}
              type="number"
              min="0"
              max={maxScore}
              step="1"
              aria-label={isIn ? `${label} (turned in${mark?.late ? ' late' : ''}, not graded yet)` : isDraft && value != null ? `${label} (draft)` : label}
              aria-invalid={failed || undefined}
              className={`${isIn ? toned(IN_TONE) : isDraft && value != null ? toned(DRAFT_TONE) : inputClass} text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                value == null && !isIn ? 'border-dashed' : ''
              } ${failed ? 'border-rose-300' : ''}`}
              value={value ?? ''}
              onChange={(e) => onValue(clampScoreInput(e.target.value, maxScore))}
              onBlur={onCommit}
              onKeyDown={(e) => {
                if (statusShortcut(e, guarded)) return
                if (LEAVE_KEYS.has(e.key)) onCommit()
                onKeyDown(e)
              }}
              onKeyPress={(e) => {
                // Digits and a decimal point only; navigation keys pass through.
                if (!/[0-9.]/.test(e.key)) e.preventDefault()
              }}
              placeholder={isIn ? 'In' : '—'}
              title={
                failed
                  ? "This score didn't save. Use Retry above the grid."
                  : isIn
                    ? `Turned in${mark?.late ? ' late' : ''}, not graded yet`
                    : isDraft && value != null
                      ? "A draft: only you see it until you publish"
                      : pastDue
                        ? 'Past due, nothing turned in'
                        : value == null
                          ? 'Not yet graded — carries no weight'
                          : undefined
              }
            />
          </div>
          <span className="text-sm text-slate-400">/{maxScore}</span>
          {pastDue && (
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-rose-600" title="Past due, nothing turned in" aria-hidden="true" />
          )}
        </div>
      )}
    </td>
  )
}

export default ScoreCell
