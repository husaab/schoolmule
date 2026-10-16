// services/authService.ts
import apiClient from './apiClient';
import { LoginResponse, LoginRequest, RegisterRequest, RegisterResponse, GoogleAuthRequest, GoogleAuthResponse } from './types/auth';
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
 * POST /auth/student-qr: sign in with a printed QR card (`t` from /qr?t=…).
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
    createdAt: string;
    lastModifiedAt: string;
    activeTerm: string;
    activeSchoolYear?: { schoolYearId: string; label: string } | null;
    schoolYears?: SchoolYear[];
    /** Set when the token is an admin "view as" preview token. */
    impersonator?: { userId: string; username: string; fullName: string } | null;
    /** A fresh token, present only when the sent token's claims were stale (e.g. approved after sign-in). */
    token?: string;
  };
}

export function validateSession(): Promise<SessionValidationResponse> {
  return apiClient('/auth/me', {
    method: 'GET',
  });
}

