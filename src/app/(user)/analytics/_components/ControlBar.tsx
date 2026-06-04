'use client'

// Sticky global filter strip: term + compare-term selectors, grade/subject
// filters, the grade-engine toggle, and the AI chat launcher.

import React from 'react'
import { SparklesIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { TermPayload } from '@/services/types/term'
import { UseAnalyticsParams } from '../_hooks/useAnalyticsParams'
import EngineTooltip from './EngineTooltip'
import StudentPicker, { PickerStudent } from './StudentPicker'
import FilterDropdown from './FilterDropdown'

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
        {/* Term. "All terms (combined)" is the single way to compare terms —
            pick it, then a grade + subject to see the Term 1 vs Term 2 view. */}
        <select
          aria-label="Term"
          value={params.termId ?? ''}
          onChange={(e) => params.setParams({ termId: e.target.value, compareTerm: null })}
          className={selectCls}
        >
          {terms.map((t) => (
            <option key={t.termId} value={t.termId}>
              {t.name} {t.academicYear}
            </option>
          ))}
          {terms.length > 1 && <option value="all">All terms (combined)</option>}
        </select>

        {params.termId === 'all' && (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-full">
            combined
          </span>
        )}

        {/* Grade filter. Stacks with subject: if a subject is active, narrowing
            the grade keeps the subject (stays in the combined subject view). */}
        <select
          aria-label="Grade level"
          value={params.grade ?? ''}
          onChange={(e) => {
            const grade = e.target.value || null
            if (params.subject) params.drillTo('subject', { grade })
            else if (grade) params.drillTo('grade', { grade })
            else params.drillTo('school')
          }}
          className={selectCls}
        >
          <option value="">All grades</option>
          {/* clearing a grade while a subject is active drops to school-wide subject */}
          {grades.map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>

        {/* Subject filter. Stacks with grade: selecting a subject keeps the
            active grade, producing e.g. "Grade 3 — Math". */}
        <FilterDropdown
          ariaLabel="Subject"
          placeholder="All subjects"
          value={params.subject}
          options={subjects.map((s) => ({ value: s, label: s }))}
          onChange={(subject) => {
            if (subject) params.drillTo('subject', { subject })
            // Clearing the subject: keep the grade (if any) but explicitly drop
            // the subject param so the dropdown + breadcrumb don't go stale.
            else if (params.grade) params.drillTo('grade', { grade: params.grade, subject: null })
            else params.drillTo('school')
          }}
        />

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

        {/* Clear filters — far right, always reachable since the bar is sticky.
            Resets to the plain school overview; keeps term + engine. */}
        {(params.view !== 'school' || params.grade || params.subject || params.compareTerm) && (
          <button
            onClick={() =>
              params.setParams({
                view: 'school',
                grade: null,
                subject: null,
                classId: null,
                studentId: null,
                compareTerm: null,
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default ControlBar
