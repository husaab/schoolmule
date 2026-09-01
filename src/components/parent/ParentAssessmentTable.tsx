'use client'

import React, { useMemo, useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { AssessmentScore } from '@/services/types/parentPortal'
import {
  AssessmentGroup,
  categoryStatus,
  groupAssessmentScores,
  leafStatus,
  pctOf,
} from '@/lib/assessmentGrouping'
import { gradeTextColor } from './childColors'
import AssessmentStatusBadge from './AssessmentStatusBadge'

const formatDate = (date: string | null) => {
  if (!date) return null
  const d = new Date(date)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Small dot-separated meta line; skips anything absent. */
const MetaLine: React.FC<{ parts: (string | null)[] }> = ({ parts }) => {
  const shown = parts.filter(Boolean)
  if (shown.length === 0) return null
  return <p className="text-xs text-slate-400 mt-0.5">{shown.join(' · ')}</p>
}

const CommentChip: React.FC<{ comment: string | null }> = ({ comment }) => {
  if (!comment) return null
  return (
    <p className="mt-2 text-xs text-slate-600 bg-stone-50 border border-stone-100 rounded-lg px-2.5 py-1.5">
      {comment}
    </p>
  )
}

/**
 * One assessment row. Laid out as a wrapping flex row rather than a table
 * cell so the breakdown reads correctly at any width — the old version was
 * a wide <table> in a horizontal scroller, which was unusable on a phone.
 */
const AssessmentRow: React.FC<{ score: AssessmentScore; indented?: boolean }> = ({
  score,
  indented = false,
}) => {
  const pct = pctOf(score.score, score.maxScore)
  const status = leafStatus(score)

  return (
    <div className={`py-3 flex items-start justify-between gap-3 ${indented ? 'pl-3' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-700">{score.name}</p>
        <MetaLine
          parts={[
            formatDate(score.date),
            score.weightPoints != null ? `Weight ${score.weightPoints}` : null,
          ]}
        />
        <CommentChip comment={score.parentComment} />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 text-right">
        <AssessmentStatusBadge status={status} />
        {pct != null && (
          <span className="text-sm whitespace-nowrap">
            <span className="text-slate-500">
              {score.score}/{score.maxScore}
            </span>{' '}
            <span className={`font-medium ${gradeTextColor(pct)}`}>{pct}%</span>
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * A category and its children. Expanded by default — a parent should never
 * have to discover that marks are hidden behind a chevron.
 */
const CategoryGroup: React.FC<{ group: AssessmentGroup }> = ({ group }) => {
  const [expanded, setExpanded] = useState(true)
  const status = categoryStatus(group)
  const childCount = group.children.length

  return (
    <div className="py-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 text-left cursor-pointer"
      >
        <div className="min-w-0 flex-1 flex items-start gap-1.5">
          {expanded ? (
            <ChevronDownIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">{group.parent.name}</p>
            <MetaLine
              parts={[
                childCount > 0 ? `${childCount} ${childCount === 1 ? 'item' : 'items'}` : null,
                group.parent.weightPoints != null ? `Weight ${group.parent.weightPoints}` : null,
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <AssessmentStatusBadge status={status} />
          {group.pct != null && (
            <span className={`text-sm font-semibold ${gradeTextColor(group.pct)}`}>
              {group.pct}%
            </span>
          )}
        </div>
      </button>

      <CommentChip comment={group.parent.parentComment} />

      {expanded && childCount > 0 && (
        <div className="mt-1 ml-5 border-l-2 border-stone-100 divide-y divide-stone-100">
          {group.children.map((child) => (
            <AssessmentRow key={child.assessmentId} score={child} indented />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Per-assessment breakdown inside an expanded class card.
 *
 * Categories are nested rather than listed flat alongside their own
 * children, and carry the rollup percentage the API computes for them.
 */
const ParentAssessmentTable: React.FC<{ scores: AssessmentScore[] }> = ({ scores }) => {
  const groups = useMemo(() => groupAssessmentScores(scores), [scores])

  if (groups.length === 0) {
    return <p className="text-sm text-slate-500 py-3">No assessments published yet.</p>
  }

  return (
    <div className="divide-y divide-stone-100">
      {groups.map((group) =>
        group.kind === 'category' ? (
          <CategoryGroup key={group.parent.assessmentId} group={group} />
        ) : (
          <AssessmentRow key={group.parent.assessmentId} score={group.parent} />
        ),
      )}
    </div>
  )
}

export default ParentAssessmentTable
