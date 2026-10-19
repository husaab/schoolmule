// src/lib/classroomText.ts
// The words and groupings of the student portal and the parent's Classes page
// (the Student-Home, Student-Class, Student-Grades and Parent-Classes boards):
// the greeting, the "next" line on a class card, how a due date reads, a
// grade's score and meta line, the note under each class on the Grades page,
// and the parent's per-child wording. Pure, so it is unit-tested
// (classroomText.test.ts); the components only render what these decide.
// Dates are read on the Toronto calendar, the school's. Copy names people,
// never "he" or "she".

import { dayKeyLabel } from '@/lib/classStream'
import { gradeLabel, shortDate, torontoDateKey } from '@/lib/studentAccounts'
import type { ChildClassGrades, ChildGrades, GradeItem, StudentClassNext, StudentAnnouncement, TodoItem } from '@/services/types/studentPortal'
import type { ChildClassroomSummary, NeedsYouMissing } from '@/services/types/parentClassroom'

const TZ = 'America/Toronto'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// ---------------------------------------------------------------------------
// Names

/** "Yusuf" from "Yusuf Rahman". */
export const firstNameOf = (name: string | null | undefined): string => (name ?? '').trim().split(/\s+/)[0] ?? ''

/** "A", "A and B", "A, B and C". */
export const joinNames = (names: string[]): string =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

/** The class header's meta line: "Grade 5 · Ms. Siddiqui and Mr. Haddad", or just the grade. */
export const classPageMeta = (grade: string, teachers: { name: string }[]): string =>
  [gradeLabel(grade), joinNames(teachers.map((t) => t.name))].filter(Boolean).join(' · ')

/** "Grade 5 · 8 classes" (a child who signs in), or "SK · Ms. Jaber" (one who does not). */
export const childSubline = (child: Pick<ChildClassroomSummary, 'grade' | 'classCount' | 'signsIn' | 'homeroomTeacherName'>): string =>
  child.signsIn
    ? `${gradeLabel(child.grade)} · ${plural(child.classCount, 'class', 'classes')}`
    : [gradeLabel(child.grade), child.homeroomTeacherName].filter(Boolean).join(' · ')

/**
 * "Noor doesn't sign in. Ms. Farouk's posts show here and in your weekly summary email."
 * No weekday: the school picks the summary day, and a parent cannot read that setting.
 */
export const notSigningNote = (name: string, homeroomTeacher: string | null): string => {
  const who = firstNameOf(name)
  return homeroomTeacher
    ? `${who} doesn't sign in. ${homeroomTeacher}'s posts show here and in your weekly summary email.`
    : `${who} doesn't sign in. Posts from ${who}'s teachers show here and in your weekly summary email.`
}

/** "See Amal's classes" for a child with several classes or a login, "See Noor's class" for a single homeroom. */
/** "Open Yusuf's 8 classes" (Parent-Phone board), "Open Noor's class". */
export const openChildLabel = (child: Pick<ChildClassroomSummary, 'name' | 'signsIn' | 'classCount'>): string => {
  const first = firstNameOf(child.name)
  if (child.classCount === 1) return `Open ${first}'s class`
  return child.classCount > 1 ? `Open ${first}'s ${child.classCount} classes` : `Open ${first}'s classes`
}

/** The parent's children in the order the Classes page shows them: those who sign in first (their week is there), each group as the server sent it. */
export const childrenForClassesPage = <T extends Pick<ChildClassroomSummary, 'signsIn'>>(kids: T[]): T[] =>
  [...kids].sort((a, b) => Number(b.signsIn) - Number(a.signsIn))

/** The one teacher shared by every class, or null when the classes have different leads (or none). */
export function commonTeacher<T extends { userId: string | null }>(classes: { teacher: T | null }[]): T | null {
  const first = classes[0]?.teacher ?? null
  if (!first) return null
  return classes.every((c) => c.teacher?.userId === first.userId) ? first : null
}

// ---------------------------------------------------------------------------
// Time of day and dates

/** "Good morning" before noon, "Good afternoon" until 6 pm, then "Good evening" (Toronto). */
export function greetingFor(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' })
      .formatToParts(now)
      .find((p) => p.type === 'hour')?.value ?? 12,
  )
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

const dayNumber = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

export const weekday = (key: string, style: 'short' | 'long'): string => {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: style }).format(new Date(Date.UTC(y, m - 1, d)))
}

/** The Toronto calendar day an item falls on: its due time's day, else its gradebook date. */
export const dayKeyOf = (item: { dueAt: string | null; date: string | null }): string | null =>
  item.dueAt ? torontoDateKey(new Date(item.dueAt)) : item.date ?? null

