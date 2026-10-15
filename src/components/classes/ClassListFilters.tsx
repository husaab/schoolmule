'use client'

// Shared filter bar for the Classes and Gradebook index pages.
// Order: Subject, Teacher (admins only), Grade, Term.

import React from 'react'
import SearchableSelect, { type SearchableOption } from '@/components/ui/SearchableSelect'
import type { TermPayload } from '@/services/types/term'
import type { GradeOption } from '@/lib/schoolUtils'
import { getGradeDisplayName } from '@/lib/schoolUtils'
import type { ClassListFilterValues } from '@/lib/classListFilters'
import type { FilterPatch } from '@/hooks/useFilterParams'

interface ClassListFiltersProps {
  values: ClassListFilterValues
  setParams: (patch: FilterPatch) => void
  subjects: SearchableOption[]
  teachers: SearchableOption[]
  grades: GradeOption[]
  terms: TermPayload[]
  activeTerm?: TermPayload
  showTeacher: boolean
}

const labelClass = 'block text-sm font-medium text-slate-700 mb-2'
const selectClass =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 cursor-pointer'

const ClassListFilters: React.FC<ClassListFiltersProps> = ({
  values,
  setParams,
  subjects,
  teachers,
  grades,
  terms,
  activeTerm,
  showTeacher,
}) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${showTeacher ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
    <div>
      <label className={labelClass}>Filter by Subject</label>
      <SearchableSelect
        options={subjects}
        value={values.subject}
        onChange={(v) => setParams({ subject: v })}
        allLabel="All Subjects"
        searchPlaceholder="Find a subject"
      />
    </div>
    {showTeacher && (
      <div>
        <label className={labelClass}>Filter by Teacher</label>
        <SearchableSelect
          options={teachers}
          value={values.teacher}
          onChange={(v) => setParams({ teacher: v })}
          allLabel="All Teachers"
          searchPlaceholder="Find a teacher"
        />
      </div>
    )}
    <div>
      <label className={labelClass}>Filter by Grade</label>
      <select value={values.grade} onChange={(e) => setParams({ grade: e.target.value })} className={selectClass}>
        <option value="">All Grades</option>
        {grades.map((g) => (
          <option key={g.value} value={String(g.value)}>
            {getGradeDisplayName(g.value)}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className={labelClass}>Filter by Term</label>
      <select
        value={values.term}
        onChange={(e) => setParams({ term: e.target.value === 'active' ? null : e.target.value })}
        className={selectClass}
      >
        <option value="active">Active Term ({activeTerm?.name})</option>
        <option value="all">All Terms</option>
        {terms.map((term) => (
          <option key={term.termId} value={term.name}>
            {term.name}
          </option>
        ))}
      </select>
    </div>
  </div>
)

export default ClassListFilters
