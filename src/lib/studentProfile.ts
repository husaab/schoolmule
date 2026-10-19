// Pure helpers for the staff student profile modal. Everything
// here derives display data from the API payloads; nothing re-computes a
// grade, which only ever comes from the backend's one grade engine.

import type { AssessmentScoreCell, StudentData } from '@/services/types/analytics'
import type { AttendanceDay, AttendanceStatus, ProfileTerm } from '@/services/types/studentProfile'

export type ProfileTab = 'overview' | 'grades' | 'attendance' | 'reports' | 'messages'

export const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'grades', label: 'Grades' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'reports', label: 'Reports' },
  { key: 'messages', label: 'Messages' },
]

export const parseTab = (value: string | null | undefined): ProfileTab =>
  PROFILE_TABS.some((t) => t.key === value) ? (value as ProfileTab) : 'overview'

const round1 = (v: number) => Math.round(v * 10) / 10

/** One assessment's percent: graded → score/max, flagged missing → 0, otherwise none. */
export function cellPct(cell: AssessmentScoreCell): number | null {
  if (cell.status === 'missing') return 0
  if (cell.status === 'graded' && cell.score != null && cell.maxScore) return round1((cell.score / cell.maxScore) * 100)
  return null
}

/** Text colour for a grade, shared by every mark on the profile. */
export const gradeText = (pct: number | null | undefined): string =>
  pct == null ? 'text-slate-400' : pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-slate-900' : 'text-rose-600'

/** Fill colour for a grade bar. */
export const gradeBar = (pct: number | null | undefined): string =>
  pct == null ? 'bg-slate-200' : pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-cyan-500' : 'bg-rose-500'

export const fmtPct = (v: number | null | undefined): string => (v == null ? '—' : `${v}%`)

/** StatCard gradient for an attendance rate: amber under 85%, like analytics. */
export const attendanceTone = (pct: number | null | undefined): string =>
  pct != null && pct < 85 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600'

/**
 * Assessment rows in reading order: each top-level row, and right after a
 * category its children, indented. Children whose category is missing stay
 * at the top level so nothing is ever dropped.
 */
export function orderAssessments(cells: AssessmentScoreCell[]): { cell: AssessmentScoreCell; depth: 0 | 1 }[] {
  const ids = new Set(cells.map((c) => c.assessmentId))
  const isChild = (c: AssessmentScoreCell) => c.parentAssessmentId != null && ids.has(c.parentAssessmentId)
  const out: { cell: AssessmentScoreCell; depth: 0 | 1 }[] = []
  for (const cell of cells) {
    if (isChild(cell)) continue
    out.push({ cell, depth: 0 })
    if (cell.isParent) {
      for (const child of cells) if (child.parentAssessmentId === cell.assessmentId) out.push({ cell: child, depth: 1 })
    }
  }
  return out
}

export interface RecentMark {
  classId: string
  subject: string
  assessmentId: string
  name: string
  date: string | null
  pct: number | null
  status: 'graded' | 'missing'
}

/** The newest marks across every class: leaf assessments with evidence, by date. */
export function recentMarks(detail: StudentData | null, limit = 6): RecentMark[] {
  if (!detail) return []
  const marks: RecentMark[] = []
  for (const cls of detail.classes) {
    for (const cell of cls.assessmentScores) {
      if (cell.isParent || (cell.status !== 'graded' && cell.status !== 'missing')) continue
      marks.push({
        classId: cls.classId,
        subject: cls.subject,
        assessmentId: cell.assessmentId,
        name: cell.name,
        date: cell.date ? String(cell.date).slice(0, 10) : null,
        pct: cellPct(cell),
        status: cell.status,
      })
    }
  }
  // Undated marks sink to the bottom; ties keep class order.
  return marks
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (b.m.date ?? '').localeCompare(a.m.date ?? '') || a.i - b.i)
    .slice(0, limit)
    .map(({ m }) => m)
}

/** Change in average against the term before `termId`, or null without both numbers. */
export function termDelta(terms: ProfileTerm[], termId: string | null): number | null {
  const i = terms.findIndex((t) => t.termId === termId)
  if (i <= 0) return null
  const cur = terms[i].avg
  const prev = terms[i - 1].avg
  return cur == null || prev == null ? null : round1(cur - prev)
}

export interface SubjectRow {
  subject: string
  byTerm: Record<string, number | null>
}

/**
 * Subject × term grid for the year. Classes are term-bound, so a subject is
 * matched by name across terms; two classes of one subject in a term average.
 */
