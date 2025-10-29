// src/services/excludedAssessmentService.ts

import apiClient from './apiClient'

/**
 * Types for excluded assessment operations
 */
export interface ExcludedAssessmentPayload {
  studentId: string
  classId: string
  assessmentId: string
  createdAt: string
}

export interface CreateExclusionRequest {
  studentId: string
  classId: string
  assessmentId: string
}

export interface ExcludedAssessmentResponse {
  status: string
  data?: ExcludedAssessmentPayload
  message?: string
}

export interface AllExcludedAssessmentsResponse {
  status: string
  data: ExcludedAssessmentPayload[]
  message?: string
}

export interface CheckExclusionResponse {
  status: string
  data: {
    isExcluded: boolean
  }
  message?: string
}

/**
 * Create a new assessment exclusion
 * POST /excluded-assessments
 */
export const createExclusion = async (
  payload: CreateExclusionRequest
): Promise<ExcludedAssessmentResponse> => {
  return apiClient<ExcludedAssessmentResponse>(`/excluded-assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  })
}

/**
 * Remove an assessment exclusion
 * DELETE /excluded-assessments/:studentId/:classId/:assessmentId
 */
export const deleteExclusion = async (
  studentId: string,
  classId: string,
  assessmentId: string
): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(
    `/excluded-assessments/${encodeURIComponent(studentId)}/${encodeURIComponent(classId)}/${encodeURIComponent(assessmentId)}`,
    {
      method: 'DELETE',
    }
  )
}

/**
 * Get all excluded assessments for a student in a specific class
 * GET /excluded-assessments/:studentId/:classId
 */
export const getExclusionsByStudentAndClass = async (
  studentId: string,
  classId: string
): Promise<AllExcludedAssessmentsResponse> => {
  return apiClient<AllExcludedAssessmentsResponse>(
    `/excluded-assessments/${encodeURIComponent(studentId)}/${encodeURIComponent(classId)}`
  )
}

/**
 * Check if specific assessment is excluded for student in class
 * GET /excluded-assessments/:studentId/:classId/:assessmentId/check
 */
export const checkExclusion = async (
  studentId: string,
  classId: string,
  assessmentId: string
): Promise<CheckExclusionResponse> => {
  return apiClient<CheckExclusionResponse>(
    `/excluded-assessments/${encodeURIComponent(studentId)}/${encodeURIComponent(classId)}/${encodeURIComponent(assessmentId)}/check`
  )
}

/**
 * Get all excluded assessments for an entire class
 * GET /excluded-assessments/class/:classId
 */
export const getExclusionsByClass = async (
  classId: string
): Promise<AllExcludedAssessmentsResponse> => {
  return apiClient<AllExcludedAssessmentsResponse>(
    `/excluded-assessments/class/${encodeURIComponent(classId)}`
  )
}