import { describe, it, expect } from 'vitest'
import { ApiError } from '@/services/apiClient'
import type { RequestCandidate, StudentRequest } from '@/services/types/studentRequest'
import {
  approveBlocker,
  blockingProblems,
  defaultStudentId,
  matchesRequest,
  requestSubmitError,
  splitRequests,
  suggestionLabel,
  validateRequestForm,
} from './studentRequests'

const FORM = { firstName: 'Amal', lastName: 'Haddad', grade: '5', email: 'amal.haddad@example.com' }

describe('validateRequestForm (same rules as the server)', () => {
  it('passes a complete form', () => {
    expect(validateRequestForm(FORM)).toEqual({})
    expect(validateRequestForm({ ...FORM, grade: 'JK', email: '  amal@students.example.org ' })).toEqual({})
  })
  it('names every field that is wrong', () => {
    expect(validateRequestForm({ firstName: ' ', lastName: '', grade: '', email: 'amal@' })).toEqual({
      firstName: 'Enter your first name',
      lastName: 'Enter your last name',
      grade: 'Choose your grade',
      email: 'Enter your school email address',
    })
    expect(validateRequestForm({ ...FORM, lastName: 'x'.repeat(61), grade: '9' })).toEqual({
      lastName: 'Up to 60 characters', grade: 'Choose your grade',
    })
  })
})

describe('requestSubmitError', () => {
  it("keeps the server's words for a reason the student can act on", () => {
    expect(requestSubmitError(new ApiError('Use your school email address (…@students.example.org).', { status: 400, code: 'EMAIL_DOMAIN' })))
      .toBe('Use your school email address (…@students.example.org).')
    expect(requestSubmitError(new ApiError('Too many requests from this network. Please try again later.', { status: 429 })))
      .toBe('Too many requests from this network. Please try again later.')
  })
  it('falls back for a server or network failure', () => {
    expect(requestSubmitError(new ApiError('Internal error', { status: 500 }))).toBe(
      "Your request couldn't be sent. Check your connection and try again.",
    )
    expect(requestSubmitError(new Error('offline'))).toBe("Your request couldn't be sent. Check your connection and try again.")
  })
})

const req = (overrides: Partial<StudentRequest> = {}): StudentRequest => ({
  requestId: 'r1', firstName: 'Amal', lastName: 'Haddad', name: 'Amal Haddad', grade: '5', email: 'amal.haddad@example.com',
  status: 'pending', createdAt: '2026-10-19T14:00:00.000Z', decidedAt: null, addressTaken: false, suggestion: null, ...overrides,
})

describe('the Approvals page list', () => {
  it('splits pending from declined and searches name or address', () => {
    const list = [req(), req({ requestId: 'r2', status: 'declined', name: 'Rami Omar', email: 'rami@example.com' })]
    expect(splitRequests(list)).toEqual({ pending: [list[0]], declined: [list[1]] })
    expect(matchesRequest(list[1], 'RAMI')).toBe(true)
    expect(matchesRequest(list[0], 'amal.haddad@')).toBe(true)
    expect(matchesRequest(list[0], 'rami')).toBe(false)
    expect(matchesRequest(list[0], '  ')).toBe(true)
  })
  it('labels a suggestion by how sure it is', () => {
    expect(suggestionLabel('exact')).toBe('Likely match')
    expect(suggestionLabel('close')).toBe('Possible match')
    expect(suggestionLabel('picked')).toBe('Your pick')
  })
})

const cand = (overrides: Partial<RequestCandidate> = {}): RequestCandidate => ({
  studentId: 's1', name: 'Amal Haddad', grade: '5', kind: 'exact', hasLogin: false, currentEmail: null, problems: [], ...overrides,
})
const BLOCK = { code: 'email_in_use', blocking: true, message: 'A parent account uses this email.' }
const WARN = { code: 'outside_domain', blocking: false, message: "This address isn't on the school's student domain." }

describe('the review', () => {
  it('preselects only one exact suggestion with nothing blocking it', () => {
    expect(defaultStudentId([cand(), cand({ studentId: 's2', kind: 'close' })])).toBe('s1')
    expect(defaultStudentId([cand({ problems: [WARN] })])).toBe('s1')
    expect(defaultStudentId([cand({ problems: [BLOCK] })])).toBeNull()
    expect(defaultStudentId([cand({ kind: 'close' })])).toBeNull()
    expect(defaultStudentId([])).toBeNull()
  })
  it('keeps warnings apart from what blocks', () => {
    expect(blockingProblems([WARN, BLOCK])).toEqual([BLOCK])
  })
  it('says why Approve is off, in the order the admin fixes things', () => {
    const ok = { studentId: 's1', email: 'amal@example.com', consent: true, problems: [WARN], checking: false }
    expect(approveBlocker(ok)).toBeNull()
    expect(approveBlocker({ ...ok, studentId: null })).toBe("Choose the student's record")
    expect(approveBlocker({ ...ok, email: 'amal@' })).toBe('Enter a valid email address')
    expect(approveBlocker({ ...ok, checking: true })).toBe('Checking the address…')
    expect(approveBlocker({ ...ok, problems: [WARN, BLOCK] })).toBe('A parent account uses this email.')
    expect(approveBlocker({ ...ok, consent: false })).toBe('Confirm parental consent')
  })
})
