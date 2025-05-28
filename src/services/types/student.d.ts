// File: src/services/types/student.ts

/**
 * Represents a single student record as returned by the API
 */
export interface StudentPayload {
  studentId: string;
  name: string;
  homeroomTeacherId: string | null;
  school: string;
  grade: number | null;
  oen: string | null;
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
  createdAt: string;
  lastModifiedAt: string;
}

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
