'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChatBubbleLeftRightIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { AssessmentScore } from '@/services/types/parentPortal'
import type { ThreadStub } from '@/services/types/messaging'
import {
  AssessmentGroup,
  categoryStatus,
  groupAssessmentScores,
  leafStatus,
  pctOf,
} from '@/lib/assessmentGrouping'
import { gradeTextColor } from './childColors'
import AssessmentStatusBadge from './AssessmentStatusBadge'
import InlineAskComposer from '@/components/messaging/InlineAskComposer'

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

/** Where the "Ask the teacher" action lands: everything a thread needs. */
export interface AskContext {
  studentId: string
  studentFirstName: string
  classId: string
  teacherName: string | null
}

interface RowProps {
  score: AssessmentScore
  indented?: boolean
  stub?: ThreadStub
  /** Present when this row may start a conversation. */
  ask?: AskContext
  askOpen: boolean
  onToggleAsk: () => void
}

/**
 * One assessment row. Laid out as a wrapping flex row rather than a table
 * cell so the breakdown reads correctly at any width — the old version was
 * a wide <table> in a horizontal scroller, which was unusable on a phone.
 *
 * A row with an existing conversation shows a chip into it; any other row
 * offers "Ask the teacher", which opens an inline composer underneath.
 */
const AssessmentRow: React.FC<RowProps> = ({ score, indented = false, stub, ask, askOpen, onToggleAsk }) => {
  const pct = pctOf(score.score, score.maxScore)
  const status = leafStatus(score)
  const scoreLabel = pct != null ? `${score.score}/${score.maxScore} (${pct}%)` : null

  return (
    <div className={`py-3 ${indented ? 'pl-3' : ''}`}>
      <div className="group flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-700">{score.name}</p>
            {stub && (
              <Link
                href={`/parent/messages?thread=${encodeURIComponent(stub.conversationId)}`}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-px text-[11px] font-medium ${
                  stub.unreadCount > 0
                    ? 'bg-amber-700 text-white'
                    : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-3 w-3" />
                {stub.unreadCount > 0
                  ? `${stub.unreadCount} new ${stub.unreadCount === 1 ? 'reply' : 'replies'}`
                  : stub.status === 'resolved'
                    ? 'Conversation resolved'
                    : 'Open conversation'}
              </Link>
            )}
          </div>
          <MetaLine
            parts={[
              formatDate(score.date),
              score.weightPoints != null ? `Weight ${score.weightPoints}` : null,
            ]}
          />
          <CommentChip comment={score.parentComment} />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 text-right">
          {ask && !stub && (
            <button
              type="button"
              onClick={onToggleAsk}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-opacity cursor-pointer ${
                askOpen
                  ? 'border-amber-300 bg-amber-100 text-amber-900'
                  : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
              Ask the teacher
            </button>
          )}
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

      {ask && askOpen && (
        <InlineAskComposer
          studentId={ask.studentId}
          studentFirstName={ask.studentFirstName}
          classId={ask.classId}
          assessmentId={score.assessmentId}
          assessmentName={score.name}
          scoreLabel={scoreLabel}
          teacherName={ask.teacherName}
          onClose={onToggleAsk}
        />
      )}
    </div>
  )
}

interface GroupProps {
  group: AssessmentGroup
  stubs: Record<string, ThreadStub>
  ask?: AskContext
  askingId: string | null
  onToggleAsk: (assessmentId: string) => void
}

/**
 * A category and its children. Expanded by default — a parent should never
 * have to discover that marks are hidden behind a chevron.
 */
const CategoryGroup: React.FC<GroupProps> = ({ group, stubs, ask, askingId, onToggleAsk }) => {
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
            <AssessmentRow
              key={child.assessmentId}
              score={child}
              indented
              stub={stubs[child.assessmentId]}
              ask={ask}
              askOpen={askingId === child.assessmentId}
              onToggleAsk={() => onToggleAsk(child.assessmentId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ParentAssessmentTableProps {
  scores: AssessmentScore[]
  /** Existing conversations keyed by assessmentId, for the chips. */
  threadStubs?: Record<string, ThreadStub>
  /** When set, published rows get an "Ask the teacher" action. */
  ask?: AskContext
}

/**
 * Per-assessment breakdown inside an expanded class card.
 *
 * Categories are nested rather than listed flat alongside their own
 * children, and carry the rollup percentage the API computes for them.
 */
const ParentAssessmentTable: React.FC<ParentAssessmentTableProps> = ({ scores, threadStubs = {}, ask }) => {
  const groups = useMemo(() => groupAssessmentScores(scores), [scores])
  const [askingId, setAskingId] = useState<string | null>(null)
  const toggleAsk = (id: string) => setAskingId((cur) => (cur === id ? null : id))

  if (groups.length === 0) {
    return <p className="text-sm text-slate-500 py-3">No assessments published yet.</p>
  }

  return (
    <div className="divide-y divide-stone-100">
      {groups.map((group) =>
        group.kind === 'category' ? (
          <CategoryGroup
            key={group.parent.assessmentId}
            group={group}
            stubs={threadStubs}
            ask={ask}
            askingId={askingId}
            onToggleAsk={toggleAsk}
          />
        ) : (
          <AssessmentRow
            key={group.parent.assessmentId}
            score={group.parent}
            stub={threadStubs[group.parent.assessmentId]}
            ask={ask}
            askOpen={askingId === group.parent.assessmentId}
            onToggleAsk={() => toggleAsk(group.parent.assessmentId)}
          />
        ),
      )}
    </div>
  )
}

export default ParentAssessmentTable
