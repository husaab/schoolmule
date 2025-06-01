// src/services/types/assessment.ts

/**
 * Represents a single assessment (marking‐scheme item) as returned by the API
 */
export interface AssessmentPayload {
  assessmentId: string;
  classId:      string;
  name:         string;
  weightPercent: number;
  createdAt:    string;
  lastModifiedAt: string;
}

/**
 * Response wrapper for a single-assessment list (in this case, we only expect multiple),
 * but we’ll mirror the same pattern:
 */
export interface AllAssessmentsResponse {
  status: string;
  data:   AssessmentPayload[];
  message?: string;
}
