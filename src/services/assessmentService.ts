// src/services/assessmentService.ts

import apiClient from './apiClient'
import {
  AssessmentPayload,
  AssessmentResponse,
  AllAssessmentsResponse,
  CreateAssessmentRequest,
  ParentAssessmentCreateResponse,
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
 * Create a new assessment (can be standalone, parent, or child)
 * POST /assessments
 *
 * @param payload  Assessment creation payload with optional parent-child fields
 */
export const createAssessment = async (
  payload: CreateAssessmentRequest
): Promise<AssessmentResponse | ParentAssessmentCreateResponse> => {
  return apiClient<AssessmentResponse | ParentAssessmentCreateResponse>(`/assessments`, {
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

export interface StudentAssessmentPayload {
  studentId: string;
  assessmentId: string;
  score: number | null;
}

/**
 * Response wrapper for single student-assessment fetch
 */
export interface StudentAssessmentResponse {
  status: string;
  data: StudentAssessmentPayload | null;
  message?: string;
}

/**
 * Fetch a single student-assessment by student and assessment IDs
 * GET /api/studentAssessments/:studentId/:assessmentId
 */
export const getStudentAssessment = async (
  studentId: string,
  assessmentId: string
): Promise<StudentAssessmentResponse> => {
  return apiClient<StudentAssessmentResponse>(
    `/studentAssessments/${encodeURIComponent(studentId)}/${encodeURIComponent(assessmentId)}`
  )
}

/**
 * Batch update multiple assessments
 * PATCH /assessments/batch
 */
export interface BatchUpdateRequest {
  updates: Array<{
    assessmentId: string
    name?: string
    weightPercent?: number
    weightPoints?: number
    maxScore?: number
    sortOrder?: number
  }>
}

export const batchUpdateAssessments = async (
  payload: BatchUpdateRequest
): Promise<AllAssessmentsResponse> => {
  return apiClient<AllAssessmentsResponse>(`/assessments/batch`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  })
}