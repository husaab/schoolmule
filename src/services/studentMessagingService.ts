// src/services/studentMessagingService.ts
// The student's conversations with their teachers (/api/student/conversations).
// This is the existing parent–teacher messaging with the student in it: every
// thread a student starts includes their parents, and the server decides that
// (nothing here sends a student id). A student reaches their own current
// teachers only, and never sees an older parent–teacher thread.

import apiClient from './apiClient';
import type { ConversationItem, Thread, StudentMessageTargets, StudentUnreadSummary } from './types/messaging';
import type { StudentPortalEnvelope } from './types/studentPortal';

export { deleteStudentMessage, editStudentMessage } from './studentPortalService';

const base = '/student/conversations';
const thread = (id: string) => `${base}/${encodeURIComponent(id)}`;

export interface StudentListFilters {
  status?: 'open' | 'resolved';
  classId?: string;
  q?: string;
  unread?: boolean;
  limit?: number;
}

/** GET /student/conversations: the student's own threads, newest first (every status unless one is asked for). */
export const listStudentConversations = (filters: StudentListFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.q) params.set('q', filters.q);
  if (filters.unread) params.set('unread', '1');
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return apiClient<StudentPortalEnvelope<{ items: ConversationItem[] }>>(query ? `${base}?${query}` : base);
};

/** GET /student/conversations/unread-count: what the Messages badge counts. */
export const getStudentUnreadCount = () => apiClient<StudentPortalEnvelope<StudentUnreadSummary>>(`${base}/unread-count`);

/** GET /student/conversations/targets: the teachers the student may write to, and the guardians who will be in every thread. */
export const getStudentMessageTargets = () => apiClient<StudentPortalEnvelope<StudentMessageTargets>>(`${base}/targets`);

export interface NewStudentConversation {
  teacherId: string;
  /** One of that teacher's classes for the student; the server uses the first when it is left out. */
  classId?: string | null;
  subject: string;
  body: string;
}

/** POST /student/conversations: starts a thread with one of the student's teachers (their parents are in it). Answers with the thread. */
export const createStudentConversation = (input: NewStudentConversation) =>
  apiClient<StudentPortalEnvelope<Thread>, NewStudentConversation>(base, {
    method: 'POST',
    body: {
      teacherId: input.teacherId,
      ...(input.classId ? { classId: input.classId } : {}),
      subject: input.subject.trim(),
      body: input.body.trim(),
    },
  });

/** GET /student/conversations/:id: the thread. The server marks it read for the student (not in an admin's preview). */
export const getStudentConversation = (id: string) => apiClient<StudentPortalEnvelope<Thread>>(thread(id));

/** POST /student/conversations/:id/messages: a reply. Answers with the whole thread. */
export const postStudentMessage = (id: string, body: string) =>
  apiClient<StudentPortalEnvelope<Thread>, { body: string }>(`${thread(id)}/messages`, {
    method: 'POST',
    body: { body: body.trim() },
  });
