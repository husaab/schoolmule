// src/lib/workStatusLabels.ts
// What a piece of work is called and what color it wears wherever a student or
// a parent sees it: the To-do rows, the Classwork list, the assignment page's
// "Your work" card and the parent's lens. The status itself comes from the
// server (workStatus, one rule for everyone); this only words it. The one
// client-only state is "Ready to turn in": assigned work that has something
// added. Pure, so it is unit-tested (workStatusLabels.test.ts).

import { formatMark } from '@/lib/classroomText'
import type { WorkStatus } from '@/services/types/studentPortal'

/** The server's statuses plus the one the page works out for itself. */
export type DisplayStatus = WorkStatus | 'ready'

export interface WorkStatusLabel {
  /** The pill's words. Empty for work with nothing to turn in: no pill is shown. */
  label: string
  /** Tailwind classes of the pill. */
  pill: string
  /** " · late" or " · 8/10", written after the label. */
  suffix: string | null
  suffixClass: string | null
}

const LABELS: Record<DisplayStatus, { label: string; pill: string }> = {
  assigned: { label: 'Assigned', pill: 'bg-slate-100 text-slate-600' },
  ready: { label: 'Ready to turn in', pill: 'bg-indigo-50 text-indigo-800' },
  turned_in: { label: 'Turned in', pill: 'bg-emerald-100 text-emerald-700' },
  graded: { label: 'Graded', pill: 'bg-indigo-100 text-indigo-800' },
  missing: { label: 'Missing', pill: 'bg-rose-100 text-rose-700' },
  excused: { label: 'Excused', pill: 'bg-stone-100 text-stone-600' },
  material: { label: 'To read', pill: 'bg-stone-100 text-stone-600' },
  no_turn_in: { label: '', pill: '' },
}

/**
 * The pill for a status. `late` only matters for work that is turned in; a
 * `score` ("8/10") is only written after Graded.
 */
export function workStatusLabel(status: DisplayStatus, late = false, score: string | null = null): WorkStatusLabel {
  const base = LABELS[status]
  if (status === 'turned_in' && late) return { ...base, suffix: ' · late', suffixClass: 'text-amber-800' }
  if (status === 'graded' && score) return { ...base, suffix: ` · ${score}`, suffixClass: '' }
  return { ...base, suffix: null, suffixClass: null }
}

/** "Ready to turn in" for assigned work with something added; every other status as the server says. */
export const displayStatus = (status: WorkStatus, hasWork: boolean): DisplayStatus =>
  status === 'assigned' && hasWork ? 'ready' : status

/** "8/10" for a published score; null for feedback only, Missing and Excused. */
export function rowScoreText(
  grade: { status: 'graded' | 'missing' | 'excused'; score: number | null; maxScore: number | null } | null,
): string | null {
  if (!grade || grade.status !== 'graded' || grade.score == null) return null
  return grade.maxScore == null ? formatMark(grade.score) : `${formatMark(grade.score)}/${formatMark(grade.maxScore)}`
}