/** Whole days from today (Toronto) to `key`; negative once it has passed. */
export const daysFromToday = (key: string, now: Date = new Date()): number => dayNumber(key) - dayNumber(torontoDateKey(now))

export const timeText = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(iso)).replace(/\s?([AP]M)$/i, (_, ap: string) => ` ${ap.toLowerCase()}`)

/** "Today, 2:10 pm" for today's posts, otherwise "Oct 10". */
export function postedAtLabel(iso: string, now: Date = new Date()): string {
  if (torontoDateKey(new Date(iso)) === torontoDateKey(now)) return `Today, ${timeText(iso)}`
  return shortDate(iso, now)
}

/** "today", "yesterday", a weekday within the past week ("Monday"), otherwise "Oct 9". */
export function recentDayLabel(iso: string, now: Date = new Date()): string {
  const key = torontoDateKey(new Date(iso))
  const days = daysFromToday(key, now)
  if (days === 0) return 'today'
  if (days === -1) return 'yesterday'
  if (days < 0 && days > -7) return weekday(key, 'long')
  return shortDate(iso, now)
}

/** "Oct 9" for a calendar day ('YYYY-MM-DD'). */
const monthDay = (key: string): string => {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(new Date(Date.UTC(y, m - 1, d)))
}

// ---------------------------------------------------------------------------
// Due dates

/** The small word for when something falls: "today", "tomorrow", "Mon" (this week), else "Fri, Oct 23". */
export function dueWhen(item: { dueAt: string | null; date: string | null }, now: Date = new Date()): string {
  const key = dayKeyOf(item)
  if (!key) return ''
  const days = daysFromToday(key, now)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days > 1 && days <= 6) return weekday(key, 'short')
  return dayKeyLabel(key)
}

/** "was due Tuesday" within the past week, "was due yesterday", otherwise "was due Oct 9". */
export function wasDue(item: { dueAt: string | null; date: string | null }, now: Date = new Date()): string {
  const key = dayKeyOf(item)
  if (!key) return ''
  const days = daysFromToday(key, now)
  if (days > 0) return `due ${dueWhen(item, now)}`
  if (days === 0) return 'was due today'
  if (days === -1) return 'was due yesterday'
  if (days >= -6) return `was due ${weekday(key, 'long')}`
  return `was due ${monthDay(key)}`
}

/** "due tomorrow, 3:30 pm" / "due Mon, 3:30 pm" / "due Fri, Oct 23, 3:30 pm". */
export const dueLine = (dueAt: string, now: Date = new Date()): string => `due ${dueWhen({ dueAt, date: null }, now)}, ${timeText(dueAt)}`

export interface CardLines {
  /** "1 missing", shown in rose; null when nothing is missing. */
  missing: string | null
  /** "Plant cell diagram · due tomorrow", or "Nothing due" when there is neither next nor missing work. */
  next: string | null
}

/** The two quiet lines under a class card's title. */
export function cardLines(next: StudentClassNext | null, missingCount: number, now: Date = new Date()): CardLines {
  const missing = missingCount > 0 ? `${missingCount} missing` : null
  if (!next) return { missing, next: missing ? null : 'Nothing due' }
  const key = dayKeyOf(next)
  if (!key) return { missing, next: next.title }
  const when = dueWhen(next, now)
  const phrase = next.dueAt && (when === 'today' || when === 'tomorrow') ? `due ${when}` : when
  return { missing, next: `${next.title} · ${phrase}` }
}

export interface UpcomingLabel {
  text: string
  /** Today or tomorrow: shown in amber. */
  soon: boolean
}

/** The date over an item in "Coming up": "Tomorrow", "Wed, Oct 21", "Fri, Oct 23 · in class". */
export function upcomingLabel(item: Pick<TodoItem, 'dueAt' | 'date' | 'status'>, now: Date = new Date()): UpcomingLabel {
  const key = dayKeyOf(item)
  if (!key) return { text: '', soon: false }
  const days = daysFromToday(key, now)
  const inClass = item.status === 'no_turn_in' ? ' · in class' : ''
  if (days === 0) return { text: `Today${inClass}`, soon: true }
  if (days === 1) return { text: `Tomorrow${inClass}`, soon: true }
  return { text: `${dayKeyLabel(key)}${inClass}`, soon: false }
}

/** Home lists at most this many things due soon, so a full list means "at least". */
export const HOME_DUE_SOON_CAP = 5

