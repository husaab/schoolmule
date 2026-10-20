import apiClient from './apiClient';
import { AdminUserResponse } from './types/adminUser';
import type {
  ApproveRequestBody,
  ApproveRequestResult,
  RequestCandidates,
  StudentRequest,
} from './types/studentRequest';

// Admin-only: students' account requests on the Approvals page. The backend
// scopes every call to the signed-in admin's school.

const BASE = '/admin/student-requests';

/** GET /admin/student-requests — pending and declined requests, newest first */
export const getStudentRequests = () =>
  apiClient<AdminUserResponse<{ requests: StudentRequest[] }>>(BASE);

/** GET /admin/student-requests/:id/candidates — the review, for the address as the admin has it now */
export const getRequestCandidates = (requestId: string, opts: { email?: string; studentId?: string | null } = {}) => {
  const params = new URLSearchParams();
  if (opts.email) params.set('email', opts.email);
  if (opts.studentId) params.set('studentId', opts.studentId);
  const query = params.toString();
  return apiClient<AdminUserResponse<RequestCandidates>>(`${BASE}/${requestId}/candidates${query ? `?${query}` : ''}`);
};

/** POST /admin/student-requests/:id/approve — the address on the record, the login and the invite, in one step */
export const approveStudentRequest = (requestId: string, body: ApproveRequestBody) =>
  apiClient<AdminUserResponse<ApproveRequestResult>>(`${BASE}/${requestId}/approve`, { method: 'POST', body });

/** POST /admin/student-requests/:id/decline */
export const declineStudentRequest = (requestId: string) =>
  apiClient<AdminUserResponse<{ request: StudentRequest }>>(`${BASE}/${requestId}/decline`, { method: 'POST' });

/** POST /admin/student-requests/:id/restore — back to pending */
export const restoreStudentRequest = (requestId: string) =>
  apiClient<AdminUserResponse<{ request: StudentRequest }>>(`${BASE}/${requestId}/restore`, { method: 'POST' });

/** DELETE /admin/student-requests/:id — declined requests only */
export const deleteStudentRequest = (requestId: string) =>
  apiClient<AdminUserResponse<{ deleted: true }>>(`${BASE}/${requestId}`, { method: 'DELETE' });
