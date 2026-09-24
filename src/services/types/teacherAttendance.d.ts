export interface TodayStatusResponse {
  status: string;
  data: {
    checkedIn: boolean;
    status: string | null;
    notes?: string | null;
    /** False on school closures and the person's days off. */
    expected?: boolean;
  };
}

export interface CheckInResponse {
  status: string;
  data: {
    teacherId: string;
    attendanceDate: string;
    status: string;
    notes?: string | null;
    hours?: number | null;
  };
}

export interface AttendanceRecord {
  attendanceDate: string;
  status: "PRESENT" | "ABSENT";
  notes?: string | null;
  /** Admin override for the hours this day is worth; null = the person's usual day. */
  hours?: number | null;
}

/** Where a staff member's work days came from. */
export type WorkDaysSource = "custom" | "planner" | "default";

/** Where a staff member's hours per day came from. */
export type HoursPerDaySource = "custom" | "school";

/** A person's assembled attendance over a range (a month or a pay period). */
export interface AttendanceSummary {
  records: AttendanceRecord[];
  /** ISO weekdays they work, Monday = 1 */
  workDays: number[];
  workDaysSource: WorkDaysSource;
  /** Open school days they work in the range */
  workingDays: number;
  /** …of which have already happened */
  elapsedWorkingDays: number;
  presentDays: number;
  absentDays: number;
  /** Hours a present day is worth for this person */
  hoursPerDay: number;
  hoursPerDaySource: HoursPerDaySource;
  /** Present days × hoursPerDay, with per-day overrides applied */
  hoursWorked: number;
}

export interface MyMonthResponse {
  status: string;
  data: AttendanceSummary;
}

export interface TeacherAttendanceData extends AttendanceSummary {
  teacherId: string;
  firstName: string;
  lastName: string;
  username: string;
}

export type PayFrequency = "MONTHLY" | "SEMI_MONTHLY" | "BIWEEKLY" | "WEEKLY";

export interface PaySchedule {
  frequency: PayFrequency;
  /** MONTHLY / SEMI_MONTHLY: day of the month (clamped to short months) */
  payDayOfMonth: number | null;
  secondPayDayOfMonth: number | null;
  /** BIWEEKLY / WEEKLY: any real pay date; pay days repeat from it */
  anchorPayDate: string | null;
  defaultHoursPerDay: number;
  /** e.g. "Monthly on the 25th" */
  description: string | null;
  updatedAt?: string | null;
}

export interface PaySchedulePayload {
  frequency: PayFrequency;
  payDayOfMonth?: number | null;
  secondPayDayOfMonth?: number | null;
  anchorPayDate?: string | null;
  defaultHoursPerDay?: number;
}

/** A pay period: ends on the pay day (inclusive), starts after the previous one. */
export interface PayPeriodRange {
  payDate: string;
  startDate: string;
  endDate: string;
}

export interface PayPeriod extends PayPeriodRange {
  /** Last day the numbers cover: the pay day once it has passed, otherwise today. */
  throughDate: string;
  isComplete: boolean;
  teachers: TeacherAttendanceData[];
}

export interface AllTeachersResponse {
  status: string;
  data: {
    teachers: TeacherAttendanceData[];
    workingDays: number;
    paySchedule: PaySchedule | null;
    schoolHoursPerDay: number;
  };
}

export interface PayScheduleResponse {
  status: string;
  data: {
    schedule: PaySchedule | null;
    currentPeriod: PayPeriodRange | null;
    today?: string;
  };
}

export interface PayPeriodsResponse {
  status: string;
  data: {
    schedule: PaySchedule | null;
    periods: PayPeriod[];
  };
}

export interface MyPayPeriodResponse {
  status: string;
  data: {
    schedule: PaySchedule | null;
    period: (PayPeriodRange & { throughDate: string; isComplete: boolean } & Partial<AttendanceSummary>) | null;
  };
}

export interface UpdateRecordResponse {
  status: string;
  data: {
    teacherId: string;
    attendanceDate: string;
    status: string;
    notes?: string | null;
    hours?: number | null;
  };
}

export interface WorkDaysResponse {
  status: string;
  data: {
    teacherId: string;
    workDays?: number[];
    workDaysSource?: WorkDaysSource;
  };
}

export interface HoursPerDayResponse {
  status: string;
  data: {
    teacherId: string;
    hoursPerDay?: number;
    hoursPerDaySource?: HoursPerDaySource;
  };
}

export interface DeleteRecordResponse {
  status: string;
  data: {
    teacherId: string;
    attendanceDate: string;
    /** False when nothing was recorded for that day (an assumed-present day). */
    deleted: boolean;
  };
}
