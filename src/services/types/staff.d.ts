// src/services/types/staff.d.ts

/**
 * Represents a staff member record
 */
export interface StaffPayload {
  staffId: string;
  school: string;
  fullName: string;
  staffRole: string;
  teachingAssignments?: any; // JSONB field
  homeroomGrade?: string;
  email?: string;
  phone?: string;
  preferredContact?: string;
  phoneContactHours?: string;
  emailContactHours?: string;
  createdAt: string;
}

/**
 * Response wrapper for list endpoints
 */
export interface StaffListResponse {
  status: 'success' | 'failed';
  data: StaffPayload[];
  message?: string;
}

/**
 * Response wrapper for single staff endpoints
 */
export interface StaffResponse {
  status: 'success' | 'failed';
  data: StaffPayload;
  message?: string;
}

/**
 * Request payload for creating/updating staff
 */
export interface StaffRequest {
  school: string;
  fullName: string;
  staffRole: string;
  teachingAssignments?: any;
  homeroomGrade?: string;
  email?: string;
  phone?: string;
  preferredContact?: string;
  phoneContactHours?: string;
  emailContactHours?: string;
}

/**
 * Response wrapper for delete endpoints
 */
export interface DeleteStaffResponse {
  status: 'success' | 'failed';
  message?: string;
}