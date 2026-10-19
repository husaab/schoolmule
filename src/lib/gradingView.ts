// src/lib/gradingView.ts
// The words and rules of the teacher's grading view (the Teacher-Grading
// board): the list filters and counts, each row's score, the header and
// panel lines, the Publish prompts and what a Publish reports back. Pure, so
// it is unit-tested (gradingView.test.ts); the components only render what
// these decide. Dates read on the Toronto calendar, the school's. Copy names
// people, never "he" or "she".

import { dayLabel } from '@/lib/classStream'
import { classTitle } from '@/lib/classesHome'
import type { GradePatch, GradeStatus, GradingCounts, GradingLabel, GradingRow, PublishGradesResult } from '@/services/types/grading'

const TZ = 'America/Toronto'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "Yusuf" from "Yusuf Rahman". */
export const firstName = (name: string | null | undefined): string => (name ?? '').trim().split(/\s+/)[0] ?? ''

/** 8 → "8", 7.5 → "7.5", 8.333 → "8.33". */
export const formatScore = (n: number): string => String(Math.round(Number(n) * 100) / 100)

const timeOfDay = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
    .format(new Date(iso))
    .replace(/\s+/g, ' ')
    .replace(/ ?([AP]M)$/i, (_, ap: string) => ` ${ap.toLowerCase()}`)

// ---------------------------------------------------------------------------
// The list

export type GradingFilter = 'all' | 'to-grade' | 'missing'

export const GRADING_FILTERS: readonly GradingFilter[] = ['all', 'to-grade', 'missing']

export const GRADING_FILTER_LABELS: Record<GradingFilter, string> = {
  all: 'All',
  'to-grade': 'To grade',
  missing: 'Missing',
}

/** The ?filter= value; anything else is All (the default, left out of URLs). */
export const parseGradingFilter = (value: string | null | undefined): GradingFilter =>
  value === 'to-grade' || value === 'missing' ? value : 'all'

export const hasDraft = (row: Pick<GradingRow, 'draftScore' | 'draftStatus'>): boolean =>
  row.draftScore !== null || row.draftStatus !== null

const gradeVisible = (row: GradingRow): boolean => row.publishedScore !== null || row.publishedStatus !== null

/**
 * Waiting for the teacher: turned in, no draft yet and nothing published.
 * Without a gradebook column (`linked` false) published feedback is the grade.
 */
export function isToGrade(row: GradingRow, linked: boolean): boolean {
  if (!row.turnedInAt) return false
  if (!linked) return !row.publishedAt
  return !hasDraft(row) && !gradeVisible(row)
}

export function filterGradingRows(rows: GradingRow[], filter: GradingFilter, linked: boolean): GradingRow[] {
  if (filter === 'to-grade') return rows.filter((r) => isToGrade(r, linked))
  if (filter === 'missing') return rows.filter((r) => r.status === 'missing')
  return rows
}

/** The list's counts, as the server makes them, so a saved draft updates them at once. */
export function gradingCounts(rows: GradingRow[], linked: boolean): GradingCounts {
  return {
    all: rows.length,
    turnedIn: rows.filter((r) => r.turnedInAt).length,
    toGrade: rows.filter((r) => isToGrade(r, linked)).length,
    missing: rows.filter((r) => r.status === 'missing').length,
    drafts: rows.filter((r) => r.needsPublish).length,
    published: rows.filter((r) => r.publishedAt).length,
  }
}

/** The status line's colour per label (the board's). */
export const LABEL_INK: Record<GradingLabel, string> = {
  'Graded · draft': 'text-blue-700',
  'Turned in': 'text-emerald-700',
  'Turned in · late': 'text-amber-800',
  Missing: 'text-rose-700',
  'Not turned in yet': 'text-slate-500',
  Published: 'text-slate-600',
  Excused: 'text-slate-500',
}

export type ScoreTone = 'draft' | 'published' | 'missing' | 'muted' | 'none'

export const SCORE_INK: Record<ScoreTone, string> = {
  draft: 'italic text-slate-500',
  published: 'font-medium text-slate-900',
  missing: 'font-semibold text-rose-700',
  muted: 'text-slate-400',
  none: '',
}

