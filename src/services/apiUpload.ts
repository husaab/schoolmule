// services/apiUpload.ts
//
// apiClient always JSON-encodes its body, which cannot carry files. This is
// the multipart twin: same base URL, same Authorization and X-School-Year
// headers, same ApiError on a non-2xx response — but the body is a FormData
// and the browser sets Content-Type (with the boundary) itself.

import { ApiError } from './apiClient';
import { useSchoolYearStore } from '@/store/useSchoolYearStore';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export async function apiUpload<T>(
  endpoint: string,
  form: FormData,
  options: { method?: 'POST' | 'PATCH' } = {},
): Promise<T> {
  const token = getToken();
  const selectedYearId =
    typeof window === 'undefined' ? null : useSchoolYearStore.getState().selectedYearId;

  const response = await fetch(`${baseURL}${endpoint}`, {
    method: options.method ?? 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(selectedYearId && { 'X-School-Year': selectedYearId }),
    },
    body: form,
  });

  if (!response.ok) {
    let errorBody: { message?: string; code?: string; data?: unknown } = {};
    try {
      errorBody = await response.json();
    } catch {
      // A proxy or multer failure may answer with no JSON body at all.
    }
    if (response.status === 401 && typeof window !== 'undefined') {
      const { handleUnauthorized } = await import('./sessionExpiry');
      await handleUnauthorized(token);
    }
    throw new ApiError(errorBody.message || 'Something went wrong', {
      status: response.status,
      code: errorBody.code ?? null,
      data: errorBody.data ?? null,
    });
  }

  return response.json() as Promise<T>;
}

export default apiUpload;
