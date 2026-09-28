import apiClient from "./apiClient";
import { useSchoolYearStore } from "@/store/useSchoolYearStore";
import type {
  ApiEnvelope,
  ContactInput,
  CreateFamilyInput,
  FamilyDetail,
  FamilyLinkedFilter,
  FamilySuggestions,
  FamilySummary,
  FamilySummaryContact,
  GridStudent,
  ImportInput,
  ImportResult,
  InvoiceKind,
  InvoiceKindResult,
  QboCustomerOption,
  TuitionAnomalies,
  UpdateFamilyInput,
  QboConnection,
  SyncQueued,
  SyncRunsPage,
  SyncStatus,
  TuitionGrid,
} from "./types/finance";

// Admin-only finance API. The school year comes from the X-School-Year header
// apiClient already sends, so none of these take a year argument.
const BASE = "/finance";

export const getQboConnection = () =>
  apiClient<ApiEnvelope<QboConnection>>(`${BASE}/qbo/connection`);

/** Intuit's consent URL; navigate the browser to it. Intuit redirects back to
 *  `returnTo` with a `?qbo=` outcome param. */
export const getQboConnectUrl = (returnTo = "/finance/tuition") =>
  apiClient<ApiEnvelope<{ url: string }>>(
    `${BASE}/qbo/connect-url?returnTo=${encodeURIComponent(returnTo)}`
  );

/** Revoke the connection. `purge` also deletes the cached QuickBooks data. */
export const disconnectQbo = (purge: boolean) =>
  apiClient<ApiEnvelope<{ disconnected: boolean; purged: boolean }>>(
    `${BASE}/qbo/connection?purge=${purge ? "true" : "false"}`,
    { method: "DELETE" }
  );

/** Queue a sync. Rejects with the server's message on 409 (not connected /
 *  needs reconnect) and 429 (a sync ran under a minute ago). Pass
 *  `{ full: true }` to queue a full refresh — re-reads every customer,
 *  invoice and payment for the year, instead of the cheap "what changed"
 *  sync. Use after merging or renaming customers in QuickBooks. */
export const syncNow = (options?: { full?: boolean }) =>
  apiClient<ApiEnvelope<SyncQueued>, { full: boolean } | undefined>(`${BASE}/sync`, {
    method: "POST",
    body: options?.full ? { full: true } : undefined,
  });

export const getSyncStatus = () =>
  apiClient<ApiEnvelope<SyncStatus>>(`${BASE}/sync/status`);

export const getSyncRuns = (limit = 20, offset = 0) =>
  apiClient<ApiEnvelope<SyncRunsPage>>(`${BASE}/sync/runs?limit=${limit}&offset=${offset}`);

export const getTuitionGrid = () =>
  apiClient<ApiEnvelope<TuitionGrid>>(`${BASE}/tuition/grid`);

export const getFamilyDetail = (familyId: string) =>
  apiClient<ApiEnvelope<FamilyDetail>>(`${BASE}/families/${encodeURIComponent(familyId)}`);

// ── Families (Phase 2) ───────────────────────────────────────────────────

const fam = (familyId: string) => `${BASE}/families/${encodeURIComponent(familyId)}`;

export const listFamilies = (search = "", linked: FamilyLinkedFilter = "all") => {
  const qs = new URLSearchParams();
  if (search.trim()) qs.set("search", search.trim());
  if (linked !== "all") qs.set("linked", linked);
  const s = qs.toString();
  return apiClient<ApiEnvelope<{ families: FamilySummary[] }>>(`${BASE}/families${s ? `?${s}` : ""}`);
};

/** Rejects with the server's message on 409 (CUSTOMER_LINKED /
 *  STUDENT_IN_FAMILY) and 400 (validation, unknown customer). */
export const createFamily = (body: CreateFamilyInput) =>
  apiClient<ApiEnvelope<FamilySummary>, CreateFamilyInput>(`${BASE}/families`, { method: "POST", body });

export const updateFamily = (familyId: string, body: UpdateFamilyInput) =>
  apiClient<ApiEnvelope<FamilySummary>, UpdateFamilyInput>(fam(familyId), { method: "PATCH", body });

export const deleteFamily = (familyId: string) =>
  apiClient<ApiEnvelope<{ deleted: boolean }>>(fam(familyId), { method: "DELETE" });

export interface LinkCustomerOptions {
  /** 'YYYY-MM-DD'; the current link closes the day before (default today). */
  effectiveFrom?: string;
  /** The current link was a mistake: delete it and open the new one from its
   *  start date, so the whole year's invoices move to the new customer. */
  replace?: boolean;
}

/** Rejects with the server's message on 409 (CUSTOMER_LINKED, LINK_OVERLAP —
 *  the latter names the earliest allowed date) and 400 (unknown customer). */
