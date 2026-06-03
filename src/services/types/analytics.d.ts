// src/services/types/analytics.d.ts
//
// Types for the teacher analytics feature. These mirror the response
// shapes of the Express /api/analytics/* endpoints exactly.

/** Which grade engine computed the numbers (see EngineTooltip for the difference). */
export type GradeEngine = 'null_skip' | 'null_zero'

export type AnalyticsViewLevel = 'school' | 'grade' | 'class' | 'student'

/** Descriptive summary returned by the backend's statsUtils.summarize(). */
export interface SummaryStats {
  count: number
  avg: number
  median: number
  min: number
  max: number
  stdDev: number
  q1: number
  q3: number
}

export interface HistogramBucket {
  bucket: string // "70-79"
  min: number
  max: number
  count: number
}

export interface AnalyticsTerm {
  term_id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  academic_year: string
}

// ── Overview ────────────────────────────────────────────────────────

export interface GradeStudentRow {
  studentId: string
  studentName: string
  overallAvg: number | null
  missingCount: number
  classCount: number
}

export interface GradeLevelStats {
  grade: string
  studentCount: number
  stats: SummaryStats | null
  histogram: HistogramBucket[]
  students: GradeStudentRow[]
}

export interface SubjectClassRow {
  classId: string
  grade: string
  teacherName: string
  studentCount: number
  classAvg: number | null
}

export interface SubjectStats {
  subject: string
  classCount: number
  stats: SummaryStats | null
  histogram: HistogramBucket[]
  classes: SubjectClassRow[]
}

export interface TermDiffRow {
  grade?: string
  subject?: string
  currentAvg: number | null
  previousAvg: number | null
  avgDiff: number | null
}

export interface OverviewData {
  termId: string
  engine: GradeEngine
  terms: AnalyticsTerm[]
  school: {
    stats: SummaryStats | null
    histogram: HistogramBucket[]
    totalStudents: number
    totalClasses: number
  }
  byGrade: GradeLevelStats[]
  bySubject: SubjectStats[]
  compareTermId?: string
  termDiff?: {
    byGrade: TermDiffRow[]
    bySubject: TermDiffRow[]
  }
}

export interface OverviewResponse {
  status: string
  data: OverviewData
}

// ── Class detail ────────────────────────────────────────────────────

export interface AssessmentScoreCell {
  assessmentId: string
  name: string
  date?: string | null
  score: number | null
  maxScore: number | null
  weightPoints?: number | null
  isExcluded: boolean
  isParent: boolean
  parentAssessmentId: string | null
}

export interface ClassStudentRow {
  studentId: string
  studentName: string
  finalPct: number | null
  rank: number | null
  percentileInClass: number | null
  missingCount: number
  excludedCount: number
  assessmentScores: AssessmentScoreCell[]
}

export interface AssessmentStatsRow {
  assessmentId: string
  name: string
  date: string | null
  weightPoints: number | null
  isParent: boolean
  completionRate: number // 0-1
  stats: SummaryStats | null
  histogram: HistogramBucket[]
  isAnomalous: boolean
}

export interface TrendPoint {
  assessmentId: string
  name: string
  date: string
  classAvgPct: number
}

export interface ClassData {
  classId: string
  subject: string
  grade: string
  teacherName: string
  termId: string
  engine: GradeEngine
  summary: {
    stats: SummaryStats | null
    histogram: HistogramBucket[]
  }
  students: ClassStudentRow[]
  assessments: AssessmentStatsRow[]
  trend: TrendPoint[]
}

export interface ClassResponse {
  status: string
  data: ClassData
}

// ── Student detail ──────────────────────────────────────────────────

export interface StudentClassBreakdown {
  classId: string
  subject: string
  teacherName: string
  finalPct: number | null
  classAvg: number | null
  percentileInClass: number | null
  missingCount: number
  excludedCount: number
  assessmentScores: AssessmentScoreCell[]
}

export interface MissingWorkItem {
  classId: string
  subject: string
  assessmentId: string
  assessmentName: string
  assessmentDate: string | null
  weightPoints: number | null
}

export interface StudentData {
  studentId: string
  studentName: string
  gradeLevel: string
  termId: string
  engine: GradeEngine
  attendance: { presentDays: number; totalDays: number; pct: number | null } | null
  overall: {
    avg: number | null
    classCount: number
    percentileInGrade: number | null
    missingCount: number
  }
  classes: StudentClassBreakdown[]
  missingWork: MissingWorkItem[]
  termTrajectory?: {
    currentTermId: string
    currentAvg: number | null
    compareTermId: string
    compareAvg: number | null
    diff: number | null
  }
}

export interface StudentResponse {
  status: string
  data: StudentData
}

// ── AI snapshot ─────────────────────────────────────────────────────

export interface SnapshotStudent {
  studentId: string
  studentName: string
  gradeLevel: string
  overallAvg: number | null
  attendancePct: number | null
  missingCount: number
  lowestSubject: string | null
  lowestPct: number | null
  classCount: number
}

export interface SnapshotData {
  termId: string
  engine: GradeEngine
  students: SnapshotStudent[]
}

export interface SnapshotResponse {
  status: string
  data: SnapshotData
}

// ── AI / chat ───────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AtRiskResult {
  score: number
  flags: string[]
  tier: 'high' | 'moderate' | 'low'
}