export function subjectTermGrid(terms: ProfileTerm[]): SubjectRow[] {
  const rows = new Map<string, Record<string, number[]>>()
  for (const term of terms) {
    for (const s of term.subjects) {
      const key = s.subject.trim()
      if (!rows.has(key)) rows.set(key, {})
      const cell = rows.get(key)!
      cell[term.termId] = cell[term.termId] || []
      if (s.pct != null) cell[term.termId].push(s.pct)
    }
  }
  return [...rows.entries()]
    .map(([subject, cells]) => ({
      subject,
      byTerm: Object.fromEntries(
        terms.map((t) => {
          const v = cells[t.termId]
          return [t.termId, v && v.length ? round1(v.reduce((a, b) => a + b, 0) / v.length) : null]
        })
      ),
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject))
}

// ── Attendance calendar ────────────────────────────────────────────

export interface CalendarCell {
  date: string
  day: number
  status: AttendanceStatus | null
  /** Outside the school-year window (before the first term / after the last). */
  outside: boolean
}

export interface CalendarMonth {
  key: string
  label: string
  /** Rows of Mon–Fri; null pads the first and last week. */
  weeks: (CalendarCell | null)[][]
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/**
 * Weekday month grids covering the school year (first term start → last term
 * end), widened to any recorded day outside it. Dates are handled as
 * YYYY-MM-DD strings and UTC calendar maths, so no timezone can shift a day.
 */
export function attendanceMonths(days: AttendanceDay[], terms: Pick<ProfileTerm, 'startDate' | 'endDate'>[]): CalendarMonth[] {
  const recorded = days.map((d) => d.date).sort()
  const starts = terms.map((t) => t.startDate).sort()
  const ends = terms.map((t) => t.endDate).sort()
  const windowStart = starts[0] ?? recorded[0]
  const windowEnd = ends[ends.length - 1] ?? recorded[recorded.length - 1]
  if (!windowStart || !windowEnd) return []
  const first = recorded.length && recorded[0] < windowStart ? recorded[0] : windowStart
  const last = recorded.length && recorded[recorded.length - 1] > windowEnd ? recorded[recorded.length - 1] : windowEnd

  const statusByDate = new Map(days.map((d) => [d.date, d.status]))
  const months: CalendarMonth[] = []
  let y = Number(first.slice(0, 4))
  let m = Number(first.slice(5, 7)) - 1
  const endY = Number(last.slice(0, 4))
  const endM = Number(last.slice(5, 7)) - 1

  while (y < endY || (y === endY && m <= endM)) {
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const weeks: (CalendarCell | null)[][] = []
    let week: (CalendarCell | null)[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(Date.UTC(y, m, d)).getUTCDay() // 0 Sun … 6 Sat
      if (dow === 0 || dow === 6) continue
      const col = dow - 1
      if (week.length === 0) for (let i = 0; i < col; i++) week.push(null)
      const date = ymd(y, m, d)
      week.push({ date, day: d, status: statusByDate.get(date) ?? null, outside: date < windowStart || date > windowEnd })
      if (col === 4) {
        weeks.push(week)
        week = []
      }
    }
    if (week.length) {
      while (week.length < 5) week.push(null)
      weeks.push(week)
    }
    months.push({ key: `${y}-${pad(m + 1)}`, label: `${MONTHS[m]} ${y}`, weeks })
    m += 1
    if (m === 12) {
      m = 0
      y += 1
    }
  }
  return months
}

/** Absences and lates, newest first. */
export const attendanceExceptions = (days: AttendanceDay[]): AttendanceDay[] =>
  days.filter((d) => d.status === 'ABSENT' || d.status === 'LATE').sort((a, b) => b.date.localeCompare(a.date))

/** Items grouped by their term label, terms in first-seen order. */
export function groupByTerm<T extends { term: string }>(items: T[]): { term: string; items: T[] }[] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    if (!groups.has(item.term)) groups.set(item.term, [])
    groups.get(item.term)!.push(item)
  }
  return [...groups.entries()].map(([term, list]) => ({ term, items: list }))
}

/** 'mother' → 'Mother'; null → 'Guardian'. */
export const relationLabel = (relation: string | null | undefined): string =>
  relation ? relation.charAt(0).toUpperCase() + relation.slice(1).toLowerCase() : 'Guardian'

/**
 * A calendar date ('YYYY-MM-DD', or a DATE column serialized as UTC
 * midnight) shown without timezone drift: Oct 1 stays Oct 1 in Toronto.
 */
export function formatDay(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value)) : null
  if (!m) return '—'
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString(undefined, opts)
}

/** A moment in time (timestamptz), shown as the viewer's local date. */
export function formatStamp(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, opts)
}

/** The gradebook for a class: JK and SK have their own competency gradebooks. */
export const gradebookHref = (classId: string, classGrade: string | number | null | undefined): string => {
  const g = String(classGrade ?? '').toUpperCase()
  if (g === 'JK') return `/gradebook/jk/${classId}`
  if (g === 'SK') return `/gradebook/sk/${classId}`
  return `/gradebook/${classId}`
}

/** Plain-language versions of computeAtRiskScore's flags. */
const RISK_FLAG_TEXT: Record<string, string> = {
  'grade<50': 'average below 50%',
  'grade<60': 'average below 60%',
  'grade<70': 'average below 70%',
  'attendance<70': 'attendance below 70%',
  'attendance<75': 'attendance below 75%',
  'attendance<80': 'attendance below 80%',
  'missing>=5': '5+ missing assignments',
  'missing>=3': '3+ missing assignments',
  'missing>=2': '2 missing assignments',
  'declining severely': 'sharp drop since last term',
  declining: 'dropping since last term',
}
export const riskFlagText = (flag: string): string => RISK_FLAG_TEXT[flag] ?? flag

/** 1 → '1st', 12 → '12th', 22 → '22nd'. */
export function ordinal(n: number): string {
  const r100 = n % 100
  if (r100 >= 11 && r100 <= 13) return `${n}th`
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`
}
