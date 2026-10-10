'use client'

// One editable score cell with four states:
//   blank   — empty dashed input, placeholder "—": not yet graded, no weight
//   graded  — a number (0 is a real 0)
//   missing — red "M" pill: counts as 0
//   excused — grey "Excused" pill: never counts
// A hover/focus "…" control switches between them; on a focused cell `m`
// marks missing, `x` excuses, and Backspace/Delete on a pill clears it.
// Renders the <td> itself so the grids stay thin.

import React, { ChangeEvent, KeyboardEvent } from 'react'
import { inputClass } from '@/components/shared/modalKit'
import type { ScoreStatus } from '@/lib/gradeEngine'
import StatusControl from './StatusControl'

interface ScoreCellProps {
  /** DOM id used by useScoreGridNav to move focus (input or pill). */
  inputId: string
  /** Accessible name, e.g. "Student A score for Quiz 1". */
  label: string
  value: number | ''
  maxScore: number
  status: ScoreStatus
  /** This cell's status round trip is in flight. */
  isToggling: boolean
  /** Some cell's round trip is in flight, so no second one may start. */
  toggleDisabled: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSetStatus: (status: ScoreStatus) => void
  /** Arrow-key navigation; receives keys the cell did not handle itself. */
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void
  className?: string
  /** Rendered in the top-left corner, e.g. the parent-conversation chip. */
  corner?: React.ReactNode
}

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

const ScoreCell: React.FC<ScoreCellProps> = ({
  inputId,
  label,
  value,
  maxScore,
  status,
  isToggling,
  toggleDisabled,
  onChange,
  onSetStatus,
  onKeyDown,
  className = '',
  corner,
}) => {
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
              status === 'missing'
                ? 'Missing — counts as 0. Backspace clears.'
                : 'Excused — not counted. Backspace clears.'
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
            className={`cursor-default rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${pillClass[status]}`}
          >
            {status === 'missing' ? 'M' : 'Excused'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1">
          <div className="w-16">
            <input
              id={inputId}
              type="number"
              min="0"
              max={maxScore}
              step="1"
              aria-label={label}
              className={`${inputClass} text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                value === '' ? 'border-dashed placeholder:text-slate-400' : ''
              }`}
              value={value}
              onChange={onChange}
              onKeyDown={(e) => {
                if (statusShortcut(e, guarded)) return
                onKeyDown(e)
              }}
              onKeyPress={(e) => {
                // Digits and a decimal point only; navigation keys pass through.
                if (!/[0-9.]/.test(e.key)) e.preventDefault()
              }}
              placeholder="—"
              title={value === '' ? 'Not yet graded — carries no weight' : undefined}
            />
          </div>
          <span className="text-sm text-slate-400">/{maxScore}</span>
        </div>
      )}
    </td>
  )
}

export default ScoreCell
