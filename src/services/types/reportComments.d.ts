// Report comment rules: word limits and the review lock (/report-comments).
import type { ClassCommentRules, ClassCommentStanding, CommentKind, CommentLimits, CommentRule } from '@/lib/commentRules'

export interface SchoolCommentLimits {
  reportCard: CommentLimits
  progressReport: CommentLimits
}

export interface TermCommentLock {
  locked: boolean
  lockedAt: string | null
  /** Who locked it, by name; null when unknown or not locked. */
  lockedBy: string | null
}

export interface ReviewClass {
  classId: string
  subject: string
  grade: string
  teacherName: string | null
  /** JK and SK follow the term: no exception of their own, nothing counted. */
  kindergarten: boolean
  reportCard: ClassCommentStanding
  progressReport: ClassCommentStanding
}

export interface CommentsOverview {
  limits: SchoolCommentLimits
  /** The term shown; null when the school has no term yet. */
  term: { termId: string; name: string; isActive: boolean } | null
  termLocks: { reportCard: TermCommentLock; progressReport: TermCommentLock }
  classes: ReviewClass[]
}

export interface ClassCommentRulesResponse {
  status: string
  data: ClassCommentRules
  message?: string
}

export interface CommentsOverviewResponse {
  status: string
  data: CommentsOverview
  message?: string
}

export interface CommentLimitsResponse {
  status: string
  data: SchoolCommentLimits
  message?: string
}

export interface ClassCommentLockResponse {
  status: string
  data: CommentRule & { classId: string; kind: CommentKind }
  message?: string
}
