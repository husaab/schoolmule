import { describe, it, expect } from 'vitest'
import type { StudentAccountRow, StudentAccountLogin } from '@/services/types/studentAccount'
import {
  chunk,
  consentText,
  countByStatus,
  filterRows,
  gradeLabel,
  gradeRank,
  inviteReadiness,
  lastSignedInText,
  longDateLine,
  printNeedsConfirm,
  printQrConfirm,
  qrCardText,
  readSkipped,
  rowActions,
  settingsSummary,
  shortDate,
  studentSubline,
  inviteSubline,
  parseDomainList,
  peopleAccountLine,
  groupInviteReview,
} from './studentAccounts'

const settings = { loginFromGrade: '1', qrUntilGrade: '3' } as const

const login = (over: Partial<StudentAccountLogin> = {}): StudentAccountLogin => ({
  userId: 'u-1',
  email: 'amal.haddad@example.com',
  createdAt: '2026-10-01T14:00:00.000Z',
  lastLoginAt: null,
  lastSeenAt: null,
  consent: { at: '2026-10-15T14:00:00.000Z', byName: 'Office Admin', noticeVersion: '2026-10' },
  qr: { active: false, issuedAt: null, voidedAt: null },
  ...over,
})

const row = (over: Partial<StudentAccountRow> = {}): StudentAccountRow => ({
  studentId: 's-1',
  name: 'Amal Haddad',
  grade: '2',
  homeroomTeacherName: 'Ziad Teacher',
  studentEmail: 'amal.haddad@example.com',
  status: 'not_invited',
  account: null,
  qrEligible: false,
  conflict: null,
  ...over,
})

// 2026-10-15 is a Thursday. 16:00 UTC is noon in Toronto (EDT).
const NOW = new Date('2026-10-15T16:00:00.000Z')

describe('grades', () => {
  it('ranks grades like the backend', () => {
    expect(gradeRank('JK')).toBe(-1)
    expect(gradeRank('SK')).toBe(0)
    expect(gradeRank('5')).toBe(5)
    expect(gradeRank('9')).toBeNull()
    expect(gradeRank(null)).toBeNull()
  })

  it('labels grades', () => {
    expect(gradeLabel('JK')).toBe('JK')
    expect(gradeLabel('5')).toBe('Grade 5')
  })
})

describe('settingsSummary', () => {
  it('reads the defaults the way the brief words them', () => {
    expect(settingsSummary(settings)).toBe(
      'Invite students with the email they already have. Grades 1–8 can sign in; Grades 1–3 can also use a QR card.',
    )
  })

  it('names one grade on its own', () => {
    expect(settingsSummary({ loginFromGrade: '3', qrUntilGrade: '3' })).toBe(
      'Invite students with the email they already have. Grades 3–8 can sign in; Grade 3 can also use a QR card.',
    )
  })

  it('says so when no grade gets a QR card', () => {
    expect(settingsSummary({ loginFromGrade: '4', qrUntilGrade: '3' })).toBe(
      'Invite students with the email they already have. Grades 4–8 can sign in. No grade uses a QR card.',
    )
  })
})

describe('dates (America/Toronto)', () => {
  it('formats a short date, with the year only when it differs', () => {
    expect(shortDate('2026-10-15T14:00:00.000Z', NOW)).toBe('Oct 15')
    expect(shortDate('2025-03-02T14:00:00.000Z', NOW)).toBe('Mar 2, 2025')
  })

  it('uses the Toronto calendar day, not UTC', () => {
    // 02:00 UTC on Oct 15 is still Oct 14 in Toronto.
    expect(shortDate('2026-10-15T02:00:00.000Z', NOW)).toBe('Oct 14')
  })

  it('writes the home date line', () => {
    expect(longDateLine(NOW)).toBe('Thursday, October 15')
  })

  it('describes the last sign-in', () => {
    expect(lastSignedInText(null, NOW)).toBe('Never')
    expect(lastSignedInText('2026-10-15T13:00:00.000Z', NOW)).toBe('Today')
    expect(lastSignedInText('2026-10-14T20:00:00.000Z', NOW)).toBe('Yesterday')
    expect(lastSignedInText('2026-10-12T15:00:00.000Z', NOW)).toBe('Mon')
    expect(lastSignedInText('2026-10-01T15:00:00.000Z', NOW)).toBe('Oct 1')
  })
})

