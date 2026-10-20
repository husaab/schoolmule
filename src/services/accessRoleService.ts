import apiClient from './apiClient';
import type {
  AccessRole,
  AccessRoleHolder,
  AccessRoleInput,
  AccessRoleList,
  AccessRoleResponse,
  PermissionCatalog,
} from './types/accessRole';

// Custom staff access roles. Full admins only (403 FULL_ADMIN_REQUIRED
// otherwise); the backend scopes every call to the signed-in admin's school.
// People holding a role pick a change up on their next request: the server
// resolves access per request, and the app re-reads it from /auth/me.

/** GET /admin/roles/catalog — every permission by group, the presets and the built-ins */
export const getPermissionCatalog = () =>
  apiClient<AccessRoleResponse<PermissionCatalog>>('/admin/roles/catalog');

/** GET /admin/roles — the school's custom roles and the built-ins, each with how many people hold it */
export const getAccessRoles = () =>
  apiClient<AccessRoleResponse<AccessRoleList>>('/admin/roles');

/** POST /admin/roles — 409 when the name is taken (case-insensitive) */
export const createAccessRole = (payload: AccessRoleInput) =>
  apiClient<AccessRoleResponse<AccessRole>, AccessRoleInput>('/admin/roles', {
    method: 'POST',
    body: payload,
  });

/** PATCH /admin/roles/:id */
export const updateAccessRole = (roleId: string, payload: Partial<AccessRoleInput>) =>
  apiClient<AccessRoleResponse<AccessRole>, Partial<AccessRoleInput>>(`/admin/roles/${roleId}`, {
    method: 'PATCH',
    body: payload,
  });

/** DELETE /admin/roles/:id — refused with 409 ROLE_IN_USE while anyone holds it (it never silently widens access) */
export const deleteAccessRole = (roleId: string) =>
  apiClient<{ status: string; message?: string }>(`/admin/roles/${roleId}`, {
    method: 'DELETE',
  });

/** GET /admin/roles/:id/users — who holds a role */
export const getAccessRoleHolders = (roleId: string) =>
  apiClient<AccessRoleResponse<AccessRoleHolder[]>>(`/admin/roles/${roleId}/users`);
