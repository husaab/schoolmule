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
  qrCardText,
  readSkipped,
  rowActions,
  settingsSummary,
  shortDate,
  studentSubline,
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
    expect(countByStatus(rows)).toEqual({ not_invited: 1, invited: 0, active: 1, archived: 0, not_eligible: 1 })
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