/** "3 things due this week" for the end of Home's date line; null when nothing is due. */
export function thingsDueThisWeek(count: number, week: 'this week' | 'next week' = 'this week'): string | null {
  if (count <= 0) return null
  if (count >= HOME_DUE_SOON_CAP) return `${HOME_DUE_SOON_CAP}+ things due ${week}`
  return `${count} ${count === 1 ? 'thing' : 'things'} due ${week}`
}

/**
 * Whether the To-do files this item under this week: Today, Tomorrow or This
 * week. The server's rule (services/classroom/todoGroups.js): Toronto days, a
 * week runs Monday to Sunday, and tomorrow is "Tomorrow" even on a Sunday.
 */
export function isDueThisWeek(item: { dueAt: string | null; date?: string | null }, now: Date = new Date()): boolean {
  if (!item.dueAt) return false
  const key = dayKeyOf({ dueAt: item.dueAt, date: item.date ?? null })
  if (!key) return false
  const ahead = daysFromToday(key, now)
  if (ahead <= 1) return true
  const today = torontoDateKey(now)
  const sinceMonday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
  return ahead + sinceMonday <= 6
}

/**
 * The end of Home's date line (smoke S6): the same week the To-do uses, so
 * Home never says "this week" about work the To-do files under Next week.
 * `dueSoon` is Home's list (due in the next 7 days, at most 5).
 */
export function homeDueLine(dueSoon: { dueAt: string | null; date?: string | null }[], now: Date = new Date()): string | null {
  const thisWeek = dueSoon.filter((i) => isDueThisWeek(i, now)).length
  if (thisWeek > 0) return thingsDueThisWeek(thisWeek)
  return thingsDueThisWeek(dueSoon.length, 'next week')
}

// ---------------------------------------------------------------------------
// Home on a phone (Student-Phone board, smoke S11)

/** "today", "tomorrow", "Wed" (this week or next), else "Oct 30". */
const dayWord = (key: string, now: Date): string => {
  const days = daysFromToday(key, now)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1 && days < 7) return weekday(key, 'short')
  return dayKeyLabel(key)
}

/** What a due item asks for, in a few words: "4 questions", "mark as done", "turn in a photo". */
export function workAsk(item: Pick<TodoItem, 'kind' | 'submissionMode' | 'questionCount'>): string {
  if (item.kind === 'quiz') return item.questionCount ? `${item.questionCount} ${item.questionCount === 1 ? 'question' : 'questions'}` : 'quiz'
  switch (item.submissionMode) {
    case 'file':
      return 'turn in a photo or file'
    case 'text':
      return 'type your answer'
    case 'done':
      return 'mark as done'
    default:
      return 'in class'
  }
}

/** "Mon · mark as done" under a due row on the phone's Home. */
export function phoneDueSubline(item: Pick<TodoItem, 'kind' | 'submissionMode' | 'questionCount' | 'dueAt' | 'date'>, now: Date = new Date()): string {
  const key = dayKeyOf(item)
  return [key ? dayWord(key, now) : null, workAsk(item)].filter(Boolean).join(' · ')
}

/** "Due tomorrow, 3:30 pm" on the phone's "Take a photo & turn in" card. */
export function photoDueLine(item: Pick<TodoItem, 'dueAt' | 'date'>, now: Date = new Date()): string {
  const key = dayKeyOf(item)
  if (!key) return ''
  const word = dayWord(key, now)
  const day = word === 'Today' || word === 'Tomorrow' ? word.toLowerCase() : word
  return item.dueAt ? `Due ${day}, ${timeText(item.dueAt)}` : `Due ${day}`
}

export interface PhoneHomePlan {
  /** Missing work, each a rose banner (at most two). */
  missing: TodoItem[]
  /** Missing work beyond those two ("N more missing"). */
  moreMissing: number
  /** The next thing turned in with a photo: its own card with "Take a photo & turn in". */
  photo: TodoItem | null
  /** The rest of what is due, under the To-do's own week headings. */
  groups: { label: 'This week' | 'Next week'; items: TodoItem[] }[]
}

/** How the phone's Home lays out what is due and missing (Student-Phone board). */
export function phoneHomePlan(missing: TodoItem[], dueSoon: TodoItem[], now: Date = new Date()): PhoneHomePlan {
  const photo = dueSoon.find((i) => i.kind === 'assignment' && i.submissionMode === 'file') ?? null
  const rest = dueSoon.filter((i) => i !== photo)
  const thisWeek = rest.filter((i) => isDueThisWeek(i, now))
  const nextWeek = rest.filter((i) => !isDueThisWeek(i, now))
  const groups: PhoneHomePlan['groups'] = []
  if (thisWeek.length) groups.push({ label: 'This week', items: thisWeek })
  if (nextWeek.length) groups.push({ label: 'Next week', items: nextWeek })
  return { missing: missing.slice(0, 2), moreMissing: Math.max(0, missing.length - 2), photo, groups }
}

