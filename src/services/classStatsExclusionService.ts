// src/services/classStatsExclusionService.ts
//
// Who counts in a class's statistics (the class average, median, rank and the
// per-assessment averages). Staff only.

import apiClient from './apiClient'
import type {
  SchoolStatsExclusionListResponse,
  StatsExclusionInput,
  StatsExclusionListResponse,
  StatsExclusionResponse,
} from './types/classStatsExclusion'

const base = (classId: string) => `/classes/${encodeURIComponent(classId)}/stats-exclusions`

export const getStatsExclusions = (classId: string) => apiClient<StatsExclusionListResponse>(base(classId))

/** Replaces everything the student is left out of in the class. */
export const saveStatsExclusion = (classId: string, studentId: string, input: StatsExclusionInput) =>
  apiClient<StatsExclusionResponse, StatsExclusionInput>(`${base(classId)}/${encodeURIComponent(studentId)}`, {
    method: 'PUT',
    body: input,
  })

/** Counts the student in every class statistic again. */
export const removeStatsExclusion = (classId: string, studentId: string) =>
  apiClient<{ status: string }>(`${base(classId)}/${encodeURIComponent(studentId)}`, { method: 'DELETE' })

/** Every exclusion in the school for a term ('all' for every term). */
export const getSchoolStatsExclusions = (termId: string) =>
  apiClient<SchoolStatsExclusionListResponse>(`/analytics/stats-exclusions?termId=${encodeURIComponent(termId)}`)
