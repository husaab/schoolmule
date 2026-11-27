import apiClient from "./apiClient";
import type { ApiEnvelope } from "./types/finance";
import type {
  Charge,
  ChargeListFilters,
  OfflineKind,
  PaymentAccount,
  PaymentRequest,
  PaymentRequestDetail,
  PaymentRequestInput,
  PaymentRequestTarget,
  PaymentSettings,
  PaymentsConnection,
  PaymentsOverview,
  PaymentsRoster,
  PaymentsSummary,
  PayoutsData,
  StudentMatch,
} from "./types/payments";

// Finance → Payments API (finance permission): the school's Stripe connection,
// the overview, the ledger, payment requests and payouts.
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

// ─── The ledger (finance permission) ────────────────────────────────

const listQuery = (filters: ChargeListFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.formId) params.set("formId", filters.formId);
  if (filters.requestId) params.set("requestId", filters.requestId);
  if (filters.studentId) params.set("studentId", filters.studentId);
  if (filters.source) params.set("source", filters.source);
  if (filters.tax) params.set("tax", filters.tax);
  if (filters.q) params.set("q", filters.q);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const getPaymentsSummary = () =>
  apiClient<ApiEnvelope<PaymentsSummary>>(`${BASE}/summary`);

export const listCharges = (filters: ChargeListFilters = {}) =>
  apiClient<ApiEnvelope<Charge[]> & { pagination: { total: number; page: number; limit: number } }>(
    `${BASE}/charges${listQuery(filters)}`
  );

/** One charge with its lines and everything that happened to it. */
export const getCharge = (chargeId: string) =>
  apiClient<ApiEnvelope<Charge>>(`${BASE}/charges/${encodeURIComponent(chargeId)}`);

/** Cash, cheque or another payment taken at the office. `amountCents` defaults to what is still owed. */
export const recordOfflinePayment = (
  chargeId: string,
  body: { kind: OfflineKind; amountCents?: number | null; note?: string | null; sendReceipt?: boolean }
) =>
  apiClient<ApiEnvelope<Charge>, typeof body>(`${BASE}/charges/${encodeURIComponent(chargeId)}/offline`, { method: "POST", body });

export const waiveCharge = (chargeId: string, note: string | null) =>
  apiClient<ApiEnvelope<Charge>, { note: string | null }>(`${BASE}/charges/${encodeURIComponent(chargeId)}/waive`, {
    method: "POST",
    body: { note },
  });

/** Refunds card money; `amountCents` defaults to all that can be refunded. */
export const refundCharge = (chargeId: string, body: { amountCents?: number | null; note?: string | null }) =>
  apiClient<ApiEnvelope<Charge>, typeof body>(`${BASE}/charges/${encodeURIComponent(chargeId)}/refund`, { method: "POST", body });

export const sendPaymentLink = (chargeId: string) =>
  apiClient<ApiEnvelope<Charge>>(`${BASE}/charges/${encodeURIComponent(chargeId)}/send-link`, { method: "POST" });

/** Takes back a cash, cheque or other payment, or a waiver, recorded by mistake. */
export const voidChargePayment = (chargeId: string, paymentId: string) =>
  apiClient<ApiEnvelope<Charge>>(
    `${BASE}/charges/${encodeURIComponent(chargeId)}/payments/${encodeURIComponent(paymentId)}/void`,
    { method: "POST" }
  );

export const getPayouts = () =>
  apiClient<ApiEnvelope<PayoutsData>>(`${BASE}/payouts`);

/** Says which child a form payment is for, or none (null). */
export const setChargeStudent = (chargeId: string, studentId: string | null) =>
  apiClient<ApiEnvelope<Charge>, { studentId: string | null }>(`${BASE}/charges/${encodeURIComponent(chargeId)}/student`, {
    method: "PUT",
    body: { studentId },
  });

/** Students matching a name (two letters or more), this school year. */
export const searchPaymentStudents = (q: string) =>
  apiClient<ApiEnvelope<StudentMatch[]>>(`${BASE}/students?q=${encodeURIComponent(q)}`);

/** The Overview tab in one call: tiles, months, each form and request, the latest activity. */
export const getPaymentsOverview = () =>
  apiClient<ApiEnvelope<PaymentsOverview>>(`${BASE}/overview`);

// ─── Settings: the school's tax number and tax rates ────────────────
// Every call answers with the whole settings, as GET gives them.

