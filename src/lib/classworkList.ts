// src/lib/classworkList.ts
// A class's Classwork as a student or parent reads it (the Classwork tab of
// the student's class page and of the parent's lens): work grouped by topic,
// a status pill on each row, and the line under its title. The list, the
// status and the order come from the server (selectStudentWork); this only
// groups and words them. Dates are read on the Toronto calendar. Pure, so it
// is unit-tested (classworkList.test.ts).

import { dayKeyLabel } from '@/lib/classStream'
import { dayKeyOf, daysFromToday, recentDayLabel, timeText, wasDue } from '@/lib/classroomText'
import { displayStatus, rowScoreText, workStatusLabel, type WorkStatusLabel } from '@/lib/workStatusLabels'
import type { ClassworkTopic, StudentItemSummary } from '@/services/types/studentPortal'

export interface ClassworkSection {
  /** The topic's name; null for work with no topic (shown first, with no heading). */
  title: string | null
  topicId: string | null
  items: StudentItemSummary[]
}

/**
 * Work with no topic first, then each topic that holds something, in the
 * teacher's order. Inside a section the server's order is kept. Work filed
 * under a topic the reader cannot see is listed with the work that has none.
 */
export function classworkSections(topics: ClassworkTopic[], items: StudentItemSummary[]): ClassworkSection[] {
  const ordered = [...topics].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  const known = new Set(ordered.map((t) => t.topicId))
  const loose = items.filter((i) => !i.topicId || !known.has(i.topicId))
  const sections: ClassworkSection[] = []
  if (loose.length > 0) sections.push({ title: null, topicId: null, items: loose })
  for (const t of ordered) {
    const mine = items.filter((i) => i.topicId === t.topicId)
    if (mine.length > 0) sections.push({ title: t.name, topicId: t.topicId, items: mine })
  }
  return sections
}

/** The pill on a row: "Assigned", "Turned in · late", "Graded · 8/10", "To read". Empty label: no pill. */
export function classworkPill(item: Pick<StudentItemSummary, 'status' | 'isLate' | 'grade'>): WorkStatusLabel {
  const score = item.grade ? rowScoreText({ status: 'graded', score: item.grade.score, maxScore: item.grade.maxScore }) : null
  return workStatusLabel(displayStatus(item.status, false), item.isLate, score)
}

const cap = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

/** Due text on an open row: today and tomorrow with their time, later as a date. */
function openDue(item: Pick<StudentItemSummary, 'dueAt' | 'date'>, now: Date): string {
  const key = dayKeyOf(item)
  if (!item.dueAt || !key) return 'No due date'
  const days = daysFromToday(key, now)
  // Past due and still "assigned": a child who cannot sign in (nothing is derived Missing for them).
  if (days < 0) return cap(wasDue(item, now))
  if (days === 0) return `Due today, ${timeText(item.dueAt)}`
  if (days === 1) return `Due tomorrow, ${timeText(item.dueAt)}`
  return `Due ${dayKeyLabel(key)}`
}

/** The line under a row's title: "Due tomorrow, 3:30 pm", "Was due Oct 9", "Turned in Thu · graded today", "Material". */
export function classworkMeta(item: StudentItemSummary, now: Date = new Date()): string {
  switch (item.status) {
    case 'missing':
      return item.dueAt || item.date ? cap(wasDue(item, now)) : 'Marked missing'
    case 'turned_in':
      return `Turned in${item.turnedInAt ? ` ${recentDayLabel(item.turnedInAt, now)}` : ''}${item.isLate ? ' · late' : ''}`
    case 'graded': {
      const graded = item.publishedAt ? `graded ${recentDayLabel(item.publishedAt, now)}` : 'graded'
      return item.turnedInAt ? `Turned in ${recentDayLabel(item.turnedInAt, now)} · ${graded}` : cap(graded)
    }
    case 'excused':
      return 'Excused'
    case 'material':
      return 'Material'
    case 'no_turn_in': {
      const key = dayKeyOf(item)
      if (key) return `${dayKeyLabel(key)} · in class`
      return item.kind === 'assignment' ? 'Done in class' : 'In class'
    }
    default:
      return openDue(item, now)
  }
}
