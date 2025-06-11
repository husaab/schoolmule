import apiClient from './apiClient';
import {
  PendingApprovalResponse,
  AdminApprovalRequest,
  AdminApprovalResponse,
  ResendApprovalRequest,
  ResendApprovalResponse,
} from './types/admin';

/**
 * GET /auth/pending-approvals
 */
export const fetchPendingApprovals = async (
  school: string
): Promise<PendingApprovalResponse> => {
  return apiClient<PendingApprovalResponse>(
    `/auth/pending-approvals?school=${encodeURIComponent(school)}`
  );
};

/**
 * POST /auth/approve-school
 */
export const approveUser = async (
  payload: AdminApprovalRequest
): Promise<AdminApprovalResponse> => {
  return apiClient<AdminApprovalResponse>('/auth/approve-school', {
    method: 'POST',
    body: payload,
  });
};

/**
 * POST /auth/resend-approval-email
 */
export const resendApprovalEmail = async (
  payload: ResendApprovalRequest
): Promise<ResendApprovalResponse> => {
  return apiClient<ResendApprovalResponse>('/auth/resend-approval-email', {
    method: 'POST',
    body: payload,
  });
};


export const declineUserForSchool = async ({ userId }: { userId: string }) => {
  return apiClient('/auth/decline-school', {
    method: 'POST',
    body: { userId },
  });
};
