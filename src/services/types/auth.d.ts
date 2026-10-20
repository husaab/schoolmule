// services/types/auth.d.ts

/** Every database role. STUDENT logins only ever open the student portal (/student). */
export type UserRole = 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface User {
    userId: string;
    username: string;
    email: string;
    role: string;
    school: string;
}
  
export interface ErrorResponse {
    message: string;
}

/**
 * What the session's active view may do (RBAC), on every payload that opens
 * or refreshes a session. UI hints only: the API enforces. Absent on an older
 * backend, which lib/permissions then reads by role.
 */
export interface AccessClaims {
  /** The active view's permission keys (lib/permissions PERMISSIONS). Full admins get all of them. */
  permissions?: string[];
  isFullAdmin?: boolean;
  /** The custom access role; null for the built-in Admin and Teacher. */
  accessRole?: { id: string; name: string } | null;
  /** Leads or co-teaches a class this school year (false outside staff views). */
  teachesClasses?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  school: string;
  role: string;
}

export interface RegisterResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    userId: string;
    username: string;
    fullName: string;
    email: string;
    school: string;
    role: string;
    isVerified: boolean;
    isVerifiedSchool: boolean;
    isPlatformOwner?: boolean;
    /** The picked avatar (null = the neutral one) and a signed URL for the optional photo. */
    avatar?: import('./profile').AvatarSpec | null;
    photoUrl?: string | null;
    createdAt: string;
    lastModifiedAt: string;
    activeTerm: string;
    token: string;
    activeSchoolYear?: { schoolYearId: string; label: string } | null;
    schoolYears?: import('./schoolYear').SchoolYear[];
  } & AccessClaims;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// POST /auth/google. `code` comes from Google's sign-in popup. A signup names
// the school and role it is for; a login never creates an account.
export type GoogleAuthRequest =
  | { code: string; intent: 'login' }
  | { code: string; intent: 'signup'; school: string; role: import('./adminApproval').SignupRole };

// Response from backend after login
export interface LoginResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    userId: string;
    username: string;
    fullName: string;
    email: string;
    school: string;
    /** The active view; sign-in always starts in the database role. */
    role: string;
    /** Database role, and every view the account may switch to. */
    baseRole?: string;
    roles?: string[];
    isVerified: boolean;
    isVerifiedSchool: boolean;
    isPlatformOwner: boolean;
    /** The picked avatar (null = the neutral one) and a signed URL for the optional photo. */
    avatar?: import('./profile').AvatarSpec | null;
    photoUrl?: string | null;
    createdAt: string;
    lastModifiedAt: string;
    activeTerm: string;
    token: string;
    activeSchoolYear?: { schoolYearId: string; label: string } | null;
    schoolYears?: import('./schoolYear').SchoolYear[];
  } & AccessClaims;
}

// The login payload, plus whether this request created the account (false
// when a signup found an existing account and signed into it instead).
// A login with no matching account fails with code GOOGLE_NO_ACCOUNT and
// `data.email` set to the Google address.
export interface GoogleAuthResponse extends LoginResponse {
  data: LoginResponse['data'] & { accountCreated: boolean };
}