/** The score at the end of a row: a draft grey italic, published solid, missing "0" in rose. */
export function rowScore(row: GradingRow, linked: boolean): { text: string; tone: ScoreTone } {
  if (!linked) return { text: '', tone: 'none' }
  if (row.label === 'Graded · draft') {
    if (row.draftStatus === 'missing') return { text: '0', tone: 'missing' }
    if (row.draftStatus === 'excused') return { text: 'Excused', tone: 'draft' }
    if (row.draftScore !== null) return { text: formatScore(row.draftScore), tone: 'draft' }
    return { text: '—', tone: 'muted' }
  }
  if (row.publishedStatus === 'missing') return { text: '0', tone: 'missing' }
  if (row.publishedStatus === 'excused') return { text: 'Excused', tone: 'muted' }
  if (row.publishedScore !== null) return { text: formatScore(row.publishedScore), tone: 'published' }
  if (row.status === 'missing') return { text: '0', tone: 'missing' }
  if (row.turnedInAt) return { text: '—', tone: 'muted' }
  return { text: '', tone: 'none' }
}

/** The previous and next student of the (filtered) list; an id not in it starts at the top. */
export function neighbours(rows: Pick<GradingRow, 'studentId'>[], studentId: string | null): { prev: string | null; next: string | null } {
  const i = rows.findIndex((r) => r.studentId === studentId)
  if (i === -1) return { prev: null, next: rows[0]?.studentId ?? null }
  return { prev: rows[i - 1]?.studentId ?? null, next: rows[i + 1]?.studentId ?? null }
}

// ---------------------------------------------------------------------------
// The header and the student panel

/** "Grade 5 Science · due Fri, Oct 16, 3:30 pm · out of 10 · Homework". */
export function gradingSubline(input: {
  grade: string
  subject: string
  dueAt: string | null
  maxScore: number | null
  categoryName: string | null
  linked: boolean
}): string {
  const parts = [classTitle(input.grade, input.subject)]
  if (input.dueAt) parts.push(`due ${dayLabel(input.dueAt)}, ${timeOfDay(input.dueAt)}`)
  if (!input.linked) {
    parts.push('feedback only')
    return parts.join(' · ')
  }
  if (input.maxScore !== null) parts.push(`out of ${formatScore(input.maxScore)}`)
  parts.push(input.categoryName ?? 'counts on its own')
  return parts.join(' · ')
}

export type TurnedInTone = 'ok' | 'late' | 'missing' | 'muted'

export const TURNED_IN_INK: Record<TurnedInTone, string> = {
  ok: 'text-emerald-700',
  late: 'text-amber-800',
  missing: 'text-rose-700',
  muted: 'text-slate-500',
}

/** "Turned in Thu, Oct 15 at 6:42 pm · on time" (or "· late"), else what there is instead. */
export function turnedInLine(row: GradingRow): { text: string; tone: TurnedInTone } {
  if (row.turnedInAt) {
    return {
      text: `Turned in ${dayLabel(row.turnedInAt)} at ${timeOfDay(row.turnedInAt)} · ${row.isLate ? 'late' : 'on time'}`,
      tone: row.isLate ? 'late' : 'ok',
    }
  }
  if (row.status === 'missing') return { text: 'Missing · nothing turned in', tone: 'missing' }
  if (row.status === 'graded' || row.status === 'excused') return { text: 'Nothing turned in online', tone: 'muted' }
  return { text: 'Not turned in yet', tone: 'muted' }
}

const DRAFT_HINT = 'Draft, saved automatically. Only you see it until you publish.'
const LIVE_HINT = 'Published. Changes go live as they save.'

/**
 * The line under the grade box, for this student (D3: a draft always reads
 * as a draft). "Published" only once the student's own grade is released.
 * Once the column is published (a first Publish for anyone), the server
 * writes a newly typed score live (D17), while feedback alone stays with the
 * draft: the hint says so for a student whose draft still waits. Without a
 * gradebook column, the feedback itself is what is published.
 */
