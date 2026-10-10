'use client'

// A category (multiple-assessment) roll-up cell: "earned/points" when any
// item inside is counted, "—" when nothing is graded yet, "Excused" when every
// item is excused. Its "…" control applies a status to the whole category.

import React from 'react'
import type { AssessmentResult, CellState, ScoreStatus } from '@/lib/gradeEngine'
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
  onClick?: () => void
  className?: string
  title?: string
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

export const formatCategoryScore = (result: AssessmentResult): string => {
  if (!result.isCounted || result.pct == null) return '—'
  const earned = (result.pct / 100) * result.weight
  return `${earned.toFixed(1)}/${result.weight}`
}

const CategoryCell: React.FC<CategoryCellProps> = ({
  label,
  result,
  childStates = [],
  isToggling,
  toggleDisabled,
  onSetStatus,
  onClick,
  className = '',
  title,
}) => {
  const excused = result.state === 'excused'
  const gradedChildren = childStates.filter((st) => st === 'graded').length
  return (
    <td
      className={`group relative px-2 py-2 text-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      title={title}
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
      {excused ? (
        <span className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset ${pillClass.excused}`}>
          Excused
        </span>
      ) : result.isCounted ? (
        <span className="inline-block rounded-lg bg-blue-100 px-2 py-1 text-sm font-medium tabular-nums text-blue-700">
          {formatCategoryScore(result)}
        </span>
      ) : (
        <span className="inline-block px-2 py-1 text-sm text-slate-400" title="Nothing graded yet">
          —
        </span>
      )}
    </td>
  )
}

export default CategoryCell
