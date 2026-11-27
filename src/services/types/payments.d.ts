// Finance → Payments: a school's Stripe connection, and the ledger.

import type { ChargeStatus, LastPayment } from './registration';

/** Where the school stands. See payments_stripe_connect_migration.sql. */
export type PaymentAccountStatus = 'onboarding' | 'pending' | 'active' | 'restricted' | 'disconnected';

/** Stripe's own word for one capability (card payments, payouts). */
export type StripeCapabilityStatus = 'active' | 'pending' | 'restricted' | 'unsupported';

export interface PaymentAccount {
  connected: boolean;
  status: PaymentAccountStatus;
  canTakePayments: boolean;
  stripeAccountId: string;
  livemode: boolean;
  cardPaymentsStatus: StripeCapabilityStatus | null;
  payoutsStatus: StripeCapabilityStatus | null;
  /** How many items Stripe is waiting on the school for right now. */
  requirementsDue: number;
  requirementsPastDue: boolean;
  displayName: string | null;
  currency: string;
  activatedAt: string | null;
  lastSyncedAt: string | null;
  /** The last check with Stripe failed; the figures may be out of date. */
  syncFailed: boolean;
  connectedAt: string;
  disconnectedAt: string | null;
}

export interface PaymentsConnection {
  /** False until the SchoolMule server itself has a Stripe key. */
  configured: boolean;
  /** 'test' means no real money moves. */
  mode: 'test' | 'live' | null;
  account: PaymentAccount | null;
}

// ─── The ledger: what is owed and what happened ─────────────────────

export interface ChargeLine {
  lineId: string;
  itemId: string | null;
  label: string;
  amountCents: number;
}

export type ChargePaymentKind = 'card' | 'cash' | 'cheque' | 'other' | 'waiver' | 'refund';

export interface ChargePayment {
  paymentId: string;
  kind: ChargePaymentKind;
  amountCents: number;
  status: 'pending' | 'succeeded' | 'failed' | 'voided';
  cardBrand: string | null;
  cardLast4: string | null;
  wallet: string | null;
  stripeFeeCents: number | null;
  /** The office's note (a cheque number, why a fee was waived). */
  note: string | null;
  recordedByName: string | null;
  createdAt: string;
  voidedAt: string | null;
}

export type ChargeSource = 'form_submission' | 'request';

export interface Charge {
  chargeId: string;
  /** A form response, or a payment request the office sent. */
  sourceType: ChargeSource;
  submissionId: string | null;
  formId: string | null;
  formTitle: string | null;
  requestId: string | null;
  requestTitle: string | null;
  /** A request's due date, "YYYY-MM-DD". */
  dueDate: string | null;
  /** The child it is for: picked by a signed-in parent, linked by the office, or the request's student. */
  studentId: string | null;
  studentName: string | null;
  studentGrade: string | null;
  description: string;
  payerEmail: string | null;
  currency: string;
  amountCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  balanceCents: number;
  status: ChargeStatus;
  chosenMethod: 'card' | 'offline';
  paidAt: string | null;
  disputeStatus: string | null;
  accountingCode: string | null;
  linkSentAt: string | null;
  createdAt: string;
  /** In lists. */
  lastPayment?: LastPayment | null;
  stripeFeeCents?: number;
  /** In the detail. */
  lines?: ChargeLine[];
  payments?: ChargePayment[];
  refundableCents?: number;
}

export interface PaymentsSummary {
  collectedThisMonthCents: number;
  refundedThisMonthCents: number;
  outstandingCents: number;
  outstandingCount: number;
  openDisputes: number;
}

export type ChargeListStatus = 'open' | 'unpaid' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'waived';

export interface ChargeListFilters {
  status?: ChargeListStatus | null;
  formId?: string | null;
  requestId?: string | null;
  studentId?: string | null;
  /** Forms or payment requests only. */
  source?: 'form' | 'request' | null;
  q?: string | null;
  page?: number;
  limit?: number;
}

export interface Payout {
  payoutId: string;
  amountCents: number;
  currency: string;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  arrivalDate: string | null;
  createdAt: string | null;
  automatic: boolean;
  failureMessage: string | null;
}

export interface PayoutsData {
  payouts: Payout[];
  balance: { availableCents: number; pendingCents: number } | null;
}

export type OfflineKind = 'cash' | 'cheque' | 'other';

