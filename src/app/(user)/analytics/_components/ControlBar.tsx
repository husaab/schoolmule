'use client'

// Sticky global filter strip: term + compare-term selectors, grade/subject
// filters, and the AI chat launcher. (The old grade-engine toggle is gone:
// there is one engine now — graded work only.)

import React from 'react'
import { SparklesIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { TermPayload } from '@/services/types/term'
import { UseAnalyticsParams } from '../_hooks/useAnalyticsParams'
import StudentPicker, { PickerStudent } from './StudentPicker'
import FilterDropdown from './FilterDropdown'
import SearchableSelect from '@/components/ui/SearchableSelect'

interface ControlBarProps {
  params: UseAnalyticsParams
  terms: TermPayload[]
  grades: string[]
  subjects: string[]
  students: PickerStudent[]
  onOpenChat: () => void
  onOpenReport: () => void
}

const triggerCls =
  'px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-cyan-500'

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
        <SearchableSelect
          ariaLabel="Term"
          options={[
            ...terms.map((t) => ({ value: t.termId, label: `${t.name} ${t.academicYear}` })),
            ...(terms.length > 1 ? [{ value: 'all', label: 'All terms (combined)' }] : []),
          ]}
          value={params.termId ?? ''}
          onChange={(v) => params.setParams({ termId: v, compareTerm: null })}
          placeholder="Term"
          className="max-w-[180px]"
          triggerClassName={triggerCls}
        />

        {params.termId === 'all' && (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-full">
            combined
          </span>
        )}

        {/* Grade filter. Stacks with subject: if a subject is active, narrowing
            the grade keeps the subject (stays in the combined subject view). */}
        {/* clearing a grade while a subject is active drops to school-wide subject */}
        <SearchableSelect
          ariaLabel="Grade level"
          options={grades.map((g) => ({ value: g, label: `Grade ${g}` }))}
          value={params.grade ?? ''}
          onChange={(v) => {
            const grade = v || null
            if (params.subject) params.drillTo('subject', { grade })
            else if (grade) params.drillTo('grade', { grade })
            else params.drillTo('school')
          }}
          allLabel="All grades"
          className="max-w-[180px]"
          triggerClassName={triggerCls}
        />

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
            Resets to the plain school overview; keeps term. */}
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
