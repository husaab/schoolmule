import apiClient from './apiClient';
import type { StudentOverviewResponse, StudentTermGradesResponse } from './types/studentProfile';

/**
 * Everything the student profile shows that isn't one term's grades.
 * GET /students/:id/overview
 */
export const getStudentOverview = async (studentId: string): Promise<StudentOverviewResponse> =>
  apiClient<StudentOverviewResponse>(`/students/${encodeURIComponent(studentId)}/overview`);

/**
 * One term's full grade breakdown; without a termId the server picks the
 * default term (active → containing today → latest ended → first).
 * GET /students/:id/grades?termId=
 */
export const getStudentTermGrades = async (
  studentId: string,
  termId?: string | null
): Promise<StudentTermGradesResponse> => {
  const query = termId ? `?termId=${encodeURIComponent(termId)}` : '';
  return apiClient<StudentTermGradesResponse>(`/students/${encodeURIComponent(studentId)}/grades${query}`);
};