/** What a family's payment link shows (/pay/<token>). */
export interface PublicPayment {
  schoolName: string | null;
  sourceType: ChargeSource;
  /** The form's title, or the request's. */
  formTitle: string;
  formPath: string | null;
  /** A request's own words for the family. */
  requestDescription: string | null;
  dueDate: string | null;
  studentName: string | null;
  /** Whether paying at the office is fine. */
  allowOffline: boolean;
  currency: string;
  lines: ChargeLine[];
  amountCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  balanceCents: number;
  status: ChargeStatus;
  paidAt: string | null;
  chosenMethod: 'card' | 'offline';
  canPayOnline: boolean;
  card: { brand: string | null; last4: string | null; wallet: string | null } | null;
  reference: string;
  testMode: boolean;
}

// ─── Payment requests: the office asks families to pay ──────────────

export interface PaymentRequestStats {
  students: number;
  settled: number;
  open: number;
  expectedCents: number;
  collectedCents: number;
  outstandingCents: number;
  waivedCents: number;
}

export interface PaymentRequest {
  requestId: string;
  title: string;
  description: string | null;
  currency: string;
  amountCents: number;
  /** "YYYY-MM-DD" */
  dueDate: string | null;
  allowOffline: boolean;
  accountingCode: string | null;
  createdAt: string;
  createdByName: string | null;
  stats: PaymentRequestStats;
}

export interface PaymentRequestCharge extends Charge {
  /** Where the request's emails went. */
  guardianEmails: string[];
}

export interface PaymentRequestDetail extends PaymentRequest {
  charges: PaymentRequestCharge[];
  /** After an action: what it did. */
  result?: { added?: number; removed?: boolean; reminded?: number; open?: number };
}

/** Who a request goes to: whole grades, whole classes, picked students. */
export interface PaymentRequestTarget {
  grades?: string[];
  classIds?: string[];
  studentIds?: string[];
}

export interface PaymentRequestInput {
  title: string;
  description: string | null;
  amountCents: number;
  dueDate: string | null;
  allowOffline: boolean;
  accountingCode: string | null;
}

export interface RosterStudent {
  studentId: string;
  name: string;
  grade: string;
  classIds: string[];
  /** Someone to email: a parent account, or a mother's or father's email. */
  hasGuardianEmail: boolean;
}

export interface RosterClass {
  classId: string;
  name: string;
  grade: string;
  teacherName: string;
  studentCount: number;
}

export interface PaymentsRoster {
  students: RosterStudent[];
  classes: RosterClass[];
}

export interface StudentMatch {
  studentId: string;
  name: string;
  grade: string;
}

// ─── The overview ────────────────────────────────────────────────────

export interface PaymentsMonth {
  /** "YYYY-MM" */
  month: string;
  cardCents: number;
  officeCents: number;
  refundedCents: number;
  stripeFeeCents: number;
}

export interface PaymentsCollection {
  source: 'form' | 'request';
  id: string;
  title: string;
  slug?: string;
  dueDate: string | null;
  createdAt: string;
  stats: {
    count: number;
    settled: number;
    open: number;
    expectedCents: number;
    collectedCents: number;
    outstandingCents: number;
    waivedCents: number;
  };
}

export interface PaymentsActivity {
  paymentId: string;
  chargeId: string;
  kind: ChargePaymentKind;
  status: ChargePayment['status'];
  amountCents: number;
  createdAt: string;
  title: string;
  sourceType: ChargeSource;
  studentName: string | null;
  payerEmail: string | null;
  paidWith: string | null;
}

export interface PaymentsOverview {
  summary: PaymentsSummary;
  months: PaymentsMonth[];
  collections: PaymentsCollection[];
  activity: PaymentsActivity[];
}

// ─── The parent portal's Payments page ───────────────────────────────

export interface ParentPaymentEntry {
  chargeId: string;
  title: string;
  sourceType: ChargeSource;
  studentName: string | null;
  currency: string;
  amountCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  balanceCents: number;
  status: ChargeStatus;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  canPayOnline: boolean;
  /** The family's own payment page. */
  payPath: string;
}

export interface ParentPayments {
  owing: ParentPaymentEntry[];
  history: ParentPaymentEntry[];
  totalOwingCents: number;
  canPayOnline: boolean;
}
