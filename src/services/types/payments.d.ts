// Finance → Payments: a school's Stripe connection.

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
