// src/services/schoolService.ts

import apiClient from './apiClient';
import {
  SchoolPayload,
  CreateSchoolRequest,
  UpdateSchoolRequest,
  SchoolResponse,
  SchoolsResponse,
  SchoolDeleteResponse
} from './types/school';

/**
 * Get all schools
 * GET /api/schools
 */
export const getAllSchools = async (): Promise<SchoolsResponse> => {
  return apiClient<SchoolsResponse>('/schools');
};

/**
 * Get school by code (enum)
 * GET /api/schools/:code
 */
export const getSchoolByCode = async (code: string): Promise<SchoolResponse> => {
  return apiClient<SchoolResponse>(`/schools/${encodeURIComponent(code)}`);
};

/**
 * Get school by ID
 * GET /api/schools/id/:id
 */
export const getSchoolById = async (id: string): Promise<SchoolResponse> => {
  return apiClient<SchoolResponse>(`/schools/id/${encodeURIComponent(id)}`);
};

/**
 * Create new school
 * POST /api/schools
 */
export const createSchool = async (schoolData: CreateSchoolRequest): Promise<SchoolResponse> => {
  return apiClient<SchoolResponse>('/schools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: schoolData,
  });
};

/**
 * Update school
 * PUT /api/schools/:id
 */
export const updateSchool = async (
  id: string,
  schoolData: UpdateSchoolRequest
): Promise<SchoolResponse> => {
  return apiClient<SchoolResponse>(`/schools/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: schoolData,
  });
};

/**
 * Delete school
 * DELETE /api/schools/:id
 */
export const deleteSchool = async (id: string): Promise<SchoolDeleteResponse> => {
  return apiClient<SchoolDeleteResponse>(`/schools/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};