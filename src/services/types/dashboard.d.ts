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
  averageStudentGrade: number
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
