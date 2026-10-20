// src/lib/studentRequests.ts
// Pure rules behind student account requests: the public "Request an
// account" form (/signup/[school]/student) and the Approvals page's Students
// review. The server has the last word on every rule here
// (services/classroom/studentRequestRules.js). Unit-tested
// (studentRequests.test.ts).

import { isApiError } from '@/services/apiClient'
import type { GradeCode } from '@/services/types/studentAccount'
import type { RequestCandidate, RequestProblem, StudentRequest } from '@/services/types/studentRequest'

export const NAME_MAX = 60
export const EMAIL_MAX = 254
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GRADE_CODES: readonly GradeCode[] = ['JK', 'SK', '1', '2', '3', '4', '5', '6', '7', '8']

export interface RequestFormValues {
  firstName: string
  lastName: string
  grade: string
  email: string
}

export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>

/** What's wrong with the form, field by field (empty when it can be sent). */
export const validateRequestForm = (v: RequestFormValues): RequestFormErrors => {
  const errors: RequestFormErrors = {}
  const first = v.firstName.trim()
  const last = v.lastName.trim()
  const email = v.email.trim()
  if (!first) errors.firstName = 'Enter your first name'
  else if (first.length > NAME_MAX) errors.firstName = `Up to ${NAME_MAX} characters`
  if (!last) errors.lastName = 'Enter your last name'
  else if (last.length > NAME_MAX) errors.lastName = `Up to ${NAME_MAX} characters`
  if (!(GRADE_CODES as readonly string[]).includes(v.grade)) errors.grade = 'Choose your grade'
  if (!email || email.length > EMAIL_MAX || !EMAIL_RE.test(email)) errors.email = 'Enter your school email address'
  return errors
}

/** The words for a request that couldn't be sent: the server's when it gave a reason. */
export const requestSubmitError = (err: unknown): string => {
  if (isApiError(err) && err.message && (err.code || (err.status >= 400 && err.status < 500))) return err.message
  return "Your request couldn't be sent. Check your connection and try again."
}

// ---------------------------------------------------------------------------
// The Approvals page

export const splitRequests = (list: StudentRequest[]) => ({
  pending: list.filter((r) => r.status === 'pending'),
  declined: list.filter((r) => r.status === 'declined'),
})

/** The page's search box: name or address, any case. */
export const matchesRequest = (r: StudentRequest, query: string): boolean => {
  const q = query.trim().toLowerCase()
  return !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
}

export const suggestionLabel = (kind: RequestCandidate['kind']): string =>
  kind === 'exact' ? 'Likely match' : kind === 'close' ? 'Possible match' : 'Your pick'

export const blockingProblems = (problems: RequestProblem[]): RequestProblem[] => problems.filter((p) => p.blocking)

/**
 * The student to preselect: only one exact suggestion with nothing blocking
 * it. Anything less certain waits for the admin to choose.
 */
export const defaultStudentId = (candidates: RequestCandidate[]): string | null => {
  const exact = candidates.filter((c) => c.kind === 'exact')
  return exact.length === 1 && blockingProblems(exact[0].problems).length === 0 ? exact[0].studentId : null
}

/** Why "Approve and send invite" is off, or null when it can be pressed. */
export const approveBlocker = (p: {
  studentId: string | null
  email: string
  consent: boolean
  problems: RequestProblem[]
  checking: boolean
}): string | null => {
  if (!p.studentId) return "Choose the student's record"
  if (!EMAIL_RE.test(p.email.trim())) return 'Enter a valid email address'
  if (p.checking) return 'Checking the address…'
  const [block] = blockingProblems(p.problems)
  if (block) return block.message
  if (!p.consent) return 'Confirm parental consent'
  return null
}
