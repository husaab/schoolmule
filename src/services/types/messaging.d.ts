/** Shared response envelope for /api/messaging endpoints */
export interface MessagingResponse<T> {
  status: 'success' | 'failed';
  data?: T;
  message?: string;
}

export type ConversationStatus = 'open' | 'resolved';
export type ConversationKind = 'assessment' | 'general';
export type SenderRole = 'PARENT' | 'TEACHER' | 'ADMIN';

export interface LastMessage {
  senderId: string | null;
  senderName: string;
  senderRole: SenderRole;
  kind: 'message' | 'system';
  /** First 140 characters; null when the message was removed. */
  body: string | null;
  deleted: boolean;
  createdAt: string;
}

export interface ConversationItem {
  conversationId: string;
  studentId: string;
  studentName: string;
  /** null for a homeroom-anchored general thread. */
  classId: string | null;
  classSubject: string;
  assessmentId: string | null;
  /** 'general' threads have no assessment; title is the author's subject. */
  kind: ConversationKind;
  /** Set for homeroom-anchored general threads with no class row. */
  teacherId: string | null;
  /** Snapshot of the assessment name at creation, or the general subject. */
  title: string;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  leadTeacherName: string | null;
  /** The class's term, for the staff inbox's term filter. */
  termName: string | null;
  /** Every guardian of the student (accounts and free-text rows), for the parent filter. */
  guardianNames: string[];
  unreadCount: number;
  /** The last real message came from the other side of the table. */
  needsReply: boolean;
  lastMessage: LastMessage | null;
  /** Admin lists only: a digest email for this thread failed after retries. */
  emailFailed?: boolean;
}

export interface Attachment {
  attachmentId: string;
  messageId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Signed URL, valid for an hour from the thread fetch. */
  url: string | null;
}

export interface Message {
  messageId: string;
  senderId: string | null;
  senderName: string;
  senderRole: SenderRole;
  /** e.g. "Mother" — only for guardians. */
  senderRelation: string | null;
  kind: 'message' | 'system';
  /** null once removed. */
  body: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  attachments: Attachment[];
}

export interface Participant {
  userId: string;
  name: string;
  role: SenderRole;
  relation: string | null;
  /** Invited guardian who has not set a password yet. */
  invitePending: boolean;
}

/** Staff-only context strip for general threads. */
export interface StudentContext {
  studentId: string;
  name: string;
  grade: string | number | null;
  homeroomTeacherName: string | null;
  attendancePct: number | null;
}

export type InviteStatus = 'invited' | 'linked' | 'skipped' | 'failed';
export interface InviteResult {
  linkId: string;
  name: string;
  status: InviteStatus;
}

export interface AssessmentContext {
  assessmentId: string;
  name: string;
  date: string | null;
  weightPoints: number | null;
  maxScore: number | null;
  /** Hidden (null) from parents until the assessment is published. */
  score: number | null;
  pct: number | null;
  isPublished: boolean;
  parentComment: string | null;
  /** Staff only. */
  classAvgPct: number | null;
}

export interface Thread {
  conversation: ConversationItem;
  context: AssessmentContext | null;
  /** Present for staff on general threads. */
  student: StudentContext | null;
  participants: Participant[];
  messages: Message[];
  lastReadAt: string | null;
  muted: boolean;
  /** Returned on create/reply when guardians were invited or linked. */
  invites?: InviteResult[];
}

export interface UnreadSummary {
  unreadConversations: number;
  unreadMessages: number;
  needsReply: number;
  /** Visible announcements the caller has not opened (never their own). */
  unreadAnnouncements: number;
}

export interface ThreadStub {
  conversationId: string;
  studentId: string;
  classId: string;
  assessmentId: string | null;
  status: ConversationStatus;
  unreadCount: number;
}

export interface ParentTargetAssessment {
  assessmentId: string;
  name: string;
  date: string | null;
  conversationId: string | null;
}

export interface ParentTargetClass {
  classId: string;
  subject: string;
  teacherName: string | null;
  assessments: ParentTargetAssessment[];
}

export interface ParentTargetTeacher {
  userId: string;
  name: string;
  /** "Homeroom" or the class subject. */
  via: string;
}

export interface ParentTargets {
  classes: ParentTargetClass[];
  teachers: ParentTargetTeacher[];
}

export interface StaffTargetGuardian {
  linkId: string;
  name: string | null;
  relation: string | null;
  email: string | null;
  hasAccount: boolean;
  invitePending: boolean;
  invitedAt: string | null;
}

export interface StaffTargetAssessment {
  assessmentId: string;
  name: string;
  date: string | null;
  isPublished: boolean;
}

export interface StaffTargets {
  students: { studentId: string; name: string; guardians: StaffTargetGuardian[] }[];
  /** Class-scoped picker (gradebook): the assessments of that one class. */
  assessments: StaffTargetAssessment[];
  /** Student-scoped picker (Students page): the classes the caller teaches the student in. */
  classes?: { classId: string; subject: string; assessments: StaffTargetAssessment[] }[];
}

export interface ListFilters {
  status?: 'open' | 'resolved' | 'all';
  unread?: boolean;
  classId?: string;
  studentId?: string;
  q?: string;
  limit?: number;
}

interface NewConversationBase {
  studentId: string;
  body: string;
  files?: File[];
  /** Staff only: invite guardians who have an email but no account (default true). */
  invite?: boolean;
  /** Staff only: include the full message in the invite email (default true). */
  includePreview?: boolean;
}
export interface NewAssessmentConversationInput extends NewConversationBase {
  classId: string;
  assessmentId: string;
}
export interface NewGeneralConversationInput extends NewConversationBase {
  teacherId: string;
  title: string;
  /** Optional: the class (subject) the thread is about. */
  classId?: string;
  /** "Ask about this": the announcement this thread is about (parents only). */
  announcementId?: string;
}
export type NewConversationInput = NewAssessmentConversationInput | NewGeneralConversationInput;

export interface NewMessageInput {
  body: string;
  files?: File[];
  invite?: boolean;
  includePreview?: boolean;
}

export type ConversationListResponse = MessagingResponse<ConversationItem[]>;
export type ThreadResponse = MessagingResponse<Thread>;
export type UnreadSummaryResponse = MessagingResponse<UnreadSummary>;
export type ThreadStubsResponse = MessagingResponse<ThreadStub[]>;
export type ParentTargetsResponse = MessagingResponse<ParentTargets>;
export type ResendInviteResponse = MessagingResponse<{ linkId: string; status: InviteStatus }>;
export type StaffTargetsResponse = MessagingResponse<StaffTargets>;
export type EditMessageResponse = MessagingResponse<{ messageId: string; body: string; editedAt: string }>;
export type DeleteMessageResponse = MessagingResponse<{ messageId: string; deletedAt: string }>;
export type MarkReadResponse = MessagingResponse<{ lastReadAt: string | null }>;
export type SetStatusResponse = MessagingResponse<{ status: ConversationStatus }>;
export type SetMutedResponse = MessagingResponse<{ muted: boolean }>;
export type AttachmentUrlResponse = MessagingResponse<{ url: string; fileName: string; mimeType: string }>;
