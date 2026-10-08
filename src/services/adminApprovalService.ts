import apiClient from './apiClient';
import { AdminUserResponse } from './types/adminUser';
import {
  ApprovalUser,
  ApproveSignupRequest,
  ApproveSignupResult,
  ChildCandidatesResponse,
  DeclineSignupResult,
  SignupRole,
} from './types/adminApproval';

// Admin-only. The backend scopes every call to the signed-in admin's school.

/** GET /admin/approvals — pending signups plus declined ones (isArchived) */
export const getApprovals = () =>
  apiClient<AdminUserResponse<ApprovalUser[]>>('/admin/approvals');

/** GET /admin/approvals/:id/children — active-year students, with email-matched suggestions */
export const getChildCandidates = (userId: string) =>
  apiClient<AdminUserResponse<ChildCandidatesResponse>>(`/admin/approvals/${userId}/children`);

/** POST /admin/approvals/:id/approve — set role, link children and grant access in one step */
export const approveSignup = (userId: string, payload: ApproveSignupRequest) =>
  apiClient<AdminUserResponse<ApproveSignupResult>>(`/admin/approvals/${userId}/approve`, {
    method: 'POST',
    body: payload,
  });

/** PATCH /admin/approvals/:id/role — fix the role while the signup is still pending */
export const changeSignupRole = (userId: string, role: SignupRole) =>
  apiClient<AdminUserResponse<{ user: ApprovalUser }>>(`/admin/approvals/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });

/** POST /admin/approvals/:id/decline — archives the signup; optionally emails them */
export const declineSignup = (userId: string, sendEmail: boolean) =>
  apiClient<AdminUserResponse<DeclineSignupResult>>(`/admin/approvals/${userId}/decline`, {
    method: 'POST',
    body: { sendEmail },
  });

/** POST /admin/approvals/:id/restore — back to pending, grants nothing */
export const restoreSignup = (userId: string) =>
  apiClient<AdminUserResponse<{ user: ApprovalUser }>>(`/admin/approvals/${userId}/restore`, {
    method: 'POST',
  });
