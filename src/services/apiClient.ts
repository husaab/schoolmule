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

type ErrorBody = { code?: string | null; message?: string } | null | undefined;

// verifyUserMiddleware's 403 for a JWT minted before the account was approved.
// The message fallback covers a backend deployed without `code`; remove it
// once the backend carrying ACCOUNT_NOT_VERIFIED is live.
const isAccountNotVerified = (status: number, body: ErrorBody): boolean =>
  status === 403 &&
  (body?.code === 'ACCOUNT_NOT_VERIFIED' || /not fully verified/i.test(body?.message ?? ''));

/**
 * Shared by every fetch wrapper: signs the user out when the response says
 * the session is dead (401) or stale (403 ACCOUNT_NOT_VERIFIED). Both handlers
 * are idempotent and preview-aware; see services/sessionExpiry.ts.
 */
export const handleSessionFailure = async (status: number, body: ErrorBody, sentToken: string | null): Promise<void> => {
  if (typeof window === 'undefined') return;
  if (status === 401) {
    const { handleUnauthorized } = await import('./sessionExpiry');
    await handleUnauthorized(sentToken);
  } else if (isAccountNotVerified(status, body)) {
    const { handleAccountNotVerified } = await import('./sessionExpiry');
    await handleAccountNotVerified(sentToken);
  }
};

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
        
        await handleSessionFailure(response.status, errorBody, token);

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
