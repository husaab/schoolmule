import type { PublicFormChildren, PublicFormResponse, PublicPaymentChoice, PublicSubmitResponse } from './types/registration';
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

/** The signed-in person's token, if any. Public forms work without one. */
const authToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

/**
 * A signed-in parent's children at the form's school, so the form can ask
 * which child it is for. Anyone else (or a failure) gets nobody.
 */
export const getPublicFormChildren = async (schoolSlug: string, formSlug: string): Promise<PublicFormChildren> => {
  const token = authToken();
  if (!token) return { signedIn: false, children: [] };
  try {
    const response = await fetch(
      `${baseURL}/registration/public/${encodeURIComponent(schoolSlug)}/${encodeURIComponent(formSlug)}/children`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) return { signedIn: false, children: [] };
    const body = await response.json();
    return body.data as PublicFormChildren;
  } catch {
    return { signedIn: false, children: [] };
  }
};

/**
 * Submit a public form (no auth required). With `studentId`, a signed-in
 * parent says which of their children it is for; the token goes with it.
 */
export const submitPublicForm = async (
  schoolSlug: string,
  formSlug: string,
  answers: Record<string, string>,
  honeypotFields: { website?: string; url?: string; homepage?: string } = {},
  payment: PublicPaymentChoice | null = null,
  studentId: string | null = null
): Promise<PublicSubmitResponse> => {
  const token = authToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(
    `${baseURL}/registration/public/${encodeURIComponent(schoolSlug)}/${encodeURIComponent(formSlug)}/submit`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ answers, ...honeypotFields, ...(payment ? { payment } : {}), ...(studentId ? { studentId } : {}) }),
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

/** What opening a payment gives back: Stripe's page (`url`), or what Stripe.js needs to show the form inside ours. */
export interface StartedPayment {
  url: string | null;
  /** Embedded only: the Checkout Session's client secret, and the school's account it is on. */
  clientSecret?: string | null;
  stripeAccountId?: string | null;
  /** It turned out to be paid already. */
  paid: boolean;
}

/**
 * Opens a payment for what is still owed: Stripe's own page by default, or
 * (`ui: 'embedded'`) Stripe's form to show inside our page.
 */
export const startPublicPayment = (token: string, ui: 'hosted' | 'embedded' = 'hosted') =>
  paymentRequest<StartedPayment>(`${encodeURIComponent(token)}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ui }),
  });
