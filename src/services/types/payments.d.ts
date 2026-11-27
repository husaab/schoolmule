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

export interface Charge {
  chargeId: string;
  submissionId: string | null;
  formId: string | null;
  formTitle: string | null;
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
  formTitle: string;
  formPath: string | null;
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
