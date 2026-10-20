// services/authService.ts
import apiClient from './apiClient';
import { LoginResponse, LoginRequest, RegisterRequest, RegisterResponse, GoogleAuthRequest, GoogleAuthResponse } from './types/auth';
import type { StudentRequestBody } from './types/studentRequest';
import type { SchoolYear } from './types/schoolYear';

// Token management functions
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: credentials,
  });
};

/**
 * POST /auth/student-qr: sign in with a printed QR card (the token "Scan my card" read from it).
 * Same payload as a password sign-in. Fails with 401 QR_INVALID for a voided
 * or forged card, 403 QR_NOT_ENABLED above the QR grades, or a sign-in gate
 * code (CLASSROOM_DISABLED, NO_STUDENT_LINK, CONSENT_REQUIRED, GRADE_NOT_ENABLED).
 */
export const studentQrSignIn = async (token: string): Promise<LoginResponse> => {
  return apiClient<LoginResponse>('/auth/student-qr', {
    method: 'POST',
    body: { token },
  });
};

/** What the student invite page shows: who the link is for and how to get in (or why it is dead). */
export interface StudentInviteInfo {
  state: 'valid' | 'expired' | 'used' | 'replaced' | 'cancelled';
  school: { code: string; name: string };
  /** lastName is for the page's password check; the page shows the initial. */
  student: { firstName: string; lastName?: string; lastInitial: string; grade: string };
  email: string;
  methods: { google: boolean; password: boolean };
  expiresAt: string;
}

/** POST /auth/student-invite: look at an invite link (changes nothing). 404 INVITE_NOT_FOUND for an unknown one. */
export const inspectStudentInvite = (token: string) =>
  apiClient<{ success: boolean; message: string; data: StudentInviteInfo }>('/auth/student-invite', {
    method: 'POST',
    body: { token },
  });

/**
 * POST /auth/student-request — a student with no account asks their school
 * for one (/signup/[school]/student). The same answer whether or not anything
 * was stored; refusals the student can fix come back as ApiErrors with a code.
 */
export const requestStudentAccount = (body: StudentRequestBody) =>
  apiClient<{ status: 'success'; data: { received: true } }>('/auth/student-request', {
    method: 'POST',
    body,
  });

/** Set up, but the school hasn't opened sign-in for this student yet. */
export interface StudentInviteNotOpen {
  activated: true;
  signedIn: false;
  code: string;
  message: string;
}

/**
 * POST /auth/student-invite/accept with a password or a Google code: the
 * login payload (signed in), or StudentInviteNotOpen. Refusals: 410 with
 * data.state (dead link), 400 PASSWORD_WEAK, 403 PASSWORD_SIGN_IN_OFF,
 * 409 GOOGLE_WRONG_ACCOUNT / GOOGLE_WRONG_DOMAIN / GOOGLE_IN_USE.
 */
export const acceptStudentInvite = (body: { token: string; password: string } | { token: string; googleCode: string }) =>
  apiClient<{ success: boolean; message: string; data: LoginResponse['data'] | StudentInviteNotOpen }>('/auth/student-invite/accept', {
    method: 'POST',
    body,
  });

/**
 * POST /auth/email-link: one-tap sign-in from a parent email's button
 * (lib/emailLogin). The login payload, or 401 EMAIL_LINK_INVALID.
 */
export const emailLinkLogin = (token: string) =>
  apiClient<LoginResponse>('/auth/email-link', {
    method: 'POST',
    body: { token },
  });

export const googleAuth = async (request: GoogleAuthRequest): Promise<GoogleAuthResponse> => {
  return apiClient<GoogleAuthResponse>('/auth/google', {
    method: 'POST',
    body: request,
  });
};

export const logout = async (): Promise<void> => {
  removeToken();
  // No need to call backend since JWT tokens are stateless
};

export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  return apiClient<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: userData,
  });
};

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  data?: { alreadyVerified?: boolean };
}

export function resendVerificationEmail({ email }: { email: string }) {
  return apiClient<ResendVerificationResponse>('/auth/verify-email', {
    method: 'POST',
    body: { email },
  });
}

export interface ConfirmEmailResponse {
  success: boolean;
  status: number;
  message: string;
  data?: {
    id?: string;
    email?: string;
    username?: string;
    isVerified?: boolean;
    /** The link was already used: the account was verified earlier. */
    alreadyVerified?: boolean;
  };
}


export function confirmEmail(token: string): Promise<ConfirmEmailResponse> {
  return apiClient('/auth/confirm-email?token=' + encodeURIComponent(token), {
    method: 'GET',
  });
}

export interface SessionValidationResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    username: string;
    fullName: string;
    email: string;
    school: string;
    /** The active view (what every guard reads). */
    role: string;
    /** Database role, and every view the account may switch to. */
    baseRole?: string;
    roles?: string[];
    isVerified: boolean;
    isVerifiedSchool: boolean;
    /** True only for the platform owner (backend env allowlist). */
    isPlatformOwner?: boolean;
    /** The picked avatar (null = the neutral one) and a signed URL (about six hours) for the optional photo. */
    avatar?: import('./types/profile').AvatarSpec | null;
    photoUrl?: string | null;
    createdAt: string;
    lastModifiedAt: string;
    activeTerm: string;
    activeSchoolYear?: { schoolYearId: string; label: string } | null;
    schoolYears?: SchoolYear[];
    /** Set when the token is an admin "view as" preview token. */
    impersonator?: { userId: string; username: string; fullName: string } | null;
    /** A fresh token, present only when the sent token's claims were stale (e.g. approved after sign-in). */
    token?: string;
  } & import('./types/auth').AccessClaims;
}

export function validateSession(): Promise<SessionValidationResponse> {
  return apiClient('/auth/me', {
    method: 'GET',
  });
}