export const getPaymentSettings = () =>
  apiClient<ApiEnvelope<PaymentSettings>>(`${BASE}/settings`);

/** Empty clears it. */
export const updatePaymentSettings = (body: { taxNumber: string | null }) =>
  apiClient<ApiEnvelope<PaymentSettings>, typeof body>(`${BASE}/settings`, { method: "PUT", body });

/** `percent` as typed, e.g. "13" or "9.975". */
export const addTaxRate = (body: { name: string; percent: string }) =>
  apiClient<ApiEnvelope<PaymentSettings>, typeof body>(`${BASE}/tax-rates`, { method: "POST", body });

export const updateTaxRate = (taxRateId: string, body: { name?: string; percent?: string }) =>
  apiClient<ApiEnvelope<PaymentSettings>, typeof body>(`${BASE}/tax-rates/${encodeURIComponent(taxRateId)}`, { method: "PATCH", body });

/** Removes a rate from the pickers. Forms and requests that use it keep it. */
export const removeTaxRate = (taxRateId: string) =>
  apiClient<ApiEnvelope<PaymentSettings>>(`${BASE}/tax-rates/${encodeURIComponent(taxRateId)}`, { method: "DELETE" });

// ─── Payment requests ───────────────────────────────────────────────

export const listPaymentRequests = () =>
  apiClient<ApiEnvelope<PaymentRequest[]>>(`${BASE}/requests`);

export const getPaymentRequest = (requestId: string) =>
  apiClient<ApiEnvelope<PaymentRequestDetail>>(`${BASE}/requests/${encodeURIComponent(requestId)}`);

/** The year's students and classes, for choosing who a request goes to. */
export const getPaymentsRoster = () =>
  apiClient<ApiEnvelope<PaymentsRoster>>(`${BASE}/requests/roster`);

/** Sends a request: a charge for each student, and an email to their guardians (unless notify is false). */
export const createPaymentRequest = (body: PaymentRequestInput & PaymentRequestTarget & { notify?: boolean }) =>
  apiClient<ApiEnvelope<PaymentRequestDetail>, typeof body>(`${BASE}/requests`, { method: "POST", body });

/** Edits a request. The amount can change only while nobody has paid. */
export const updatePaymentRequest = (requestId: string, body: Partial<PaymentRequestInput>) =>
  apiClient<ApiEnvelope<PaymentRequestDetail>, typeof body>(`${BASE}/requests/${encodeURIComponent(requestId)}`, { method: "PATCH", body });

/** Deletes a request nobody has paid anything on. */
export const deletePaymentRequest = (requestId: string) =>
  apiClient<ApiEnvelope<{ deleted: boolean }>>(`${BASE}/requests/${encodeURIComponent(requestId)}`, { method: "DELETE" });

/** Sends the request to more students; anyone asked already is skipped. */
export const addPaymentRequestStudents = (requestId: string, body: PaymentRequestTarget & { notify?: boolean }) =>
  apiClient<ApiEnvelope<PaymentRequestDetail>, typeof body>(`${BASE}/requests/${encodeURIComponent(requestId)}/students`, { method: "POST", body });

/** Takes a student off a request (only before anything was paid). */
export const removePaymentRequestCharge = (requestId: string, chargeId: string) =>
  apiClient<ApiEnvelope<PaymentRequestDetail>>(
    `${BASE}/requests/${encodeURIComponent(requestId)}/charges/${encodeURIComponent(chargeId)}`,
    { method: "DELETE" }
  );

/** Emails a reminder to every family that still owes. */
export const remindPaymentRequest = (requestId: string) =>
  apiClient<ApiEnvelope<PaymentRequestDetail>>(`${BASE}/requests/${encodeURIComponent(requestId)}/remind`, { method: "POST" });

/** The CSV of the list as filtered (finance permission). */
export const chargesCsvPath = (filters: ChargeListFilters = {}) => `${BASE}/charges.csv${listQuery(filters)}`;

/** Downloads the payments CSV as filtered. */
export const downloadChargesCsv = async (filters: ChargeListFilters = {}): Promise<void> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${chargesCsvPath(filters)}`, { headers });
  if (!res.ok) throw new Error("Could not export the payments CSV");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Payments.csv";
  a.click();
  window.URL.revokeObjectURL(url);
};