describe('table cells', () => {
  it('shows consent with who recorded it', () => {
    expect(consentText(row(), NOW)).toBe('—')
    expect(consentText(row({ status: 'invited', account: login() }), NOW)).toBe('Recorded Oct 15 · Office Admin')
    expect(
      consentText(row({ status: 'invited', account: login({ consent: { at: '2026-10-15T14:00:00.000Z', byName: null, noticeVersion: null } }) }), NOW),
    ).toBe('Recorded Oct 15')
  })

  it('shows the QR card state', () => {
    const active = row({ status: 'active', qrEligible: true, account: login({ qr: { active: true, issuedAt: '2026-10-15T14:00:00.000Z', voidedAt: null } }) })
    expect(qrCardText(active, settings, NOW)).toBe('Active since Oct 15')
    expect(qrCardText(row({ grade: '5' }), settings, NOW)).toBe('Not used for Grade 5')
    expect(qrCardText(row({ grade: '2' }), settings, NOW)).toBe('—')
    expect(qrCardText(row({ grade: 'SK', status: 'not_eligible' }), settings, NOW)).toBe('—')
  })

  it('writes the student sub-line', () => {
    expect(studentSubline(row({ grade: '5' }))).toBe('Grade 5 · Ziad Teacher')
    expect(studentSubline(row({ grade: '5', homeroomTeacherName: null }))).toBe('Grade 5')
  })
})

describe('inviteReadiness', () => {
  it('is ready with an address and no conflict', () => {
    expect(inviteReadiness(row(), settings)).toEqual({ kind: 'ready', ready: true, note: 'Ready · amal.haddad@example.com' })
  })

  it('names why a student cannot be invited', () => {
    expect(inviteReadiness(row({ studentEmail: null }), settings).kind).toBe('no_email')
    expect(inviteReadiness(row({ grade: 'SK', status: 'not_eligible' }), settings)).toMatchObject({
      kind: 'not_eligible',
      note: 'Not eligible: student logins start at Grade 1',
    })
    const conflict = { kind: 'family_address' as const, message: "This is a parent's address on file. Use the student's own school address." }
    expect(inviteReadiness(row({ conflict }), settings)).toMatchObject({ kind: 'conflict', ready: false, note: conflict.message })
    expect(inviteReadiness(row({ status: 'invited', account: login() }), settings).kind).toBe('has_account')
  })
})

describe('rowActions', () => {
  it('offers invite only when the student is ready', () => {
    expect(rowActions(row())).toEqual(['edit_email', 'invite', 'link'])
    expect(rowActions(row({ studentEmail: null }))).toEqual(['edit_email', 'link'])
    expect(rowActions(row({ conflict: { kind: 'email_in_use', message: 'x' } }))).toEqual(['edit_email', 'link'])
  })

  it('an invited login can be resent, previewed, archived and deleted', () => {
    expect(rowActions(row({ status: 'invited', account: login(), qrEligible: true }))).toEqual([
      'edit_email', 'resend_invite', 'print_qr', 'view_as', 'unlink', 'archive', 'delete',
    ])
  })

  it('an active login is archived before it can be deleted', () => {
    const actions = rowActions(row({ status: 'active', account: login({ qr: { active: true, issuedAt: '2026-10-15T14:00:00.000Z', voidedAt: null } }) }))
    expect(actions).toEqual(['edit_email', 'reset_password', 'void_qr', 'view_as', 'unlink', 'archive'])
    expect(actions).not.toContain('delete')
  })

  it('an archived login can be restored or deleted', () => {
    expect(rowActions(row({ status: 'archived', account: login() }))).toEqual(['edit_email', 'unlink', 'unarchive', 'delete'])
  })
})

describe('filters', () => {
  const rows = [
    row({ studentId: 'a', name: 'Amal Haddad', grade: '2', status: 'active', account: login() }),
    row({ studentId: 'b', name: 'Sami Haddad', grade: '5', studentEmail: 'sami.haddad@example.com' }),
    row({ studentId: 'c', name: 'Rana Kareem', grade: 'SK', studentEmail: null, status: 'not_eligible' }),
  ]

  it('filters by grade, status and search', () => {
    expect(filterRows(rows, { grade: '5', status: '', q: '' }).map((r) => r.studentId)).toEqual(['b'])
    expect(filterRows(rows, { grade: '', status: 'active', q: '' }).map((r) => r.studentId)).toEqual(['a'])
    expect(filterRows(rows, { grade: '', status: '', q: 'SAMI.h' }).map((r) => r.studentId)).toEqual(['b'])
    expect(filterRows(rows, { grade: '', status: '', q: 'haddad' }).map((r) => r.studentId)).toEqual(['a', 'b'])
  })

  it('counts each status', () => {
    expect(countByStatus(rows)).toEqual({ not_invited: 1, invited: 0, active: 1, archived: 0, not_eligible: 1, needs_attention: 0 })
  })
})

