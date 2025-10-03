// src/services/types/assessment.ts

/**
 * Represents a single assessment (marking-scheme item) as returned by the API
 */
export interface AssessmentPayload {
  assessmentId:       string
  classId:            string
  name:               string
  weightPercent:      number
  createdAt:          string
  lastModifiedAt:     string
  parentAssessmentId?: string | null
  isParent:           boolean
  sortOrder?:         number | null
  maxScore?:          number | null
  weightPoints?:      number | null
  date?:              string | null
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

/**
 * Response for creating parent assessment with children
 */
export interface ParentAssessmentCreateResponse {
  status: string
  data: {
    parent: AssessmentPayload
    children: AssessmentPayload[]
  }
  message?: string
}

/**
 * Request payload for creating assessments (including parent-child)
 */
export interface CreateAssessmentRequest {
  classId: string
  name: string
  weightPercent: number
  isParent: boolean
  childCount?: number
  parentAssessmentId?: string | null
  sortOrder?: number | null
  maxScore?: number | null
  weightPoints?: number | null
  date?: string | null
  childrenData?: Array<{
    name: string
    weightPercent: number
    sortOrder: number
    maxScore?: number | null
    weightPoints?: number | null
    date?: string | null
  }>
}
