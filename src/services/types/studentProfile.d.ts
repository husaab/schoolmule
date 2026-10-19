// src/services/types/studentProfile.d.ts
//
// The staff student profile (/students/[id]). Mirrors
// GET /api/students/:id/overview and GET /api/students/:id/grades.

import type { StudentPayload } from './student'
import type { StudentData } from './analytics'

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT'

export interface AttendanceSummary {
  presentDays: number
  lateDays: number
  absentDays: number
  totalDays: number
  /** PRESENT + LATE over every recorded day; null with no records. */
  pct: number | null
}

export interface AttendanceDay {
  /** YYYY-MM-DD */
  date: string
  status: AttendanceStatus | null
}

/** One term of the student's school year, with its headline numbers. */
export interface ProfileTerm {
  termId: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  /** Mean of the term's class grades; null when nothing is graded. */
  avg: number | null
  subjects: { subject: string; pct: number | null }[]
  attendance: AttendanceSummary
}

export interface ProfileEnrollment {
  classId: string
  subject: string
  grade: string
  teacherId: string | null
  teacherName: string | null
  termId: string | null
}

export interface GuardianAccount {
  linkId: string
  name: string | null
  email: string | null
  phone: string | null
  relation: string | null
  /** linked = has a portal account; invited = invite still out; none = contact only. */
  status: 'linked' | 'invited' | 'none'
}

export interface ReportFile {
  term: string
  filePath: string
  generatedAt: string
  emailSent: boolean
  emailSentAt: string | null
}

export interface ReportCardComment {
  classId: string
  subject: string
  teacherName: string | null
  term: string
  workHabits: string | null
  behavior: string | null
  comment: string | null
}

export interface ProgressComment {
  classId: string
  subject: string
  teacherName: string | null
  term: string
  coreStandards: string | null
  workHabit: string | null
  behavior: string | null
  comment: string | null
}

export interface StudentProfileStudent extends StudentPayload {
  homeroomTeacherName: string | null
}

export interface StudentOverview {
  student: StudentProfileStudent
  /** JK/SK are graded on competencies and have no numeric averages. */
  gradingMode: 'numeric' | 'competency'
  defaultTermId: string | null
  terms: ProfileTerm[]
  enrollments: ProfileEnrollment[]
  attendance: { summary: AttendanceSummary; days: AttendanceDay[] }
  guardianAccounts: GuardianAccount[]
  reports: {
    reportCards: ReportFile[]
    progressReports: ReportFile[]
    reportCardFeedback: ReportCardComment[]
    progressFeedback: ProgressComment[]
  }
}

export interface StudentOverviewResponse {
  status: string
  data: StudentOverview
  message?: string
}

export interface StudentTermGrades {
  termId: string | null
  /** Same shape as the analytics student view; null when nothing is graded numerically that term. */
  detail: StudentData | null
}

export interface StudentTermGradesResponse {
  status: string
  data: StudentTermGrades
  message?: string
}
