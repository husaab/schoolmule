// services/announcementService.ts
//
// One-to-many announcements. Every call is scoped server-side by the
// caller's role: a parent sees posts that reach their children, a teacher
// their classes' (and grade/school posts), an admin the whole school.

import apiClient from './apiClient';
import apiUpload from './apiUpload';
import type {
  AnnouncementAttachmentUrlResponse,
  AnnouncementDetailResponse,
  AnnouncementListFilters,
  AnnouncementListResponse,
  AnnouncementScope,
  AnnouncementTargetsResponse,
  AudiencePreviewResponse,
  DeleteAnnouncementResponse,
  EditAnnouncementInput,
  MarkAnnouncementReadResponse,
  NewAnnouncementInput,
  RetryAnnouncementEmailsResponse,
} from './types/announcement';

const base = '/announcements';
const one = (id: string) => `${base}/${encodeURIComponent(id)}`;

const withFiles = (form: FormData, files?: File[]) => {
  (files ?? []).forEach((f) => form.append('files', f, f.name));
  return form;
};

/**
 * Feed for the caller, pinned-and-current first then newest.
 * GET /announcements
 */
export const listAnnouncements = async (filters: AnnouncementListFilters = {}): Promise<AnnouncementListResponse> => {
  const params = new URLSearchParams();
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.scope) params.set('scope', filters.scope);
  if (filters.grade) params.set('grade', filters.grade);
  if (filters.authorId) params.set('authorId', filters.authorId);
  if (filters.mine) params.set('mine', '1');
  if (filters.unread) params.set('unread', '1');
  if (filters.q) params.set('q', filters.q);
  if (filters.studentId) params.set('studentId', filters.studentId);
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient<AnnouncementListResponse>(`${base}${query}`);
};

/**
 * One announcement with signed attachments; staff also get read receipts and email stats.
 * GET /announcements/:id  (410 with code REMOVED once deleted)
 */
export const getAnnouncement = async (id: string): Promise<AnnouncementDetailResponse> =>
  apiClient<AnnouncementDetailResponse>(one(id));

/**
 * What the caller may post to.
 * GET /announcements/targets
 */
export const getAnnouncementTargets = async (): Promise<AnnouncementTargetsResponse> =>
  apiClient<AnnouncementTargetsResponse>(`${base}/targets`);

/**
 * Recipient summary for the composer.
 * GET /announcements/preview?scope=&classId=&grade=
 */
export const previewAudience = async (scope: { scope: AnnouncementScope; classId?: string; grade?: string }): Promise<AudiencePreviewResponse> => {
  const params = new URLSearchParams({ scope: scope.scope });
  if (scope.classId) params.set('classId', scope.classId);
  if (scope.grade) params.set('grade', scope.grade);
  return apiClient<AudiencePreviewResponse>(`${base}/preview?${params.toString()}`);
};

/**
 * Post. Emails go out two minutes later.
 * POST /announcements (multipart)
 */
export const createAnnouncement = async (input: NewAnnouncementInput): Promise<AnnouncementDetailResponse> => {
  const form = new FormData();
  form.set('scope', input.scope);
  if (input.classId) form.set('classId', input.classId);
  if (input.grade) form.set('grade', input.grade);
  form.set('title', input.title);
  form.set('body', input.body);
  if (input.pinnedUntil) form.set('pinnedUntil', input.pinnedUntil);
  return apiUpload<AnnouncementDetailResponse>(base, withFiles(form, input.files));
};

/**
 * Edit title, body, pin and attachments. Nobody is emailed again.
 * PATCH /announcements/:id (multipart)
 */
export const updateAnnouncement = async (id: string, input: EditAnnouncementInput): Promise<AnnouncementDetailResponse> => {
  const form = new FormData();
  if (input.title !== undefined) form.set('title', input.title);
  if (input.body !== undefined) form.set('body', input.body);
  if (input.pinnedUntil !== undefined) form.set('pinnedUntil', input.pinnedUntil === null ? 'null' : input.pinnedUntil);
  (input.removeAttachmentIds ?? []).forEach((a) => form.append('removeAttachmentIds', a));
  return apiUpload<AnnouncementDetailResponse>(one(id), withFiles(form, input.files), { method: 'PATCH' });
};

/**
 * Soft delete: hidden everywhere, pending emails cancelled.
 * DELETE /announcements/:id
 */
export const deleteAnnouncement = async (id: string): Promise<DeleteAnnouncementResponse> =>
  apiClient<DeleteAnnouncementResponse>(one(id), { method: 'DELETE' });

/**
 * Mark seen by the caller.
 * POST /announcements/:id/read
 */
export const markAnnouncementRead = async (id: string): Promise<MarkAnnouncementReadResponse> =>
  apiClient<MarkAnnouncementReadResponse>(`${one(id)}/read`, { method: 'POST' });

/**
 * Admin: queue failed emails again.
 * POST /announcements/:id/emails/retry
 */
export const retryAnnouncementEmails = async (id: string): Promise<RetryAnnouncementEmailsResponse> =>
  apiClient<RetryAnnouncementEmailsResponse>(`${one(id)}/emails/retry`, { method: 'POST' });

/**
 * Fresh signed URL for an attachment.
 * GET /announcements/:id/attachments/:attachmentId/url
 */
export const getAnnouncementAttachmentUrl = async (id: string, attachmentId: string): Promise<AnnouncementAttachmentUrlResponse> =>
  apiClient<AnnouncementAttachmentUrlResponse>(`${one(id)}/attachments/${encodeURIComponent(attachmentId)}/url`);
