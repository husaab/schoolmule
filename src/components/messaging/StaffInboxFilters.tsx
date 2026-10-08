'use client'

import React, { useMemo } from 'react'
import type { ClassPayload } from '@/services/types/class'
import type { ConversationItem } from '@/services/types/messaging'

export type StaffFilterMode = 'all' | 'class' | 'student' | 'parent' | 'assessment'

export interface StaffInboxFilter {
  mode: StaffFilterMode
  /** Class mode: narrows the class list; '' = every term. */
  termName: string
  classId: string
  studentId: string
  guardian: string
  assessmentId: string
}

export const EMPTY_STAFF_FILTER: StaffInboxFilter = {
  mode: 'all',
  termName: '',
  classId: '',
  studentId: '',
  guardian: '',
  assessmentId: '',
}

/** The predicate the inbox applies on top of the server's class filter. */
export const staffFilterPredicate = (f: StaffInboxFilter) => (item: ConversationItem) => {
  switch (f.mode) {
    case 'student':
      return !f.studentId || item.studentId === f.studentId
    case 'parent':
      return !f.guardian || item.guardianNames.includes(f.guardian)
    case 'assessment':
      return !f.assessmentId || item.assessmentId === f.assessmentId
    default:
      return true
  }
}

const MODES: { value: StaffFilterMode; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'class', label: 'By class' },
  { value: 'student', label: 'By student' },
  { value: 'parent', label: 'By parent' },
  { value: 'assessment', label: 'By assessment' },
]

const selectClass =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 cursor-pointer disabled:opacity-50'

interface StaffInboxFiltersProps {
  value: StaffInboxFilter
  onChange: (next: StaffInboxFilter) => void
  /** The caller's classes (every term), from the classes service. */
  classes: ClassPayload[]
  /** Loaded conversations, used to offer the students, parents and assessments that actually have threads. */
  items: ConversationItem[]
}

/**
 * Staff inbox filter bar. A class exists once per term, so "Arabic · Gr 1"
 * would otherwise appear once for every term; the Term picker collapses that,
 * and with every term shown the label carries the term name instead.
 */
const StaffInboxFilters: React.FC<StaffInboxFiltersProps> = ({ value, onChange, classes, items }) => {
  const terms = useMemo(
    () => [...new Set(classes.map((c) => c.termName).filter(Boolean))].sort(),
    [classes],
  )
  const classOptions = useMemo(
    () =>
      classes
        .filter((c) => !value.termName || c.termName === value.termName)
        .slice()
        .sort((a, b) => `${a.subject}${a.grade}`.localeCompare(`${b.subject}${b.grade}`)),
    [classes, value.termName],
  )
  const students = useMemo(() => {
    const m = new Map<string, string>()
    for (const i of items) m.set(i.studentId, i.studentName)
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [items])
  const guardians = useMemo(
    () => [...new Set(items.flatMap((i) => i.guardianNames))].sort((a, b) => a.localeCompare(b)),
    [items],
  )
  const assessments = useMemo(() => {
    const m = new Map<string, string>()
    for (const i of items) if (i.assessmentId) m.set(i.assessmentId, `${i.title} · ${i.classSubject}`)
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [items])

  const set = (patch: Partial<StaffInboxFilter>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="sr-only">Filter by</span>
        <select
          value={value.mode}
          onChange={(e) => onChange({ ...EMPTY_STAFF_FILTER, mode: e.target.value as StaffFilterMode })}
          className={selectClass}
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      {value.mode === 'class' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="sr-only">Term</span>
            <select value={value.termName} onChange={(e) => set({ termName: e.target.value, classId: '' })} className={selectClass}>
              <option value="">All terms</option>
              {terms.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Class</span>
            <select value={value.classId} onChange={(e) => set({ classId: e.target.value })} className={selectClass}>
              <option value="">All classes</option>
              {classOptions.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.subject} · Gr {c.grade}
                  {!value.termName && c.termName ? ` · ${c.termName}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {value.mode === 'student' && (
        <label className="block">
          <span className="sr-only">Student</span>
          <select value={value.studentId} onChange={(e) => set({ studentId: e.target.value })} className={selectClass} disabled={students.length === 0}>
            <option value="">All students</option>
            {students.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}

      {value.mode === 'parent' && (
        <label className="block">
          <span className="sr-only">Parent</span>
          <select value={value.guardian} onChange={(e) => set({ guardian: e.target.value })} className={selectClass} disabled={guardians.length === 0}>
            <option value="">All parents</option>
            {guardians.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      )}

      {value.mode === 'assessment' && (
        <label className="block">
          <span className="sr-only">Assessment</span>
          <select value={value.assessmentId} onChange={(e) => set({ assessmentId: e.target.value })} className={selectClass} disabled={assessments.length === 0}>
            <option value="">All assessments</option>
            {assessments.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}

export default StaffInboxFilters
