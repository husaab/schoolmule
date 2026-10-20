// src/services/types/accessRole.d.ts
// Custom staff access roles (RBAC): /api/admin/roles, full admins only.
// "Access role" on the frontend, because staffRole is already the staff
// directory's job title.

/** One area of the role editor, e.g. Academics. */
export interface PermissionGroup {
  id: string;
  label: string;
}

/** One checkbox in the role editor. */
export interface PermissionMeta {
  key: string;
  /** PermissionGroup.id */
  group: string;
  label: string;
  description: string;
}

/** A "Start from" template, e.g. Office Staff. Not a role anyone holds. */
export interface RolePreset {
  id: string;
  name: string;
  permissions: string[];
}

/** The built-in Admin and Teacher: fixed, defined in code on the server. */
export interface BuiltInRole {
  id: 'admin' | 'teacher';
  name: string;
  description: string;
  permissions: string[];
  builtIn: true;
  /** Accounts on it (ADMIN or TEACHER with no access role). Only on GET /admin/roles. */
  userCount?: number;
}

/** GET /admin/roles/catalog */
export interface PermissionCatalog {
  groups: PermissionGroup[];
  permissions: PermissionMeta[];
  presets: RolePreset[];
  builtIns: BuiltInRole[];
}

/** A school's custom role. */
export interface AccessRole {
  roleId: string;
  name: string;
  description: string | null;
  permissions: string[];
  /** Accounts holding it. */
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

/** GET /admin/roles */
export interface AccessRoleList {
  roles: AccessRole[];
  builtIns: BuiltInRole[];
}

/** POST /admin/roles, PATCH /admin/roles/:id */
export interface AccessRoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

/** GET /admin/roles/:id/users */
export interface AccessRoleHolder {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  isArchived: boolean;
}

export interface AccessRoleResponse<T> {
  status: 'success' | 'failed';
  message?: string;
  data: T;
}
