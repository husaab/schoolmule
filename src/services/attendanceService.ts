import apiClient from './apiClient';
import {
  GeneralAttendanceRequest,
  ClassAttendanceRequest,
  AttendanceResponse,
  GetAttendanceResponse,
} from './types/attendance';

/**
 * POST /attendance/general
 * body: { attendanceDate, entries, school }
 */
export const submitGeneralAttendance = async (
  payload: GeneralAttendanceRequest
): Promise<AttendanceResponse> => {
  return apiClient<AttendanceResponse>(`/attendance/general`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
};

/**
 * POST /attendance/class
 */
export const submitClassAttendance = async (
  payload: ClassAttendanceRequest
): Promise<AttendanceResponse> => {
  return apiClient<AttendanceResponse>(`/attendance/class`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
};

/**
 * GET /attendance/general?date=...&school=...
 */
export const getGeneralAttendanceByDate = async (
  date: string,
  school: string
): Promise<GetAttendanceResponse> => {
  const qs = `?date=${encodeURIComponent(date)}&school=${encodeURIComponent(school)}`;
  return apiClient<GetAttendanceResponse>(`/attendance/general${qs}`);
};

/**
 * GET /attendance/class/:classId?date=YYYY-MM-DD
 */
export const getClassAttendanceByDate = async (
  classId: string,
  date: string
): Promise<GetAttendanceResponse> => {
  return apiClient<GetAttendanceResponse>(
    `/attendance/class/${encodeURIComponent(classId)}?date=${encodeURIComponent(date)}`
  );
};
