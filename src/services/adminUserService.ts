import apiClient from './apiClient';
import {
  AdminUserResponse,
  InviteUserRequest,
  SchoolUser,
  SchoolUserDetails,
  UpdateSchoolUserRequest,
} from './types/adminUser';

// Admin-only. The backend scopes every call to the signed-in admin's school.

/** GET /admin/users */
export const getSchoolUsers = () =>
  apiClient<AdminUserResponse<SchoolUser[]>>('/admin/users');

/** GET /admin/users/:id — account plus classes, homeroom, staff profile, children */
export const getSchoolUserDetails = (userId: string) =>
  apiClient<AdminUserResponse<SchoolUserDetails>>(`/admin/users/${userId}`);

/** POST /admin/users — creates a pre-approved account and emails a set-password link */
export const inviteSchoolUser = (payload: InviteUserRequest) =>
  apiClient<AdminUserResponse<SchoolUser & { inviteSent: boolean }>>('/admin/users', {
    method: 'POST',
    body: payload,
  });

/** POST /admin/users/:id/resend-invite */
export const resendSchoolUserInvite = (userId: string) =>
  apiClient<{ status: string; message?: string }>(`/admin/users/${userId}/resend-invite`, {
    method: 'POST',
  });

/** PATCH /admin/users/:id */
export const updateSchoolUser = (userId: string, payload: UpdateSchoolUserRequest) =>
  apiClient<AdminUserResponse<SchoolUser>>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: payload,
  });

/** DELETE /admin/users/:id */
export const deleteSchoolUser = (userId: string) =>
  apiClient<{ status: string; message?: string }>(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
