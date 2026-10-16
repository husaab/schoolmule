// src/services/studentPortalService.ts
// The student portal API (/api/student). The backend keys every query on the
// signed-in student (requireStudent), never on an id sent from here.

import apiClient from './apiClient';
import type {
  ChildGrades,
  ClassTeacher,
  StudentClassCard,
  StudentClassPage,
  StudentClassStream,
  StudentHome,
  StudentMe,
  StudentPortalEnvelope,
} from './types/studentPortal';

/** GET /student/me: the student row for this year, the login and the school. */
export const getStudentMe = () => apiClient<StudentPortalEnvelope<StudentMe>>('/student/me');

/** GET /student/home: greeting data, new grades and the class cards. */
export const getStudentHome = () => apiClient<StudentPortalEnvelope<StudentHome>>('/student/home');

/** GET /student/classes: the current term's class cards. */
export const getStudentClasses = () =>
  apiClient<StudentPortalEnvelope<{ classes: StudentClassCard[] }>>('/student/classes');

/** GET /student/classes/:classId: the header and what is coming up (404 NOT_ENROLLED if not on the roster). */
export const getStudentClass = (classId: string) =>
  apiClient<StudentPortalEnvelope<StudentClassPage>>(`/student/classes/${encodeURIComponent(classId)}`);

/** GET /student/classes/:classId/stream: the class's posts for this student and its classwork notices. */
export const getStudentClassStream = (classId: string) =>
  apiClient<StudentPortalEnvelope<StudentClassStream>>(`/student/classes/${encodeURIComponent(classId)}/stream`);

/** GET /student/classes/:classId/people: the teachers (never classmates). */
export const getStudentClassPeople = (classId: string) =>
  apiClient<StudentPortalEnvelope<{ teachers: ClassTeacher[] }>>(`/student/classes/${encodeURIComponent(classId)}/people`);

/** GET /student/grades: published grades for a term (the default term when none is given). */
export const getStudentGrades = (termId?: string) =>
  apiClient<StudentPortalEnvelope<ChildGrades>>(`/student/grades${termId ? `?termId=${encodeURIComponent(termId)}` : ''}`);

/** POST /student/announcements/:id/read: idempotent. */
export const markStudentAnnouncementRead = (announcementId: string) =>
  apiClient<StudentPortalEnvelope<{ read: true }>>(`/student/announcements/${encodeURIComponent(announcementId)}/read`, {
    method: 'POST',
  });

/** GET /student/announcements/:id/attachments/:attachmentId/url: a signed link, good for an hour. */
export const getStudentAttachmentUrl = (announcementId: string, attachmentId: string) =>
  apiClient<StudentPortalEnvelope<{ url: string }>>(
    `/student/announcements/${encodeURIComponent(announcementId)}/attachments/${encodeURIComponent(attachmentId)}/url`,
  );
