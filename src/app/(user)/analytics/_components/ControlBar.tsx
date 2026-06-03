'use client'

// Sticky global filter strip: term + compare-term selectors, grade/subject
// filters, the grade-engine toggle, and the AI chat launcher.

import React from 'react'
import { SparklesIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { TermPayload } from '@/services/types/term'
import { UseAnalyticsParams } from '../_hooks/useAnalyticsParams'
import EngineTooltip from './EngineTooltip'
import StudentPicker, { PickerStudent } from './StudentPicker'

interface ControlBarProps {
  params: UseAnalyticsParams
  terms: TermPayload[]
  grades: string[]
  subjects: string[]
  students: PickerStudent[]
  onOpenChat: () => void
  onOpenReport: () => void
}

const selectCls =
  'px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent cursor-pointer max-w-[180px]'

const ControlBar: React.FC<ControlBarProps> = ({
  params,
  terms,
  grades,
  subjects,
  students,
  onOpenChat,
  onOpenReport,
}) => {
  return (
    <div className="sticky top-20 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2.5">
        {/* Term — single term or every term combined */}
        <select
          aria-label="Term"
          value={params.termId ?? ''}
          onChange={(e) =>
            params.setParams({
              termId: e.target.value,
              // Comparison is per-term only; clear it in combined mode.
              ...(e.target.value === 'all' ? { compareTerm: null } : {}),
            })
          }
          className={selectCls}
        >
          {terms.map((t) => (
            <option key={t.termId} value={t.termId}>
              {t.name} {t.academicYear}
            </option>
          ))}
          {terms.length > 1 && <option value="all">All terms (combined)</option>}
        </select>

        {/* Compare term (hidden in combined mode) */}
        {params.termId !== 'all' && (
          <select
            aria-label="Compare with term"
            value={params.compareTerm ?? ''}
            onChange={(e) => params.setParams({ compareTerm: e.target.value || null })}
            className={selectCls}
          >
            <option value="">No comparison</option>
            {terms
              .filter((t) => t.termId !== params.termId)
              .map((t) => (
                <option key={t.termId} value={t.termId}>
                  vs {t.name} {t.academicYear}
                </option>
              ))}
          </select>
        )}

        {params.termId === 'all' ? (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-full">
            combined
          </span>
        ) : params.compareTerm ? (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-teal-50 text-teal-700 border border-teal-100 rounded-full">
            comparing
          </span>
        ) : null}

        {/* Grade filter (drills to grade view) */}
        <select
          aria-label="Grade level"
          value={params.view === 'grade' || params.view === 'school' ? params.grade ?? '' : params.grade ?? ''}
          onChange={(e) =>
            e.target.value
              ? params.drillTo('grade', { grade: e.target.value })
              : params.drillTo('school')
          }
          className={selectCls}
        >
          <option value="">All grades</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>

        {/* Subject filter */}
        <select
          aria-label="Subject"
          value={params.subject ?? ''}
          onChange={(e) => params.setParams({ subject: e.target.value || null })}
          className={selectCls}
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Jump to a student's profile */}
        <StudentPicker
          students={students}
          onSelect={(s) => params.drillTo('student', { studentId: s.studentId, grade: s.grade })}
        />

        <div className="flex-1" />

        {/* Engine segmented toggle */}
        <div className="flex items-center gap-1.5">
          <div className="inline-flex bg-slate-100 rounded-xl p-0.5" role="group" aria-label="Grade engine">
            <button
              onClick={() => params.setParams({ engine: 'null_skip' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[10px] transition-colors ${
                params.engine === 'null_skip'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Skip Ungraded
            </button>
            <button
              onClick={() => params.setParams({ engine: 'null_zero' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[10px] transition-colors ${
                params.engine === 'null_zero'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Count as Zero
            </button>
          </div>
          <EngineTooltip />
        </div>

        {/* AI actions */}
        <button
          onClick={onOpenReport}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <DocumentTextIcon className="w-4 h-4" />
          <span className="hidden sm:inline">AI Report</span>
        </button>
        <button
          onClick={onOpenChat}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl shadow-sm hover:shadow-md hover:from-cyan-600 hover:to-teal-600 transition-all"
        >
          <SparklesIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>
    </div>
  )
}

export default ControlBar
