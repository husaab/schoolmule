/** Shared response envelope for /api/announcements endpoints */
export interface AnnouncementResponse<T> {
  status: 'success' | 'failed';
  data?: T;
  message?: string;
  /** 'REMOVED' when a deleted announcement is fetched by id (HTTP 410). */
  code?: string;
}

export type AnnouncementScope = 'class' | 'grade' | 'school' | 'custom';
export type AnnouncementAuthorRole = 'TEACHER' | 'ADMIN';

export interface AnnouncementChild {
  studentId: string;
  name: string;
  grade?: string | null;
}

/** One row of the custom-audience picker (GET /announcements/students). */
export interface PickableStudent {
  studentId: string;
  name: string;
  grade: string | null;
  classes: { classId: string; subject: string }[];
  guardianNames: string[];
  /** At least one guardian address on file (link row or student record). */
  hasEmail: boolean;
}

/** Where announcement emails come from and where replies land (GET /announcements/targets). */
export interface AnnouncementSender {
  from: string;
  replyTo: { email: string; name: string | null }[];
  /** Teachers: their own address is prepended for their posts. */
  includesAuthor: boolean;
  /** Admins may change the office list on the school settings page. */
  canEdit: boolean;
}

export interface AnnouncementItem {
  announcementId: string;
  scope: AnnouncementScope;
  classId: string | null;
  classSubject: string | null;
  classGrade: string | null;
  grade: string | null;
  /** "Gr 6 Math" | "Grade 6" | "Whole school" | "Selected families" */
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
  /** The author asked families to press "Got it". */
  ackRequested: boolean;
  /** The caller has acknowledged it. */
  acked: boolean;
  ackedAt: string | null;
  /** Staff lists only. */
  seenCount?: number;
  audienceCount?: number;
  ackCount?: number;
  /** Custom scope, staff lists: how many students were picked and the first three as "Amina R.". */
  studentCount?: number;
  studentNamesPreview?: string[];
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
  ackedAt: string | null;
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
  /** Staff only, custom scope: the picked students (for the editor and the "To …" line). */
  students?: AnnouncementChild[];
}

export interface AnnouncementTargets {
  classes: { classId: string; subject: string; grade: string | null; studentCount: number }[];
  grades: { grade: string; studentCount: number }[];
  canSchool: boolean;
  canCustom: boolean;
  sender: AnnouncementSender | null;
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
  /** Custom scope: the picked students (1–500). */
  studentIds?: string[];
  ackRequested?: boolean;
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
  studentIds?: string[];
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
  /** Custom scope only: the full new selection. */
  studentIds?: string[];
  ackRequested?: boolean;
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
export type PickableStudentsResponse = AnnouncementResponse<PickableStudent[]>;
export type AcknowledgeAnnouncementResponse = AnnouncementResponse<{ ackedAt: string | null }>;
export type AnnouncementAttachmentUrlResponse = AnnouncementResponse<{ url: string; fileName: string; mimeType: string }>;
