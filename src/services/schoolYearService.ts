import apiClient from './apiClient';
import type {
  SchoolYearsResponse, SchoolYearResponse,
  RolloverPreviewResponse, RolloverRequest, RolloverResponse,
} from './types/schoolYear';

export const getSchoolYears = () =>
  apiClient<SchoolYearsResponse>('/school-years');

export const createSchoolYear = (body: { label: string; startDate: string; endDate: string }) =>
  apiClient<SchoolYearResponse, typeof body>('/school-years', { method: 'POST', body });

export const updateSchoolYear = (id: string, body: { label: string; startDate: string; endDate: string }) =>
  apiClient<SchoolYearResponse, typeof body>(`/school-years/${id}`, { method: 'PUT', body });

export const activateSchoolYear = (id: string) =>
  apiClient<SchoolYearResponse>(`/school-years/${id}/activate`, { method: 'PUT' });

export const deleteSchoolYear = (id: string) =>
  apiClient<{ status: string; message: string }>(`/school-years/${id}`, { method: 'DELETE' });

export const getRolloverPreview = (sourceYearId?: string) =>
  apiClient<RolloverPreviewResponse>(
    `/school-years/rollover/preview${sourceYearId ? `?sourceYearId=${sourceYearId}` : ''}`);

export const executeRollover = (id: string, body: RolloverRequest) =>
  apiClient<RolloverResponse, RolloverRequest>(`/school-years/${id}/rollover`, { method: 'POST', body });
