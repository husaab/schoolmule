// src/services/staffService.ts

import apiClient from './apiClient';
import {
  StaffListResponse,
  StaffResponse,
  StaffRequest,
  DeleteStaffResponse
} from './types/staff';

/**
 * Fetch all staff members for a specific school
 * GET /api/staff?school=<school>
 */
export const getStaffBySchool = async (school: string): Promise<StaffListResponse> => {
  const url = `/staff?school=${encodeURIComponent(school)}`;
  return apiClient<StaffListResponse>(url);
};

/**
 * Fetch a specific staff member by ID
 * GET /api/staff/:staffId
 */
export const getStaffById = async (staffId: string): Promise<StaffResponse> => {
  const url = `/staff/${encodeURIComponent(staffId)}`;
  return apiClient<StaffResponse>(url);
};

/**
 * Create a new staff member
 * POST /api/staff
 */
export const createStaff = async (payload: StaffRequest): Promise<StaffResponse> => {
  const url = '/staff';
  return apiClient<StaffResponse>(url, {
    method: 'POST',
    body: payload
  });
};

/**
 * Update an existing staff member
 * PATCH /api/staff/:staffId
 */
export const updateStaff = async (
  staffId: string, 
  payload: Partial<StaffRequest> & { school: string }
): Promise<StaffResponse> => {
  const url = `/staff/${encodeURIComponent(staffId)}`;
  return apiClient<StaffResponse>(url, {
    method: 'PATCH',
    body: payload
  });
};


export interface DeleteStaffPayload {
  school: string;
}

/**
 * Delete a staff member
 * DELETE /api/staff/:staffId
 */
export const deleteStaff = async (
  staffId: string, 
  school: string
): Promise<DeleteStaffResponse> => {
  const url = `/staff/${encodeURIComponent(staffId)}`;
  return apiClient<DeleteStaffResponse>(url, {
    method: 'DELETE',
    body: { school }
  });
};