describe('batching', () => {
  it('splits into batches', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([], 10)).toEqual([])
    expect(() => chunk([1], 0)).toThrow()
  })

  it('reads the skipped-student headers', () => {
    const headers = new Headers({ 'X-Skipped-Count': '2', 'X-Skipped-Students': 'a,b' })
    expect(readSkipped(headers)).toEqual({ count: 2, ids: ['a', 'b'] })
    // Over 50 skipped: the server sends only the count.
    expect(readSkipped(new Headers({ 'X-Skipped-Count': '60' }))).toEqual({ count: 60, ids: [] })
    expect(readSkipped(new Headers())).toEqual({ count: 0, ids: [] })
  })
})

describe('printing QR cards', () => {
  it('asks first, unless none of the students holds a card', () => {
    expect(printNeedsConfirm(1)).toBe(true)
    expect(printNeedsConfirm(5)).toBe(true)
    expect(printNeedsConfirm(null)).toBe(true) // the class People tab cannot tell
    expect(printNeedsConfirm(0)).toBe(false) // a first card voids nothing
  })

  it('says plainly that the old card stops working, for one student', () => {
    const c = printQrConfirm(['Amal Haddad'], 1)
    expect(c.warning).toBe("Printing a new card replaces Amal Haddad's old one. The old card stops working.")
    expect(c.title).toBe('Print a new QR card')
    expect(c.confirmLabel).toBe('Print QR card')
  })

  it('does not claim a card exists when the page cannot tell', () => {
    expect(printQrConfirm(['Amal Haddad'], null).warning).toBe(
      'If Amal Haddad already has a card, printing a new one replaces it. The old card stops working.',
    )
  })

  it('says it for several students, with how many hold a card', () => {
    const c = printQrConfirm(['A', 'B', 'C'], 2)
    expect(c.warning).toBe('Printing new cards replaces the old ones. The old cards stop working.')
    expect(c.title).toBe('Print 3 QR cards')
    expect(c.confirmLabel).toBe('Print 3 cards')
    expect(c.consequences.items.join(' ')).toContain('2 of these 3 students have a card now')
  })

  it('always mentions that a device already signed in stays signed in for a while', () => {
    expect(printQrConfirm(['A'], 1).consequences.items.join(' ')).toContain('at most 12 hours')
    expect(printQrConfirm(['A', 'B'], null).consequences.items.join(' ')).toContain('at most 12 hours')
  })
})

describe('student invitations: row sub-lines and actions', () => {
  const invite = (over: Partial<NonNullable<StudentAccountRow['invite']>> = {}) => ({
    state: 'pending' as const,
    sentAt: '2026-10-15T14:00:00.000Z',
    expiresAt: '2026-10-29T14:00:00.000Z',
    endedAt: null,
    error: null,
    ...over,
  })
  const invited = (over: Partial<StudentAccountRow> = {}) =>
    row({ status: 'invited', account: login(), invite: invite(), signInMethod: null, needsAttention: false, ...over })
  const allSettings = { loginFromGrade: '1', qrUntilGrade: '3', studentSignIn: 'google_or_password' } as const

  it('says where each invite stands', () => {
    expect(inviteSubline(invited(), allSettings, NOW)).toBe('Sent Oct 15 · expires Oct 29')
    expect(inviteSubline(invited({ invite: invite({ state: 'failed', error: 'Resend is down' }) }), allSettings, NOW)).toBe('Email failed · Resend')
    expect(inviteSubline(invited({ invite: invite({ state: 'expired', expiresAt: '2026-10-14T14:00:00.000Z' }) }), allSettings, NOW)).toBe('Expired Oct 14')
    expect(inviteSubline(invited({ invite: invite({ state: 'cancelled' }) }), allSettings, NOW)).toBe('Invite cancelled')
    expect(inviteSubline(invited({ invite: invite({ state: 'accepted' }) }), allSettings, NOW)).toBe('Address changed · send a new invite')
    expect(inviteSubline(invited({ invite: null }), allSettings, NOW)).toBe('No invite sent yet · Resend')
  })

  it('says how an active student signs in', () => {
    const active = (over: Partial<StudentAccountRow>) =>
      row({ status: 'active', account: login({ lastLoginAt: '2026-10-15T13:00:00.000Z' }), ...over })
    expect(inviteSubline(active({ signInMethod: 'google' }), allSettings, NOW)).toBe('Google · last signed in today')
    expect(inviteSubline(active({ signInMethod: 'password', account: login({ lastLoginAt: null }) }), allSettings, NOW)).toBe('Password · never signed in')
    expect(inviteSubline(active({ signInMethod: 'card' }), allSettings, NOW)).toBe('QR card · last signed in today')
    expect(inviteSubline(active({ signInMethod: 'card', grade: '4', needsAttention: true }), allSettings, NOW))
      .toBe('Card no longer works for Grade 4 · resend the invite')
  })

  it('has nothing to say without a login', () => {
    expect(inviteSubline(row(), allSettings, NOW)).toBeNull()
  })

  it('an open invite can be cancelled; a card student can be sent the invite again', () => {
    expect(rowActions(invited())).toEqual(
      ['edit_email', 'resend_invite', 'cancel_invite', 'view_as', 'unlink', 'archive', 'delete'],
    )
    expect(rowActions(invited({ invite: invite({ state: 'cancelled' }) }))).not.toContain('cancel_invite')
    const card = row({ status: 'active', account: login(), signInMethod: 'card' })
    expect(rowActions(card)).toContain('resend_invite')
    expect(rowActions(card)).not.toContain('reset_password')
  })

  it('a Google-only school has no student password to reset', () => {
    const active = row({ status: 'active', account: login(), signInMethod: 'google' })
    expect(rowActions(active, { studentSignIn: 'google_or_password' })).toContain('reset_password')
    expect(rowActions(active, { studentSignIn: 'google_only' })).not.toContain('reset_password')
  })

  it('counts and filters students who need attention', () => {
    const rows = [invited({ studentId: 'a', needsAttention: true }), invited({ studentId: 'b' })]
    expect(countByStatus(rows).needs_attention).toBe(1)
    expect(filterRows(rows, { grade: '', status: 'needs_attention', q: '' }).map((r) => r.studentId)).toEqual(['a'])
  })
})

