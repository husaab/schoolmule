import apiClient from './apiClient';
import {
  ParentSummaryResponse,
  ChildGradesResponse,
  ChildAttendanceResponse,
  ChildFeedbackResponse,
  ParentCalendarResponse,
} from './types/parentPortal';

/**
 * Fetch the parent overview summary (all linked children, one call)
 * GET /parent-portal/summary
 */
export const getParentSummary = async (termId?: string): Promise<ParentSummaryResponse> => {
  const query = termId ? `?termId=${encodeURIComponent(termId)}` : '';
  return apiClient<ParentSummaryResponse>(`/parent-portal/summary${query}`);
};

/**
 * Fetch grades for one linked child (null-skip engine by default)
 * GET /parent-portal/students/:studentId/grades
 */
export const getChildGrades = async (
  studentId: string,
  termId?: string,
  engine?: string
): Promise<ChildGradesResponse> => {
  const params = new URLSearchParams();
  if (termId) params.set('termId', termId);
  if (engine) params.set('engine', engine);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient<ChildGradesResponse>(
    `/parent-portal/students/${encodeURIComponent(studentId)}/grades${query}`
  );
};

/**
 * Fetch day-by-day attendance for one linked child (defaults to the active term)
 * GET /parent-portal/students/:studentId/attendance
 */
export const getChildAttendance = async (
  studentId: string,
  opts?: { from?: string; to?: string; termId?: string }
): Promise<ChildAttendanceResponse> => {
  const params = new URLSearchParams();
  if (opts?.from) params.set('from', opts.from);
  if (opts?.to) params.set('to', opts.to);
  if (opts?.termId) params.set('termId', opts.termId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient<ChildAttendanceResponse>(
    `/parent-portal/students/${encodeURIComponent(studentId)}/attendance${query}`
  );
};

/**
 * Fetch teacher feedback + progress reports for one linked child
 * GET /parent-portal/students/:studentId/feedback
 */
export const getChildFeedback = async (studentId: string): Promise<ChildFeedbackResponse> => {
  return apiClient<ChildFeedbackResponse>(
    `/parent-portal/students/${encodeURIComponent(studentId)}/feedback`
  );
};

/**
 * Fetch the school calendar (school comes from the JWT server-side)
 * GET /parent-portal/calendar
 */
export const getParentCalendar = async (
  opts: { academicYear?: string; from?: string; to?: string } = {}
): Promise<ParentCalendarResponse> => {
  const params = new URLSearchParams();
  if (opts.academicYear) params.set('academicYear', opts.academicYear);
  if (opts.from) params.set('from', opts.from);
  if (opts.to) params.set('to', opts.to);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient<ParentCalendarResponse>(`/parent-portal/calendar${query}`);
};