export const linkFamilyCustomer = (familyId: string, qboCustomerId: string, opts: LinkCustomerOptions = {}) =>
  apiClient<ApiEnvelope<FamilySummary>, { qboCustomerId: string; effectiveFrom?: string; replace?: boolean }>(
    `${fam(familyId)}/customer`,
    {
      method: "PUT",
      body: {
        qboCustomerId,
        ...(opts.replace ? { replace: true } : opts.effectiveFrom ? { effectiveFrom: opts.effectiveFrom } : {}),
      },
    }
  );

/** Closes the open customer link as of today. */
export const unlinkFamilyCustomer = (familyId: string) =>
  apiClient<ApiEnvelope<FamilySummary>>(`${fam(familyId)}/customer`, { method: "DELETE" });

export const addFamilyStudent = (familyId: string, studentId: string) =>
  apiClient<ApiEnvelope<{ students: GridStudent[] }>, { studentId: string }>(`${fam(familyId)}/students`, {
    method: "POST",
    body: { studentId },
  });

export const removeFamilyStudent = (familyId: string, studentId: string) =>
  apiClient<ApiEnvelope<{ students: GridStudent[] }>>(`${fam(familyId)}/students/${encodeURIComponent(studentId)}`, {
    method: "DELETE",
  });

export const addFamilyContact = (familyId: string, body: ContactInput) =>
  apiClient<ApiEnvelope<{ contacts: FamilySummaryContact[] }>, ContactInput>(`${fam(familyId)}/contacts`, {
    method: "POST",
    body,
  });

export const updateFamilyContact = (familyId: string, contactId: string, body: ContactInput) =>
  apiClient<ApiEnvelope<{ contacts: FamilySummaryContact[] }>, ContactInput>(
    `${fam(familyId)}/contacts/${encodeURIComponent(contactId)}`,
    { method: "PATCH", body }
  );

export const deleteFamilyContact = (familyId: string, contactId: string) =>
  apiClient<ApiEnvelope<{ contacts: FamilySummaryContact[] }>>(`${fam(familyId)}/contacts/${encodeURIComponent(contactId)}`, {
    method: "DELETE",
  });

/** Dry run by default; pass dryRun: false to apply. */
export const importFamilies = (body: ImportInput) =>
  apiClient<ApiEnvelope<ImportResult>, ImportInput>(`${BASE}/families/import`, {
    method: "POST",
    body: { ...body, dryRun: body.dryRun ?? true },
  });

export const getFamilySuggestions = () =>
  apiClient<ApiEnvelope<FamilySuggestions>>(`${BASE}/families/suggestions`);

/** The cached QuickBooks customers (at most 200, sorted by name). */
export const searchQboCustomers = (q = "", opts: { unlinkedOnly?: boolean; withInvoices?: boolean } = {}) => {
  const qs = new URLSearchParams();
  if (q.trim()) qs.set("q", q.trim());
  if (opts.unlinkedOnly !== undefined) qs.set("unlinkedOnly", String(opts.unlinkedOnly));
  if (opts.withInvoices !== undefined) qs.set("withInvoices", String(opts.withInvoices));
  const s = qs.toString();
  return apiClient<ApiEnvelope<{ customers: QboCustomerOption[] }>>(`${BASE}/qbo/customers${s ? `?${s}` : ""}`);
};

/** null resets the invoice to its automatic kind. */
export const setInvoiceKind = (qboId: string, kind: InvoiceKind | null) =>
  apiClient<ApiEnvelope<InvoiceKindResult>, { kind: InvoiceKind | null }>(
    `${BASE}/invoices/${encodeURIComponent(qboId)}/kind`,
    { method: "PATCH", body: { kind } }
  );

export const getTuitionAnomalies = () =>
  apiClient<ApiEnvelope<TuitionAnomalies>>(`${BASE}/tuition/anomalies`);

/**
 * Downloads the grid as CSV. Sent with the same X-School-Year header
 * apiClient uses (see fetchWithAuth in schedulePlannerService) so the file
 * matches the year on screen rather than the backend's active-year fallback.
 * `yearLabel` (the grid's year) names the file when the response carries no
 * Content-Disposition filename.
 */
export const downloadTuitionCsv = async (yearLabel?: string): Promise<void> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const { selectedYearId, years } = useSchoolYearStore.getState();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (selectedYearId) headers["X-School-Year"] = selectedYearId;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${BASE}/tuition/grid.csv`, { headers });
  if (!res.ok) {
    let message = "Could not export the tuition CSV";
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Not JSON; keep the generic message.
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  // Content-Disposition normally names the file; if not, use the year on
  // screen (the grid's label, else the selected year's).
  const label = yearLabel || years.find((y) => y.schoolYearId === selectedYearId)?.label || "";
  const fallback = `tuition-${label.replace(/[^\w.-]+/g, "_") || "export"}.csv`;
  const filename = match ? decodeURIComponent(match[1].trim()) : fallback;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
