// src/lib/progressReportRoster.ts
// The progress reports page lists every student once for the chosen term:
// their report, if one was generated, and whether it went to the family. This
// file turns the students list and the term's report rows into that roster,
// and owns its filters and counts, so the web page and the app read the same
// statuses. Platform-neutral: the app copies it verbatim.

import { getGradeNumericValue } from '@/lib/schoolUtils'

/** A report row as GET /progress-reports/reports/term/:term/school/:school returns it (snake_case; camelCase tolerated). */
export interface RawProgressReport {
  student_id?: string
  studentId?: string
  term?: string
  student_name?: string
  studentName?: string
  grade?: string | number | null
  file_path?: string
  filePath?: string
  generated_at?: string | null
  generatedAt?: string | null
  email_sent?: boolean | null
  emailSent?: boolean | null
  email_sent_at?: string | null
  emailSentAt?: string | null
}

/** One generated progress report PDF. `filePath` is the key every download, view and delete call takes. */
export interface ProgressReportFile {
  studentId: string
  studentName: string
  grade: string
  term: string
  filePath: string
  generatedAt: string | null
  emailSent: boolean
  emailSentAt: string | null
}

/**
 * Where a student's report stands this term.
 * - none: no report yet
 * - ready: generated, not emailed
 * - emailed: emailed to the family
 * - updated: regenerated after it was emailed, so the family has the older PDF
 */
export type RosterStatus = 'none' | 'ready' | 'emailed' | 'updated'

export interface RosterRow<S> {
  studentId: string
  name: string
  /** The grade as a string ('JK', '3'), '-' when unknown. */
  grade: string
  /** Null for a report whose student is no longer on the list; it can still be viewed or deleted. */
  student: S | null
  report: ProgressReportFile | null
  status: RosterStatus
}

/** The `status` URL filter. '' shows everyone; 'emailed' includes 'updated' (they were emailed too). */
export type StatusFilter = '' | 'none' | 'ready' | 'emailed' | 'updated'

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All students' },
  { value: 'none', label: 'Not generated' },
  { value: 'ready', label: 'Ready to email' },
  { value: 'emailed', label: 'Emailed' },
  { value: 'updated', label: 'Updated since emailed' },
]

export const isStatusFilter = (value: string): value is StatusFilter => STATUS_FILTERS.some((f) => f.value === value)

const gradeKey = (grade: unknown): string => (grade === null || grade === undefined || grade === '' ? '-' : String(grade))

export const normalizeProgressReport = (r: RawProgressReport): ProgressReportFile => ({
  studentId: r.student_id || r.studentId || '',
  studentName: r.student_name || r.studentName || '',
  grade: gradeKey(r.grade),
  term: r.term || '',
  filePath: r.file_path || r.filePath || '',
  generatedAt: r.generated_at || r.generatedAt || null,
  emailSent: Boolean(r.email_sent ?? r.emailSent),
  emailSentAt: r.email_sent_at || r.emailSentAt || null,
})

export function reportStatus(report: ProgressReportFile | null): RosterStatus {
  if (!report) return 'none'
  if (!report.emailSent) return 'ready'
  const generated = report.generatedAt ? Date.parse(report.generatedAt) : NaN
  const sent = report.emailSentAt ? Date.parse(report.emailSentAt) : NaN
  return Number.isFinite(generated) && Number.isFinite(sent) && generated > sent ? 'updated' : 'emailed'
}

const byGradeThenName = <T extends { grade: string; name: string }>(a: T, b: T) => {
  if (a.grade === '-' || b.grade === '-') return a.grade === b.grade ? a.name.localeCompare(b.name) : a.grade === '-' ? 1 : -1
  return getGradeNumericValue(a.grade) - getGradeNumericValue(b.grade) || a.name.localeCompare(b.name)
}

/** Every student once, with their report for the term; grades in school order, names A–Z inside. */
export function buildRoster<S extends { studentId: string; name: string; grade?: unknown }>(
  students: S[],
  reports: ProgressReportFile[],
): RosterRow<S>[] {
  const reportFor = new Map(reports.map((r) => [r.studentId, r]))
  const rows: RosterRow<S>[] = students.map((s) => {
    const report = reportFor.get(s.studentId) ?? null
    return { studentId: s.studentId, name: s.name, grade: gradeKey(s.grade), student: s, report, status: reportStatus(report) }
  })
  const listed = new Set(students.map((s) => s.studentId))
  for (const r of reports) {
    if (!listed.has(r.studentId)) {
      rows.push({ studentId: r.studentId, name: r.studentName, grade: r.grade, student: null, report: r, status: reportStatus(r) })
    }
  }
  return rows.sort(byGradeThenName)
}

export function matchesStatus(row: { status: RosterStatus }, filter: StatusFilter): boolean {
  if (!filter) return true
  if (filter === 'emailed') return row.status === 'emailed' || row.status === 'updated'
  return row.status === filter
}

