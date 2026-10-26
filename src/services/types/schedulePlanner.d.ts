// src/services/types/schedulePlanner.d.ts

/** Time window in minutes-from-midnight; day is ISO weekday (1 = Monday) */
export interface TimeWindow {
  day: number;
  startMin: number;
  endMin: number;
  label?: string;
}

export interface TimeRange {
  startMin: number;
  endMin: number;
}

export interface PlannerSettings {
  defaultDurationMinutes: number;
  snapMinutes: number;
}

export interface PlannerTeacher {
  plannerTeacherId: string;
  school: string;
  userId?: string | null;
  staffId?: string | null;
  displayName: string;
  isFullTime: boolean;
  maxWeeklyMinutes?: number | null;
  /** Contiguous free minutes required on any day this teacher teaches */
  dailySpareMinutes?: number | null;
  /** Cap on distinct working days per week (null = unlimited) */
  maxDaysPerWeek?: number | null;
  /** Max free period-slots BETWEEN the first and last session of a day (null = unlimited) */
  maxSparesPerDay?: number | null;
  /** Prefer no two consecutive spare slots. Soft: the solver trades it away if it must */
  avoidAdjacentSpares?: boolean | null;
  allowedDays: number[];
  excludedWindows: TimeWindow[];
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlannerRoom {
  roomId: string;
  school: string;
  name: string;
  capacityNote?: string | null;
}

export interface CourseRequirement {
  courseId: string;
  classGroupId: string;
  name: string;
  sessionsPerWeek: number;
  durationMinutes?: number | null;
  maxPerDay: number;
  /** Max days per week that may hold 2+ sessions of this course (null = unlimited) */
  maxRepeatDays?: number | null;
  assignedTeacherId?: string | null;
  candidateTeacherIds: string[];
  requiredRoomId?: string | null;
}

export interface ClassGroup {
  classGroupId: string;
  school: string;
  name: string;
  grade?: string | null;
  sortOrder: number;
  courses?: CourseRequirement[];
}

export interface DayTemplate {
  dayTemplateId?: string;
  dayOfWeek: number;
  fillableRanges: TimeRange[];
}

export interface FixedBlock {
  fixedBlockId: string;
  /** Class groups this block applies to; empty = whole school */
  classGroupIds: string[];
  label: string;
  dayOfWeek: number;
  startMin: number;
  endMin: number;
}

/**
 * Window-based scheduling rule the generator enforces:
 * - teach: class group's sessions inside the window are taught by the teacher
 *   on at least minPerWeek days (homeroom mornings)
 * - free: teacher keeps at least minPerWeek period-slots free inside the
 *   window across the week (ESL pull-outs)
 */
export interface PeriodRule {
  ruleId: string;
  teacherId: string;
  classGroupId?: string | null;
  kind: 'teach' | 'free';
  startMin: number;
  endMin: number;
  minPerWeek: number;
}

export interface PlannerConfig {
  settings: PlannerSettings;
  teachers: PlannerTeacher[];
  rooms: PlannerRoom[];
  classGroups: ClassGroup[];
  dayTemplates: DayTemplate[];
  fixedBlocks: FixedBlock[];
  periodRules: PeriodRule[];
}

/** One placed session in a generated candidate or saved schedule */
export interface ScheduleSession {
  courseId: string;
  sessionIndex: number;
  classGroupId: string;
  courseName: string;
  day: number;
  startMin: number;
  endMin: number;
  teacherId: string;
  roomId?: string | null;
  pinned: boolean;
}

export interface ScheduleCandidate {
  candidateIndex: number;
  sessions: ScheduleSession[];
  metrics?: {
    teacherLoadStdDev: number;
    avgGapMinutesPerClass: number;
  };
}

export interface SolverDiagnostic {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface GenerateMeta {
  requested: number;
  returned: number;
  elapsedMs: number;
  timedOut: boolean;
  seed: number;
  warnings: SolverDiagnostic[];
}

export interface GenerateResult {
  candidates: ScheduleCandidate[];
  meta: GenerateMeta;
}

export interface GenerateFailureData {
  phase: 'preSolve' | 'search';
  diagnostics: SolverDiagnostic[];
  partial: {
    placedSessions: ScheduleSession[];
    unplaced: { courseId: string; courseName: string; sessionIndex: number; classGroupId: string }[];
  } | null;
}

export interface PinnedSessionInput {
  courseId: string;
  sessionIndex: number;
  day: number;
  startMin: number;
  teacherId: string;
  roomId?: string | null;
}

export interface GenerateRequest {
  numCandidates?: number;
  timeBudgetMs?: number;
  seed?: number;
  pinnedSessions?: PinnedSessionInput[];
  /** Warm-start the solver from this saved schedule — returns variations of it in seconds. */
  baseScheduleId?: string;
}

export type GoLiveStatus = 'pending' | 'running' | 'done' | 'failed';

export interface ScheduleSummary {
  scheduleId: string;
  school: string;
  name: string;
  status: 'draft' | 'published';
  shareToken: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  /** The schedule this one was copied from with new times */
  sourceScheduleId?: string | null;
  /** Carries its own breaks + school hours (a copy with new times, or a schedule that was live and got replaced) */
  hasOwnBellTimes?: boolean;
  /** yyyy-mm-dd it publishes itself (America/Toronto) */
  goLiveOn?: string | null;
  goLiveStatus?: GoLiveStatus | null;
  goLiveError?: string | null;
  /** yyyy-mm-dd it went live / last day it was live */
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

/** The breaks and school hours a schedule was made for. */
export interface BellTimes {
  fixedBlocks: Omit<FixedBlock, 'fixedBlockId'>[];
  dayTemplates: DayTemplate[];
}

export interface ScheduleDraft extends ScheduleSummary {
  sessions: ScheduleSession[];
  diagnostics?: SolverDiagnostic[] | null;
  configSnapshot?: Record<string, unknown> | null;
  /** Own bell times; null = the year's live config */
  bellTimes?: BellTimes | null;
}

// ─── Copy with new times ─────────────────────────────────────────────────

/** One editable line of a bell schedule: a period (classes move with it) or a break. */
export interface RetimeRow {
  rowId: string;
  kind: 'period' | 'break';
  label: string;
  startMin: number;
  endMin: number;
  days: number[];
  /** Breaks: the class groups it applies to (empty = whole school) */
  classGroupIds?: string[];
  /** Periods: how many classes meet in it */
  sessionCount?: number;
}

/** Grades that share period times, e.g. "Grades 1–4 · JK · SK". */
export interface RetimeBell {
  bellId: string;
  label: string;
  classGroupIds: string[];
  rows: RetimeRow[];
}

export interface RetimeHours {
  rowId: string;
  startMin: number;
  endMin: number;
  days: number[];
}

export interface RetimeModel {
  schedule: ScheduleSummary;
  bells: RetimeBell[];
  hours: RetimeHours[];
  /** Blocks such as "JK not in session" that follow the bell times automatically */
  adjustableBlocks: number;
}

export interface RetimeEdits {
  rows?: { rowId: string; startMin?: number; endMin?: number; removed?: boolean }[];
  added?: { label: string; startMin: number; endMin: number; classGroupIds: string[]; days?: number[] }[];
  hours?: { rowId: string; startMin: number; endMin: number }[];
}

export type RetimeWarningCode =
  | 'TEACHER_CLASH'
  | 'CLASS_CLASH'
  | 'ROOM_CLASH'
  | 'IN_BREAK'
  | 'OUTSIDE_HOURS'
  | 'TEACHER_UNAVAILABLE';

export interface RetimePreview {
  totals: { sessions: number; moved: number };
  movedByRow: Record<string, number>;
  adjustedBlocks: { label: string; days: number[]; from: TimeRange; to: TimeRange }[];
  unmatchedBlocks: { label: string; days: number[]; startMin: number; endMin: number }[];
  unmapped: { classGroupName: string | null; courseName: string; dayOfWeek: number; startMin: number; endMin: number }[];
  /** Only problems the new times create, not ones the schedule already had */
  warnings: { code: RetimeWarningCode; dayOfWeek: number; message: string }[];
}

export interface RetimeRequest {
  edits: RetimeEdits;
  name?: string;
  goLiveOn?: string | null;
  dryRun?: boolean;
}

/** Materialized session (published schedule; used by widget + public page) */
export interface PublishedSession {
  sessionId: string;
  scheduleId: string;
  classGroupId?: string | null;
  classGroupName: string;
  courseName: string;
  plannerTeacherId?: string | null;
  teacherUserId?: string | null;
  teacherName: string;
  roomName?: string | null;
  dayOfWeek: number;
  startMin: number;
  endMin: number;
}

/** A day the school is closed (holiday, PA day) from the school calendar. */
export interface ScheduleClosure {
  title: string;
  category: string;
  /** yyyy-mm-dd, inclusive */
  startDate: string;
  /** yyyy-mm-dd, inclusive */
  endDate: string;
}

/** Everything a teacher needs to render their own published timetable. */
export interface MySchedule {
  sessions: PublishedSession[];
  /** Breaks snapshotted at publish time (Snack, Lunch, Salat) */
  fixedBlocks: FixedBlock[];
  dayTemplates: DayTemplate[];
  schedule: { scheduleId: string; name: string; publishedAt: string; effectiveFrom?: string | null } | null;
  /** Monday of the current week, yyyy-mm-dd */
  weekStart: string;
  /** School closures overlapping the current week */
  closures: ScheduleClosure[];
}

export interface PublicSchedule {
  schoolName: string;
  scheduleName: string;
  publishedAt: string;
  sessions: PublishedSession[];
}

export interface ApiResponse<T> {
  status: 'success' | 'failed';
  data: T;
  message?: string;
}
