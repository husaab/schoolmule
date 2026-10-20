// src/services/types/studentAccount.d.ts
// Admin Panel → Student accounts (/api/admin/student-accounts) and the
// school's classroom settings (/api/admin/classroom-settings).

export type GradeCode = 'JK' | 'SK' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

/** not_eligible = the grade is below loginFromGrade (JK/SK by default). */
export type AccountStatus = 'not_invited' | 'invited' | 'active' | 'archived' | 'not_eligible';

export interface ClassroomSettings {
  /** Student sign-in (the student portal) on or off for the whole school. */
  enabled: boolean;
  loginFromGrade: GradeCode;
  qrUntilGrade: GradeCode;
  /** null = student email off. */
  studentEmailFromGrade: GradeCode | null;
  parentsReadPrivateComments: boolean;
  /** 0 = Sunday … 6 = Saturday. */
  summaryDow: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** The parents' weekly summary, its own switch (apart from student sign-in). Absent from older servers. */
  parentSummary?: boolean;
  studentPhotos: boolean;
  /** Recorded with each consent; no longer shown or edited. */
  consentNoticeVersion: string;
  /** The domains of the school's student addresses ([] = no domain checks). */
  studentEmailDomains: string[];
  /** 'google_only' turns password sign-in off for students. */
  studentSignIn: StudentSignIn;
  /** null when the school never saved its settings (defaults). */
  updatedAt: string | null;
}

export type StudentSignIn = 'google_or_password' | 'google_only';

/** PUT body: every field except updatedAt. */
export type ClassroomSettingsInput = Omit<ClassroomSettings, 'updatedAt'>;

export type ConflictKind = 'email_in_use' | 'family_address' | 'shared_with_student';

/** The latest invite of a login: still open (pending / failed / expired) or how it ended. */
export type InviteState =
  | 'pending' | 'failed' | 'expired'
  | 'accepted' | 'replaced' | 'cancelled' | 'email_changed' | 'archived';

export interface StudentInvite {
  state: InviteState;
  sentAt: string | null;
  expiresAt: string;
  endedAt: string | null;
  /** Why the email failed (state 'failed'). */
  error: string | null;
}

export type SignInMethod = 'google' | 'password' | 'card';

/** A problem with a student's address: blocking ones can't be saved or invited. */
export interface EmailProblem {
  code:
    | 'invalid_email' | 'email_in_use' | 'family_address' | 'shared_with_student'
    | 'has_login' | 'duplicate_in_list' | 'not_found'
    | 'outside_domain' | 'name_mismatch' | 'replaces_existing';
  blocking: boolean;
  message: string;
  /** replaces_existing: the import leaves the row unticked until the admin opts in. */
  defaultUnticked?: boolean;
}

export interface StudentAccountLogin {
  userId: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  consent: { at: string; byName: string | null; noticeVersion: string | null } | null;
  qr: { active: boolean; issuedAt: string | null; voidedAt: string | null };
}

/** One student of the selected school year with their login, if any. */
export interface StudentAccountRow {
  studentId: string;
  name: string;
  /** The student's own avatar (final review M7); optional, older servers don't send it. */
  studentAvatar?: import('./profile').AvatarSpec | null;
  /** Signed URL of the photo on the student's login (null while the school has student photos off). */
  studentPhotoUrl?: string | null;
  grade: GradeCode;
  homeroomTeacherName: string | null;
  /** The student's own address (students.student_email). */
  studentEmail: string | null;
  status: AccountStatus;
  account: StudentAccountLogin | null;
  /** Invited or active, and the grade is at or below qrUntilGrade. */
  qrEligible: boolean;
  /** The address belongs to another account, a parent on file, or another student this year. */
  conflict: { kind: ConflictKind; message: string } | null;
  /** Non-blocking: outside the school's student domain, or not mentioning the student. */
  warnings?: { code: 'outside_domain' | 'name_mismatch'; message: string }[];
  /** The login's latest invite (null without one). Optional: older servers don't send it. */
  invite?: StudentInvite | null;
  /** How the login signs in, or null before it does. */
  signInMethod?: SignInMethod | null;
  /** An invite that didn't go out, expired or was cancelled, or a card student past the card grades. */
  needsAttention?: boolean;
}

export interface StudentAccountList {
  settings: ClassroomSettings;
  students: StudentAccountRow[];
}

export type InviteSkipReason =
  | 'no_email'
  | 'invalid_email'
  | 'email_in_use'
  | 'family_address'
  | 'shared_with_student'
  | 'already_has_account'
  | 'below_login_grade';

export interface InviteResult {
  studentId: string;
  outcome: 'invited' | 'skipped';
  reason: InviteSkipReason | null;
  message: string;
  userId?: string;
  /** false: the account was created but the email failed (Resend invite recovers it). */
  inviteSent?: boolean;
  inviteId?: string;
  sendStatus?: 'sent' | 'failed';
}

/** POST /invites/resend. */
export interface ResendInvitesResponse {
  results: { studentId: string; outcome: 'sent' | 'skipped' | 'failed'; message: string }[];
}

/** GET /invite-preview: the invite email as this student would get it. */
export interface InvitePreview {
  subject: string;
  html: string;
}

// Import emails (/emails/parse, /emails/preview, /emails)

export interface EmailImportParse {
  sheets: string[];
  sheet: string;
  rows: string[][];
}

export interface EmailImportCandidate {
  studentId: string;
  name: string;
  grade: GradeCode;
  currentEmail: string | null;
  problems: EmailProblem[];
}

export interface EmailImportPreviewLine {
  /** The line's position in the request. */
  index: number;
  email: string;
  match: { kind: 'matched' | 'check' | 'not_found'; candidates: EmailImportCandidate[] };
}

export interface EmailImportSaveResponse {
  saved: number;
  results: { studentId: string; outcome: 'saved' | 'refused'; problems: EmailProblem[] }[];
}

export interface InviteResponse {
  invited: number;
  skipped: number;
  results: InviteResult[];
}

/** A student login with no student row linked this school year (relink picker). */
export interface UnlinkedStudentUser {
  userId: string;
  name: string;
  email: string;
  lastSchoolYearLabel: string | null;
}

export interface StudentAccountEnvelope<T> {
  status: 'success' | 'failed';
  message?: string;
  data: T;
}
