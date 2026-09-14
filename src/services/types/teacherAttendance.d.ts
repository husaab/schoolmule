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
  };
}

export interface AttendanceRecord {
  attendanceDate: string;
  status: "PRESENT" | "ABSENT";
  notes?: string | null;
}

/** Where a staff member's work days came from. */
export type WorkDaysSource = "custom" | "planner" | "default";

export interface MyMonthResponse {
  status: string;
  data: {
    records: AttendanceRecord[];
    /** ISO weekdays they work, Monday = 1 */
    workDays: number[];
    workDaysSource: WorkDaysSource;
    /** Open school days they work this month */
    workingDays: number;
    presentDays: number;
    absentDays: number;
  };
}

export interface TeacherAttendanceData {
  teacherId: string;
  firstName: string;
  lastName: string;
  username: string;
  records: AttendanceRecord[];
  /** ISO weekdays they work, Monday = 1 */
  workDays: number[];
  workDaysSource: WorkDaysSource;
  /** Open school days they work this month */
  workingDays: number;
}

export interface AllTeachersResponse {
  status: string;
  data: {
    teachers: TeacherAttendanceData[];
    workingDays: number;
  };
}

export interface UpdateRecordResponse {
  status: string;
  data: {
    teacherId: string;
    attendanceDate: string;
    status: string;
    notes?: string | null;
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