export interface DuePill {
  text: string
  tone: 'amber' | 'slate'
}

/** The pill on a "Due soon" row: "Due tomorrow" in amber, otherwise the date. */
export function duePill(item: { dueAt: string | null; date: string | null }, now: Date = new Date()): DuePill {
  const key = dayKeyOf(item)
  if (!key) return { text: '', tone: 'slate' }
  const days = daysFromToday(key, now)
  if (days === 0) return { text: 'Due today', tone: 'amber' }
  if (days === 1) return { text: 'Due tomorrow', tone: 'amber' }
  return { text: dayKeyLabel(key), tone: 'slate' }
}

/** "Missing · English · was due Tuesday" under a missing row on Home. */
export const missingSubline = (item: Pick<TodoItem, 'subject' | 'dueAt' | 'date'>, now: Date = new Date()): string =>
  ['Missing', item.subject, wasDue(item, now)].filter(Boolean).join(' · ')

// ---------------------------------------------------------------------------
// Grades

const KIND_LABELS: Record<GradeItem['kind'], string> = {
  assessment: 'Assessment',
  assignment: 'Assignment',
  quiz: 'Quiz',
  material: 'Material',
}

export const kindLabel = (kind: GradeItem['kind']): string => KIND_LABELS[kind] ?? 'Assessment'

/** 13 → "13", 13.5 → "13.5", 13.456 → "13.46". */
export const formatMark = (n: number): string => String(Math.round(n * 100) / 100)

/** "13/15", "Missing" or "Excused". A grade with no score reads "—". */
export function scoreText(grade: Pick<GradeItem, 'status' | 'score' | 'maxScore'>): string {
  if (grade.status === 'missing') return 'Missing'
  if (grade.status === 'excused') return 'Excused'
  if (grade.score == null) return '—'
  return grade.maxScore == null ? formatMark(grade.score) : `${formatMark(grade.score)}/${formatMark(grade.maxScore)}`
}

const isToday = (iso: string | null, now: Date): boolean => !!iso && torontoDateKey(new Date(iso)) === torontoDateKey(now)

/** "Assignment · graded today", "Quiz · graded Oct 6", "Assignment · missing", "Quiz · excused". */
export function gradeMeta(grade: Pick<GradeItem, 'kind' | 'status' | 'publishedAt'>, now: Date = new Date()): string {
  const kind = kindLabel(grade.kind)
  if (grade.status === 'missing') return `${kind} · missing`
  if (grade.status === 'excused') return `${kind} · excused`
  if (!grade.publishedAt) return kind
  return `${kind} · graded ${isToday(grade.publishedAt, now) ? 'today' : shortDate(grade.publishedAt, now)}`
}

/** True for a grade the teacher published today (it gets the highlight). */
export const isNewToday = (grade: Pick<GradeItem, 'publishedAt'>, now: Date = new Date()): boolean => isToday(grade.publishedAt, now)

/** "84%", or "—" when nothing counts yet. */
export const pctText = (pct: number | null | undefined): string => (pct == null ? '—' : `${Math.round(pct)}%`)

export interface ClassNote {
  text: string
  tone: 'new' | 'missing' | 'plain'
}

/** The note under a class on the Grades page: "New grade today", "1 missing", "5 graded" or "No grades yet". */
export function classNote(cls: Pick<ChildClassGrades, 'latestPublishedAt' | 'missingCount' | 'gradedCount'>, now: Date = new Date()): ClassNote {
  if (isToday(cls.latestPublishedAt, now)) return { text: 'New grade today', tone: 'new' }
  if (cls.missingCount > 0) return { text: `${cls.missingCount} missing`, tone: 'missing' }
  if (cls.gradedCount > 0) return { text: `${cls.gradedCount} graded`, tone: 'plain' }
  return { text: 'No grades yet', tone: 'plain' }
}

/** "Ms. Siddiqui · 4 graded · 1 missing" (the missing count only when there is some). */
export function classDetailLine(cls: Pick<ChildClassGrades, 'teacherName' | 'gradedCount' | 'missingCount'>): string {
  return [cls.teacherName, `${cls.gradedCount} graded`, cls.missingCount > 0 ? `${cls.missingCount} missing` : null]
    .filter(Boolean)
    .join(' · ')
}

/**
 * The link under a grade on the Grades page, or null when it has nowhere to go. A parent passes the child's
 * first name: "See Amal's work and comments" (a student reads "your", and is offered "Turn it in now").
 */
