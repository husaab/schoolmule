// src/services/assessmentService.ts

import apiClient from './apiClient'
import {
  AssessmentPayload,
  AssessmentResponse,
  AllAssessmentsResponse,
} from './types/assessment'

/**
 * Fetch a single assessment by its ID
 * GET /assessments/:id
 */
export const getAssessmentById = async (
  id: string
): Promise<AssessmentResponse> => {
  return apiClient<AssessmentResponse>(`/assessments/${id}`)
}

/**
 * Fetch all assessments belonging to a given class
 * GET /assessments/class/:classId
 */
export const getAssessmentsByClass = async (
  classId: string
): Promise<AllAssessmentsResponse> => {
  return apiClient<AllAssessmentsResponse>(
    `/assessments/class/${encodeURIComponent(classId)}`
  )
}

/**
 * Create a new assessment
 * POST /assessments
 *
 * @param payload  Must include:
 *   - classId:        string
 *   - name:           string
 *   - weightPercent:  number
 */
export const createAssessment = async (
  payload: Omit<AssessmentPayload, 'assessmentId' | 'createdAt' | 'lastModifiedAt'>
): Promise<AssessmentResponse> => {
  return apiClient<AssessmentResponse>(`/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  })
}

/**
 * Update an existing assessment (PATCH)
 * PATCH /assessments/:id
 *
 * @param id         Assessment UUID
 * @param payload    One or more of:
 *   - classId?:       string
 *   - name?:          string
 *   - weightPercent?: number
 */
export const updateAssessment = async (
  id: string,
  payload: Partial<
    Omit<AssessmentPayload, 'assessmentId' | 'createdAt' | 'lastModifiedAt'>
  >
): Promise<AssessmentResponse> => {
  return apiClient<AssessmentResponse>(`/assessments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  })
}

/**
 * Delete an assessment by its ID
 * DELETE /assessments/:id
 */
export const deleteAssessment = async (
  id: string
): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(`/assessments/${id}`, {
    method: 'DELETE',
  })
}
