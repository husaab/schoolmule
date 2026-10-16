// src/lib/studentAccounts.ts
// Pure rules behind Admin Panel → Student accounts: which actions a row
// offers, whether a student is ready to invite, the table's wording, and the
// batching of long invite/print runs. Unit-tested (studentAccounts.test.ts);
// the page and its modals only render what these decide.

import type {
  AccountStatus,
  ClassroomSettings,
  GradeCode,
  StudentAccountRow,
} from '@/services/types/studentAccount'

export const GRADE_CODES: readonly GradeCode[] = ['JK', 'SK', '1', '2', '3', '4', '5', '6', '7', '8']

/** JK → -1, SK → 0, '1'..'8' → 1..8, anything else → null (the backend's gradeRank). */
export const gradeRank = (grade: string | null | undefined): number | null => {
  if (grade === 'JK') return -1
  if (grade === 'SK') return 0
  if (grade && /^[1-8]$/.test(grade)) return Number(grade)
  return null
}

/** 'JK' / 'SK' as they are, otherwise 'Grade 5'. */
export const gradeLabel = (grade: string): string => (grade === 'JK' || grade === 'SK' ? grade : `Grade ${grade}`)

/** Option label for a grade picker: 'JK', 'SK', 'Grade 1'… */
export const GRADE_OPTIONS = GRADE_CODES.map((g) => ({ value: g, label: gradeLabel(g) }))

export const STATUS_LABELS: Record<AccountStatus, string> = {
  not_invited: 'Not invited',
  invited: 'Invited',
  active: 'Active',
  archived: 'Archived',
  not_eligible: 'Not eligible',
}

/** Status chips, in the order the page shows them (after "All"). */
export const STATUS_ORDER: readonly AccountStatus[] = ['not_invited', 'invited', 'active', 'archived', 'not_eligible']

export const isAccountStatus = (value: string): value is AccountStatus =>
  (STATUS_ORDER as readonly string[]).includes(value)

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

// ---------------------------------------------------------------------------
// Header copy

const gradeSpan = (from: GradeCode, to: GradeCode): string =>
  from === to ? gradeLabel(from) : `Grades ${from}–${to}`

/**
 * The page subtitle, e.g. "Invite students with the email they already have.
 * Grades 1–8 can sign in; Grades 1–3 can also use a QR card."
 */
export const settingsSummary = (settings: Pick<ClassroomSettings, 'loginFromGrade' | 'qrUntilGrade'>): string => {
  const from = settings.loginFromGrade
  const fromRank = gradeRank(from) ?? 1
  const qrRank = gradeRank(settings.qrUntilGrade) ?? -2
  const qr =
    qrRank < fromRank
      ? 'No grade uses a QR card.'
      : `${gradeSpan(from, settings.qrUntilGrade)} can also use a QR card.`
  const signIn = `${gradeSpan(from, '8')} can sign in`
  return qrRank < fromRank
    ? `Invite students with the email they already have. ${signIn}. ${qr}`
    : `Invite students with the email they already have. ${signIn}; ${qr}`
}

// ---------------------------------------------------------------------------
// Dates (America/Toronto, the school's time zone)

const TZ = 'America/Toronto'

/** 'YYYY-MM-DD' of an instant, on the Toronto calendar. */
export const torontoDateKey = (date: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)

const dayNumber = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** 'Oct 15', or 'Oct 15, 2025' when it isn't this year (Toronto). */
export const shortDate = (iso: string, now: Date = new Date()): string => {
  const date = new Date(iso)
  const sameYear = torontoDateKey(date).slice(0, 4) === torontoDateKey(now).slice(0, 4)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date)
}

/** 'Thursday, October 15' (Toronto), the student home's date line. */
export const longDateLine = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' }).format(now)

/** Last signed in: 'Today', 'Yesterday', a weekday this past week, a date, or 'Never'. */
export const lastSignedInText = (iso: string | null, now: Date = new Date()): string => {
  if (!iso) return 'Never'
  const date = new Date(iso)
  const days = dayNumber(torontoDateKey(now)) - dayNumber(torontoDateKey(date))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 7) return new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(date)
  return shortDate(iso, now)
}

// ---------------------------------------------------------------------------
// Table cells

/** "Recorded Oct 15 · Office Admin", or '—' when no consent is on file. */
export const consentText = (row: StudentAccountRow, now: Date = new Date()): string => {
  const consent = row.account?.consent
  if (!consent) return '—'
  return consent.byName ? `Recorded ${shortDate(consent.at, now)} · ${consent.byName}` : `Recorded ${shortDate(consent.at, now)}`
}

/** "Active since Oct 15", "Not used for Grade 5", or '—'. */
export const qrCardText = (
  row: StudentAccountRow,
  settings: Pick<ClassroomSettings, 'qrUntilGrade'>,
  now: Date = new Date(),
): string => {
  const qr = row.account?.qr
  if (qr?.active && qr.issuedAt) return `Active since ${shortDate(qr.issuedAt, now)}`
  if (row.status === 'not_eligible') return '—'
  const rank = gradeRank(row.grade)
  const until = gradeRank(settings.qrUntilGrade)
  if (rank !== null && until !== null && rank > until) return `Not used for ${gradeLabel(row.grade)}`
  return '—'
}

