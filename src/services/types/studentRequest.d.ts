// Student account requests: a student's ask from the public signup page,
// reviewed on the Approvals page (backend services/classroom/studentRequests.js).

import type { GradeCode } from './studentAccount'

export interface StudentRequestBody {
  school: string
  firstName: string
  lastName: string
  grade: GradeCode
  email: string
  /** Honeypot: people never see or fill it. */
  website?: string
}

export interface RequestSuggestion {
  studentId: string
  name: string
  grade: GradeCode
  kind: 'exact' | 'close'
  hasLogin: boolean
}

export interface StudentRequest {
  requestId: string
  firstName: string
  lastName: string
  name: string
  /** As the student typed it: a hint, not a fact. */
  grade: GradeCode
  /** Typed by the student, not verified. */
  email: string
  status: 'pending' | 'declined'
  createdAt: string
  decidedAt: string | null
  /** An account already uses this address. */
  addressTaken: boolean
  /** The likeliest student (pending requests only). */
  suggestion: RequestSuggestion | null
}

/** Same shape as the invite flow's EmailProblem, plus below_login_grade and has_login. */
export interface RequestProblem {
  code: string
  blocking: boolean
  message: string
}

export interface RequestCandidate {
  studentId: string
  name: string
  grade: GradeCode
  /** 'picked' = chosen by the admin from the full list. */
  kind: 'exact' | 'close' | 'picked'
  hasLogin: boolean
  currentEmail: string | null
  problems: RequestProblem[]
}

export interface RequestCandidates {
  request: Omit<StudentRequest, 'suggestion'>
  /** The address the problems were checked for. */
  email: string
  noticeVersion: string
  candidates: RequestCandidate[]
  students: { studentId: string; name: string; grade: GradeCode; hasLogin: boolean }[]
}

export interface ApproveRequestBody {
  studentId: string
  email: string
  consentConfirmed: true
  noticeVersion?: string
}

export interface ApproveRequestResult {
  request: Omit<StudentRequest, 'suggestion' | 'status'> & { status: 'approved' }
  invite: { userId: string; inviteSent: boolean; message: string }
}
