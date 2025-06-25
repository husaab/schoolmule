// src/services/dashboardService.ts

import apiClient from './apiClient'
import {
  DashboardSummaryResponse,
  AttendanceRateResponse,
  AttendanceTrendPoint,
  AttendanceTrendResponse
} from './types/dashboard'

/**
 * Fetch the dashboard summary metrics for a given school, term, and date
 * GET /dashboard/summary?school=...&term=...&date=YYYY-MM-DD
 */
export const getDashboardSummary = async (
  school: string,
  term: string,
  date: string
): Promise<DashboardSummaryResponse> => {
  const query = `?school=${encodeURIComponent(school)}&term=${encodeURIComponent(
    term
  )}&date=${encodeURIComponent(date)}`
  return apiClient<DashboardSummaryResponse>(
    `/dashboard/summary${query}`
  )
}

/**
 * Fetch attendance rate for a given school and date
 * GET /dashboard/attendance/today?school=...&date=YYYY-MM-DD
 */
export const getTodaysAttendanceRate = async (
  school: string,
  date: string
): Promise<AttendanceRateResponse> => {
  const query = `?school=${encodeURIComponent(school)}&date=${encodeURIComponent(
    date
  )}`
  return apiClient<AttendanceRateResponse>(
    `/dashboard/attendance/today${query}`
  )
}

/**
 * Fetch the weekly attendance rate ending on a given date for a school
 * GET /dashboard/attendance/weekly?school=...&endDate=YYYY-MM-DD
 */
export const getWeeklyAttendanceRate = async (
  school: string,
  endDate: string
): Promise<AttendanceRateResponse> => {
  const query = `?school=${encodeURIComponent(school)}&endDate=${encodeURIComponent(
    endDate
  )}`
  return apiClient<AttendanceRateResponse>(
    `/dashboard/attendance/weekly${query}`
  )
}

/**
 * Fetch the monthly attendance rate up to a given reference date for a school
 * GET /dashboard/attendance/monthly?school=...&refDate=YYYY-MM-DD
 */
export const getMonthlyAttendanceRate = async (
  school: string,
  refDate: string
): Promise<AttendanceRateResponse> => {
  const query = `?school=${encodeURIComponent(school)}&refDate=${encodeURIComponent(
    refDate
  )}`
  return apiClient<AttendanceRateResponse>(
    `/dashboard/attendance/monthly${query}`
  )
}


/**
 * GET /dashboard/attendance/trend
 * @param school   school code
 * @param days     lookback window (e.g. 7, 14, 30)
 * @param endDate  optional YYYY-MM-DD; defaults to today
 */
export const getAttendanceTrend = async (
  school: string,
  days = 7,
  endDate?: string
): Promise<AttendanceTrendResponse> => {
  // manually build the query string
  let query = `?school=${encodeURIComponent(school)}&days=${encodeURIComponent(days)}`;
  if (endDate) {
    query += `&endDate=${encodeURIComponent(endDate)}`;
  }
  return apiClient<AttendanceTrendResponse>(
    `/dashboard/attendance/trend${query}`
  );
};