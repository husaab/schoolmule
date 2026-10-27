// src/services/types/classStatsExclusion.d.ts
//
// Students left out of a class's pooled statistics (the class average, median,
// rank and the per-assessment class averages). Their own marks never change.
// Staff only: no family payload ever carries these.

/** 'class': left out of every class statistic; 'assessments': of those columns' averages only. */
export type StatsExclusionScope = 'class' | 'assessments'

/** One student's exclusion in a class, as the API returns it. */
export interface StatsExclusion {
  classId: string
  studentId: string
  scope: StatsExclusionScope
  /** The columns left out (scope 'assessments'); a category covers its children. Empty for 'class'. */
  assessmentIds: string[]
  note: string | null
  createdBy: string | null
  createdByName: string | null
  createdAt: string
}

/** A row of the school-wide list (GET /analytics/stats-exclusions). */
export interface SchoolStatsExclusion extends StatsExclusion {
  studentName: string
  subject: string
  grade: string
  termId: string | null
  teacherName: string | null
  assessmentNames: string[]
}

/** PUT body: replaces everything the student is left out of in the class. */
export interface StatsExclusionInput {
  scope: StatsExclusionScope
  assessmentIds?: string[]
  note?: string | null
}

export interface StatsExclusionListResponse {
  status: string
  data: StatsExclusion[]
  message?: string
}

export interface StatsExclusionResponse {
  status: string
  data: StatsExclusion
  message?: string
}

export interface SchoolStatsExclusionListResponse {
  status: string
  data: SchoolStatsExclusion[]
  message?: string
}