/** The `grades` URL filter: a comma list of the grades shown; empty shows every grade. */
export const parseGradeList = (raw: string): string[] => (raw ? raw.split(',').filter(Boolean) : [])

export const inGrades = (row: { grade: string }, grades: string[]): boolean => grades.length === 0 || grades.includes(row.grade)

export function filterRoster<R extends { grade: string; name: string; status: RosterStatus }>(
  rows: R[],
  { grades, status, q }: { grades: string[]; status: StatusFilter; q: string },
): R[] {
  const needle = q.trim().toLowerCase()
  return rows.filter((r) => inGrades(r, grades) && matchesStatus(r, status) && (!needle || r.name.toLowerCase().includes(needle)))
}

export interface ProgressCounts {
  total: number
  /** Has a report (ready + emailed + updated). */
  generated: number
  /** Was emailed (emailed + updated). */
  emailed: number
  ready: number
  none: number
  updated: number
}

export function rosterCounts(rows: { status: RosterStatus }[]): ProgressCounts {
  const c = { total: rows.length, generated: 0, emailed: 0, ready: 0, none: 0, updated: 0 }
  for (const r of rows) {
    if (r.status === 'none') c.none += 1
    else {
      c.generated += 1
      if (r.status === 'ready') c.ready += 1
      else c.emailed += 1
      if (r.status === 'updated') c.updated += 1
    }
  }
  return c
}

/** Counts per grade, grades in school order ('-' last). */
export function gradeBreakdown(rows: { grade: string; status: RosterStatus }[]): { grade: string; counts: ProgressCounts }[] {
  const groups = new Map<string, { status: RosterStatus }[]>()
  for (const r of rows) {
    if (!groups.has(r.grade)) groups.set(r.grade, [])
    groups.get(r.grade)!.push(r)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '-' ? 1 : b === '-' ? -1 : getGradeNumericValue(a) - getGradeNumericValue(b)))
    .map(([grade, list]) => ({ grade, counts: rosterCounts(list) }))
}

/** "Grade 3", "JK", "SK"; '-' reads as "No grade". */
export const gradeLabel = (grade: string): string => (grade === '-' ? 'No grade' : grade === 'JK' || grade === 'SK' ? grade : `Grade ${grade}`)

/** What a selection can act on: generate needs a student on the list; download and delete need a report; email needs one not yet sent. */
export function selectionTargets<S>(rows: RosterRow<S>[], selectedIds: string[]) {
  const picked = rows.filter((r) => selectedIds.includes(r.studentId))
  return {
    rows: picked,
    generateIds: picked.filter((r) => r.student).map((r) => r.studentId),
    filePaths: picked.map((r) => r.report?.filePath || '').filter(Boolean),
    emailIds: picked.filter((r) => r.status === 'ready').map((r) => r.studentId),
    replacing: picked.filter((r) => r.student && r.report).length,
  }
}

/** Oct 12 (a timestamp, read in local time). Empty when missing or unreadable. */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** The Report column: "Not generated", "Generated Oct 12" or "Updated Oct 20". */
export function reportLine(row: { status: RosterStatus; report: ProgressReportFile | null }): string {
  if (!row.report) return 'Not generated'
  const date = shortDate(row.report.generatedAt)
  const verb = row.status === 'updated' ? 'Updated' : 'Generated'
  return date ? `${verb} ${date}` : verb
}

/** The family-email line for a report that was sent: "Emailed Oct 14", plus ", before the update" when regenerated since. */
export function emailedLine(row: { status: RosterStatus; report: ProgressReportFile | null }): string {
  const date = shortDate(row.report?.emailSentAt)
  const base = date ? `Emailed ${date}` : 'Emailed'
  return row.status === 'updated' ? `${base}, before the update` : base
}

export interface GenerateOutcome {
  generated: string[]
  failed: { studentId: string; error: string }[]
}

/** POST /progress-reports/generate/bulk answers { generated: [{ studentId }], failed: [{ studentId, error }] }. */
export function parseGenerateResult(res: { generated?: unknown[]; failed?: unknown[] } | null | undefined): GenerateOutcome {
  const idOf = (x: unknown) => (x && typeof x === 'object' && 'studentId' in x ? String((x as { studentId: unknown }).studentId ?? '') : '')
  return {
    generated: (res?.generated ?? []).map(idOf).filter(Boolean),
    failed: (res?.failed ?? []).map((x) => ({
      studentId: idOf(x),
      error: x && typeof x === 'object' && 'error' in x ? String((x as { error: unknown }).error || 'Unknown error') : 'Unknown error',
    })),
  }
}

/** The server's skip reasons, said the way the results list shows them. */
export function generateErrorText(error: string, term: string): string {
  if (/not enrolled in any classes/i.test(error)) return `Not in any ${term} class yet. Add them to a class, then generate again.`
  if (/student not found/i.test(error)) return 'This student is no longer on the list.'
  if (/term .* not found/i.test(error)) return `${term} isn't set up for this school.`
  return error
}

/** A date as YYYY-MM-DD in the device's own time zone (the default report date). */
export function localDateISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
