// Filtering for the Classes and Gradebook index pages. Every dropdown's options
// come from the classes the viewer actually loaded: a teacher's list is already
// scoped to the classes they teach (lead or co-teacher), so they only ever see
// their own subjects and grades. The Teacher filter is admin-only.

import type { ClassPayload } from '@/services/types/class'
import { getGradeOptions, type GradeOption } from '@/lib/schoolUtils'
import type { SearchableOption } from '@/components/ui/SearchableSelect'

export interface ClassListFilterValues {
  subject: string
  /** Teacher user id; '' = everyone. Ignored for non-admins. */
  teacher: string
  grade: string
  /** 'active' | 'all' | a term name. */
  term: string
}

/** Lead teacher plus co-teachers, as {id, name}. */
export const classTeachers = (c: ClassPayload): { id: string; name: string }[] => {
  const list = c.teacherId ? [{ id: c.teacherId, name: c.teacherName || 'Unnamed teacher' }] : []
  for (const t of c.additionalTeachers ?? []) list.push({ id: t.teacherId, name: t.fullName })
  return list
}

const byLabel = (a: SearchableOption, b: SearchableOption) => a.label.localeCompare(b.label)

export const subjectOptions = (classes: ClassPayload[]): SearchableOption[] =>
  Array.from(new Set(classes.map((c) => c.subject).filter(Boolean)))
    .map((s) => ({ value: s, label: s }))
    .sort(byLabel)

export const teacherOptions = (classes: ClassPayload[]): SearchableOption[] => {
  const byId = new Map<string, string>()
  for (const c of classes) for (const t of classTeachers(c)) if (!byId.has(t.id)) byId.set(t.id, t.name)
  return Array.from(byId, ([value, label]) => ({ value, label })).sort(byLabel)
}

/** Grades that have at least one class, in school order (JK, SK, 1…8). */
export const gradeOptions = (classes: ClassPayload[]): GradeOption[] => {
  const present = new Set(classes.map((c) => String(c.grade)))
  return getGradeOptions().filter((g) => present.has(String(g.value)))
}

/** The value if it is one of the known options, else '' (= all). */
export const knownOrAll = (value: string, known: string[]): string => (value && known.includes(value) ? value : '')

export const filterClasses = (
  classes: ClassPayload[],
  f: ClassListFilterValues,
  { isAdmin, activeTermName }: { isAdmin: boolean; activeTermName?: string },
): ClassPayload[] =>
  classes.filter((c) => {
    if (f.subject && c.subject !== f.subject) return false
    if (isAdmin && f.teacher && !classTeachers(c).some((t) => t.id === f.teacher)) return false
    if (f.grade && String(c.grade) !== f.grade) return false
    if (f.term === 'active') return activeTermName ? c.termName === activeTermName : true
    if (f.term !== 'all') return c.termName === f.term
    return true
  })

/**
 * The classes a picker should offer: the active term's (a class exists once
 * per term, so listing every term repeats each subject). With no active term,
 * every class. `keepClassId` (a deep link to another term's class) stays in.
 */
export const currentTermClasses = (
  classes: ClassPayload[],
  activeTermName: string | undefined,
  keepClassId?: string,
): ClassPayload[] =>
  activeTermName
    ? classes.filter((c) => c.termName === activeTermName || c.classId === keepClassId)
    : classes

/**
 * Picker options labelled "Subject · Gr N". Another term's class gets its
 * term name; two sections that would still read the same get the teacher.
 */
export const classPickerOptions = (classes: ClassPayload[], activeTermName?: string): SearchableOption[] => {
  const base = (c: ClassPayload) =>
    `${c.subject}${c.grade != null ? ` · Gr ${c.grade}` : ''}` +
    (activeTermName && c.termName !== activeTermName && c.termName ? ` · ${c.termName}` : '')
  const counts = new Map<string, number>()
  for (const c of classes) counts.set(base(c), (counts.get(base(c)) ?? 0) + 1)
  return classes
    .map((c) => ({
      value: c.classId,
      label: (counts.get(base(c)) ?? 0) > 1 && c.teacherName ? `${base(c)} · ${c.teacherName}` : base(c),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
}
