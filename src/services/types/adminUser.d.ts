// src/services/types/adminUser.d.ts

import type { AccessClaims } from './auth';

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
  /** Staff only: Mr. | Ms. | Mrs. | Dr. before the name parents see ("Ms. Doha Chahade"); null = plain name. */
  honorific?: Honorific | null;
  /** The custom access role (RBAC); null for the built-in Admin or Teacher. Optional until the backend sends it. */
  accessRoleId?: string | null;
  accessRoleName?: string | null;
  /** An ADMIN with no access role: only full admins may edit, archive, delete or preview them. */
  isFullAdmin?: boolean;
  isVerified: boolean;
  isVerifiedSchool: boolean;
  /** Archived: kept with all their records, hidden from staff lists, can't sign in. */
  isArchived: boolean;
  archivedAt: string | null;
  /** Set when a signup was declined from the Approvals page (always archived too). */
  declinedAt: string | null;
  /** Created by an admin and hasn't set a password yet. */
  invitePending: boolean;
  /** null = the neutral avatar. */
  avatar?: import('./profile').AvatarSpec | null;
  /** Signed photo URL (null = no photo). */
  photoUrl?: string | null;
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

export type Honorific = 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.';

export interface InviteUserRequest {
  honorific?: Honorific | null;
  firstName: string;
  lastName: string;
  email: string;
  role: SchoolRole;
  /** Full admins only, staff roles only. Omitted = the built-in Admin or Teacher. */
  accessRoleId?: string | null;
}

export interface UpdateSchoolUserRequest {
  firstName: string;
  lastName: string;
  role: SchoolRole;
  isVerifiedSchool: boolean;
  /** Admins only; empty or omitted clears it. Ignored for other roles. */
  staffTitle?: string;
  /** Omitted keeps the stored title; null clears it. */
  honorific?: Honorific | null;
  /** Full admins only. null clears it (back to the built-in); omitted leaves it unchanged. */
  accessRoleId?: string | null;
}

/** POST /admin/users/:id/impersonate — a login-shaped payload for the previewed user. */
export interface ImpersonationStart extends AccessClaims {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  school: string;
  /** STUDENT when an admin previews a student login (Admin Panel → Student accounts). */
  role: SchoolRole | 'STUDENT';
  /** Dual-role claims, when the backend sends them. The switcher is hidden during a preview anyway. */
  baseRole?: string;
  roles?: string[];
  isVerified: boolean;
  isVerifiedSchool: boolean;
  /** The previewed account's avatar (null = the neutral avatar). */
  avatar?: import('./profile').AvatarSpec | null;
  /** The previewed account's signed photo URL (null = no photo). */
  photoUrl?: string | null;
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
