// services/apiClient.ts
import { useSchoolYearStore } from '@/store/useSchoolYearStore';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

// Get token function (avoid circular import)
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

/**
 * What apiClient throws on a non-2xx response. It is still an Error whose
 * message is the server's `message` (so existing `err.message` callers are
 * unchanged), with the HTTP status, the server's `code` and its `data`
 * attached for callers that need to tell failures apart.
 */
export class ApiError extends Error {
  status: number;
  code: string | null;
  data: unknown;

  constructor(message: string, opts: { status: number; code?: string | null; data?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code ?? null;
    this.data = opts.data ?? null;
  }
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError;

interface ApiClientOptions<T = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: T;
  headers?: HeadersInit;
}

async function apiClient<T, B = unknown>(
    endpoint: string,
        { method = 'GET', body, headers = {} }: ApiClientOptions<B> = {}
): Promise<T> {
    const token = getToken();

    const selectedYearId =
        typeof window === 'undefined' ? null : useSchoolYearStore.getState().selectedYearId;

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(selectedYearId && { 'X-School-Year': selectedYearId }),
            ...headers,
        },
        // Remove credentials since we're using JWT tokens instead of cookies
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseURL}${endpoint}`, config);
    if (!response.ok) {
        const errorBody = await response.json();
        console.log(errorBody)
        
        // Handle 401 Unauthorized - token expired or invalid. The handler is
        // idempotent and preview-aware; see services/sessionExpiry.ts.
        if (response.status === 401 && typeof window !== 'undefined') {
            const { handleUnauthorized } = await import('./sessionExpiry');
            await handleUnauthorized(token);
        }

        // Writes attempted during an admin "view as" preview. The server
        // refuses them all; say so in one consistent, friendly way.
        if (response.status === 403 && errorBody.code === 'IMPERSONATION_READ_ONLY' && typeof window !== 'undefined') {
            const { useNotificationStore } = await import('@/store/useNotificationStore');
            useNotificationStore.getState().showNotification(
                "You're in a read-only preview — exit it to make changes",
                'error'
            );
        }

        throw new ApiError(errorBody.message || 'Something went wrong', {
            status: response.status,
            code: errorBody.code ?? null,
            data: errorBody.data ?? null,
        });
    }

    return response.json() as Promise<T>;
}

export default apiClient;
