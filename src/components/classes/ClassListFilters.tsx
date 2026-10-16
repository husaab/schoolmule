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
  /** False when the page has its own term picker (the Classes home header). */
  showTerm?: boolean
}

const labelClass = 'block text-sm font-medium text-slate-700 mb-2'

const ClassListFilters: React.FC<ClassListFiltersProps> = ({
  values,
  setParams,
  subjects,
  teachers,
  grades,
  terms,
  activeTerm,
  showTeacher,
  showTerm = true,
}) => (
  <div
    className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
      showTeacher && showTerm ? 'lg:grid-cols-4' : showTeacher || showTerm ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
    }`}
  >
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
      <SearchableSelect
        options={grades.map((g) => ({ value: String(g.value), label: getGradeDisplayName(g.value) }))}
        value={values.grade}
        onChange={(v) => setParams({ grade: v })}
        allLabel="All Grades"
        ariaLabel="Filter by Grade"
        searchPlaceholder="Find a grade"
      />
    </div>
    {showTerm && (
      <div>
        <label className={labelClass}>Filter by Term</label>
        <SearchableSelect
          options={[
            { value: 'active', label: `Active Term (${activeTerm?.name ?? ''})` },
            { value: 'all', label: 'All Terms' },
            ...terms.map((term) => ({ value: term.name, label: term.name })),
          ]}
          value={values.term}
          onChange={(v) => setParams({ term: v === 'active' ? null : v })}
          ariaLabel="Filter by Term"
          searchPlaceholder="Find a term"
        />
      </div>
    )}
  </div>
)

export default ClassListFilters
