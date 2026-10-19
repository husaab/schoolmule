// src/lib/studentAccounts.ts
// Pure rules behind Admin Panel → Student accounts: which actions a row
// offers, whether a student is ready to invite, the table's wording, and the
// batching of long invite/print runs. Unit-tested (studentAccounts.test.ts);
// the page and its modals only render what these decide.

import type {
  AccountStatus,
  ClassroomSettings,
  GradeCode,
  SignInMethod,
  StudentAccountRow,
  StudentInvite,
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

/** The status chips also filter on "Needs attention" (row.needsAttention). */
export type StatusFilter = AccountStatus | 'needs_attention'
export const NEEDS_ATTENTION_LABEL = 'Needs attention'
export const isStatusFilter = (value: string): value is StatusFilter => value === 'needs_attention' || isAccountStatus(value)

// One list of day names (M11): the parent's email preferences define it.
export { DAY_NAMES } from './notificationPrefs'

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
// Classroom settings

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/

/**
 * "Students.Example.org, staff.example.org" → ['students.example.org',
 * 'staff.example.org'] (the server's rule: domain names, at most 5).
 */
export const parseDomainList = (text: string): { domains: string[] } | { error: string } => {
  const domains = [...new Set(text.split(/[\s,;]+/).map((d) => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean))]
  const bad = domains.find((d) => !DOMAIN_RE.test(d))
  if (bad) return { error: `"${bad}" isn't a domain name. Write it like students.example.org.` }
  if (domains.length > 5) return { error: 'List up to 5 domains.' }
  return { domains }
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
// Invites and sign-in (the line under the SchoolMule status)

const SIGN_IN_LABELS = { google: 'Google', password: 'Password', card: 'QR card' } as const

/** "last signed in today", "last signed in Mon", "never signed in". */
const lastSignedInPhrase = (iso: string | null | undefined, now: Date): string => {
  if (!iso) return 'never signed in'
  const text = lastSignedInText(iso, now)
  return `last signed in ${text === 'Today' || text === 'Yesterday' ? text.toLowerCase() : text}`
}

/**
 * Where a login's invite stands, or how an active student signs in:
 * "Sent Oct 19 · expires Nov 2", "Email failed · Resend", "Expired Nov 2",
 * "Google · last signed in today", "Card no longer works for Grade 4 · …".
 * null when there is nothing to add (no login, archived).
 */
export const inviteSubline = (
  row: StudentAccountRow,
  settings: Pick<ClassroomSettings, 'qrUntilGrade'>,
  now: Date = new Date(),
): string | null => {
  if (!row.account) return null
  if (row.status === 'active') {
    if (row.signInMethod === 'card' && row.needsAttention) {
      return `Card no longer works for ${gradeLabel(row.grade)} · resend the invite`
    }
    const how = row.signInMethod ? SIGN_IN_LABELS[row.signInMethod] : 'Signed in'
    return `${how} · ${lastSignedInPhrase(row.account.lastLoginAt, now)}`
  }
  if (row.status !== 'invited') return null
  return row.invite ? invitedLine(row.invite, now) : 'No invite sent yet · Resend'
}

/** Where an invited login's latest invite stands. */
const invitedLine = (invite: StudentInvite, now: Date): string => {
  switch (invite.state) {
    case 'pending':
      return invite.sentAt
        ? `Sent ${shortDate(invite.sentAt, now)} · expires ${shortDate(invite.expiresAt, now)}`
        : `Expires ${shortDate(invite.expiresAt, now)}`
    case 'failed':
      return 'Email failed · Resend'
    case 'expired':
      return `Expired ${shortDate(invite.expiresAt, now)}`
    case 'cancelled':
      return 'Invite cancelled'
    // Back to Invited after the address changed (the old sign-in was reset).
    case 'accepted':
    case 'email_changed':
      return 'Address changed · send a new invite'
    default:
      return 'Resend the invite'
  }
}

/**
 * The class People tab's line under a student's status: the invite for an
 * invited login, how an active one signs in, else null.
 */
export const peopleAccountLine = (
  account: { status: AccountStatus; invite?: StudentInvite | null; signInMethod?: SignInMethod | null },
  now: Date = new Date(),
): string | null => {
  if (account.status === 'invited') return account.invite ? invitedLine(account.invite, now) : null
  if (account.status === 'active' && account.signInMethod) return SIGN_IN_LABELS[account.signInMethod]
  return null
}

/** An invite that is still open (its link may work, or can be cancelled). */
export const hasOpenInvite = (row: StudentAccountRow): boolean =>
  Boolean(row.invite && ['pending', 'failed', 'expired'].includes(row.invite.state))

/** A login that hasn't set up email sign-in yet (invited, or a card student): Resend applies. */
export const canResendInvite = (row: StudentAccountRow): boolean =>
  row.status === 'invited' || (row.status === 'active' && row.signInMethod === 'card')

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

export interface InviteReview {
  /** Ready, nothing to check: they get the email. */
  send: StudentAccountRow[]
  /** Ready, but the address looks off (not a school address, doesn't mention them); ticked by default. */
  check: { row: StudentAccountRow; warnings: NonNullable<StudentAccountRow['warnings']> }[]
  /** Not invited this time, and why. */
  skipped: { row: StudentAccountRow; reason: string }[]
}

/** The invite review's three groups (spec §2.4), in the order the rows came. */
export const groupInviteReview = (
  rows: StudentAccountRow[],
  settings: Pick<ClassroomSettings, 'loginFromGrade'>,
  now: Date = new Date(),
): InviteReview => {
  const review: InviteReview = { send: [], check: [], skipped: [] }
  for (const row of rows) {
    const readiness = inviteReadiness(row, settings)
    if (readiness.ready) {
      if (row.warnings && row.warnings.length > 0) review.check.push({ row, warnings: row.warnings })
      else review.send.push(row)
      continue
    }
    let reason = readiness.note
    if (readiness.kind === 'no_email') reason = 'No email yet.'
    else if (row.status === 'active') reason = 'Already active.'
    else if (row.status === 'invited' && row.invite && hasOpenInvite(row) && row.invite.sentAt) {
      reason = `Invite already sent ${shortDate(row.invite.sentAt, now)} (expires ${shortDate(row.invite.expiresAt, now)}). Use Resend.`
    } else if (row.status === 'invited') reason = 'Already invited. Use Resend.'
    review.skipped.push({ row, reason })
  }
  return review
}

// ---------------------------------------------------------------------------
// Row menu

export type RowAction =
  | 'edit_email'
  | 'invite'
  | 'resend_invite'
  | 'cancel_invite'
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
  cancel_invite: 'Cancel invite',
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

/**
 * Only the actions the server would accept for this row, in menu order. A
 * Google-only school has no student passwords, so no Reset password.
 */
export const rowActions = (
  row: StudentAccountRow,
  settings: Pick<ClassroomSettings, 'studentSignIn'> = { studentSignIn: 'google_or_password' },
): RowAction[] => {
  const live = row.status === 'invited' || row.status === 'active'
  const actions: RowAction[] = []
  actions.push('edit_email')
  if (row.status === 'not_invited' && row.studentEmail && !row.conflict) actions.push('invite')
  if (canResendInvite(row)) actions.push('resend_invite')
  if (live && hasOpenInvite(row)) actions.push('cancel_invite')
  if (row.status === 'active' && row.signInMethod !== 'card' && settings.studentSignIn !== 'google_only') {
    actions.push('reset_password')
  }
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
  /** An AccountStatus, 'needs_attention', or '' for all. */
  status: string
  q: string
}

/** Rows matching grade, status and a name/email search (case-insensitive). */
export const filterRows = (rows: StudentAccountRow[], { grade, status, q }: RowFilters): StudentAccountRow[] => {
  const term = q.trim().toLowerCase()
  return rows.filter(
    (r) =>
      (!grade || r.grade === grade) &&
      (!status || (status === 'needs_attention' ? Boolean(r.needsAttention) : r.status === status)) &&
      (!term ||
        [r.name, r.studentEmail, r.account?.email].some((v) => typeof v === 'string' && v.toLowerCase().includes(term))),
  )
}

/** How many rows have each status, and how many need attention (the chips' counts). */
export const countByStatus = (rows: StudentAccountRow[]): Record<StatusFilter, number> => {
  const counts: Record<StatusFilter, number> = {
    not_invited: 0, invited: 0, active: 0, archived: 0, not_eligible: 0, needs_attention: 0,
  }
  for (const r of rows) {
    counts[r.status] += 1
    if (r.needsAttention) counts.needs_attention += 1
  }
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

// ---------------------------------------------------------------------------
// Printing QR cards

/**
 * Whether printing needs a confirm first. Printing always issues a new card and
 * voids the student's older one, so it asks unless the page knows none of these
 * students holds a card (`withCards` 0). `null` means the page cannot tell
 * (the class People tab), which asks too.
 */
export const printNeedsConfirm = (withCards: number | null): boolean => withCards !== 0

export interface PrintQrConfirm {
  title: string
  /** The plain warning: printing replaces the old cards and they stop working. */
  warning: string
  consequences: { title: string; items: string[] }
  confirmLabel: string
}

/**
 * The words of the confirm before QR cards are printed. `names` are the students
 * whose cards will print; `withCards` is how many of them hold a card now, or
 * null when the page cannot tell.
 */
export function printQrConfirm(names: readonly string[], withCards: number | null): PrintQrConfirm {
  const n = names.length
  const single = n === 1 ? names[0] : null
  const warning = single
    ? withCards === null
      ? `If ${single} already has a card, printing a new one replaces it. The old card stops working.`
      : `Printing a new card replaces ${single}'s old one. The old card stops working.`
    : withCards === null
      ? 'Printing new cards replaces any old ones. The old cards stop working.'
      : 'Printing new cards replaces the old ones. The old cards stop working.'
  const items = [
    single ? 'The new card works as soon as it prints' : 'The new cards work as soon as they print',
    withCards !== null && withCards > 0 && n > 1
      ? `${withCards} of these ${n} students have a card now; those cards stop working right away`
      : single
        ? 'Take back the old card, if it was handed out'
        : 'Take back the old cards, if they were handed out',
    'A device already signed in with an old card stays signed in until that session ends (at most 12 hours)',
  ]
  return {
    title: single ? 'Print a new QR card' : `Print ${n} QR cards`,
    warning,
    consequences: { title: 'What happens:', items },
    confirmLabel: single ? 'Print QR card' : `Print ${n} cards`,
  }
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
