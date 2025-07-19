// src/services/types/term.d.ts

/**
 * Term data payload (from API response)
 */
export interface TermPayload {
  termId: string;
  school: string;              // School enum value
  schoolId?: string;           // UUID reference
  name: string;                // e.g., "Quarter 1", "Fall Semester"
  startDate: string;           // ISO date string (YYYY-MM-DD)
  endDate: string;             // ISO date string (YYYY-MM-DD)
  academicYear: string;        // e.g., "2024-2025"
  isActive: boolean;           // Only one active term per school
  createdAt: string;           // ISO datetime string
  updatedAt?: string;          // ISO datetime string
  schoolName?: string;         // Human-readable school name (from JOIN)
}

/**
 * Term creation request payload
 */
export interface CreateTermRequest {
  school: string;              // School enum value (required)
  schoolId?: string;           // Optional UUID reference
  name: string;
  startDate: string;           // YYYY-MM-DD format
  endDate: string;             // YYYY-MM-DD format
  academicYear: string;        // e.g., "2024-2025"
  isActive?: boolean;          // Defaults to false
}

/**
 * Term update request payload
 */
export interface UpdateTermRequest {
  name: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  isActive?: boolean;
}

/**
 * Term template for easy setup
 */
export interface TermTemplate {
  name: string;
  startMonth: number;          // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
  displayOrder: number;
}

/**
 * Predefined term template sets
 */
export interface TermTemplateSet {
  name: string;                // "Quarters", "Semesters", "Trimesters"
  description: string;
  terms: TermTemplate[];
}

/**
 * API response for single term
 */
export interface TermResponse {
  status: string;
  data: TermPayload;
}

/**
 * API response for multiple terms
 */
export interface TermsResponse {
  status: string;
  data: TermPayload[];
}

/**
 * Term deletion response
 */
export interface TermDeleteResponse {
  status: string;
  message: string;
  data: TermPayload;
}

/**
 * Term activation response
 */
export interface TermActivateResponse {
  status: string;
  data: TermPayload;
}

/**
 * Academic year summary
 */
export interface AcademicYearSummary {
  academicYear: string;
  startDate: string;
  endDate: string;
  termCount: number;
  activeTermId?: string;
  terms: TermPayload[];
}