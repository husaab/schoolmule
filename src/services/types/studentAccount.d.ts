// src/services/types/studentAccount.d.ts
// Admin Panel → Student accounts (/api/admin/student-accounts) and the
// school's classroom settings (/api/admin/classroom-settings).

export type GradeCode = 'JK' | 'SK' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

/** not_eligible = the grade is below loginFromGrade (JK/SK by default). */
export type AccountStatus = 'not_invited' | 'invited' | 'active' | 'archived' | 'not_eligible';

export interface ClassroomSettings {
  /** Student sign-in on or off for the whole school. */
  enabled: boolean;
  loginFromGrade: GradeCode;
  qrUntilGrade: GradeCode;
  /** null = student email off. */
  studentEmailFromGrade: GradeCode | null;
  parentsReadPrivateComments: boolean;
  /** 0 = Sunday … 6 = Saturday. */
  summaryDow: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  studentPhotos: boolean;
  consentNoticeVersion: string;
  /** null when the school never saved its settings (defaults). */
  updatedAt: string | null;
}

/** PUT body: every field except updatedAt. */
export type ClassroomSettingsInput = Omit<ClassroomSettings, 'updatedAt'>;

export type ConflictKind = 'email_in_use' | 'family_address';

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
  grade: GradeCode;
  homeroomTeacherName: string | null;
  /** The student's own address (students.student_email). */
  studentEmail: string | null;
  status: AccountStatus;
  account: StudentAccountLogin | null;
  /** Invited or active, and the grade is at or below qrUntilGrade. */
  qrEligible: boolean;
  /** The address belongs to another account or to a parent on file. */
  conflict: { kind: ConflictKind; message: string } | null;
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
