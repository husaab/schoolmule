// services/authService.ts
import apiClient from './apiClient';
import { LoginResponse, LoginRequest, RegisterRequest, RegisterResponse } from './types/auth';

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

export function resendVerificationEmail({ email }: { email: string }) {
  return apiClient('/auth/verify-email', {
    method: 'POST',
    body: { email },
  });
}

export interface ConfirmEmailResponse {
  success: boolean;
  status: number;
  message: string;
  data?: {
    id: string;
    email: string;
    username: string;
    isVerified: boolean;
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
    role: string;
    isVerified: boolean;
    isVerifiedSchool: boolean;
    createdAt: string;
    lastModifiedAt: string;
    activeTerm: string;
  };
}

export function validateSession(): Promise<SessionValidationResponse> {
  return apiClient('/auth/me', {
    method: 'GET',
  });
}

