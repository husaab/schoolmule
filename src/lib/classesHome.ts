// src/lib/classesHome.ts
// The words and groupings of the Classes home (the Teacher-Home board): card
// meta and "what's next" lines, the review pill, the Coming up and Drafts
// rails, and the bridge from a class card to the class payload that the
// existing filters and Duplicate/Delete modals work on. Dates are read on the
// Toronto calendar, the school's.

import type { ClassPayload } from '@/services/types/class'
import type {
  ClassCard,
  ClassCardNext,
  ComingUpRow,
  DraftOrScheduledRow,
  ToReviewRow,
} from '@/services/types/classroom'
import type { GradeValue } from '@/lib/schoolUtils'
import { getGradeDisplayName } from '@/lib/schoolUtils'
import { filterClasses, type ClassListFilterValues } from '@/lib/classListFilters'
import { torontoDateKey } from '@/lib/studentAccounts'

const TZ = 'America/Toronto'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "Grade 5", or "JK" / "SK". */
export const gradeShort = (grade: string | number): string => {
  const g = String(grade)
  return g === 'JK' || g === 'SK' ? g : `Grade ${g}`
}

/** "Grade 5 Science"; a JK or SK class reads "JK Science", or just its name when that already says kindergarten. */
export const classTitle = (grade: string | number, subject: string): string => {
  const g = String(grade)
  const name = (subject ?? '').trim()
  if (g === 'JK' || g === 'SK') return /kindergarten|^[js]k\b/i.test(name) ? name : `${g} ${name}`.trim()
  return `Grade ${g} ${name}`.trim()
}

/** "Amal Haddad, with Sami Haddad, Rana Kareem": the lead teacher, then co-teachers. */
export const teacherLine = (teachers: { name: string; role: 'lead' | 'co' }[], fallbackLead?: string | null): string => {
  const lead = teachers.find((t) => t.role === 'lead')?.name || fallbackLead || ''
  const co = teachers.filter((t) => t.role === 'co').map((t) => t.name)
  if (lead && co.length) return `${lead}, with ${co.join(', ')}`
  return lead || co.join(', ')
}

/** The class header's meta line: "Grade 5 · Term 1 · Amal Haddad, with Sami Haddad". */
export const headerMeta = (
  card: { grade: string | number; termName: string | null; teacherName?: string | null },
  teachers: { name: string; role: 'lead' | 'co' }[],
): string => [gradeShort(card.grade), card.termName, teacherLine(teachers, card.teacherName)].filter(Boolean).join(' · ')

/** "Grade 5 · 22 students" */
export const cardMeta = (card: Pick<ClassCard, 'grade' | 'studentCount'>): string =>
  `${gradeShort(card.grade)} · ${plural(card.studentCount, 'student', 'students')}`

/** "Term 1 · 4 classes · 87 students" (students summed across the classes shown). */
export const homeSummary = (term: string, cards: Pick<ClassCard, 'studentCount'>[]): string => {
  const students = cards.reduce((sum, c) => sum + (c.studentCount || 0), 0)
  return [term, plural(cards.length, 'class', 'classes'), plural(students, 'student', 'students')]
    .filter(Boolean)
    .join(' · ')
}

/** The header's name for the `term` filter ('active' | 'all' | a term name). */
export const termLabel = (term: string, activeTermName: string | undefined): string => {
  if (term === 'active') return activeTermName || 'Active term'
  if (term === 'all') return 'All terms'
  return term
}

// ---------------------------------------------------------------------------
// Dates

const dayNumber = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

const utcDate = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

