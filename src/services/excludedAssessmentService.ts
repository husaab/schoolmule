// src/services/excludedAssessmentService.ts
//
// Legacy read-only helpers. "Excluded" is now the 'excused' cell status on
// student_assessments; the grid and the Excused assessments modal read it
// from the class score matrix and change it with setScoreStatus() in
// classService. These GETs remain for the transition only — do not add
// writes here.

import apiClient from './apiClient'

export interface ExcludedAssessmentPayload {
  studentId: string
  classId: string
  assessmentId: string
  createdAt: string
}

export interface AllExcludedAssessmentsResponse {
  status: string
  data: ExcludedAssessmentPayload[]
  message?: string
}

/**
 * Get all excused assessments for a student in a specific class
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
 * Get all excused assessments for an entire class
 * GET /excluded-assessments/class/:classId
 */
export const getExclusionsByClass = async (
  classId: string
): Promise<AllExcludedAssessmentsResponse> => {
  return apiClient<AllExcludedAssessmentsResponse>(
    `/excluded-assessments/class/${encodeURIComponent(classId)}`
  )
}
