// Finance (QuickBooks Online tuition ledger). Money values are numbers in CAD;
// months are 'YYYY-MM'; dates are 'YYYY-MM-DD' (timestamps are ISO strings).

export interface ApiEnvelope<T> {
  status: string;
  data: T;
  message?: string;
}

// ── Connection & sync ────────────────────────────────────────────────────

export type QboConnectionStatus = "active" | "needs_reconnect" | "disconnected";

export interface QboConnection {
  connected: boolean;
  status: QboConnectionStatus | null;
  realmId: string | null;
  companyName: string | null;
  settings: Record<string, unknown>;
  cdcCursor: string | null;
  backfillCompletedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  connectedBy: string | null;
  connectedAt: string | null;
}

export type SyncRunKind = "backfill" | "cdc" | "manual";

export interface SyncRun {
  runId: string;
  jobId: string | null;
  kind: SyncRunKind;
  mode: "full" | "cdc";
  status: "running" | "success" | "failed";
  startedAt: string;
  finishedAt: string | null;
  cursorFrom: string | null;
  cursorTo: string | null;
  customersUpserted: number;
  invoicesUpserted: number;
  paymentsUpserted: number;
  deletedFlagged: number;
  apiCalls: number;
  error: string | null;
  triggeredBy: string | null;
}

