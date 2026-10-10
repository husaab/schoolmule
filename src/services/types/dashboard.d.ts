// src/services/types/dashboard.ts

/**
 * Data payload for dashboard summary metrics.
 */
export interface DashboardSummaryData {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  todaysAttendance: number
  weeklyAttendance: number
  monthlyAttendance: number
  /** null when no student has any counted work yet — never 0 for "no evidence". */
  averageStudentGrade: number | null
  reportCardsCount: number
  avgClassSize: number
}

/**
 * Response shape for GET /dashboard/summary
 */
export interface DashboardSummaryResponse {
  status: string
  data: DashboardSummaryData
}

/**
 * Response shape for attendance rate endpoints
 * e.g. GET /dashboard/attendance/today
 */
export interface AttendanceRateResponse {
  status: string
  data: {
    rate: number
  }
}

export interface AttendanceTrendPoint {
  date: string;    // e.g. "2025-06-18"
  rate: number;    // 0–1
}

export interface AttendanceTrendResponse {
  status: string;
  data: AttendanceTrendPoint[];
}