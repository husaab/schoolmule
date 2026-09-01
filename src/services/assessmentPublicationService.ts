import apiClient from './apiClient'
import {
  PublicationStateResponse,
  PublishPreviewResponse,
  PublishResponse,
  UnpublishResponse,
  PublicationHistoryResponse,
  UpdatePublicationCommentResponse,
} from './types/assessmentPublication'

const base = (classId: string) =>
  `/assessment-publications/classes/${encodeURIComponent(classId)}`

/**
 * Publish state for every assessment in a class.
 * GET /assessment-publications/classes/:classId
 */
export const getPublicationState = async (
  classId: string
): Promise<PublicationStateResponse> => {
  return apiClient<PublicationStateResponse>(base(classId))
}

/**
 * What publishing this selection would do: category cascade, ungraded
 * warnings, recipient counts. Shares its code path with the real publish,
 * so the modal can't promise something the send won't do.
 * POST /assessment-publications/classes/:classId/preview
 */
export const previewPublish = async (
  classId: string,
  assessmentIds: string[]
): Promise<PublishPreviewResponse> => {
  return apiClient<PublishPreviewResponse, { assessmentIds: string[] }>(
    `${base(classId)}/preview`,
    { method: 'POST', body: { assessmentIds } }
  )
};

/**
 * Publish assessments and email the affected guardians.
 * POST /assessment-publications/classes/:classId/publish
 */
export const publishAssessments = async (
  classId: string,
  payload: {
    assessmentIds: string[]
    batchComment?: string
    assessmentComments?: Record<string, string>
  }
): Promise<PublishResponse> => {
  return apiClient<PublishResponse, typeof payload>(`${base(classId)}/publish`, {
    method: 'POST',
    body: payload,
  })
}

/**
 * Hide assessments from parents again. Does not cascade to a category's
 * children — select them explicitly to roll back a whole category.
 * POST /assessment-publications/classes/:classId/unpublish
 */
export const unpublishAssessments = async (
  classId: string,
  assessmentIds: string[]
): Promise<UnpublishResponse> => {
  return apiClient<UnpublishResponse, { assessmentIds: string[] }>(
    `${base(classId)}/unpublish`,
    { method: 'POST', body: { assessmentIds } }
  )
}

/**
 * Edit the parent-facing note on one assessment. Silent — no new email.
 * PATCH /assessment-publications/classes/:classId/assessments/:assessmentId/comment
 */
export const updatePublicationComment = async (
  classId: string,
  assessmentId: string,
  comment: string | null
): Promise<UpdatePublicationCommentResponse> => {
  return apiClient<UpdatePublicationCommentResponse, { comment: string | null }>(
    `${base(classId)}/assessments/${encodeURIComponent(assessmentId)}/comment`,
    { method: 'PATCH', body: { comment } }
  )
}

/**
 * Publish/unpublish history for a class.
 * GET /assessment-publications/classes/:classId/history
 */
export const getPublicationHistory = async (
  classId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<PublicationHistoryResponse> => {
  const params = new URLSearchParams()
  if (opts.limit != null) params.set('limit', String(opts.limit))
  if (opts.offset != null) params.set('offset', String(opts.offset))
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiClient<PublicationHistoryResponse>(`${base(classId)}/history${query}`)
}
