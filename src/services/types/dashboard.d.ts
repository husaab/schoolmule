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

export interface AttendanceTrendPoint {
  date: string;    // e.g. "2025-06-18"
  rate: number;    // 0–1
}

export interface AttendanceTrendResponse {
  status: string;
  data: AttendanceTrendPoint[];
}

/**
 * Monthly revenue trend data point
 */
export interface MonthlyRevenueTrendPoint {
  month: string;          // e.g. "2025-01-01T00:00:00.000Z"  
  revenue: number;        // total revenue for that month
  invoiceCount: number;   // number of invoices for that month
}

/**
 * Invoice status counts breakdown
 */
export interface InvoiceStatusCounts {
  pending: number;
  paid: number;
  overdue: number;
  cancelled: number;
}

/**
 * Data payload for financial overview metrics
 */
export interface FinancialOverviewData {
  totalRevenue: number;               // total money collected
  totalOutstanding: number;           // total money still owed
  statusCounts: InvoiceStatusCounts;  // breakdown by status
  studentsWithInvoices: number;       // count of students with invoices
  monthlyTrends: MonthlyRevenueTrendPoint[];  // 12 months of revenue trends
  averagePayment: number;             // average payment amount
}

/**
 * Response shape for GET /dashboard/financial
 */
export interface FinancialOverviewResponse {
  status: string;
  data: FinancialOverviewData;
}