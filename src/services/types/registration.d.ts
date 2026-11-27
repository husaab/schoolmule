// ─── Enums ──────────────────────────────────────────────────────────

export type FormStatus = 'draft' | 'published' | 'closed';
export type FieldType = 'text' | 'email' | 'phone' | 'date' | 'select' | 'radio' | 'textarea' | 'payment';

// ─── Payment field ──────────────────────────────────────────────────

/** One priced item on a payment field. Prices are whole cents. */
export interface PaymentItem {
  id: string;
  label: string;
  amountCents: number;
  /** Always charged; an optional item is only charged when the family ticks it. */
  required: boolean;
}

export interface PaymentFieldConfig {
  items: PaymentItem[];
  /** The family may choose to pay at the office instead of by card. */
  allowOffline: boolean;
  /** For the school's books; never shown to families. */
  accountingCode?: string | null;
  currency?: string;
}

/** Where a response's payment stands. Staff without `finance` see a waived fee as 'settled'. */
export type ChargeStatus = 'unpaid' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'waived' | 'settled';

/** The way a payment was made, as the lists show it. */
export interface LastPayment {
  kind: 'card' | 'cash' | 'cheque' | 'other';
  cardBrand: string | null;
  cardLast4: string | null;
  wallet: string | null;
}

/** The payment on one form response. */
export interface SubmissionPayment {
  chargeId: string;
  status: ChargeStatus;
  amountCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  chosenMethod: 'card' | 'offline';
  disputeStatus: string | null;
  livemode: boolean;
  lastPayment: LastPayment | null;
}

/** The submissions list's payment filter. */
export type PaymentState = 'open' | 'paid' | 'refunded' | 'waived' | 'settled' | 'none';
export type SubmissionStatus = 'new' | 'reviewed' | 'archived';

// ─── Form ───────────────────────────────────────────────────────────

export interface RegistrationForm {
  formId: string;
  school: string;
  title: string;
  slug: string;
  description: string | null;
  bannerImagePath: string | null;
  status: FormStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  closedAt: string | null;
  newSubmissionsCount: number;
}

export interface FormField {
  fieldId: string;
  fieldType: FieldType;
  label: string;
  placeholder: string | null;
  isRequired: boolean;
  options: string[] | null;
  /** The price list, on a 'payment' field only. */
  payment?: PaymentFieldConfig | null;
  sortOrder: number;
}

export interface RegistrationFormWithFields extends RegistrationForm {
  fields: FormField[];
}

// ─── Submissions ────────────────────────────────────────────────────

export interface FormSubmission {
  submissionId: string;
  formId: string;
  school: string;
  answers: Record<string, string>;
  submittedAt: string;
  ipAddress: string | null;
  status: SubmissionStatus;
  // Import provenance. Null until this submission has been imported as a
  // student; `status` stays a separate human workflow field.
  importedStudentId: string | null;
  importedAt: string | null;
  importedBy: string | null;
  importedStudentName: string | null;
  /** Null when the response owes nothing. */
  payment?: SubmissionPayment | null;
}

// Whether to show all submissions, only those already imported, or only those
// still waiting to be imported.
export type ImportState = 'all' | 'imported' | 'not_imported';

export interface SubmissionPagination {
  total: number;
  page: number;
  limit: number;
}

// ─── API Responses ──────────────────────────────────────────────────

export interface FormsListResponse {
  status: string;
  data: RegistrationForm[];
}

export interface FormResponse {
  status: string;
  data: RegistrationFormWithFields;
}

export interface FieldsResponse {
  status: string;
  data: FormField[];
}

export interface SubmissionsListResponse {
  status: string;
  data: FormSubmission[];
  pagination: SubmissionPagination;
}

export interface SubmissionResponse {
  status: string;
  data: FormSubmission;
}

export interface NewCountResponse {
  status: string;
  data: { count: number };
}

// ─── Public Form Response ───────────────────────────────────────────

export interface PublicFormData extends RegistrationFormWithFields {
  bannerImageUrl: string | null;
  schoolName: string;
  schoolSlug: string;
  /** On a form with a payment field: whether the family can pay by card right now. */
  payments?: { online: boolean; currency: string } | null;
}

/** What the family chose to pay, sent with the answers. The server prices it. */
export interface PublicPaymentChoice {
  itemIds: string[];
  method: 'card' | 'offline';
}

export interface PublicFormResponse {
  status: string;
  data: PublicFormData;
}

export interface PublicSubmitResponse {
  status: string;
  message: string;
  data: {
    submissionId: string;
    /** Null when nothing is owed. `checkoutUrl` is Stripe's page; null for paying at the office, or when Stripe couldn't open one (use payPath). */
    payment?: { token: string; method: 'card' | 'offline'; totalCents: number; payPath: string; checkoutUrl: string | null } | null;
  };
}

// ─── Request Bodies ─────────────────────────────────────────────────

export interface CreateFormBody {
  title: string;
  description?: string;
}

export interface UpdateFormBody {
  title: string;
  slug?: string;
  description?: string;
}

export interface UpsertFieldsBody {
  fields: Omit<FormField, 'fieldId' | 'sortOrder'>[];
}

// One level of sort: a field UUID (or the special string 'submittedAt') + direction.
export interface SortSpec {
  fieldId: string;
  dir: 'asc' | 'desc';
}

// A per-field value filter. `values` are OR'd together; different fields are AND'd.
// Choice fields match exactly; text-ish fields match by "contains".
export interface FieldFilter {
  fieldId: string;
  values: string[];
}

export interface SubmissionFilters {
  status?: SubmissionStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  // Ordered multi-sort (priority order). Replaces the legacy sortFieldId/sortDir.
  sorts?: SortSpec[];
  // Per-field answer-value filters.
  fieldFilters?: FieldFilter[];
  // Restricts the list to imported / not-yet-imported submissions.
  importState?: ImportState;
  // Restricts the list by where the response's payment stands.
  payment?: PaymentState;
  // Legacy single-sort params (still honored by the backend; not emitted by the UI).
  sortFieldId?: string;
  sortDir?: 'asc' | 'desc';
}