export interface SyncJob {
  jobId: string;
  kind: string;
  state: "pending" | "running" | "failed";
  attempts: number;
  nextAttemptAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface SyncStatus {
  connection: QboConnection;
  job: SyncJob | null;
  lastRun: SyncRun | null;
  pendingSync: boolean;
}

export interface SyncQueued {
  jobId: string | null;
  alreadyQueued: boolean;
}

export interface SyncRunsPage {
  runs: SyncRun[];
  total: number;
  limit: number;
  offset: number;
}

// ── Ledger ───────────────────────────────────────────────────────────────

export type CellStatus = "none" | "voided" | "paid" | "partial" | "unpaid" | "overdue";

export type InvoiceKind = "parent" | "subsidy_grant" | "subsidy_school" | "other";

export interface InvoiceBreakdown {
  tuition: number;
  registration: number;
  discounts: number;
  subsidyDeduction: number;
  other: number;
}

export interface InvoiceEntry {
  id: string;
  docNumber: string | null;
  txnDate: string;
  dueDate: string | null;
  total: number;
  balance: number;
  kind: InvoiceKind;
  voided: boolean;
  deleted: boolean;
  breakdown: InvoiceBreakdown;
  familyId?: string;
  familyName?: string;
}

export interface PaymentEntry {
  paymentId: string;
  invoiceId: string;
  date: string;
  amount: number;
  dateBeforeInvoice: boolean;
  familyId?: string;
}

export interface Cell {
  status: CellStatus;
  invoiced: number;
  paid: number;
  balance: number;
  daysOverdue: number;
  invoices: InvoiceEntry[];
  payments: PaymentEntry[];
}

export interface LedgerTotals {
  invoiced: number;
  paid: number;
  balance: number;
  overdueBalance: number;
}

export interface Ledger {
  cells: Record<string, Cell>;
  totals: LedgerTotals;
}

export type WarningCode =
  | "UNLINKED"
  | "NO_ACTIVE_STUDENTS"
  | "MISDATED_PAYMENT"
  | "UNEXPLAINED_PAID"
  | "TWO_PARENT_INVOICES_IN_MONTH"
  | "AMOUNT_DIFFERS"
  | "OTHER_KIND_INVOICE";

export interface LedgerWarning {
  code: WarningCode;
  month?: string;
  [k: string]: unknown;
}

// ── Grid ─────────────────────────────────────────────────────────────────

export interface GridStudent {
  studentId: string;
  name: string;
  grade: string;
  isArchived: boolean;
}

export interface GridContact {
  contactId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  relation: string | null;
  isPrimary: boolean;
  hasAccount: boolean;
}

export interface GridCustomer {
  qboId: string;
  displayName: string;
  isSubCustomer: boolean;
  active: boolean;
}

export interface GridFamily {
  familyId: string;
  name: string;
  isSubsidy: boolean;
  isTeacher: boolean;
  notes: string | null;
  expectedMonthlyParent: number | null;
  expectedMonthlySubsidy: number | null;
  rosterFamilyNo: number | null;
  customer: GridCustomer | null;
  students: GridStudent[];
  contacts: GridContact[];
  parent: Ledger;
  credit: number;
  warnings: LedgerWarning[];
  outOfRange: InvoiceEntry[];
}

export interface PseudoRowFamily {
  familyId: string;
  name: string;
  cells: Record<string, Cell>;
  totals: LedgerTotals;
}

export interface PseudoRow extends Ledger {
  label: string;
  byFamily: PseudoRowFamily[];
}

export interface GridSync {
  connected: boolean;
  status: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  pendingSync: boolean;
  needsFullRefresh: boolean;
}

export interface GridSummary {
  collectedThisMonth: number;
  outstanding: number;
  overdueTotal: number;
  subsidyReceivable: number;
  schoolAppliedSubsidy: number;
  familiesTotal: number;
  familiesUnpaidThisMonth: number;
  familiesOverdue: number;
  unlinkedCustomersWithInvoices: number;
  unlinkedInvoiceTotal: number;
  studentsWithoutFamily: number;
}

/** The period the tuition page is viewing: a 'YYYY-MM' month, or 'ytd'
 *  for the school year so far. Lives in the URL as `?month=`. */
export type TuitionPeriod = string;

/** A family's payment status for the viewed period ('none' = nothing billed). */
export type PeriodStatus = "none" | "unpaid" | "partial" | "overdue" | "paid";

/** The summary tiles for one month, computed client-side over every family. */
export interface MonthPeriodSummary {
  kind: "month";
  month: string;
  /** False when no family (nor the grant) has an invoice for the month yet. */
  hasInvoices: boolean;
  invoiced: number;
  collected: number;
  owed: number;
  overdue: number;
  familiesInvoiced: number;
  familiesOverdue: number;
  counts: { unpaid: number; partial: number; paid: number };
  /** Earliest due date among the month's parent invoices. */
  earliestDue: string | null;
  grantOwed: number;
  grantFamilies: number;
}

/** The summary tiles for the school year so far. */
export interface YtdPeriodSummary {
  kind: "ytd";
  invoiced: number;
  collected: number;
  outstanding: number;
  familiesWithBalance: number;
  overdue: number;
  familiesOverdue: number;
  grantReceivable: number;
  grantFamilies: number;
}

export type PeriodSummary = MonthPeriodSummary | YtdPeriodSummary;

export interface UnlinkedCustomer {
  qboId: string;
  displayName: string;
  invoiceCount: number;
  invoiceTotal: number;
  openBalance: number;
}

export interface TuitionGrid {
  months: string[];
  asOfMonth: string;
  today: string;
  year: { label: string; startDate: string; endDate: string };
  sync: GridSync;
  summary: GridSummary;
  families: GridFamily[];
  grant: PseudoRow;
  schoolSubsidy: PseudoRow;
  unlinked: { customers: UnlinkedCustomer[] };
}

// ── Family detail ────────────────────────────────────────────────────────

export interface FamilyRecord {
  familyId: string;
  schoolYearId: string;
  name: string;
  isSubsidy: boolean;
  isTeacher: boolean;
  expectedMonthlyParent: number | null;
  expectedMonthlySubsidy: number | null;
  notes: string | null;
  rosterFamilyNo: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyStudent extends GridStudent {
  addedAt: string;
}

export interface FamilyContact extends GridContact {
  source: "roster" | "student_record" | "manual";
}

export interface CustomerLink {
  linkId: string;
  qboCustomerId: string;
  customerName: string | null;
  isSubCustomer: boolean;
  customerActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  current: boolean;
  createdAt: string;
}

export interface FamilyInvoiceLine {
  lineNum: number;
  description: string | null;
  amount: number;
  itemRef: string | null;
  itemName: string | null;
  studentHint: string | null;
}

export interface FamilyInvoicePayment {
  paymentId: string;
  amount: number;
  date: string;
  ref: string | null;
  method: string | null;
  deleted: boolean;
}

export interface FamilyInvoice {
  qboId: string;
  docNumber: string | null;
  txnDate: string;
  month: string;
  dueDate: string | null;
  total: number;
  balance: number;
  kind: InvoiceKind;
  kindAuto: InvoiceKind;
  kindOverride: string | null;
  isVoided: boolean;
  deleted: boolean;
  emailStatus: string | null;
  privateNote: string | null;
  customerQboId: string;
  isRecurring: boolean;
  lines: FamilyInvoiceLine[];
  payments: FamilyInvoicePayment[];
}

export interface FamilyPayment {
  paymentId: string;
  customerQboId: string;
  date: string;
  total: number;
  unapplied: number;
  ref: string | null;
  method: string | null;
  deleted: boolean;
}

export interface FamilyAuditEntry {
  auditId: string;
  action: string;
  oldQboCustomerId: string | null;
  newQboCustomerId: string | null;
  studentId: string | null;
  invoiceQboId: string | null;
  details: unknown;
  actorUserId: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface FamilyLedger {
  parent: Ledger;
  grant: Ledger;
  schoolSubsidy: Ledger;
  credit: number;
  warnings: LedgerWarning[];
  outOfRange: InvoiceEntry[];
}

export interface FamilyDetail {
  family: FamilyRecord;
  months: string[];
  students: FamilyStudent[];
  contacts: FamilyContact[];
  customerLinks: CustomerLink[];
  customer: { qboId: string; displayName: string | null } | null;
  ledger: FamilyLedger | null;
  invoices: FamilyInvoice[];
  payments: FamilyPayment[];
  audit: FamilyAuditEntry[];
}

// ── Families (Phase 2: linking & editing) ────────────────────────────────

export type ContactRelation = "mother" | "father" | "guardian" | "other";

export interface FamilySummaryContact {
  contactId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  relation: ContactRelation | null;
  isPrimary: boolean;
  hasAccount: boolean;
  source: "roster" | "student_record" | "manual";
}

export interface FamilySummary {
  familyId: string;
  name: string;
  isSubsidy: boolean;
  isTeacher: boolean;
  notes: string | null;
  expectedMonthlyParent: number | null;
  expectedMonthlySubsidy: number | null;
  rosterFamilyNo: number | null;
  customer: GridCustomer | null;
  students: GridStudent[];
  contacts: FamilySummaryContact[];
  createdAt: string;
  updatedAt: string;
}

export type FamilyLinkedFilter = "all" | "linked" | "unlinked";

export interface ContactInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  relation?: string | null;
  isPrimary?: boolean;
}

export interface CreateFamilyInput {
  name: string;
  studentIds?: string[];
  contacts?: ContactInput[];
  qboCustomerId?: string;
  isSubsidy?: boolean;
  isTeacher?: boolean;
  expectedMonthlyParent?: number | null;
  expectedMonthlySubsidy?: number | null;
  notes?: string | null;
}

export interface UpdateFamilyInput {
  name?: string;
  isSubsidy?: boolean;
  isTeacher?: boolean;
  expectedMonthlyParent?: number | null;
  expectedMonthlySubsidy?: number | null;
  notes?: string | null;
}

// ── Suggestions & anomalies ──────────────────────────────────────────────

export type MatchReason = "email" | "name" | "student";

export interface CustomerCandidate {
  qboId: string;
  displayName: string;
  isSubCustomer: boolean;
  active: boolean;
  reason: MatchReason;
  score: number;
}

export interface FamilyCandidate {
  familyId: string;
  name: string;
  reason: MatchReason;
  score: number;
}

export interface UnlinkedFamilySuggestion {
  familyId: string;
  name: string;
  candidates: CustomerCandidate[];
}

export interface UnlinkedCustomerSuggestion {
  qboId: string;
  displayName: string;
  isSubCustomer: boolean;
  active: boolean;
  invoiceCount: number;
  invoiceTotal: number;
  openBalance: number;
  /** 'YYYY-MM-DD' of the customer's first invoice this year, or null. */
  earliestInvoiceDate: string | null;
  candidates: FamilyCandidate[];
}

export interface StudentWithoutFamily {
  studentId: string;
  name: string;
  grade: string;
  motherEmail: string | null;
  fatherEmail: string | null;
  suggestedFamilyId: string | null;
  suggestedFamilyName: string | null;
}

export interface FamilySuggestions {
  unlinkedFamilies: UnlinkedFamilySuggestion[];
  unlinkedCustomers: UnlinkedCustomerSuggestion[];
  studentsWithoutFamily: StudentWithoutFamily[];
}

export interface OtherKindInvoice {
  qboId: string;
  docNumber: string | null;
  txnDate: string;
  total: number;
  balance: number;
  customerQboId: string;
  customerName: string | null;
  familyId: string | null;
  familyName: string | null;
}

export interface StaleLink {
  familyId: string;
  familyName: string;
  qboCustomerId: string;
  customerName: string | null;
  reason: "inactive" | "deleted" | "missing";
}

export interface TuitionAnomalies {
  unlinkedCustomers: UnlinkedCustomerSuggestion[];
  studentsWithoutFamily: { studentId: string; name: string; grade: string }[];
  otherKindInvoices: OtherKindInvoice[];
  staleLinks: StaleLink[];
  warningsByFamily: { familyId: string; name: string; warnings: LedgerWarning[] }[];
}

// ── QuickBooks customers (cache) ─────────────────────────────────────────

export interface QboCustomerOption {
  qboId: string;
  displayName: string;
  fullyQualifiedName: string | null;
  isSubCustomer: boolean;
  parentQboId: string | null;
  active: boolean;
  emails: string[];
  linkedFamilyId: string | null;
  linkedFamilyName: string | null;
  invoiceCount: number;
  invoiceTotal: number;
  openBalance: number;
  /** 'YYYY-MM-DD' of the first invoice this school year; null when none. */
  earliestInvoiceDate: string | null;
}

/** The part of a customer a picker needs to show a selection. */
export interface PickedCustomer {
  qboId: string;
  displayName: string;
  isSubCustomer: boolean;
  active: boolean;
  emails?: string[];
  /** Known when picked from the customer search. */
  earliestInvoiceDate?: string | null;
}

// ── Invoice kind override ────────────────────────────────────────────────

export interface InvoiceKindResult {
  qboId: string;
  kindAuto: InvoiceKind;
  kindOverride: InvoiceKind | null;
  kind: InvoiceKind;
}

// ── Import (roster JSON + customer-map CSV) ──────────────────────────────

export interface ImportInput {
  roster: Record<string, unknown> | unknown[];
  customerMap: string;
  dryRun?: boolean;
  acceptNear?: Record<string, string>;
}

export interface ImportNearMatch {
  familyNo: number | string;
  child: string;
  grade: string;
  candidates: { studentId: string; name: string; grade: string }[];
}

export interface ImportPlanFamily {
  familyNo: number | string;
  action: "create" | "update";
  customerId: string | null;
  previousCustomerId: string | null;
  row: {
    name: string;
    is_subsidy: boolean;
    is_teacher: boolean;
    expected_monthly_parent: number | null;
    expected_monthly_subsidy: number | null;
    notes: string | null;
    roster_family_no: number | null;
  };
  students: { studentId: string; name: string; grade: string; tier: "exact" | "near-accepted" }[];
  contacts: { name: string | null; email: string | null; phone: string | null; relation: string | null; is_primary: boolean; source: string }[];
}

export interface ImportPlan {
  counts: {
    families: number;
    exact: number;
    nearAccepted: number;
    near: number;
    unmatched: number;
    conflicts: number;
    contacts: number;
  };
  near: ImportNearMatch[];
  unmatched: { familyNo: number | string; child: string; grade: string }[];
  conflicts: { familyNo: number | string; child: string; studentId: string; familyId: string }[];
  errors: string[];
  families: ImportPlanFamily[];
}

export interface ImportSummary {
  familiesCreated: number;
  familiesUpdated: number;
  studentsLinked: number;
  contactsWritten: number;
  linksOpened: number;
  linksClosed: number;
  conflicts: { familyNo: number | string; studentId: string; familyId: string }[];
  skipped: { familyNo: number | string; studentId: string; reason: string }[];
}

export interface ImportResult {
  applied: boolean;
  plan: ImportPlan;
  summary: ImportSummary | null;
}
