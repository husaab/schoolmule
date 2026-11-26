// File: src/services/types/student.ts

import { GradeValue } from "@/lib/schoolUtils";

/**
 * Represents a single student record as returned by the API
 */
export interface StudentPayload {
  studentId: string;
  name: string;
  homeroomTeacherId: string | null;
  school: string;
  grade: GradeValue | null;
  oen: string | null;
  /** The student's own pick, else the one a teacher set (null = the neutral avatar). */
  avatar?: import('./profile').AvatarSpec | null;
  /** Signed URL of the photo on the student's login (null while the school has student photos off). */
  photoUrl?: string | null;
  mother: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  father: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  emergencyContact: string | null;
  dateOfBirth: string | null;
  address: string | null;
  healthCardNumber: string | null;
  medicalNotes: string | null;
  /** null = not set (existing students were prefilled from their first name where it was clear). */
  gender?: 'male' | 'female' | null;
  /**
   * The student's own address (their SchoolMule sign-in once invited).
   * Admin-only to set: the server refuses any other role's body that carries
   * this key, so non-admin forms must leave it out entirely.
   */
  studentEmail?: string | null;
  /**
   * The registration form submission this student was imported from, or null
   * when the record was entered manually.
   */
  sourceSubmissionId?: string | null;
  /**
   * The school's custom fields this student has a value for, and their one-off
   * notes. Sent only to staff who edit students; absent for everyone else.
   */
  customFields?: import('./studentCustomField').StudentCustomFields;
  createdAt: string;
  lastModifiedAt: string;
  // Archive fields - optional to maintain backward compatibility
  isArchived?: boolean;
  archivedAt?: string | null;
  archivedBy?: string | null;
}

/**
 * The body of a student create or update. Custom fields travel as a change
 * (only the fields being set or cleared), not as the whole stored object.
 */
export type StudentWriteBody = Omit<StudentPayload, 'studentId' | 'createdAt' | 'lastModifiedAt' | 'customFields'> & {
  customFields?: import('./studentCustomField').StudentCustomFieldsPatch;
};

/**
 * Response wrapper for single-student endpoints
 */
export interface StudentResponse {
  status: string;
  data: StudentPayload;
  message?: string;
}

/**
 * Response wrapper for list-of-students endpoints
 */
export interface AllStudentsResponse {
  status: string;
  data: StudentPayload[];
  message?: string;
}

export interface EnrollStudentPayload {
  studentId: string;
}

/**
 * Response returned by POST /classes/:classId/students
 */
export interface EnrollStudentResponse {
  status: string;
  data: {
    classId: string;
    studentId: string;
  };
  message?: string;
}

/**
 * Response returned by DELETE /classes/:classId/students/:studentId
 */
export interface UnenrollStudentResponse {
  status: string;
  message: string;
}

/**
 * Response returned by POST /students/:id/archive and /students/:id/unarchive
 */
export interface ArchiveStudentResponse {
  status: string;
  data: StudentPayload;
  message: string;
}