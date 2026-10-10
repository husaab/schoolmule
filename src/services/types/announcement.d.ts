/** Shared response envelope for /api/announcements endpoints */
export interface AnnouncementResponse<T> {
  status: 'success' | 'failed';
  data?: T;
  message?: string;
  /** 'REMOVED' when a deleted announcement is fetched by id (HTTP 410). */
  code?: string;
}

export type AnnouncementScope = 'class' | 'grade' | 'school';
export type AnnouncementAuthorRole = 'TEACHER' | 'ADMIN';

export interface AnnouncementChild {
  studentId: string;
  name: string;
}

export interface AnnouncementItem {
  announcementId: string;
  scope: AnnouncementScope;
  classId: string | null;
  classSubject: string | null;
  classGrade: string | null;
  grade: string | null;
  /** "Gr 6 Math" | "Grade 6" | "Whole school" */
  scopeLabel: string;
  title: string;
  body: string;
  authorId: string | null;
  authorName: string;
  authorRole: AnnouncementAuthorRole;
  publishedAt: string;
  /** YYYY-MM-DD or null. */
  pinnedUntil: string | null;
  /** pinnedUntil is today or later. */
  isPinned: boolean;
  editedAt: string | null;
  attachmentCount: number;
  /** The caller has opened it. */
  read: boolean;
  /** Author or admin. */
  canEdit: boolean;
  /** Staff lists only. */
  seenCount?: number;
  audienceCount?: number;
  /** Admin lists only: an email for this post failed after retries. */
  emailFailed?: boolean;
  /** Parent lists only: the caller's children in the audience. */
  children?: AnnouncementChild[];
}

export interface AnnouncementAttachment {
  attachmentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Signed URL, valid for an hour from the fetch. */
  url: string | null;
}

export type ReceiptState = 'seen' | 'emailed' | 'pending' | 'invited' | 'no-account' | 'failed';

export interface Receipt {
  /** null for an email-only guardian with no account. */
  userId: string | null;
  name: string;
  relation: string | null;
  studentNames: string[];
  readAt: string | null;
  state: ReceiptState;
}

export interface AnnouncementEmails {
  sent: number;
  pending: number;
  failed: number;
  signup: number;
  invite: number;
}

export interface AnnouncementDetail extends AnnouncementItem {
  attachments: AnnouncementAttachment[];
  /** Staff only. */
  receipts?: { seen: Receipt[]; notYet: Receipt[] };
  emails?: AnnouncementEmails;
}

export interface AnnouncementTargets {
  classes: { classId: string; subject: string; grade: string | null; studentCount: number }[];
  grades: { grade: string; studentCount: number }[];
  canSchool: boolean;
}

export interface AudiencePreview {
  students: number;
  guardiansWithAccount: number;
  guardiansInvitePending: number;
  guardiansEmailOnly: number;
  studentsWithoutEmail: AnnouncementChild[];
}

export interface AnnouncementListFilters {
  classId?: string;
  scope?: AnnouncementScope;
  grade?: string;
  authorId?: string;
  mine?: boolean;
  unread?: boolean;
  q?: string;
  /** Parents: only posts that reach this child. */
  studentId?: string;
  limit?: number;
}

export interface NewAnnouncementInput {
  scope: AnnouncementScope;
  classId?: string;
  grade?: string;
  title: string;
  body: string;
  pinnedUntil?: string | null;
  files?: File[];
}

/** POST /announcements/preview-email: the draft to email the author. */
export interface AnnouncementPreviewEmailInput {
  scope: AnnouncementScope;
  classId?: string;
  grade?: string;
  title: string;
  body: string;
  attachmentCount?: number;
  /** Up to 5 addresses; omitted or empty means the caller. */
  to?: string[];
}
export type AnnouncementPreviewEmailResponse = AnnouncementResponse<{ sentTo: string[] }>;

export interface EditAnnouncementInput {
  title?: string;
  body?: string;
  /** null clears the pin. */
  pinnedUntil?: string | null;
  removeAttachmentIds?: string[];
  files?: File[];
}

export type AnnouncementListResponse = AnnouncementResponse<AnnouncementItem[]>;
export type AnnouncementDetailResponse = AnnouncementResponse<AnnouncementDetail>;
export type AnnouncementTargetsResponse = AnnouncementResponse<AnnouncementTargets>;
export type AudiencePreviewResponse = AnnouncementResponse<AudiencePreview>;
export type DeleteAnnouncementResponse = AnnouncementResponse<{ announcementId: string; deletedAt: string | null }>;
export type MarkAnnouncementReadResponse = AnnouncementResponse<{ readAt: string | null }>;
export type RetryAnnouncementEmailsResponse = AnnouncementResponse<{ requeued: number }>;
export type AnnouncementAttachmentUrlResponse = AnnouncementResponse<{ url: string; fileName: string; mimeType: string }>;
