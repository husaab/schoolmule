// Report comment rules: the word limits a school sets for report card and
// progress report comments, and the review lock (lib/commentRules.ts).
import apiClient from './apiClient';
import type { CommentKind } from '@/lib/commentRules';
import type {
  ClassCommentLockResponse,
  ClassCommentRulesResponse,
  CommentLimitsResponse,
  CommentsOverviewResponse,
  SchoolCommentLimits,
} from './types/reportComments';

/** GET /report-comments/class/:classId → what a class's comment pages work under. */
export const getClassCommentRules = async (classId: string): Promise<ClassCommentRulesResponse> =>
  apiClient<ClassCommentRulesResponse>(`/report-comments/class/${encodeURIComponent(classId)}`);

/** GET /report-comments/overview → the limits, a term's locks and its classes (the active term when none is named). */
export const getCommentsOverview = async (termId?: string | null): Promise<CommentsOverviewResponse> =>
  apiClient<CommentsOverviewResponse>(`/report-comments/overview${termId ? `?termId=${encodeURIComponent(termId)}` : ''}`);

/** PUT /report-comments/limits → the school's limits (null for no limit). */
export const saveCommentLimits = async (limits: SchoolCommentLimits): Promise<CommentLimitsResponse> =>
  apiClient<CommentLimitsResponse>(`/report-comments/limits`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: limits,
  });

/** PUT /report-comments/locks/term → lock or reopen a whole term for a document; answers with the term's overview. */
export const setTermCommentLock = async (termId: string, kind: CommentKind, locked: boolean): Promise<CommentsOverviewResponse> =>
  apiClient<CommentsOverviewResponse>(`/report-comments/locks/term`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: { termId, kind, locked },
  });

/** PUT /report-comments/locks/class → lock or reopen one class for a document. */
export const setClassCommentLock = async (classId: string, kind: CommentKind, locked: boolean): Promise<ClassCommentLockResponse> =>
  apiClient<ClassCommentLockResponse>(`/report-comments/locks/class`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: { classId, kind, locked },
  });