export function gradeLinkLabel(grade: Pick<GradeItem, 'kind' | 'status' | 'itemId'>, childFirstName: string | null = null): string | null {
  if (!grade.itemId) return null
  const whose = childFirstName ? `${childFirstName}'s` : 'your'
  if (grade.kind === 'assignment') {
    if (grade.status === 'graded') return `See ${whose} work and comments`
    if (grade.status === 'missing') return childFirstName ? `See ${whose} work` : 'Turn it in now'
  }
  if (grade.kind === 'quiz' && grade.status === 'graded') return `See ${whose} answers`
  return null
}

/**
 * A class page can open a class from an earlier term, while the grades come for the default term. When
 * the class is not in them, this is the term to ask for instead: the one that carries the class's term name.
 */
export function otherTermFor(
  grades: Pick<ChildGrades, 'termId' | 'terms' | 'classes' | 'usesMarks'>,
  header: { classId: string; termName: string | null },
): string | null {
  if (!grades.usesMarks || grades.classes.some((c) => c.classId === header.classId) || !header.termName) return null
  return grades.terms.find((t) => t.name === header.termName && t.termId !== grades.termId)?.termId ?? null
}

/** The class a Grades page opens on: the one in the URL when it exists, else the first. */
export const pickClass = <T extends { classId: string }>(classes: T[], wanted: string | null | undefined): T | null =>
  classes.find((c) => c.classId === wanted) ?? classes[0] ?? null

/**
 * The class a Grades page opens on (smoke S8): the one named in the URL, else
 * the class with the newest published grade (the board leads with it), else
 * the first.
 */
export function pickGradesClass<T extends { classId: string; latestPublishedAt: string | null }>(
  classes: T[],
  wanted: string | null | undefined,
): T | null {
  const named = classes.find((c) => c.classId === wanted)
  if (named) return named
  let newest: T | null = null
  for (const c of classes) {
    if (!c.latestPublishedAt) continue
    if (!newest || Date.parse(c.latestPublishedAt) > Date.parse(newest.latestPublishedAt as string)) newest = c
  }
  return newest ?? classes[0] ?? null
}

/**
 * "SK doesn't use marks. Ms. Jaber records skills (Beginning, Developing,
 * Independent) and they appear on Maryam's report card." `owner` is "your" for
 * a student and the child's name for a parent.
 */
export function noMarksNote(opts: { grade: string; teacherName: string | null; owner: { you: true } | { name: string } }): string {
  const who = opts.teacherName ?? ('you' in opts.owner ? 'Your teacher' : 'The teacher')
  const card = 'you' in opts.owner ? 'your report card' : `${firstNameOf(opts.owner.name)}'s report card`
  return `${gradeLabel(opts.grade)} doesn't use marks. ${who} records skills (Beginning, Developing, Independent) and they appear on ${card}.`
}

// ---------------------------------------------------------------------------
// The parent's Classes page

export interface StatTile {
  key: 'due' | 'missing' | 'grades'
  value: number
  label: string
}

/** The three tiles on a child's card: due this week, missing, new grades. */
export const statTiles = (child: Pick<ChildClassroomSummary, 'dueThisWeek' | 'missingCount' | 'newGradeCount'>): StatTile[] => [
  { key: 'due', value: child.dueThisWeek, label: 'due this week' },
  { key: 'missing', value: child.missingCount, label: 'missing' },
  { key: 'grades', value: child.newGradeCount, label: child.newGradeCount === 1 ? 'new grade' : 'new grades' },
]

/** "1 missing" beside a class in the lens' class list, or null when nothing is missing. */
export const missingFlag = (missingCount: number): string | null => (missingCount > 0 ? `${missingCount} missing` : null)

/** "English · Ms. Bennett · was due Tuesday" under a "Missing: …" row. */
export const needsYouMissingSubline = (item: NeedsYouMissing, now: Date = new Date()): string =>
  [item.classSubject, item.teacher?.name, wasDue(item, now)].filter(Boolean).join(' · ')

/** "Ms. Jaber · yesterday" over a recent post. */
export const recentPostMeta = (post: Pick<StudentAnnouncement, 'author' | 'publishedAt'>, now: Date = new Date()): string =>
  `${post.author.name} · ${recentDayLabel(post.publishedAt, now)}`

/** The lens banner: "You're seeing Yusuf's classes, the way Yusuf sees them." */
export const lensBannerText = (name: string): { lead: string; name: string; tail: string } => {
  const who = firstNameOf(name)
  return { lead: "You're seeing ", name: `${who}'s`, tail: ` classes, the way ${who} sees them.` }
}
