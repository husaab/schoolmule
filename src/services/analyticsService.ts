// src/services/analyticsService.ts
//
// Express /api/analytics/* calls. The backend scopes everything to the
// JWT's school, so no school param is sent. Every endpoint accepts the
// grade-engine toggle ('null_skip' | 'null_zero').

import apiClient from './apiClient'
import {
  OverviewResponse,
  ClassResponse,
  StudentResponse,
  SnapshotResponse,
  TermComparisonResponse,
  GradeEngine,
} from './types/analytics'

/**
 * School-wide overview: per-grade + per-subject roll-ups.
 * GET /analytics/overview?termId=...&engine=...&compareTerm=...
 */
export const getAnalyticsOverview = async (
  termId: string,
  engine: GradeEngine,
  compareTerm?: string
): Promise<OverviewResponse> => {
  let query = `?termId=${encodeURIComponent(termId)}&engine=${engine}`
  if (compareTerm) query += `&compareTerm=${encodeURIComponent(compareTerm)}`
  return apiClient<OverviewResponse>(`/analytics/overview${query}`)
}

/**
 * Class detail: per-student rankings + per-assessment stats.
 * GET /analytics/class/:classId?termId=...&engine=...
 */
export const getAnalyticsClass = async (
  classId: string,
  engine: GradeEngine,
  termId?: string
): Promise<ClassResponse> => {
  let query = `?engine=${engine}`
  if (termId) query += `&termId=${encodeURIComponent(termId)}`
  return apiClient<ClassResponse>(`/analytics/class/${encodeURIComponent(classId)}${query}`)
}

/**
 * Student detail: per-class breakdown, percentiles, attendance, missing work.
 * GET /analytics/student/:studentId?termId=...&engine=...&compareTerm=...
 */
export const getAnalyticsStudent = async (
  studentId: string,
  termId: string,
  engine: GradeEngine,
  compareTerm?: string
): Promise<StudentResponse> => {
  let query = `?termId=${encodeURIComponent(termId)}&engine=${engine}`
  if (compareTerm) query += `&compareTerm=${encodeURIComponent(compareTerm)}`
  return apiClient<StudentResponse>(
    `/analytics/student/${encodeURIComponent(studentId)}${query}`
  )
}

/**
 * Compact per-student snapshot for the at-risk watchlist / AI features.
 * GET /analytics/snapshot?termId=...&engine=...
 */
export const getAnalyticsSnapshot = async (
  termId: string,
  engine: GradeEngine
): Promise<SnapshotResponse> => {
  const query = `?termId=${encodeURIComponent(termId)}&engine=${engine}`
  return apiClient<SnapshotResponse>(`/analytics/snapshot${query}`)
}

/**
 * Cross-term comparison for one subject+grade (all terms).
 * GET /analytics/term-comparison?subject=...&grade=...&engine=...
 */
export const getAnalyticsTermComparison = async (
  subject: string,
  grade: string,
  engine: GradeEngine
): Promise<TermComparisonResponse> => {
  const query = `?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}&engine=${engine}`
  return apiClient<TermComparisonResponse>(`/analytics/term-comparison${query}`)
}