const weekdayShort = (key: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(utcDate(key))

/** { dow: 'Fri', day: '16' } for a 'YYYY-MM-DD' date (the Coming up tile). */
export const dateTile = (key: string): { dow: string; day: string } => ({
  dow: weekdayShort(key),
  day: String(Number(key.slice(8, 10))),
})

// ---------------------------------------------------------------------------
// Cards

export interface NextLine {
  /** The muted lead-in: "Due Fri", "Test Wed", "Nothing due". */
  when: string
  what: string
}

const NOTHING_DUE: NextLine = { when: 'Nothing due', what: 'this week' }

/**
 * The card's "what's next" line. Only the coming week counts (today through
 * six days on); an in-class assessment reads as a test, anything with a due
 * date as due.
 */
export function cardNextLine(next: ClassCardNext | null, now: Date = new Date()): NextLine {
  if (!next) return NOTHING_DUE
  const key = next.dueAt ? torontoDateKey(new Date(next.dueAt)) : next.date
  if (!key) return NOTHING_DUE
  const days = dayNumber(key) - dayNumber(torontoDateKey(now))
  if (days < 0 || days > 6) return NOTHING_DUE
  const verb = next.kind === 'assessment' ? 'Test' : 'Due'
  return { when: `${verb} ${days === 0 ? 'today' : weekdayShort(key)}`, what: next.title }
}

export interface ReviewPill {
  label: string
  tone: 'review' | 'calm'
}

export const reviewPill = (toReviewCount: number): ReviewPill =>
  toReviewCount > 0 ? { label: `${toReviewCount} to review`, tone: 'review' } : { label: 'All caught up', tone: 'calm' }

// ---------------------------------------------------------------------------
// Rails

export const toReviewTotal = (rows: Pick<ToReviewRow, 'turnedInCount'>[]): number =>
  rows.reduce((sum, r) => sum + (r.turnedInCount || 0), 0)

export const comingUpTitle = (row: Pick<ComingUpRow, 'title' | 'inClass'>): string =>
  row.inClass ? `${row.title} (in class)` : row.title

/** "Grade 5 Science · 10 of 22 still to turn in" (the count only for turn-in work). */
export const comingUpClassLine = (row: Pick<ComingUpRow, 'classLabel' | 'stillToTurnIn'>, classSize?: number): string => {
  if (row.stillToTurnIn == null) return row.classLabel
  const of = classSize != null ? ` of ${classSize}` : ''
  return `${row.classLabel} · ${row.stillToTurnIn}${of} still to turn in`
}

/** "Draft", or when a scheduled post goes out: "Mon 7:30 am" this week, "Nov 2, 1:05 pm" later. */
export function draftWhen(row: Pick<DraftOrScheduledRow, 'status' | 'publishAt'>, now: Date = new Date()): string {
  if (row.status !== 'scheduled' || !row.publishAt) return 'Draft'
  const at = new Date(row.publishAt)
  const time = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
    .format(at)
    .replace(/ |\s/g, ' ')
    .toLowerCase()
  const days = dayNumber(torontoDateKey(at)) - dayNumber(torontoDateKey(now))
  if (days >= 0 && days <= 6) {
    return `${new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(at)} ${time}`
  }
  return `${new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short', day: 'numeric' }).format(at)}, ${time}`
}

// ---------------------------------------------------------------------------
// Filters, modals and grouping

/**
 * A card as the class payload the existing Classes filters and the Duplicate
 * and Delete modals read. Fields a card does not carry are left empty.
 */
export const cardAsClassPayload = (card: ClassCard, school: string): ClassPayload => ({
  classId: card.classId,
  school,
  // The legacy API sends the GRADE enum as text too ('5', 'JK').
  grade: card.grade as unknown as GradeValue,
  subject: card.subject,
  teacherName: card.teacherName ?? '',
  teacherId: card.teacherId ?? '',
  termId: card.termId ?? '',
  termName: card.termName ?? '',
  createdAt: '',
  lastModifiedAt: '',
  additionalTeachers: card.teachers
    .filter((t) => t.role === 'co')
    .map((t) => ({ teacherId: t.userId, fullName: t.name, email: '', addedAt: '' })),
})

/** filterClasses over cards; the server's order (JK, SK, then Grades 1 to 8) is kept. */
export function filterCards(
  cards: ClassCard[],
  values: ClassListFilterValues,
  opts: { isAdmin: boolean; activeTermName?: string },
): ClassCard[] {
  const kept = new Set(filterClasses(cards.map((c) => cardAsClassPayload(c, '')), values, opts).map((c) => c.classId))
  return cards.filter((c) => kept.has(c.classId))
}

export interface GradeGroup<T> {
  grade: string
  /** "Junior Kindergarten", "Grade 5". */
  label: string
  cards: T[]
}

/** Cards grouped under their grade, in the order the grades first appear (the server sorts them). */
export function groupCardsByGrade<T extends { grade: string | number }>(cards: T[]): GradeGroup<T>[] {
  const groups: GradeGroup<T>[] = []
  const byGrade = new Map<string, GradeGroup<T>>()
  for (const card of cards) {
    const grade = String(card.grade)
    let group = byGrade.get(grade)
    if (!group) {
      group = { grade, label: getGradeDisplayName(grade), cards: [] }
      byGrade.set(grade, group)
      groups.push(group)
    }
    group.cards.push(card)
  }
  return groups
}
