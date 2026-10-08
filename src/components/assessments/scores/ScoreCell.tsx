'use client'

// One editable score cell: number input with "/max", a hover toggle to drop
// the assessment from this student's grade, and an "Excluded" pill when it is
// dropped. Renders the <td> itself so the grids stay thin.

import React, { ChangeEvent, KeyboardEvent } from 'react'
import { ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { inputClass } from '@/components/shared/modalKit'

interface ScoreCellProps {
  /** DOM id used by useScoreGridNav to move focus. */
  inputId: string
  /** Accessible name, e.g. "Student A score for Quiz 1". */
  label: string
  value: number | ''
  maxScore: number
  isExcluded: boolean
  /** This cell's exclusion round trip is in flight. */
  isToggling: boolean
  /** Some cell's round trip is in flight, so no second one may start. */
  toggleDisabled: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onToggleExclusion: () => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  className?: string
}

const ScoreCell: React.FC<ScoreCellProps> = ({
  inputId,
  label,
  value,
  maxScore,
  isExcluded,
  isToggling,
  toggleDisabled,
  onChange,
  onToggleExclusion,
  onKeyDown,
  className = '',
}) => (
  <td className={`group relative px-2 py-1.5 text-center ${className}`}>
    <button
      type="button"
      onClick={onToggleExclusion}
      disabled={toggleDisabled}
      aria-label={isExcluded ? `Count ${label} again` : `Exclude ${label}`}
      className={`absolute right-1 top-1 z-10 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed ${
        isToggling ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
      } ${
        isExcluded
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
      }`}
      title={
        isExcluded
          ? 'Count this assessment for this student again'
          : 'Drop this assessment from this student’s grade'
      }
    >
      {isToggling ? (
        <ArrowPathIcon className="h-3 w-3 animate-spin" />
      ) : isExcluded ? (
        <CheckIcon className="h-3 w-3" />
      ) : (
        <XMarkIcon className="h-3 w-3" />
      )}
    </button>

    {isExcluded ? (
      <div className="flex items-center justify-center">
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">Excluded</span>
      </div>
    ) : (
      <div className="flex items-center justify-center gap-1">
        <div className="w-20">
          <input
            id={inputId}
            type="number"
            min="0"
            max={maxScore}
            step="1"
            aria-label={label}
            className={`${inputClass} text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onKeyPress={(e) => {
              // Digits and a decimal point only; navigation keys pass through.
              if (!/[0-9.]/.test(e.key)) e.preventDefault()
            }}
            placeholder="0"
          />
        </div>
        <span className="text-sm text-slate-400">/{maxScore}</span>
      </div>
    )}
  </td>
)

export default ScoreCell
