// src/services/classroomSettingsService.ts
// The school's classroom settings (student sign-in, QR grades, student email,
// the parents' weekly summary...). Admin only; the school comes from the token.

import apiClient from './apiClient';
import type {
  ClassroomSettings,
  ClassroomSettingsInput,
  StudentAccountEnvelope,
} from './types/studentAccount';

/** GET /admin/classroom-settings: the saved settings, or the defaults (updatedAt null). */
export const getClassroomSettings = () =>
  apiClient<StudentAccountEnvelope<ClassroomSettings>>('/admin/classroom-settings');

/** PUT /admin/classroom-settings: every field is required. */
export const saveClassroomSettings = (settings: ClassroomSettingsInput) =>
  apiClient<StudentAccountEnvelope<ClassroomSettings>, ClassroomSettingsInput>('/admin/classroom-settings', {
    method: 'PUT',
    body: settings,
  });
