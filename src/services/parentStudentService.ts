import apiClient from './apiClient';
import {
  ParentStudentListResponse,
  ParentStudentResponse,
  ParentStudentDeleteResponse,
  CreateParentStudentRequest,
  UpdateParentStudentRequest
} from './types/parentStudent';

/**
 * Fetch all parent-student relations for a given school
 * GET /parent-students?school=X
 */
export const getAllParentStudents = async (
  school: string
): Promise<ParentStudentListResponse> => {
  return apiClient<ParentStudentListResponse>(
    `/parent-students?school=${encodeURIComponent(school)}`
  );
};

/**
 * Fetch a single parent-student relation by its link ID
 * GET /parent-students/:id
 */
export const getParentStudentById = async (
  id: string
): Promise<ParentStudentResponse> => {
  return apiClient<ParentStudentResponse>(`/parent-students/${encodeURIComponent(id)}`);
};

/**
 * Fetch all parent relations for a given student
 * GET /parent-students/student/:studentId
 */
export const getParentsByStudentId = async (
  studentId: string
): Promise<ParentStudentListResponse> => {
  return apiClient<ParentStudentListResponse>(
    `/parent-students/student/${encodeURIComponent(studentId)}`
  );
};

/**
 * Fetch all student relations for a given parent
 * GET /parent-students/parent/:parentId
 */
export const getStudentsByParentId = async (
  parentId: string
): Promise<ParentStudentListResponse> => {
  return apiClient<ParentStudentListResponse>(
    `/parent-students/parent/${encodeURIComponent(parentId)}`
  );
};

/**
 * Create a new parent-student relation
 * POST /parent-students
 */
export const createParentStudent = async (
  payload: CreateParentStudentRequest
): Promise<ParentStudentResponse> => {
  return apiClient<ParentStudentResponse>(`/parent-students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
};

/**
 * Update an existing parent-student relation
 * PATCH /parent-students/:id
 */
export const updateParentStudent = async (
  id: string,
  payload: UpdateParentStudentRequest
): Promise<ParentStudentResponse> => {
  return apiClient<ParentStudentResponse>(`/parent-students/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
};

/**
 * Delete a parent-student relation by its link ID
 * DELETE /parent-students/:id
 */
export const deleteParentStudent = async (
  id: string
): Promise<ParentStudentDeleteResponse> => {
  return apiClient<ParentStudentDeleteResponse>(`/parent-students/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};
