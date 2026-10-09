// src/services/types/adminUser.d.ts

export type SchoolRole = 'ADMIN' | 'TEACHER' | 'PARENT';

/** A user account as seen from the admin Users page. */
export interface SchoolUser {
  userId: string;
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  role: SchoolRole;
  /** Admins only: the title parents see when they message them (e.g. "Principal"). null = parents can't message them. */
  staffTitle: string | null;
  isVerified: boolean;
  isVerifiedSchool: boolean;
  /** Archived: kept with all their records, hidden from staff lists, can't sign in. */
  isArchived: boolean;
  archivedAt: string | null;
  /** Set when a signup was declined from the Approvals page (always archived too). */
  declinedAt: string | null;
  /** Created by an admin and hasn't set a password yet. */
  invitePending: boolean;
  createdAt: string;
  lastModifiedAt: string;
}

export interface SchoolUserDetails extends SchoolUser {
  /** Classes taught in the selected school year. */
  classes: { classId: string; grade: string; subject: string; termName: string | null; isLead: boolean }[];
  homeroom: { grade: string; studentCount: number }[];
  /** Staff directory entry matched on email, if any. */
  staffProfile: {
    staffId: string;
    fullName: string;
    staffRole: string;
    teachingAssignments: string[] | string | null;
    homeroomGrade: string | null;
    phone: string | null;
    preferredContact: string | null;
    phoneContactHours: string | null;
    emailContactHours: string | null;
  } | null;
  children: { studentId: string; name: string; grade: string; relation: string | null }[];
  /** What must be reassigned before this account can be archived. */
  archiveBlockers: ArchiveBlockers;
}

export interface ArchiveBlockers {
  classes: { classId: string; grade: string; subject: string; termName: string | null }[];
  homeroomStudents: number;
}

export interface InviteUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: SchoolRole;
}

export interface UpdateSchoolUserRequest {
  firstName: string;
  lastName: string;
  role: SchoolRole;
  isVerifiedSchool: boolean;
  /** Admins only; empty or omitted clears it. Ignored for other roles. */
  staffTitle?: string;
}

/** POST /admin/users/:id/impersonate — a login-shaped payload for the previewed user. */
export interface ImpersonationStart {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  school: string;
  role: SchoolRole;
  /** Dual-role claims, when the backend sends them. The switcher is hidden during a preview anyway. */
  baseRole?: string;
  roles?: string[];
  isVerified: boolean;
  isVerifiedSchool: boolean;
  activeTerm: string | false;
  activeSchoolYear: { schoolYearId: string; label: string } | null;
  schoolYears: import('./schoolYear').SchoolYear[];
  /** The admin who started the preview. */
  impersonator: { userId: string; username: string; fullName: string };
  /** Short-lived, read-only token for the previewed user. */
  token: string;
}

export interface AdminUserResponse<T> {
  status: 'success' | 'failed';
  message?: string;
  data: T;
}
