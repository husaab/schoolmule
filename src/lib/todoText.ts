// src/lib/todoText.ts
// The words of the student's To-do (Student-Todo board): the three tabs and
// their counts, the line under a row's title ("Assignment · photo or file"),
// the "when" on its right, and the empty states. The tab, its groups and the
// order inside them come from the server (todoGroups.js); this only words
// them. Dates are read on the Toronto calendar. Pure, so it is unit-tested
// (todoText.test.ts).

import { dayKeyLabel } from '@/lib/classStream'
import { dayKeyOf, daysFromToday, recentDayLabel, timeText, wasDue, weekday } from '@/lib/classroomText'
import type { TodoTab } from '@/lib/portalRoutes'
import type { TodoCounts, TodoItem } from '@/services/types/studentPortal'

export interface TodoTabEntry {
  id: TodoTab
  label: string
  /** The number beside the label; null for Done and for an empty tab. */
  count: number | null
}

/** "Assigned 4 · Missing 1 · Done". */
export function todoTabs(counts: TodoCounts | null): TodoTabEntry[] {
  const some = (n: number | undefined) => (n && n > 0 ? n : null)
  return [
    { id: 'assigned', label: 'Assigned', count: some(counts?.assigned) },
    { id: 'missing', label: 'Missing', count: some(counts?.missing) },
    { id: 'done', label: 'Done', count: null },
  ]
}

/** The number on the To-do nav item: everything the student still has to do. */
export const todoBadgeCount = (counts: TodoCounts): number => counts.assigned + counts.missing

const MODE_WORDS: Record<string, string> = { file: 'photo or file', text: 'typed answer', done: 'mark as done' }

/** The small line under "when": "Assignment · photo or file", "Quiz · 4 questions". */
export function todoKindLine(item: Pick<TodoItem, 'kind' | 'submissionMode' | 'questionCount'>): string {
  switch (item.kind) {
    case 'assignment': {
      const how = item.submissionMode ? MODE_WORDS[item.submissionMode] : null
      return how ? `Assignment · ${how}` : 'Assignment'
    }
    case 'quiz': {
      const n = item.questionCount ?? 0
      return n > 0 ? `Quiz · ${n} ${n === 1 ? 'question' : 'questions'}` : 'Quiz'
    }
    case 'material':
      return 'Material'
    default:
      return 'Assessment'
  }
}

/** "Science · Ms. Siddiqui" under a row's title. */
export const todoMeta = (item: Pick<TodoItem, 'subject' | 'teacherName'>): string =>
  [item.subject, item.teacherName].filter(Boolean).join(' · ')

export type WhenTone = 'amber' | 'ink' | 'slate' | 'rose' | 'emerald' | 'indigo'

export interface TodoWhen {
  text: string
  tone: WhenTone
}

const cap = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * The "when" on the right of a row.
 *  - Assigned: today and tomorrow read in amber with their time ("Fri 3:30 pm"), later this week in ink, next week
 *    and beyond as a date ("Mon, Oct 19"), no due date as "Anytime" in slate. `group` is the server's label.
 *  - Missing: "Was due Tuesday" in rose.
 *  - Done: "Turned in yesterday · late", "Graded Monday", "Excused".
 */
export function todoWhen(item: TodoItem, tab: TodoTab, group: string, now: Date = new Date()): TodoWhen {
  if (tab === 'missing') {
    const text = wasDue(item, now)
    return { text: text ? cap(text) : 'Missing', tone: 'rose' }
  }
  if (tab === 'done') {
    if (item.status === 'excused') return { text: 'Excused', tone: 'slate' }
    if (item.status === 'graded') {
      return { text: item.publishedAt ? `Graded ${recentDayLabel(item.publishedAt, now)}` : 'Graded', tone: 'indigo' }
    }
    const when = item.turnedInAt ? ` ${recentDayLabel(item.turnedInAt, now)}` : ''
    return { text: `Turned in${when}${item.isLate ? ' · late' : ''}`, tone: 'emerald' }
  }

  const key = dayKeyOf(item)
  if (!item.dueAt || !key) return { text: 'Anytime', tone: 'slate' }
  const days = daysFromToday(key, now)
  const soon = days <= 1
  if (days === 0) return { text: `Today ${timeText(item.dueAt)}`, tone: 'amber' }
  if (group === 'Next week' || group === 'Later') return { text: dayKeyLabel(key), tone: 'ink' }
  return { text: `${weekday(key, 'short')} ${timeText(item.dueAt)}`, tone: soon ? 'amber' : 'ink' }
}

/** What an empty tab says, naming the class when one is chosen. */
export function emptyTodoMessage(tab: TodoTab, className: string | null): string {
  if (tab === 'assigned') return className ? `Nothing is assigned in ${className} right now.` : "You're all caught up. Nothing is assigned right now."
  if (tab === 'missing') return className ? `Nothing is missing in ${className}.` : 'Nothing is missing. Nice work.'
  return className ? `Nothing here yet in ${className}.` : 'Nothing here yet. Work you turn in shows up here.'
}