describe('parseDomainList', () => {
  it('lowercases, drops a leading @, splits on commas or spaces and de-duplicates', () => {
    expect(parseDomainList(' Students.Example.org, @staff.example.org  students.example.org ')).toEqual({
      domains: ['students.example.org', 'staff.example.org'],
    })
    expect(parseDomainList('')).toEqual({ domains: [] })
  })
  it('names the first entry that is not a domain', () => {
    expect(parseDomainList('students.example.org, nope')).toEqual({
      error: '"nope" isn\'t a domain name. Write it like students.example.org.',
    })
  })
})

describe('peopleAccountLine (class People tab)', () => {
  it('says where an invite stands, or how an active student signs in', () => {
    const invite = { state: 'pending' as const, sentAt: '2026-10-15T14:00:00.000Z', expiresAt: '2026-10-29T14:00:00.000Z', endedAt: null, error: null }
    expect(peopleAccountLine({ status: 'invited', invite, signInMethod: null }, NOW)).toBe('Sent Oct 15 · expires Oct 29')
    expect(peopleAccountLine({ status: 'invited', invite: { ...invite, state: 'expired' }, signInMethod: null }, NOW)).toBe('Expired Oct 29')
    expect(peopleAccountLine({ status: 'active', invite: null, signInMethod: 'google' }, NOW)).toBe('Google')
    expect(peopleAccountLine({ status: 'active', invite: null, signInMethod: 'card' }, NOW)).toBe('QR card')
    expect(peopleAccountLine({ status: 'not_invited', invite: null, signInMethod: null }, NOW)).toBeNull()
  })
})

describe('groupInviteReview', () => {
  const allSettings = { loginFromGrade: '1', qrUntilGrade: '3', studentSignIn: 'google_or_password' } as const
  it('splits students into will-send, check-these and skipped, with the reason for each skip', () => {
    const rows = [
      row({ studentId: 'ok', name: 'Amal Haddad' }),
      row({ studentId: 'warn', name: 'Dina Nasser', warnings: [{ code: 'name_mismatch', message: "This address doesn't mention Dina or Nasser" }] }),
      row({ studentId: 'none', name: 'Omar Ali', studentEmail: null }),
      row({ studentId: 'shared', name: 'Sara Haddad', conflict: { kind: 'shared_with_student', message: 'Same address as Amal Haddad (Grade 2). Each student needs their own.' } }),
      row({ studentId: 'active', name: 'Rami Saleh', status: 'active', account: login() }),
      row({
        studentId: 'pending', name: 'Lina Kareem', status: 'invited', account: login(),
        invite: { state: 'pending', sentAt: '2026-10-15T14:00:00.000Z', expiresAt: '2026-10-29T14:00:00.000Z', endedAt: null, error: null },
      }),
      row({ studentId: 'sk', name: 'Yara Ali', grade: 'SK', status: 'not_eligible' }),
    ]
    const g = groupInviteReview(rows, allSettings, NOW)
    expect(g.send.map((r) => r.studentId)).toEqual(['ok'])
    expect(g.check.map((c) => [c.row.studentId, c.warnings.map((w) => w.code)])).toEqual([['warn', ['name_mismatch']]])
    expect(g.skipped.map((s) => [s.row.studentId, s.reason])).toEqual([
      ['none', 'No email yet.'],
      ['shared', 'Same address as Amal Haddad (Grade 2). Each student needs their own.'],
      ['active', 'Already active.'],
      ['pending', 'Invite already sent Oct 15 (expires Oct 29). Use Resend.'],
      ['sk', 'Not eligible: student logins start at Grade 1'],
    ])
  })
})
