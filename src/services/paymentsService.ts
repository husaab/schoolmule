import apiClient from "./apiClient";
import type { ApiEnvelope } from "./types/finance";
import type { PaymentAccount, PaymentsConnection } from "./types/payments";

// Finance → Payments API (finance permission). Today: the school's Stripe connection.
const BASE = "/payments";

/** The school's connection as SchoolMule last saw it. Does not call Stripe. */
export const getPaymentsConnection = () =>
  apiClient<ApiEnvelope<PaymentsConnection>>(`${BASE}/account`);

/** A single-use link to Stripe's hosted sign-up; navigate the browser to it.
 *  Opens the school's Stripe account the first time. Stripe sends the school
 *  back to /finance/payments with `?stripe=return` (or `?stripe=refresh` when
 *  the link had expired). */
export const createStripeOnboardingLink = () =>
  apiClient<ApiEnvelope<{ url: string; account: PaymentAccount }>>(
    `${BASE}/account/onboarding-link`,
    { method: "POST" }
  );

/** Re-read the school's account from Stripe. */
export const syncPaymentsAccount = () =>
  apiClient<ApiEnvelope<{ account: PaymentAccount }>>(
    `${BASE}/account/sync`,
    { method: "POST" }
  );

/** Turn payments off in SchoolMule. The school's Stripe account is untouched. */
export const disconnectPayments = () =>
  apiClient<ApiEnvelope<{ account: PaymentAccount }>>(
    `${BASE}/account`,
    { method: "DELETE" }
  );
