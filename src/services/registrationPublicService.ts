import type { PublicFormResponse, PublicPaymentChoice, PublicSubmitResponse } from './types/registration';
import type { PublicPayment } from './types/payments';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

/**
 * Fetch a published form for public rendering (no auth required)
 */
export const getPublicForm = async (
  schoolSlug: string,
  formSlug: string
): Promise<PublicFormResponse> => {
  const response = await fetch(
    `${baseURL}/registration/public/${encodeURIComponent(schoolSlug)}/${encodeURIComponent(formSlug)}`
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Form not found' }));
    throw new Error(errorBody.message || 'Form not found');
  }

  return response.json();
};

/**
 * Submit a public form (no auth required)
 */
export const submitPublicForm = async (
  schoolSlug: string,
  formSlug: string,
  answers: Record<string, string>,
  honeypotFields: { website?: string; url?: string; homepage?: string } = {},
  payment: PublicPaymentChoice | null = null
): Promise<PublicSubmitResponse> => {
  const response = await fetch(
    `${baseURL}/registration/public/${encodeURIComponent(schoolSlug)}/${encodeURIComponent(formSlug)}/submit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, ...honeypotFields, ...(payment ? { payment } : {}) }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Submission failed' }));
    throw new Error(errorBody.message || 'Submission failed');
  }

  return response.json();
};

/** A payment error the page can act on: `code` is the server's (PAYMENTS_UNAVAILABLE, NOTHING_OWED…). */
export class PublicPaymentError extends Error {
  code: string | null;
  status: number;
  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = 'PublicPaymentError';
    this.status = status;
    this.code = code;
  }
}

const paymentRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${baseURL}/registration/public/payments/${path}`, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new PublicPaymentError(body.message || 'Something went wrong', response.status, body.code || null);
  return body.data as T;
};

/**
 * A family's payment link (no sign-in; the token is the secret). Coming back
 * from Stripe, pass Stripe's session id so the payment is confirmed at once.
 */
export const getPublicPayment = (token: string, sessionId?: string | null) =>
  paymentRequest<PublicPayment>(
    `${encodeURIComponent(token)}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''}`
  );

/** Opens Stripe's page for what is still owed. `url` is null when it turned out to be paid already. */
export const startPublicPayment = (token: string) =>
  paymentRequest<{ url: string | null; paid: boolean }>(`${encodeURIComponent(token)}/checkout`, { method: 'POST' });
