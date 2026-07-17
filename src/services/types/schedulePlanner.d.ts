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

export interface PlannerConfig {
  settings: PlannerSettings;
  teachers: PlannerTeacher[];
  rooms: PlannerRoom[];
  classGroups: ClassGroup[];
  dayTemplates: DayTemplate[];
  fixedBlocks: FixedBlock[];
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
}

export interface ScheduleSummary {
  scheduleId: string;
  school: string;
  name: string;
  status: 'draft' | 'published';
  shareToken: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDraft extends ScheduleSummary {
  sessions: ScheduleSession[];
  diagnostics?: SolverDiagnostic[] | null;
  configSnapshot?: Record<string, unknown> | null;
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
