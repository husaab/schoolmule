// src/services/types/parent.ts

/**
 * Represents a parent user in the system.
 */
export interface ParentPayload {
  /** UUID of the parent user */
  userId: string;
  /** First name of the parent */
  firstName: string;
  /** Last name of the parent */
  lastName: string;
  /** Combined first + last name for convenience */
  fullName: string;
  /** Email address of the parent */
  email: string;
  /** School identifier */
  school: string;
  /** ISO timestamp when this user was created */
  createdAt: string;
}

/**
 * Generic API response wrapper for a list of parents
 */
export interface AllParentsResponse {
  status: 'success' | 'failed';
  data?: ParentPayload[];
  message?: string;
}

/**
 * Generic API response wrapper for a single parent
 */
export interface ParentResponse {
  status: 'success' | 'failed';
  data?: ParentPayload;
  message?: string;
}
