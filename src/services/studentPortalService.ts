// src/services/studentPortalService.ts
// The student portal API (/api/student). The backend keys every query on the
// signed-in student (requireStudent), never on an id sent from here.

import apiClient from './apiClient';
import type { StudentMe, StudentPortalEnvelope } from './types/studentPortal';

/** GET /student/me: the student row for this year, the login and the school. */
export const getStudentMe = () => apiClient<StudentPortalEnvelope<StudentMe>>('/student/me');
