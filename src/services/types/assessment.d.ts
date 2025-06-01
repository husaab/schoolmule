// src/services/types/assessment.ts

/**
 * Represents a single assessment (marking-scheme item) as returned by the API
 */
export interface AssessmentPayload {
  assessmentId:   string
  classId:        string
  name:           string
  weightPercent:  number
  createdAt:      string
  lastModifiedAt: string
}

/**
 * Response wrapper when fetching a single Assessment (e.g. GET /assessments/:id)
 */
export interface AssessmentResponse {
  status: string
  data:   AssessmentPayload
  message?: string
}

/**
 * Response wrapper for list-of-assessments (e.g. GET /assessments/class/:classId)
 */
export interface AllAssessmentsResponse {
  status: string
  data:   AssessmentPayload[]
  message?: string
}
