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
  isVerified: boolean;
  isVerifiedSchool: boolean;
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
}

export interface AdminUserResponse<T> {
  status: 'success' | 'failed';
  message?: string;
  data: T;
}
