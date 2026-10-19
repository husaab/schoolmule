'use client'

// A category (multiple-assessment) roll-up cell: "earned/points" when any
// item inside is counted, "—" when nothing is graded yet, "Excused" when every
// item is excused. Its "…" control applies a status to the whole category.
// Clicking anywhere in the cell (or Enter on its button) opens the category
// window, where the items inside are scored. Words under the score say what
// is inside (D15, UX review E1): "Missing work" when anything is missing
// (flagged, or classwork past due), else "To grade" when classwork inside is
// turned in or holds a draft, waiting for the teacher. The score is large and
// coloured by band.

import React from 'react'
import type { AssessmentResult, CellState, ScoreStatus } from '@/lib/gradeEngine'
import type { CategoryDot } from '@/lib/gridOverlay'
import { categoryFlag, scoreTone } from '@/lib/gradesLayout'
import StatusControl from './StatusControl'
import { pillClass } from './ScoreCell'

interface CategoryCellProps {
  /** Accessible name, e.g. "Student A score for Unit tests". */
  label: string
  /** From computeAssessmentForStudent for the category assessment. */
  result: AssessmentResult
  /** Cell state of each item inside the category, so "all missing" can be cleared. */
  childStates?: CellState[]
  isToggling: boolean
  toggleDisabled: boolean
  onSetStatus: (status: ScoreStatus) => void
  /** Opens the category window. */
  onClick?: () => void
  /** A score inside this category failed to save. */
  failed?: boolean
  /** The classwork layer's dot; without it, a flagged-missing item inside still shows the rose dot. */
  dot?: CategoryDot
  className?: string
  title?: string
  /** Compact rows: the words sit beside the score instead of under it. */
  dense?: boolean
}

/**
 * The category's own status as the control sees it: excused when every item
 * is excused, missing when every counted item is flagged missing (so "Clear
 * status" is offered), otherwise graded.
 */
export const categoryStatus = (result: AssessmentResult, childStates: CellState[] = []): ScoreStatus => {
  if (result.state === 'excused') return 'excused'
  const counted = childStates.filter((st) => st === 'graded' || st === 'missing')
  if (counted.length > 0 && counted.every((st) => st === 'missing')) return 'missing'
  return 'graded'
}

const CategoryCell: React.FC<CategoryCellProps> = ({
  label,
  result,
  childStates = [],
  isToggling,
  toggleDisabled,
  onSetStatus,
  onClick,
  failed = false,
  dot,
  className = '',
  title,
  dense = false,
}) => {
  const excused = result.state === 'excused'
  const gradedChildren = childStates.filter((st) => st === 'graded').length
  // Something inside is flagged missing (counts as 0): the board's rose dot.
  const shownDot: CategoryDot = dot !== undefined ? dot : childStates.includes('missing') ? 'missing' : null
  const flag = categoryFlag(shownDot)
  const earned = result.isCounted && result.pct != null ? (result.pct / 100) * result.weight : null
  const score = excused ? (
    <span className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset ${pillClass.excused}`}>
      Excused
    </span>
  ) : earned != null ? (
    <span className="inline-flex items-baseline gap-1 tabular-nums">
      <span className={`font-display text-lg font-semibold ${scoreTone(result.pct)}`}>{earned.toFixed(1)}</span>
      <span className="text-sm text-slate-500">/ {result.weight}</span>
    </span>
  ) : (
    <span className="inline-block px-2 py-1 text-base text-slate-400" title="Nothing graded yet">
      —
    </span>
  )
  const value = (
    <span className={`inline-flex items-center px-1 ${dense ? 'flex-row gap-2' : 'flex-col gap-0.5'}`}>
      {score}
      {flag && <span className={`text-xs font-medium ${flag.className}`}>{flag.text}</span>}
    </span>
  )
  return (
    <td
      className={`group relative px-2 py-2 text-center ${onClick ? 'cursor-pointer' : ''} ${failed ? 'ring-2 ring-inset ring-rose-400' : ''} ${className}`}
      onClick={onClick}
      title={failed ? "A score in this category didn't save. Use Retry above the grid." : title}
    >
      <StatusControl
        label={label}
        status={categoryStatus(result, childStates)}
        busy={isToggling}
        disabled={toggleDisabled}
        onSetStatus={onSetStatus}
        confirmMissing={
          gradedChildren > 0
            ? `Mark all ${childStates.length} items missing? ${gradedChildren} entered score${gradedChildren === 1 ? '' : 's'} will be cleared and count as 0.`
            : undefined
        }
      />
      {onClick ? (
        <button
          type="button"
          aria-label={`${label}: open the category`}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className="cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {value}
        </button>
      ) : (
        value
      )}
    </td>
  )
}

export default CategoryCell
