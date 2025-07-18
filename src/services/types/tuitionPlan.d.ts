// src/services/types/tuitionPlan.d.ts

/**
 * Represents a tuition plan record
 */
export interface TuitionPlanPayload {
  planId: string;
  school: string;
  grade: string;
  amount: number;
  frequency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  lastModifiedAt?: string;
}

/**
 * Response wrapper for list endpoints
 */
export interface TuitionPlanListResponse {
  status: 'success' | 'failed';
  data: TuitionPlanPayload[];
  message?: string;
}

/**
 * Response wrapper for single tuition plan endpoints
 */
export interface TuitionPlanResponse {
  status: 'success' | 'failed';
  data: TuitionPlanPayload;
  message?: string;
}

/**
 * Request payload for creating/updating tuition plans
 */
export interface TuitionPlanRequest {
  school: string;
  grade: string;
  amount: number;
  frequency: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

/**
 * Response wrapper for delete endpoints
 */
export interface DeleteTuitionPlanResponse {
  status: 'success' | 'failed';
  message?: string;
}