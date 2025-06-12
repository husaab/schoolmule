import apiClient from './apiClient';

type PasswordResetResponse = { success: boolean; message: string };

/**
 * Request password reset by email
 */
export const requestPasswordReset = async (
  email: string
): Promise<PasswordResetResponse> => {
  return apiClient<PasswordResetResponse>(`/auth/request-password-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: { email },
  });
};

/**
 * Validate the password reset token
 */
export const validateResetToken = async (
  token: string
): Promise<PasswordResetResponse> => {
  return apiClient<PasswordResetResponse>(
    `/auth/validate-reset-token?token=${encodeURIComponent(token)}`
  );
};

/**
 * Submit a new password using a valid reset token
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<PasswordResetResponse> => {
  return apiClient<PasswordResetResponse>(`/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: { token, newPassword },
  });
};
