/** Shared response envelope for /api/messaging endpoints */
export interface MessagingResponse<T> {
  status: 'success' | 'failed';
  data?: T;
  message?: string;
}

export type ConversationStatus = 'open' | 'resolved';
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
  classId: string;
  classSubject: string;
  assessmentId: string | null;
  /** Snapshot of the assessment name at creation. */
  title: string;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  leadTeacherName: string | null;
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
  participants: Participant[];
  messages: Message[];
  lastReadAt: string | null;
  muted: boolean;
}

export interface UnreadSummary {
  unreadConversations: number;
  unreadMessages: number;
  needsReply: number;
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

export interface StaffTargetGuardian {
  name: string | null;
  relation: string | null;
  hasAccount: boolean;
}

export interface StaffTargets {
  students: { studentId: string; name: string; guardians: StaffTargetGuardian[] }[];
  assessments: { assessmentId: string; name: string; date: string | null; isPublished: boolean }[];
}

export interface ListFilters {
  status?: 'open' | 'resolved' | 'all';
  unread?: boolean;
  classId?: string;
  studentId?: string;
  q?: string;
  limit?: number;
}

export interface NewConversationInput {
  studentId: string;
  classId: string;
  assessmentId: string;
  body: string;
  files?: File[];
}

export interface NewMessageInput {
  body: string;
  files?: File[];
}

export type ConversationListResponse = MessagingResponse<ConversationItem[]>;
export type ThreadResponse = MessagingResponse<Thread>;
export type UnreadSummaryResponse = MessagingResponse<UnreadSummary>;
export type ThreadStubsResponse = MessagingResponse<ThreadStub[]>;
export type ParentTargetsResponse = MessagingResponse<ParentTargetClass[]>;
export type StaffTargetsResponse = MessagingResponse<StaffTargets>;
export type EditMessageResponse = MessagingResponse<{ messageId: string; body: string; editedAt: string }>;
export type DeleteMessageResponse = MessagingResponse<{ messageId: string; deletedAt: string }>;
export type MarkReadResponse = MessagingResponse<{ lastReadAt: string | null }>;
export type SetStatusResponse = MessagingResponse<{ status: ConversationStatus }>;
export type SetMutedResponse = MessagingResponse<{ muted: boolean }>;
export type AttachmentUrlResponse = MessagingResponse<{ url: string; fileName: string; mimeType: string }>;
