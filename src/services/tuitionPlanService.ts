// src/services/tuitionPlanService.ts

import apiClient from './apiClient';
import {
  TuitionPlanListResponse,
  TuitionPlanResponse,
  TuitionPlanRequest,
  DeleteTuitionPlanResponse
} from './types/tuitionPlan';

/**
 * Fetch all tuition plans for a specific school
 * GET /api/tuition-plans?school=<school>
 */
export const getTuitionPlansBySchool = async (school: string): Promise<TuitionPlanListResponse> => {
  const url = `/tuition-plans?school=${encodeURIComponent(school)}`;
  return apiClient<TuitionPlanListResponse>(url);
};

/**
 * Fetch active tuition plans for a specific school
 * GET /api/tuition-plans/active?school=<school>
 */
export const getActiveTuitionPlansBySchool = async (school: string): Promise<TuitionPlanListResponse> => {
  const url = `/tuition-plans/active?school=${encodeURIComponent(school)}`;
  return apiClient<TuitionPlanListResponse>(url);
};

/**
 * Fetch tuition plans by school and grade
 * GET /api/tuition-plans/grade/:grade?school=<school>
 */
export const getTuitionPlansBySchoolAndGrade = async (
  school: string, 
  grade: string
): Promise<TuitionPlanListResponse> => {
  const url = `/tuition-plans/grade/${encodeURIComponent(grade)}?school=${encodeURIComponent(school)}`;
  return apiClient<TuitionPlanListResponse>(url);
};

/**
 * Fetch a specific tuition plan by ID
 * GET /api/tuition-plans/:planId
 */
export const getTuitionPlanById = async (planId: string): Promise<TuitionPlanResponse> => {
  const url = `/tuition-plans/${encodeURIComponent(planId)}`;
  return apiClient<TuitionPlanResponse>(url);
};

/**
 * Create a new tuition plan
 * POST /api/tuition-plans
 */
export const createTuitionPlan = async (payload: TuitionPlanRequest): Promise<TuitionPlanResponse> => {
  const url = '/tuition-plans';
  return apiClient<TuitionPlanResponse>(url, {
    method: 'POST',
    body: payload
  });
};

/**
 * Update an existing tuition plan
 * PATCH /api/tuition-plans/:planId
 */
export const updateTuitionPlan = async (
  planId: string, 
  payload: Partial<TuitionPlanRequest> & { school: string }
): Promise<TuitionPlanResponse> => {
  const url = `/tuition-plans/${encodeURIComponent(planId)}`;
  return apiClient<TuitionPlanResponse>(url, {
    method: 'PATCH',
    body: payload
  });
};

/**
 * Delete a tuition plan
 * DELETE /api/tuition-plans/:planId
 */
export const deleteTuitionPlan = async (
  planId: string, 
  school: string
): Promise<DeleteTuitionPlanResponse> => {
  const url = `/tuition-plans/${encodeURIComponent(planId)}`;
  return apiClient<DeleteTuitionPlanResponse>(url, {
    method: 'DELETE',
    body: { school }
  });
};