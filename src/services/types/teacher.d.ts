// src/services/types/teacher.ts

/**
 * Represents a single teacher (i.e. a user with role='teacher') as returned by the API
 */
export interface TeacherPayload {
  userId:   string; // same as users.user_id
  fullName: string; // first_name + " " + last_name
  email:    string;
}

/**
 * Response wrapper for list-of-teachers endpoints
 */
export interface AllTeachersResponse {
  status: string;
  data: TeacherPayload[];
  message?: string;
}