export function gradeHint(
  row: Pick<GradingRow, 'needsPublish' | 'publishedAt' | 'publishedScore' | 'publishedStatus'>,
  { linked, columnPublished, first }: { linked: boolean; columnPublished: boolean; first: string },
): string {
  if (!linked) return row.publishedAt && !row.needsPublish ? LIVE_HINT : DRAFT_HINT
  if (!columnPublished) return DRAFT_HINT
  if (row.needsPublish) {
    return `Draft: ${first} doesn't see it yet. The column is published, so a new score goes live as it saves; Publish ${first}'s grade to show it as it is.`
  }
  if (row.publishedScore !== null || row.publishedStatus !== null) return LIVE_HINT
  return `The column is published, so a score goes live for ${first} as it saves.`
}

export const publishOneLabel = (first: string, linked: boolean): string =>
  linked ? `Publish ${first}'s grade` : `Publish ${first}'s feedback`

/**
 * Under "Publish {first}'s grade". Only a student who signs in gets the email
 * (smoke S5): `signsIn` from the server says so; without it (an older
 * server) the email is promised only to a student who signs in.
 */
export const publishOneHint = (first: string, linked: boolean, signsIn?: boolean): string => {
  const shows = `Publishing shows the ${linked ? 'grade and feedback' : 'feedback'} to ${first} and parents`
  if (signsIn === true) return `${shows}, and emails ${first}.`
  if (signsIn === false) return `${shows}.`
  return `${shows}. ${first} gets an email if they sign in to SchoolMule.`
}

/** What the panel shows: the saved grade, with an edit not saved yet over it. */
export function editedGrade(
  row: GradingRow,
  edit?: GradePatch | null,
): { score: number | null; status: GradeStatus | null; feedback: string } {
  let score = hasDraft(row) ? row.draftScore : row.publishedScore
  let status: GradeStatus | null = hasDraft(row) ? row.draftStatus : row.publishedStatus
  let feedback = row.feedback ?? ''
  if (edit) {
    if ('draftScore' in edit) {
      score = edit.draftScore ?? null
      if (!('draftStatus' in edit) && score !== null) status = 'graded'
    }
    if ('draftStatus' in edit) {
      status = edit.draftStatus ?? null
      if (status === 'missing') score = null
    }
    if ('feedback' in edit) feedback = edit.feedback ?? ''
  }
  return { score, status, feedback }
}

/** Unsaved edits, one patch per student: a newer key wins. */
export type GradeEdits = Record<string, GradePatch>

/**
 * What of a failed save a newer change leaves waiting for Retry (final review
 * M1): the newer change replaces the fields it names for its students; every
 * other failed field stays failed, and is never re-sent unasked alongside an
 * unrelated student's change. Null when nothing is left.
 */
export function splitGradeEdits(failed: GradeEdits, newer: GradeEdits): GradeEdits | null {
  const out: GradeEdits = {}
  for (const [studentId, patch] of Object.entries(failed)) {
    const replaced = newer[studentId]
    const left: GradePatch = { ...patch }
    if (replaced) for (const field of Object.keys(replaced) as (keyof GradePatch)[]) delete left[field]
    if (Object.keys(left).length > 0) out[studentId] = left
  }
  return Object.keys(out).length > 0 ? out : null
}

export function mergeGradeEdits(older: GradeEdits, newer: GradeEdits): GradeEdits {
  const out: GradeEdits = { ...older }
  for (const [studentId, patch] of Object.entries(newer)) out[studentId] = { ...out[studentId], ...patch }
  return out
}

// ---------------------------------------------------------------------------
// Publish

export const publishAllLabel = (n: number): string => `Publish to ${plural(n, 'student', 'students')}`

/** "Amal, Sami, Rana", or the first six and "3 more". */
const nameList = (names: string[], max = 6): string =>
  names.length <= max ? names.join(', ') : `${names.slice(0, max).join(', ')}, ${names.length - max} more`

/**
 * The confirm before "Publish to N students". Only students who sign in get
 * the email (smoke S5): the rows' `signsIn` says who; without it (an older
 * server) the email is promised only to those who sign in.
 */
