// services/messagingService.ts
//
// Parent–teacher conversations. Every call is scoped server-side by the
// caller's role: a parent sees their children's threads, a teacher their
// classes', an admin the whole school.

import apiClient from './apiClient';
import apiUpload from './apiUpload';
import type {
  AttachmentUrlResponse,
  ConversationListResponse,
  ConversationStatus,
  DeleteMessageResponse,
  EditMessageResponse,
  ListFilters,
  MarkReadResponse,
  NewConversationInput,
  NewMessageInput,
  ParentTargetsResponse,
  SetMutedResponse,
  SetStatusResponse,
  StaffTargetsResponse,
  ThreadResponse,
  ThreadStubsResponse,
  UnreadSummaryResponse,
} from './types/messaging';

const base = '/messaging/conversations';
const thread = (id: string) => `${base}/${encodeURIComponent(id)}`;

const withFiles = (form: FormData, files?: File[]) => {
  (files ?? []).forEach((f) => form.append('files', f, f.name));
  return form;
};

/**
 * Inbox list for the caller.
 * GET /messaging/conversations
 */
export const listConversations = async (filters: ListFilters = {}): Promise<ConversationListResponse> => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.unread) params.set('unread', '1');
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.studentId) params.set('studentId', filters.studentId);
  if (filters.q) params.set('q', filters.q);
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient<ConversationListResponse>(`${base}${query}`);
};

/**
 * Badge counts.
 * GET /messaging/conversations/unread-count
 */
export const getUnreadSummary = async (): Promise<UnreadSummaryResponse> =>
  apiClient<UnreadSummaryResponse>(`${base}/unread-count`);

/**
 * What a parent may start a thread about for one child.
 * GET /messaging/conversations/targets?studentId=
 */
export const getParentTargets = async (studentId: string): Promise<ParentTargetsResponse> =>
  apiClient<ParentTargetsResponse>(`${base}/targets?studentId=${encodeURIComponent(studentId)}`);

/**
 * Students (with guardian account status) and assessments of a class.
 * GET /messaging/conversations/targets?classId=
 */
export const getStaffTargets = async (classId: string): Promise<StaffTargetsResponse> =>
  apiClient<StaffTargetsResponse>(`${base}/targets?classId=${encodeURIComponent(classId)}`);

/**
 * Existing threads for chips on the gradebook / grades page.
 * GET /messaging/conversations/stubs?classId=|studentId=
 */
export const getThreadStubs = async (scope: { classId?: string; studentId?: string }): Promise<ThreadStubsResponse> => {
  const params = new URLSearchParams();
  if (scope.classId) params.set('classId', scope.classId);
  if (scope.studentId) params.set('studentId', scope.studentId);
  return apiClient<ThreadStubsResponse>(`${base}/stubs?${params.toString()}`);
};

/**
 * Start a thread (or post into the existing one for that assessment).
 * POST /messaging/conversations (multipart)
 */
export const createConversation = async (input: NewConversationInput): Promise<ThreadResponse> => {
  const form = new FormData();
  form.set('studentId', input.studentId);
  form.set('classId', input.classId);
  form.set('assessmentId', input.assessmentId);
  form.set('body', input.body);
  return apiUpload<ThreadResponse>(base, withFiles(form, input.files));
};

/**
 * One thread with messages, signed attachment URLs and the score context.
 * GET /messaging/conversations/:id
 */
export const getConversation = async (id: string): Promise<ThreadResponse> =>
  apiClient<ThreadResponse>(thread(id));

/**
 * Reply. Reopens a resolved thread.
 * POST /messaging/conversations/:id/messages (multipart)
 */
export const postMessage = async (id: string, input: NewMessageInput): Promise<ThreadResponse> => {
  const form = new FormData();
  form.set('body', input.body);
  return apiUpload<ThreadResponse>(`${thread(id)}/messages`, withFiles(form, input.files));
};

/**
 * Edit your own message within 15 minutes.
 * PATCH /messaging/conversations/:id/messages/:messageId
 */
export const editMessage = async (id: string, messageId: string, body: string): Promise<EditMessageResponse> =>
  apiClient<EditMessageResponse, { body: string }>(`${thread(id)}/messages/${encodeURIComponent(messageId)}`, {
    method: 'PATCH',
    body: { body },
  });

/**
 * Remove your own message (admins: any message). Soft delete.
 * DELETE /messaging/conversations/:id/messages/:messageId
 */
export const deleteMessage = async (id: string, messageId: string): Promise<DeleteMessageResponse> =>
  apiClient<DeleteMessageResponse>(`${thread(id)}/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' });

/**
 * Mark the thread read for the caller; cancels their pending digest email.
 * POST /messaging/conversations/:id/read
 */
export const markRead = async (id: string): Promise<MarkReadResponse> =>
  apiClient<MarkReadResponse>(`${thread(id)}/read`, { method: 'POST' });

/**
 * Resolve or reopen (staff only).
 * PATCH /messaging/conversations/:id
 */
export const setStatus = async (id: string, status: ConversationStatus): Promise<SetStatusResponse> =>
  apiClient<SetStatusResponse, { status: ConversationStatus }>(thread(id), { method: 'PATCH', body: { status } });

/**
 * Per-thread email opt-out for the caller.
 * PATCH /messaging/conversations/:id/mute
 */
export const setMuted = async (id: string, muted: boolean): Promise<SetMutedResponse> =>
  apiClient<SetMutedResponse, { muted: boolean }>(`${thread(id)}/mute`, { method: 'PATCH', body: { muted } });

/**
 * Fresh signed URL for an attachment (the thread's URLs expire after an hour).
 * GET /messaging/conversations/:id/attachments/:attachmentId/url
 */
export const getAttachmentUrl = async (id: string, attachmentId: string): Promise<AttachmentUrlResponse> =>
  apiClient<AttachmentUrlResponse>(`${thread(id)}/attachments/${encodeURIComponent(attachmentId)}/url`);
