/** Shared response envelope, matching the backend. */
export interface AssessmentPublicationResponse<T> {
  status: 'success' | 'failed'
  data?: T
  message?: string
}

/** Current publish state of one assessment. */
export interface AssessmentPublicationState {
  assessmentId: string
  isPublished: boolean
  publishedAt: string | null
  publishedBy: string | null
  comment: string | null
  lastBatchId: string | null
}

/** How many students have no usable grade on an assessment about to be published. */
export interface PublishWarning {
  assessmentId: string
  assessmentName: string
  ungradedStudentCount: number
  totalStudents: number
}

export interface PublishPreview {
  /** The full set after category cascade, not just what was ticked. */
  publishAssessmentIds: string[]
  cascadedChildIds: string[]
  /** Children skipped because nobody has a score for them yet. */
  skippedUngradedChildIds: string[]
  warnings: PublishWarning[]
  studentCount: number
  recipientCount: number
  studentsWithoutEmail: number
}

export type PublishEmailStatus = 'sent' | 'failed' | 'skipped'

export interface PublishEmailResult {
  studentId: string
  studentName: string
  status: PublishEmailStatus
  sentTo?: string[]
  error?: string
  reason?: string
}

export interface PublishEmailSummary {
  attempted: number
  sent: number
  failed: number
  skippedNoEmail: number
  results: PublishEmailResult[]
  /**
   * Set when the grades were published but the notification step could not
   * even be prepared. The publish is durable; only the emails didn't go out.
   */
  notificationError?: string
}

export interface PublishResult {
  batchId: string
  classId: string
  publishedAssessmentIds: string[]
  cascadedChildIds: string[]
  skippedUngradedChildIds: string[]
  emailSummary: PublishEmailSummary
}

export interface UnpublishResult {
  batchId: string | null
  classId: string
  unpublishedAssessmentIds: string[]
}

export interface PublicationHistoryEntry {
  batchId: string
  action: 'publish' | 'unpublish'
  batchComment: string | null
  studentWarningCount: number
  createdAt: string
  triggeredBy: { userId: string; name: string | null } | null
  assessments: { assessmentId: string; name: string; isParent: boolean }[]
  emailSummary: { sent: number; failed: number; skipped: number }
}

export type PublicationStateResponse = AssessmentPublicationResponse<AssessmentPublicationState[]>
export type PublishPreviewResponse = AssessmentPublicationResponse<PublishPreview>
export type PublishResponse = AssessmentPublicationResponse<PublishResult>
export type UnpublishResponse = AssessmentPublicationResponse<UnpublishResult>
export type PublicationHistoryResponse = AssessmentPublicationResponse<PublicationHistoryEntry[]>
export type UpdatePublicationCommentResponse = AssessmentPublicationResponse<{
  assessmentId: string
  comment: string | null
}>
