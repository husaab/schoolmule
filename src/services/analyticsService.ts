// src/services/analyticsService.ts
//
// Express /api/analytics/* calls. The backend scopes everything to the
// JWT's school, so no school param is sent. There is one grade engine
// ('graded_only'): blank cells carry no weight, flagged-missing cells count
// as 0, excused cells never count. The server ignores `?engine=`, so it is
// no longer sent.

import apiClient from './apiClient'
import {
  OverviewResponse,
  ClassResponse,
  StudentResponse,
  SnapshotResponse,
  TermComparisonResponse,
  ClassesHealthResponse,
} from './types/analytics'

/**
 * School-wide overview: per-grade + per-subject roll-ups.
 * GET /analytics/overview?termId=...&compareTerm=...
 */
export const getAnalyticsOverview = async (
  termId: string,
  compareTerm?: string
): Promise<OverviewResponse> => {
  let query = `?termId=${encodeURIComponent(termId)}`
  if (compareTerm) query += `&compareTerm=${encodeURIComponent(compareTerm)}`
  return apiClient<OverviewResponse>(`/analytics/overview${query}`)
}

/**
 * Class detail: per-student rankings + per-assessment stats.
 * GET /analytics/class/:classId?termId=...
 */
export const getAnalyticsClass = async (
  classId: string,
  termId?: string
): Promise<ClassResponse> => {
  const query = termId ? `?termId=${encodeURIComponent(termId)}` : ''
  return apiClient<ClassResponse>(`/analytics/class/${encodeURIComponent(classId)}${query}`)
}

/**
 * Student detail: per-class breakdown, percentiles, attendance, missing work.
 * GET /analytics/student/:studentId?termId=...&compareTerm=...
 */
export const getAnalyticsStudent = async (
  studentId: string,
  termId: string,
  compareTerm?: string
): Promise<StudentResponse> => {
  let query = `?termId=${encodeURIComponent(termId)}`
  if (compareTerm) query += `&compareTerm=${encodeURIComponent(compareTerm)}`
  return apiClient<StudentResponse>(
    `/analytics/student/${encodeURIComponent(studentId)}${query}`
  )
}

/**
 * Compact per-student snapshot for the at-risk watchlist / AI features.
 * GET /analytics/snapshot?termId=...
 */
export const getAnalyticsSnapshot = async (termId: string): Promise<SnapshotResponse> => {
  const query = `?termId=${encodeURIComponent(termId)}`
  return apiClient<SnapshotResponse>(`/analytics/snapshot${query}`)
}

/**
 * Cross-term comparison for one subject+grade (all terms).
 * GET /analytics/term-comparison?subject=...&grade=...
 */
export const getAnalyticsTermComparison = async (
  subject: string,
  grade: string
): Promise<TermComparisonResponse> => {
  const query = `?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}`
  return apiClient<TermComparisonResponse>(`/analytics/term-comparison${query}`)
}

/**
 * Per-class grading health for the dashboard (average, missing work,
 * ungraded / unpublished assessments). Teachers get only their own classes;
 * the scoping happens server-side.
 * GET /analytics/classes-health?termId=...
 */
export const getAnalyticsClassesHealth = async (
  termId: string
): Promise<ClassesHealthResponse> => {
  const query = `?termId=${encodeURIComponent(termId)}`
  return apiClient<ClassesHealthResponse>(`/analytics/classes-health${query}`)
}
