// src/services/studentViewService.ts

import apiClient from './apiClient';
import type {
  StudentViewListResponse,
  StudentViewResponse,
  EvaluateResponse,
  PreviewResponse,
  CreateStudentViewRequest,
  UpdateStudentViewRequest,
  StudentViewCriteria,
} from './types/studentView';

export const listStudentViews = (): Promise<StudentViewListResponse> =>
  apiClient<StudentViewListResponse>('/student-views');

export const getStudentView = (viewId: string): Promise<StudentViewResponse> =>
  apiClient<StudentViewResponse>(`/student-views/${encodeURIComponent(viewId)}`);

export const createStudentView = (
  body: CreateStudentViewRequest,
): Promise<StudentViewResponse> =>
  apiClient<StudentViewResponse, CreateStudentViewRequest>('/student-views', {
    method: 'POST',
    body,
  });

export const updateStudentView = (
  viewId: string,
  body: UpdateStudentViewRequest,
): Promise<StudentViewResponse> =>
  apiClient<StudentViewResponse, UpdateStudentViewRequest>(
    `/student-views/${encodeURIComponent(viewId)}`,
    { method: 'PATCH', body },
  );

export const deleteStudentView = (
  viewId: string,
): Promise<{ status: string; data: { viewId: string }; message?: string }> =>
  apiClient(`/student-views/${encodeURIComponent(viewId)}`, { method: 'DELETE' });

export const evaluateStudentView = (viewId: string): Promise<EvaluateResponse> =>
  apiClient<EvaluateResponse>(`/student-views/${encodeURIComponent(viewId)}/evaluate`, {
    method: 'POST',
  });

export const previewStudentView = (
  criteria: StudentViewCriteria,
): Promise<PreviewResponse> =>
  apiClient<PreviewResponse, { criteria: StudentViewCriteria }>('/student-views/preview', {
    method: 'POST',
    body: { criteria },
  });

// CSV and PDF use the same auth token but need raw response handling — fetch directly.
const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
const authHeaders = (): HeadersInit => {
  const token =
    typeof window === 'undefined' ? null : localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const downloadStudentViewCsv = async (viewId: string, filename: string) => {
  const res = await fetch(
    `${baseURL}/student-views/${encodeURIComponent(viewId)}/export.csv`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error('CSV export failed');
  const blob = await res.blob();
  triggerBlobDownload(blob, `${filename}.csv`);
};

export const downloadStudentViewCertificates = async (
  viewId: string,
  studentIds: string[],
  filename: string,
) => {
  const res = await fetch(
    `${baseURL}/student-views/${encodeURIComponent(viewId)}/certificates.pdf`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ studentIds }),
    },
  );
  if (!res.ok) throw new Error('Certificate generation failed');
  const blob = await res.blob();
  triggerBlobDownload(blob, `${filename}.pdf`);
};

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
