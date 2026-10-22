// src/components/classes/grading/GradingStudentList.tsx
// The grading view's student list (Teacher-Grading board): filters "All n",
// "To grade n", "Missing n" (URL ?filter=), then one row per student with
// their avatar, name, status ("Graded · draft" blue, "Turned in" green,
// "Turned in · late" amber, "Missing" rose, "Not turned in yet" slate, and
// "Graded earlier — check the new work" amber when new work came in after the
// draft, Fable I1) and score (a draft grey italic, published solid, missing
// "0" in rose).
'use client'

import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import {
  GRADING_FILTER_LABELS,
  GRADING_FILTERS,
  rowScore,
  rowStatus,
  SCORE_INK,
  type GradingFilter,
} from '@/lib/gradingView'
import type { GradingCounts, GradingRow } from '@/services/types/grading'

interface GradingStudentListProps {
  rows: GradingRow[]
  counts: GradingCounts
  filter: GradingFilter
  onFilter: (filter: GradingFilter) => void
  selectedId: string | null
  onSelect: (studentId: string) => void
  linked: boolean
}

const EMPTY_TEXT: Record<GradingFilter, string> = {
  all: 'No students to grade here yet.',
  'to-grade': 'Nothing is waiting to be graded.',
  missing: 'Nobody is missing this one.',
}

const countFor = (filter: GradingFilter, counts: GradingCounts) =>
  filter === 'all' ? counts.all : filter === 'to-grade' ? counts.toGrade : counts.missing

export default function GradingStudentList({ rows, counts, filter, onFilter, selectedId, onSelect, linked }: GradingStudentListProps) {
  return (
    <nav aria-label="Students" className="flex flex-[1_1_280px] flex-col border-slate-200 bg-white lg:border-r">
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-3.5">
        {GRADING_FILTERS.map((f) => {
          const on = f === filter
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => onFilter(f)}
              className={`cursor-pointer rounded-full border px-2.5 py-1.5 text-[13px] transition-colors ${
                on ? 'border-cyan-200 bg-cyan-50 font-medium text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {GRADING_FILTER_LABELS[f]} {countFor(f, counts)}
            </button>
          )
        })}
      </div>

      <div className="flex max-h-[45vh] flex-col overflow-y-auto p-2 lg:max-h-none">
        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">{EMPTY_TEXT[filter]}</p>
        ) : (
          rows.map((row) => {
            const score = rowScore(row, linked)
            const statusLine = rowStatus(row)
            const selected = row.studentId === selectedId
            return (
              <button
                key={row.studentId}
                type="button"
                onClick={() => onSelect(row.studentId)}
                aria-current={selected ? 'true' : undefined}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  selected ? 'bg-cyan-50' : 'hover:bg-slate-50'
                }`}
              >
                <Avatar student name={row.name} avatar={row.avatar} photoUrl={row.photoUrl} size={36} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900">
                    <span className="truncate">{row.name}</span>
                    {row.hasThread && (
                      <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 shrink-0 text-cyan-600" aria-label="Has messages about this work" />
                    )}
                  </span>
                  <span className={`text-xs ${statusLine.ink}`}>{statusLine.text}</span>
                </span>
                {score.text && <span className={`text-sm tabular-nums ${SCORE_INK[score.tone]}`}>{score.text}</span>}
              </button>
            )
          })
        )}
      </div>
    </nav>
  )
}
