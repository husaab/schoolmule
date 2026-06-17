import apiClient from './apiClient';
import type {
  FormsListResponse,
  FormResponse,
  FieldsResponse,
  SubmissionsListResponse,
  SubmissionResponse,
  NewCountResponse,
  CreateFormBody,
  UpdateFormBody,
  FormField,
  SubmissionFilters,
} from './types/registration';

// ─── Forms ──────────────────────────────────────────────────────────

export const getForms = () =>
  apiClient<FormsListResponse>('/registration/forms');

export const getForm = (formId: string) =>
  apiClient<FormResponse>(`/registration/forms/${formId}`);

export const createForm = (body: CreateFormBody) =>
  apiClient<FormResponse>('/registration/forms', { method: 'POST', body });

export const updateForm = (formId: string, body: UpdateFormBody) =>
  apiClient<FormResponse>(`/registration/forms/${formId}`, { method: 'PUT', body });

export const deleteForm = (formId: string) =>
  apiClient<{ status: string; message: string }>(`/registration/forms/${formId}`, { method: 'DELETE' });

export const updateFormStatus = (formId: string, status: string) =>
  apiClient<FormResponse>(`/registration/forms/${formId}/status`, { method: 'PATCH', body: { status } });

// ─── Banner ─────────────────────────────────────────────────────────

export const uploadBanner = async (formId: string, file: File): Promise<FormResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const response = await fetch(`${baseURL}/registration/forms/${formId}/banner`, {
    method: 'POST',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || 'Upload failed');
  }

  return response.json();
};

export const deleteBanner = (formId: string) =>
  apiClient<FormResponse>(`/registration/forms/${formId}/banner`, { method: 'DELETE' });

// ─── Fields ─────────────────────────────────────────────────────────

export const upsertFields = (formId: string, fields: Partial<FormField>[]) =>
  apiClient<FieldsResponse>(`/registration/forms/${formId}/fields`, {
    method: 'PUT',
    body: { fields },
  });

// ─── Submissions ────────────────────────────────────────────────────

// Serializes the multi-sort + per-field-value filters into query params shared
// by the list and export endpoints:
//   sort=fieldId:dir,fieldId:dir
//   fieldFilters=<URL-encoded JSON array of { fieldId, values }>
const serializeSortAndFilters = (params: URLSearchParams, filters: SubmissionFilters) => {
  if (filters.sorts && filters.sorts.length > 0) {
    params.set('sort', filters.sorts.map((s) => `${s.fieldId}:${s.dir}`).join(','));
  }
  const active = (filters.fieldFilters || []).filter((f) => f.values.length > 0);
  if (active.length > 0) {
    params.set('fieldFilters', JSON.stringify(active));
  }
};

export const getSubmissions = (formId: string, filters: SubmissionFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  serializeSortAndFilters(params, filters);
  const qs = params.toString();
  return apiClient<SubmissionsListResponse>(`/registration/forms/${formId}/submissions${qs ? `?${qs}` : ''}`);
};

export const getSubmission = (formId: string, submissionId: string) =>
  apiClient<SubmissionResponse>(`/registration/forms/${formId}/submissions/${submissionId}`);

export const updateSubmissionStatus = (submissionId: string, status: string) =>
  apiClient<SubmissionResponse>(`/registration/submissions/${submissionId}/status`, {
    method: 'PATCH',
    body: { status },
  });

export const updateSubmissionAnswers = (submissionId: string, answers: Record<string, string>) =>
  apiClient<SubmissionResponse>(`/registration/submissions/${submissionId}/answers`, {
    method: 'PATCH',
    body: { answers },
  });

export const deleteSubmission = (submissionId: string) =>
  apiClient<{ status: string; message: string }>(`/registration/submissions/${submissionId}`, {
    method: 'DELETE',
  });

// ─── CSV Export ─────────────────────────────────────────────────────

export const exportSubmissions = async (formId: string, filters: SubmissionFilters = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  serializeSortAndFilters(params, filters);
  const qs = params.toString();

  const response = await fetch(
    `${baseURL}/registration/forms/${formId}/submissions/export${qs ? `?${qs}` : ''}`,
    { headers: { ...(token && { Authorization: `Bearer ${token}` }) } }
  );

  if (!response.ok) throw new Error('Export failed');

  // Use the server-supplied filename from the Content-Disposition header
  // so the download uses the form's title (e.g. "Al_Haadi_Academy_..._submissions.csv")
  // instead of the form's UUID.
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  const filename = filenameMatch?.[1] ? decodeURIComponent(filenameMatch[1]) : `submissions_${formId}.csv`;

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ─── Badge Count ────────────────────────────────────────────────────

export const getNewSubmissionCount = () =>
  apiClient<NewCountResponse>('/registration/new-count');