/** The email shown in the table: the student's own address, else the login's. */
export const displayEmail = (row: StudentAccountRow): string | null => row.studentEmail ?? row.account?.email ?? null

/** "Grade 5 · Amal Haddad" (homeroom teacher), or just "Grade 5". */
export const studentSubline = (row: StudentAccountRow): string =>
  row.homeroomTeacherName ? `${gradeLabel(row.grade)} · ${row.homeroomTeacherName}` : gradeLabel(row.grade)

// ---------------------------------------------------------------------------
// Invite readiness

export type ReadinessKind = 'ready' | 'has_account' | 'not_eligible' | 'no_email' | 'conflict'

export interface Readiness {
  kind: ReadinessKind
  ready: boolean
  note: string
}

/** Whether an invite would go out for this row, and the note the invite modal shows. */
export const inviteReadiness = (
  row: StudentAccountRow,
  settings: Pick<ClassroomSettings, 'loginFromGrade'>,
): Readiness => {
  if (row.account) {
    return {
      kind: 'has_account',
      ready: false,
      note: row.status === 'archived' ? 'Already has an account (archived)' : 'Already has an account',
    }
  }
  if (row.status === 'not_eligible') {
    return { kind: 'not_eligible', ready: false, note: `Not eligible: student logins start at ${gradeLabel(settings.loginFromGrade)}` }
  }
  if (!row.studentEmail) return { kind: 'no_email', ready: false, note: "No email yet. Add the student's own address first." }
  if (row.conflict) return { kind: 'conflict', ready: false, note: row.conflict.message }
  return { kind: 'ready', ready: true, note: `Ready · ${row.studentEmail}` }
}

// ---------------------------------------------------------------------------
// Row menu

export type RowAction =
  | 'edit_email'
  | 'invite'
  | 'resend_invite'
  | 'reset_password'
  | 'print_qr'
  | 'void_qr'
  | 'view_as'
  | 'link'
  | 'unlink'
  | 'archive'
  | 'unarchive'
  | 'delete'

export const ROW_ACTION_LABELS: Record<RowAction, string> = {
  edit_email: 'Edit email',
  invite: 'Invite',
  resend_invite: 'Resend invite',
  reset_password: 'Reset password',
  print_qr: 'Print QR card',
  void_qr: 'Void QR card',
  view_as: 'View as student',
  link: 'Link existing account…',
  unlink: 'Unlink account',
  archive: 'Archive',
  unarchive: 'Unarchive',
  delete: 'Delete account',
}

/** Only the actions the server would accept for this row, in menu order. */
export const rowActions = (row: StudentAccountRow): RowAction[] => {
  const live = row.status === 'invited' || row.status === 'active'
  const actions: RowAction[] = []
  actions.push('edit_email')
  if (row.status === 'not_invited' && row.studentEmail && !row.conflict) actions.push('invite')
  if (row.status === 'invited') actions.push('resend_invite')
  if (row.status === 'active') actions.push('reset_password')
  if (row.qrEligible) actions.push('print_qr')
  if (row.account?.qr.active) actions.push('void_qr')
  if (live) actions.push('view_as')
  if (!row.account) actions.push('link')
  if (row.account) actions.push('unlink')
  if (live) actions.push('archive')
  if (row.status === 'archived') actions.push('unarchive')
  // An active login is archived first; delete is never the first step.
  if (row.account && row.status !== 'active') actions.push('delete')
  return actions
}

// ---------------------------------------------------------------------------
// Filters

export interface RowFilters {
  grade: string
  status: string
  q: string
}

/** Rows matching grade, status and a name/email search (case-insensitive). */
export const filterRows = (rows: StudentAccountRow[], { grade, status, q }: RowFilters): StudentAccountRow[] => {
  const term = q.trim().toLowerCase()
  return rows.filter(
    (r) =>
      (!grade || r.grade === grade) &&
      (!status || r.status === status) &&
      (!term ||
        [r.name, r.studentEmail, r.account?.email].some((v) => typeof v === 'string' && v.toLowerCase().includes(term))),
  )
}

/** How many rows have each status (the chips' counts). */
export const countByStatus = (rows: StudentAccountRow[]): Record<AccountStatus, number> => {
  const counts: Record<AccountStatus, number> = { not_invited: 0, invited: 0, active: 0, archived: 0, not_eligible: 0 }
  for (const r of rows) counts[r.status] += 1
  return counts
}

// ---------------------------------------------------------------------------
// Batching

/**
 * Students per invite request. The server sends one email every ~600 ms, so a
 * batch of 10 answers in about 6 seconds: short enough for any proxy, and the
 * modal can show progress between batches.
 */
export const INVITE_BATCH_SIZE = 10

/** The most students one cards/void request accepts (the server's limit). */
export const STUDENT_BATCH_LIMIT = 200

/** Split a list into consecutive batches of at most `size`. */
export const chunk = <T>(items: readonly T[], size: number): T[][] => {
  if (size < 1) throw new Error('chunk size must be at least 1')
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** X-Skipped-Count / X-Skipped-Students from a cards PDF response. */
export const readSkipped = (headers: Pick<Headers, 'get'>): { count: number; ids: string[] } => {
  const ids = (headers.get('X-Skipped-Students') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const count = Number(headers.get('X-Skipped-Count') ?? ids.length)
  return { count: Number.isFinite(count) ? count : ids.length, ids }
}
