// src/services/studentPortalService.ts
// The student portal API (/api/student). The backend keys every query on the
// signed-in student (requireStudent), never on an id sent from here.

import apiClient from './apiClient';
import apiUpload from './apiUpload';
import type { TodoTab } from '@/lib/portalRoutes';
import type { Thread } from './types/messaging';
import type {
  ChildGrades,
  ClassTeacher,
  StudentClassCard,
  StudentClasswork,
  StudentClassPage,
  StudentClassStream,
  StudentHome,
  StudentItem,
  StudentMe,
  StudentPortalEnvelope,
  StudentTodo,
  SubmissionFile,
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

// ---------------------------------------------------------------------------
// Classwork: the To-do, a class's Classwork, an assignment and the student's
// own work on it. Every call is the signed-in student's; the server keys each
// one on their own row.

/** GET /student/todo: the tab's groups and all three counts (the current term's classes; `classId` narrows both). */
export const getStudentTodo = (tab: TodoTab = 'assigned', classId?: string | null) =>
  apiClient<StudentPortalEnvelope<StudentTodo>>(
    `/student/todo?tab=${tab}${classId ? `&classId=${encodeURIComponent(classId)}` : ''}`,
  );

/** GET /student/classes/:classId/classwork: the topics, the visible items with this student's status, and what is coming up. */
export const getStudentClasswork = (classId: string) =>
  apiClient<StudentPortalEnvelope<StudentClasswork>>(`/student/classes/${encodeURIComponent(classId)}/classwork`);

const itemPath = (itemId: string) => `/student/items/${encodeURIComponent(itemId)}`;

/** GET /student/items/:itemId: the assignment page. The first open of a turn-in item starts the student's work. */
export const getStudentItem = (itemId: string) => apiClient<StudentPortalEnvelope<StudentItem>>(itemPath(itemId));

/**
 * PUT /student/items/:itemId/text: autosave of a typed answer. `keepalive`
 * lets the save outlive the page when it is sent from pagehide.
 */
export const saveStudentAnswer = (itemId: string, textAnswer: string, opts: { keepalive?: boolean } = {}) =>
  apiClient<StudentPortalEnvelope<{ savedAt: string }>, { textAnswer: string }>(`${itemPath(itemId)}/text`, {
    method: 'PUT',
    body: { textAnswer },
    keepalive: opts.keepalive,
  });

/** POST /student/items/:itemId/files: up to 5 files of 10 MB. Answers with every file of the work. */
export const uploadStudentFiles = (itemId: string, files: File[]) => {
  const form = new FormData();
  files.forEach((f) => form.append('files', f, f.name));
  return apiUpload<StudentPortalEnvelope<{ files: SubmissionFile[] }>>(`${itemPath(itemId)}/files`, form);
};

/** DELETE /student/files/:fileId: one of the student's own files, while the work is not turned in. */
export const deleteStudentFile = (fileId: string) =>
  apiClient<StudentPortalEnvelope<{ deleted: true }>>(`/student/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });

/** GET /student/files/:fileId/url: a link to one of the student's own files, good for an hour. */
export const getStudentFileUrl = (fileId: string) =>
  apiClient<StudentPortalEnvelope<{ url: string }>>(`/student/files/${encodeURIComponent(fileId)}/url`);

/** POST /student/items/:itemId/turn-in: answers with the item as it stands. */
export const turnInStudentItem = (itemId: string) =>
  apiClient<StudentPortalEnvelope<StudentItem>>(`${itemPath(itemId)}/turn-in`, { method: 'POST' });

/** POST /student/items/:itemId/unsubmit: takes the work back to change it. Answers with the item as it stands. */
export const unsubmitStudentItem = (itemId: string) =>
  apiClient<StudentPortalEnvelope<StudentItem>>(`${itemPath(itemId)}/unsubmit`, { method: 'POST' });

// ---------------------------------------------------------------------------
// Messages about one piece of work (private comments). The thread includes the
// student's teachers and, always, their parents.

/** GET /student/items/:itemId/thread: the thread (read as it is fetched), or null when nothing has been said yet. */
export const getStudentItemThread = (itemId: string) =>
  apiClient<StudentPortalEnvelope<{ thread: Thread | null }>>(`${itemPath(itemId)}/thread`);

/** POST /student/items/:itemId/thread/messages: the first message starts the thread. Answers with the whole thread. */
export const postStudentItemMessage = (itemId: string, body: string) =>
  apiClient<StudentPortalEnvelope<Thread>, { body: string }>(`${itemPath(itemId)}/thread/messages`, {
    method: 'POST',
    body: { body },
  });

const messagePath = (conversationId: string, messageId: string) =>
  `/student/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`;

/** PATCH: the student's own message, within 15 minutes. */
export const editStudentMessage = (conversationId: string, messageId: string, body: string) =>
  apiClient<StudentPortalEnvelope<{ messageId: string; body: string; editedAt: string }>, { body: string }>(
    messagePath(conversationId, messageId),
    { method: 'PATCH', body: { body } },
  );

/** DELETE: the student's own message, within 15 minutes. */
export const deleteStudentMessage = (conversationId: string, messageId: string) =>
  apiClient<StudentPortalEnvelope<{ messageId: string; deletedAt: string }>>(messagePath(conversationId, messageId), {
    method: 'DELETE',
  });
