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
    createdAt: string;
    lastModifiedAt: string;
    activeTerm: string;
    token: string;
    activeSchoolYear?: { schoolYearId: string; label: string } | null;
    schoolYears?: import('./schoolYear').SchoolYear[];
  };
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
    createdAt: string;
    lastModifiedAt: string;
    activeTerm: string;
    token: string;
    activeSchoolYear?: { schoolYearId: string; label: string } | null;
    schoolYears?: import('./schoolYear').SchoolYear[];
  };
}

// The login payload, plus whether this request created the account (false
// when a signup found an existing account and signed into it instead).
// A login with no matching account fails with code GOOGLE_NO_ACCOUNT and
// `data.email` set to the Google address.
export interface GoogleAuthResponse extends LoginResponse {
  data: LoginResponse['data'] & { accountCreated: boolean };
}