export function publishAllPrompt(rows: GradingRow[], linked: boolean): { title: string; body: string } {
  const waiting = rows.filter((r) => r.needsPublish)
  const names = waiting.map((r) => firstName(r.name))
  const what = linked ? 'grade and feedback' : 'feedback'
  const known = waiting.every((r) => typeof r.signsIn === 'boolean')
  const emailed = waiting.filter((r) => r.signsIn === true).length
  const email = (one: boolean): string => {
    if (!known) return one ? `. ${names[0]} gets an email if they sign in to SchoolMule.` : '. Students who sign in also get an email.'
    if (emailed === 0) return '.'
    if (one) return `, and ${names[0]} gets an email.`
    if (emailed === waiting.length) return ', and each student gets an email.'
    return `, and the ${emailed === 1 ? 'one who signs in gets' : `${emailed} who sign in get`} an email.`
  }
  if (names.length === 1) {
    return {
      title: linked ? 'Publish 1 grade?' : 'Publish feedback for 1 student?',
      body: `${names[0]} and parents see the ${what}${email(true)}`,
    }
  }
  return {
    title: linked ? `Publish ${names.length} grades?` : `Publish feedback for ${names.length} students?`,
    body: `${nameList(names)} and parents see their ${what}${email(false)}`,
  }
}

/**
 * Item-form refusals (409) whose way out is the grading view: grades already
 * on students' work, a draft above a lowered "out of", or an unpublished
 * draft held by a student being taken off the item.
 */
export const GRADING_VIEW_CODES: readonly string[] = ['GRADED_WORK_EXISTS', 'DRAFT_ABOVE_MAX', 'UNPUBLISHED_DRAFTS_OUTSIDE']

/** The 409 when a column also holds grades for students outside the item's audience. */
export const OUTSIDE_AUDIENCE_CODE = 'OUTSIDE_AUDIENCE_GRADES'

/** "assignment", "quiz": how the copy names the item. */
export const kindWord = (kind: string): string => (kind === 'quiz' ? 'quiz' : 'assignment')

/**
 * Whether Alt+↑/↓ may switch students from where the key was pressed. A
 * multi-line box (the feedback) keeps it: on macOS Option+↑/↓ moves the caret by
 * paragraph there, and a teacher writing several paragraphs would lose that.
 * The one-line grade box and everywhere else in the view pass it through.
 */
export function studentShortcutFree(target: { tagName?: string; isContentEditable?: boolean } | null): boolean {
  if (!target) return true
  if (target.isContentEditable) return false
  return target.tagName?.toUpperCase() !== 'TEXTAREA'
}

export const outsideAudienceMessage = (kind: string): string =>
  `Publish this column in Grades first — it has grades for students this ${kindWord(kind)} isn't assigned to.`

/**
 * What a Publish (one student, or every draft) did, for the toast. An item
 * with no gradebook column (`linked` false) publishes feedback, not grades.
 * `kind` ('quiz' or anything else for an assignment) words the not-assigned toast.
 */
export function publishOutcome(
  result: PublishGradesResult,
  nameOf: (studentId: string) => string,
  linked = true,
  kind = 'assignment',
): { tone: 'success' | 'info'; message: string } {
  const published = result.publishedStudentIds
  const failedEmails = result.emailSummary?.failed ?? 0
  const emailNote = failedEmails > 0 ? ` ${plural(failedEmails, "email didn't send", "emails didn't send")}.` : ''
  const noun = linked ? 'grade' : 'feedback'
  if (published.length === 1) return { tone: 'success', message: `Published ${nameOf(published[0])}'s ${noun}.${emailNote}` }
  if (published.length > 1) {
    const what = linked ? `${published.length} grades` : `feedback for ${published.length} students`
    return { tone: 'success', message: `Published ${what}.${emailNote}` }
  }
  const reasons = new Set(result.skipped.map((s) => s.reason))
  if (reasons.size === 1 && reasons.has('unchanged')) {
    const only = result.skipped.length === 1 ? `${nameOf(result.skipped[0].studentId)}'s ${noun} is` : linked ? 'These grades are' : 'This feedback is'
    return { tone: 'info', message: `${only} already published, and nothing changed since.` }
  }
  if (reasons.has('not_in_audience') && reasons.size === 1) {
    return { tone: 'info', message: `This ${kindWord(kind)} isn't for that student.` }
  }
  return { tone: 'info', message: 'Nothing to publish yet. Grade the work first.' }
}
