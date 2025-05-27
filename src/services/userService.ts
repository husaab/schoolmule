import { UserResponse } from './types/user';
import apiClient from './apiClient';
/**
 * Update a user's password.
 * @param id The user's id.
 * @param passwordData An object containing the old password and the new password.
 * @returns A promise resolving to the user response.
 */
export const updatePassword = async (
  id: string,
  passwordData: { oldPassword: string; newPassword: string }
): Promise<UserResponse> => {
  return apiClient<UserResponse>(`/users/${id}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: passwordData,
  });
};

export const updateUser = async (
  id: string,
  updateData: { username: string, email: string, school: string, role: string }
): Promise<UserResponse> => {
  return apiClient<UserResponse>(`/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: updateData,
  });
};