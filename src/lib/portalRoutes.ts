// src/lib/portalRoutes.ts
// Where things live in the student portal and the parent's Classes page, and
// the tabs of the two class pages. Build every link with these so a default
// tab or an empty param never leaks into a URL. (The staff class page has its
// own, in classroomRoutes.ts.)

import type { ClassTab } from '@/lib/classroomRoutes'

export type StudentClassTab = Extract<ClassTab, 'stream' | 'classwork' | 'grades' | 'people'>
export type ParentClassTab = Extract<ClassTab, 'stream' | 'classwork' | 'grades'>

/** The student's class page tabs, in order. */
export const STUDENT_CLASS_TABS: { id: StudentClassTab; label: string }[] = [
  { id: 'stream', label: 'Stream' },
  { id: 'classwork', label: 'Classwork' },
  { id: 'grades', label: 'My grades' },
  { id: 'people', label: 'People' },
]

/** The parent lens' tabs, in order. */
export const PARENT_CLASS_TABS: { id: ParentClassTab; label: string }[] = [
  { id: 'stream', label: 'Stream' },
  { id: 'classwork', label: 'Classwork' },
  { id: 'grades', label: 'Grades' },
]

const parseTab = <T extends string>(tabs: { id: T }[], value: string | null | undefined): T =>
  tabs.find((t) => t.id === value)?.id ?? tabs[0].id

/** The tab a ?tab= value names; anything else is the Stream. */
export const parseStudentClassTab = (value: string | null | undefined): StudentClassTab => parseTab(STUDENT_CLASS_TABS, value)
export const parseParentClassTab = (value: string | null | undefined): ParentClassTab => parseTab(PARENT_CLASS_TABS, value)

type Params = Record<string, string | null | undefined>

const withQuery = (path: string, params: Params): string => {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value != null && value !== '') query.set(key, value)
  const qs = query.toString()
  return qs ? `${path}?${qs}` : path
}

/** `/student/classes/{id}`, with `?tab=` for every tab but the Stream. */
export const studentClassHref = (classId: string, tab: StudentClassTab = 'stream', params: Params = {}): string =>
  withQuery(`/student/classes/${encodeURIComponent(classId)}`, { tab: tab === 'stream' ? null : tab, ...params })

/** `/student/grades` for a class and/or term. */
export const studentGradesHref = (opts: { classId?: string | null; termId?: string | null } = {}): string =>
  withQuery('/student/grades', { class: opts.classId, term: opts.termId })

/** `/parent/classes`, optionally on one class and tab (the lens). The Stream is the default tab. */
export const parentClassesHref = (opts: { classId?: string | null; tab?: ParentClassTab | null } = {}): string =>
  withQuery('/parent/classes', { class: opts.classId, tab: opts.tab && opts.tab !== 'stream' ? opts.tab : null })

/** The To-do's tabs, in order. Assigned is the bare URL. */
export type TodoTab = 'assigned' | 'missing' | 'done'
export const TODO_TABS: TodoTab[] = ['assigned', 'missing', 'done']

/** The tab a ?tab= value names; anything else is Assigned. */
export const parseTodoTab = (value: string | null | undefined): TodoTab => TODO_TABS.find((t) => t === value) ?? 'assigned'

/** `/student/todo`, with `?tab=` for Missing and Done and `?class=` for one class. */
export const studentTodoHref = (opts: { tab?: TodoTab | null; classId?: string | null } = {}): string =>
  withQuery('/student/todo', { tab: opts.tab && opts.tab !== 'assigned' ? opts.tab : null, class: opts.classId })

/**
 * A classwork item for the student. `from: 'todo'` makes the page's back arrow
 * return to the To-do (with its filters) instead of the class.
 */
export const studentItemHref = (itemId: string, opts: { from?: 'todo' | null } = {}): string =>
  withQuery(`/student/items/${encodeURIComponent(itemId)}`, { from: opts.from })

/** Taking a quiz: one question per screen (the item page's Start quiz / Continue). */
export const studentQuizHref = (itemId: string): string => `/student/items/${encodeURIComponent(itemId)}/quiz`

/** A classwork item in the parent's lens. */
export const parentItemHref = (studentId: string, itemId: string): string =>
  `/parent/classes/${encodeURIComponent(studentId)}/items/${encodeURIComponent(itemId)}`

/** The student's Messages page, ready to write to one teacher about one class. */
export const studentMessageHref = (opts: { teacherId: string; classId: string }): string =>
  withQuery('/student/messages', { compose: '1', teacher: opts.teacherId, class: opts.classId })
