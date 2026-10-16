// src/services/types/studentPortal.d.ts
// The student portal API (/api/student). Every call is the signed-in
// student's own data; nothing here takes a student id from the client.

import type { GradeCode } from './studentAccount';

/** GET /api/student/me: who is signed in, for the portal shell. */
export interface StudentMe {
  student: { studentId: string; name: string; firstName: string; grade: GradeCode };
  user: { userId: string; email: string | null };
  school: { code: string; name: string };
  settings: { studentPhotos: boolean };
  schoolYear: { schoolYearId: string; label: string | null };
}

export interface StudentPortalEnvelope<T> {
  status: 'success' | 'failed';
  message?: string;
  code?: string;
  data: T;
}
