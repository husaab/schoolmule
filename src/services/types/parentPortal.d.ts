import { CalendarEventPayload } from './calendarEvent';
import type { AssessmentCellStatus, GradeCoverage } from './analytics';

export type { AssessmentCellStatus, GradeCoverage };

/** Shared response envelope for parent-portal endpoints */
export interface ParentPortalResponse<T> {
  status: 'success' | 'failed';
  data?: T;
  message?: string;
}

export type ParentAttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export interface ChildAttendanceSummary {
  presentDays: number;
  totalDays: number;
  pct: number | null;
}

export interface ProgressFeedbackItem {
  classId: string;
  subject: string;
  classGrade: string | number | null;
  teacherName: string | null;
  term: string;
  coreStandards: string | null;
  workHabit: string | null;
  behavior: string | null;
  comment: string | null;
  createdAt: string | null;
}

export interface ChildSummary {
  studentId: string;
  name: string;
  grade: string | number | null;
  relation: string;
  homeroomTeacher: string | null;
  /** Weighted average over counted work only; null until something counts. Never 0 for "no evidence". */
  overallAvg: number | null;
  classCount: number;
  /** Summed across the child's classes: how much of the term's work the average rests on. */
  coverage: GradeCoverage;
  attendance: ChildAttendanceSummary | null;
  latestFeedback: ProgressFeedbackItem | null;
}

export interface ParentSummary {
  termId: string | null;
  nextEvent: CalendarEventPayload | null;
  children: ChildSummary[];
}

export interface AssessmentScore {
  assessmentId: string;
  name: string;
  date: string | null;
  score: number | null;
  maxScore: number | null;
  weightPoints: number | null;
  /** Kept for older callers: always `status === 'excused'`. */
  isExcluded: boolean;
  /**
   * Resolved cell state. 'blank' = not yet graded (no weight), 'missing' =
   * flagged by the teacher (counts as 0), 'excused' = never counts. The UI
   * must branch on this, never on `score == null`.
   */
  status: AssessmentCellStatus;
  isParent: boolean;
  parentAssessmentId: string | null;
  /**
   * Category (isParent) rows have no score of their own — they never get a
   * student_assessments row — so this weighted rollup over their graded
   * children is the only percentage they have. null when nothing under the
   * category is graded yet. Always null for standalone assessments and
   * children; use score/maxScore for those.
   */
  rollupPct: number | null;
  /**
   * The class's mean on this assessment (score/max for leaves, graded
   * rollups for categories), over published rows only. null when no
   * classmate is graded yet.
   */
  classAvgPct: number | null;
  /** Teacher's note about this assessment, written when publishing. */
  parentComment: string | null;
  /**
   * When this became visible to parents. Non-null for everything in the
   * payload — the API only returns published work — and drives the
   * dashboard's recently-published feed.
   */
  publishedAt: string | null;
}

export interface ChildClassGrades {
  classId: string;
  subject: string;
  teacherName: string | null;
  /** True when the signed-in user teaches this class (a staff member in parent view): no "Ask the teacher". */
  taughtByViewer?: boolean;
  /** Weighted average over counted work only; null until something counts. */
  finalPct: number | null;
  classAvg: number | null;
  /** Cells the teacher flagged missing (counted as 0). Blank cells are not in here. */
  missingCount: number;
  /** Blank cells — not yet graded, carry no weight. */
  notYetGradedCount?: number;
  /** Excused cells (never counted). Name kept for older callers. */
  excludedCount: number;
  /** How much of the class's work `finalPct` rests on. */
  coverage: GradeCoverage;
  assessmentScores: AssessmentScore[];
}

/** One item the teacher flagged missing. Blank (not yet graded) cells never appear here. */
export interface MissingWorkItem {
  classId: string;
  subject: string;
  assessmentId: string;
  assessmentName: string;
  assessmentDate: string | null;
  weightPoints: number | null;
  /** Categories are never shown to parents as missing work — filter these out. */
  isParent: boolean;
}

export interface ChildGrades {
  studentId: string;
  studentName: string | null;
  gradeLevel: string | null;
  termId: string | null;
  /** Always 'graded_only' now; the API ignores `?engine=`. */
  engine: string;
  attendance: ChildAttendanceSummary | null;
  overall: {
    avg: number | null;
    classCount: number;
    /** Flagged-missing cells across every class. */
    missingCount: number;
    /** Blank (not yet graded) cells across every class. */
    notYetGradedCount?: number;
  } | null;
  classes: ChildClassGrades[];
  missingWork: MissingWorkItem[];
}

export interface AttendanceDay {
  date: string;
  status: ParentAttendanceStatus;
}

export interface ChildAttendance {
  studentId: string;
  from: string | null;
  to: string | null;
  summary: {
    presentDays: number;
    lateDays: number;
    absentDays: number;
    totalDays: number;
    pct: number | null;
  };
  days: AttendanceDay[];
}

export interface ReportCardFeedbackItem {
  classId: string;
  subject: string;
  classGrade: string | number | null;
  teacherName: string | null;
  term: string;
  workHabits: string | null;
  behavior: string | null;
  comment: string | null;
}

export interface ProgressReportItem {
  term: string;
  filePath: string | null;
  generatedAt: string | null;
}

export interface ChildFeedback {
  studentId: string;
  progressFeedback: ProgressFeedbackItem[];
  reportCardFeedback: ReportCardFeedbackItem[];
  progressReports: ProgressReportItem[];
}

/** One newly published mark, for the dashboard feed. */
export interface RecentPublicationItem {
  studentId: string;
  childName: string;
  classId: string;
  subject: string;
  assessmentId: string;
  assessmentName: string;
  score: number | null;
  maxScore: number | null;
  pct: number;
  comment: string | null;
  publishedAt: string;
  /** Computed server-side against last_seen_at, so a wrong client clock can't skew it. */
  isNew: boolean;
}

export interface RecentPublicationsFeed {
  items: RecentPublicationItem[];
  newCount: number;
}

export interface ChildWeeklySummary {
  studentId: string;
  content: string | null;
  weekStart: string | null;
  weekEnd: string | null;
  generatedAt: string | null;
  /** true when generation failed or no AI key is configured — render without it. */
  unavailable: boolean;
}

export type ParentSummaryResponse = ParentPortalResponse<ParentSummary>;
export type ChildGradesResponse = ParentPortalResponse<ChildGrades>;
export type ChildAttendanceResponse = ParentPortalResponse<ChildAttendance>;
export type ChildFeedbackResponse = ParentPortalResponse<ChildFeedback>;
export type ParentCalendarResponse = ParentPortalResponse<CalendarEventPayload[]>;
export type RecentPublicationsResponse = ParentPortalResponse<RecentPublicationsFeed>;
export type MarkPublicationsSeenResponse = ParentPortalResponse<{ seenAt: string }>;
export type ChildWeeklySummaryResponse = ParentPortalResponse<ChildWeeklySummary>;
