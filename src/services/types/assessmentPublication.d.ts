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
  /** Blank cells: not yet graded, left out of the send. */
  ungradedStudentCount: number
  /** Cells marked missing: count as 0 and are included. Older servers omit it. */
  missingStudentCount?: number
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

/** What a publish queued: the parents' emails go out from the queue, not the request. */
export interface PublishDelivery {
  batchId: string
  /** Students whose guardians get an email ("Emailing N families"). */
  families: number
  /** Students with no guardian email on file. */
  noEmail: number
}

export interface PublishResult {
  batchId: string
  classId: string
  publishedAssessmentIds: string[]
  cascadedChildIds: string[]
  skippedUngradedChildIds: string[]
  /** Servers from before the email queue omit it (they sent inside the request). */
  delivery?: PublishDelivery
  /** The old, sent-in-the-request summary; a queued publish fills it with placeholders. */
  emailSummary: PublishEmailSummary
}

/** One email's state: queued, sent, failed (Retry), or skipped (with why). */
export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export interface DeliveryRecipient {
  email: string
  status: DeliveryStatus
  error: string | null
  reason: string | null
  sentAt: string | null
}

/** A student's emails: `status` is the worst of their addresses (queued, then failed). */
export interface DeliveryStudent {
  studentId: string
  studentName: string | null
  status: DeliveryStatus
  /** Why nothing was sent (no guardian email on file, unpublished before it was sent…). */
  reason: string | null
  recipients: DeliveryRecipient[]
}

export interface BatchDelivery {
  batchId: string
  /** Per student. */
  counts: Record<DeliveryStatus, number>
  students: DeliveryStudent[]
}

export interface RetryDeliveryResult extends BatchDelivery {
  /** Failed emails queued again. */
  requeued: number
  /** Addresses added since, now queued. */
  added: number
  /** Failed addresses no longer on file, dropped. */
  dropped: number
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
  /** Per student. `queued` publishes (since the email queue) also count what is still waiting. */
  emailSummary: { sent: number; failed: number; skipped: number; pending?: number; queued?: boolean }
}

/** What a "send me a preview" produced. */
export interface PublishPreviewEmail {
  sentTo: string
  /** The student whose digest was used as the sample. */
  sampleStudentName: string
  /** How many guardian addresses a real publish would reach. */
  recipientCount: number
}

export type PublicationStateResponse = AssessmentPublicationResponse<AssessmentPublicationState[]>
export type PublishPreviewEmailResponse = AssessmentPublicationResponse<PublishPreviewEmail>
export type PublishPreviewResponse = AssessmentPublicationResponse<PublishPreview>
export type PublishResponse = AssessmentPublicationResponse<PublishResult>
export type UnpublishResponse = AssessmentPublicationResponse<UnpublishResult>
export type PublicationHistoryResponse = AssessmentPublicationResponse<PublicationHistoryEntry[]>
export type BatchDeliveryResponse = AssessmentPublicationResponse<BatchDelivery>
export type RetryDeliveryResponse = AssessmentPublicationResponse<RetryDeliveryResult>
export type UpdatePublicationCommentResponse = AssessmentPublicationResponse<{
  assessmentId: string
  comment: string | null
}>
