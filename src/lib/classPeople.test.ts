import { describe, expect, it } from 'vitest'
import {
  avatarPickerSubtitle,
  chipCounts,
  filterPeople,
  inviteButtonText,
  inviteCandidates,
  parsePeopleFilter,
  parentsText,
  qrPrintedMessage,
  studentMenuActions,
  teacherRoleLine,
} from './classPeople'
import type { AccountStatus } from '@/services/types/studentAccount'
import type { PeopleStudent } from '@/services/types/classroom'

const student = (
  name: string,
  status: AccountStatus,
  extra: { missing?: number; parents?: string[]; qr?: boolean } = {},
): PeopleStudent => ({
  studentId: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  avatar: null,
  photoUrl: null,
  account: { status, userId: status === 'active' || status === 'invited' ? `u-${name}` : null, lastSeenAt: null, qrEligible: extra.qr ?? false },
  parents: (extra.parents ?? []).map((p) => ({ name: p, relation: null, hasAccount: true })),
  missingCount: extra.missing ?? 0,
})

const roster = [
  student('Amal Haddad', 'active', { parents: ['Rana Haddad'] }),
  student('Sami Kareem', 'invited', { parents: ['Dina Kareem', 'Omar Kareem'] }),
  student('Lina Farouk', 'not_invited', { missing: 2, parents: ['Hadi Farouk'] }),
  student('Tariq Noor', 'not_eligible'),
  student('Yara Saleh', 'active', { missing: 1, parents: ['Zeina Saleh'] }),
]

describe('teacherRoleLine', () => {
  it('names the lead teacher with the homeroom grade', () => {
    expect(teacherRoleLine({ role: 'lead', homeroomGrade: '5' })).toBe('Lead teacher · homeroom Grade 5')
    expect(teacherRoleLine({ role: 'lead', homeroomGrade: 'JK' })).toBe('Lead teacher · homeroom JK')
    expect(teacherRoleLine({ role: 'lead', homeroomGrade: null })).toBe('Lead teacher')
  })
  it('names a co-teacher', () => {
    expect(teacherRoleLine({ role: 'co', homeroomGrade: null })).toBe('Co-teacher')
  })
})

describe('parentsText', () => {
  it('joins parent names the way people say them', () => {
    expect(parentsText([])).toBe('')
    expect(parentsText([{ name: 'Rana Haddad' }])).toBe('Rana Haddad')
    expect(parentsText([{ name: 'Dina Kareem' }, { name: 'Omar Kareem' }])).toBe('Dina Kareem and Omar Kareem')
    expect(parentsText([{ name: 'A' }, { name: 'B' }, { name: 'C' }])).toBe('A, B and C')
  })
})

describe('parsePeopleFilter', () => {
  it('accepts the two chips and falls back to All', () => {
    expect(parsePeopleFilter('not-signed-in')).toBe('not-signed-in')
    expect(parsePeopleFilter('missing')).toBe('missing')
    expect(parsePeopleFilter('')).toBe('')
    expect(parsePeopleFilter('bogus')).toBe('')
    expect(parsePeopleFilter(null)).toBe('')
  })
})

describe('filterPeople', () => {
  it('returns everyone for All', () => {
    expect(filterPeople(roster, { filter: '', q: '' })).toHaveLength(5)
  })
  it('"Not signed in yet" is not-invited plus invited, not eligible or active', () => {
    expect(filterPeople(roster, { filter: 'not-signed-in', q: '' }).map((s) => s.name)).toEqual(['Sami Kareem', 'Lina Farouk'])
  })
  it('"Missing work" is students with at least one missing item', () => {
    expect(filterPeople(roster, { filter: 'missing', q: '' }).map((s) => s.name)).toEqual(['Lina Farouk', 'Yara Saleh'])
  })
  it('searches student and parent names, case-insensitively', () => {
    expect(filterPeople(roster, { filter: '', q: 'kareem' }).map((s) => s.name)).toEqual(['Sami Kareem'])
    expect(filterPeople(roster, { filter: '', q: '  ZEINA ' }).map((s) => s.name)).toEqual(['Yara Saleh'])
    expect(filterPeople(roster, { filter: '', q: 'omar' }).map((s) => s.name)).toEqual(['Sami Kareem'])
  })
  it('combines the chip and the search', () => {
    expect(filterPeople(roster, { filter: 'missing', q: 'lina' }).map((s) => s.name)).toEqual(['Lina Farouk'])
    expect(filterPeople(roster, { filter: 'missing', q: 'sami' })).toEqual([])
  })
})

describe('chipCounts and invite candidates', () => {
  it('counts the chips', () => {
    expect(chipCounts(roster)).toEqual({ all: 5, notSignedIn: 2, missing: 2 })
  })
  it('invites only eligible students who are not invited yet', () => {
    expect(inviteCandidates(roster).map((s) => s.name)).toEqual(['Lina Farouk'])
    expect(inviteButtonText(3)).toBe('Invite 3 students')
    expect(inviteButtonText(1)).toBe('Invite 1 student')
  })
})

describe('studentMenuActions', () => {
  it('offers view and message to everyone', () => {
    expect(studentMenuActions(student('A', 'not_eligible'))).toEqual(['view', 'message', 'change_avatar'])
  })
  it('offers resend for an open invite', () => {
    expect(studentMenuActions(student('A', 'invited', { qr: true }))).toEqual([
      'view',
      'message',
      'resend_invite',
      'print_qr',
      'change_avatar',
    ])
  })
  it('offers reset for an active login and no avatar picking', () => {
    expect(studentMenuActions(student('A', 'active'))).toEqual(['view', 'message', 'reset_password'])
    expect(studentMenuActions(student('A', 'active', { qr: true }))).toEqual(['view', 'message', 'reset_password', 'print_qr'])
  })
  it('lets a teacher pick the avatar of a student who has not signed in', () => {
    expect(studentMenuActions(student('A', 'not_invited'))).toContain('change_avatar')
    expect(studentMenuActions(student('A', 'archived'))).toContain('change_avatar')
  })
})

describe('qrPrintedMessage', () => {
  it('warns that older cards stop working', () => {
    expect(qrPrintedMessage(0)).toBe('QR card printed. Older cards for this student no longer work.')
  })
  it('explains a skipped card', () => {
    expect(qrPrintedMessage(1)).toMatch(/no card to print/)
  })
})

describe('avatarPickerSubtitle', () => {
  it('names the student, never a pronoun', () => {
    expect(avatarPickerSubtitle(student('Lina Farouk', 'not_invited'))).toBe(
      'Until Lina signs in and picks one, this is the avatar everyone sees.',
    )
    expect(avatarPickerSubtitle(student('Tariq Noor', 'not_eligible'))).toBe(
      'Tariq is in a grade that does not sign in, so you choose the avatar everyone sees.',
    )
  })
})
