// src/services/types/school.d.ts

/**
 * School data payload (from API response)
 */
export interface SchoolPayload {
  schoolId: string;
  schoolCode: string;       // The enum value (e.g., "GREENWOOD_ACADEMY")
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  academicYearStartDate?: string;  // ISO date string
  academicYearEndDate?: string;    // ISO date string
  createdAt: string;              // ISO datetime string
  lastUpdatedAt?: string;         // ISO datetime string
}

/**
 * School creation request payload
 */
export interface CreateSchoolRequest {
  schoolCode: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  academicYearStartDate?: string;
  academicYearEndDate?: string;
}

/**
 * School update request payload
 */
export interface UpdateSchoolRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  academicYearStartDate?: string;
  academicYearEndDate?: string;
}

/**
 * API response for single school
 */
export interface SchoolResponse {
  status: string;
  data: SchoolPayload;
}

/**
 * API response for multiple schools
 */
export interface SchoolsResponse {
  status: string;
  data: SchoolPayload[];
}

/**
 * School deletion response
 */
export interface SchoolDeleteResponse {
  status: string;
  message: string;
  data: {
    schoolId: string;
    schoolCode: string;
    name: string;
  };
}