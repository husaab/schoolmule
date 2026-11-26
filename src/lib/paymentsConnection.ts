// What the Payments page says about a school's Stripe connection. Pure, so
// the web page and the app's screen read the same words from the same rules.

import type { PaymentAccount, PaymentsConnection } from '@/services/types/payments'

/** The connection as the school experiences it. */
export type ConnectionState =
  | 'unavailable'    // SchoolMule's server has no Stripe key yet
  | 'not_connected'  // the school has never connected
  | 'onboarding'     // Stripe still needs information from the school
  | 'pending'        // everything is in; Stripe is checking it
  | 'active'         // the school can take card payments
  | 'restricted'     // it could before and now cannot
  | 'disconnected'   // the school turned payments off here

export type ConnectionTone = 'neutral' | 'warning' | 'good' | 'danger'

export interface ConnectionCopy {
  state: ConnectionState
  badge: { label: string; tone: ConnectionTone } | null
  title: string
  description: string
  /** The button that sends the school to Stripe's sign-up, or null when there is nothing to do there. */
  action: string | null
}

export function connectionState(connection: PaymentsConnection | null): ConnectionState {
  if (!connection || !connection.configured) return 'unavailable'
  if (!connection.account) return 'not_connected'
  return connection.account.status
}

const itemsLeft = (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`

export function connectionCopy(connection: PaymentsConnection | null): ConnectionCopy {
  const state = connectionState(connection)
  const due = connection?.account?.requirementsDue ?? 0

  switch (state) {
    case 'unavailable':
      return {
        state, badge: null, action: null,
        title: 'Payments aren’t switched on yet',
        description: 'SchoolMule is still setting up payments on its side. Nothing is needed from your school yet.',
      }
    case 'not_connected':
      return {
        state, badge: { label: 'Not connected', tone: 'neutral' }, action: 'Connect Stripe',
        title: 'Connect Stripe to start taking payments',
        description: 'Stripe is the payment company that processes cards for your school. Setup takes about 10 minutes.',
      }
    case 'onboarding':
      return {
        state, action: 'Continue setup',
        badge: { label: due > 0 ? `Setup in progress · ${itemsLeft(due)} left` : 'Setup in progress', tone: 'warning' },
        title: 'Finish setting up Stripe',
        description: due > 0
          ? `Stripe still needs ${itemsLeft(due)} from your school before you can take payments.`
          : 'Stripe still needs a few details from your school before you can take payments.',
      }
    case 'pending':
      return {
        state, badge: { label: 'In review', tone: 'warning' }, action: null,
        title: 'Stripe is checking your details',
        description: 'Everything is in. Stripe’s checks can take a few business days, and this page updates when they finish.',
      }
    case 'active':
      return {
        state, badge: { label: 'Active', tone: 'good' }, action: null,
        title: 'Stripe is connected',
        description: 'Your school can take card payments. Payouts go to the bank account on your Stripe account.',
      }
    case 'restricted':
      return {
        state, badge: { label: 'Stripe needs more information', tone: 'warning' }, action: 'Fix in Stripe',
        title: 'Card payments are paused',
        description: due > 0
          ? `Stripe needs ${itemsLeft(due)} from your school before payments can resume.`
          : 'Stripe has paused payments for your school. Open Stripe to see what it needs.',
      }
    case 'disconnected':
      return {
        state, badge: { label: 'Disconnected', tone: 'danger' }, action: 'Reconnect Stripe',
        title: 'Payments are turned off',
        description: 'Your Stripe account still exists. Reconnect to start taking payments again.',
      }
  }
}

/** Card payments work but Stripe is not yet paying out to the school's bank. */
export function payoutsPaused(account: PaymentAccount | null): boolean {
  return Boolean(account && account.status === 'active' && account.payoutsStatus && account.payoutsStatus !== 'active')
}

/** What to tell the school when it comes back from Stripe's sign-up. */
export function returnMessage(account: PaymentAccount | null): [string, 'success' | 'info'] {
  if (account?.status === 'active') return ['Stripe is connected. Your school can take payments.', 'success']
  if (account?.status === 'pending') return ['Thanks. Stripe is checking your details.', 'success']
  return ['Stripe still needs some information. You can continue any time.', 'info']
}

// ── Fees ──────────────────────────────────────────────────────────────────
// Stripe's standard Canadian card price, read from stripe.com/en-ca/pricing on
// 2026-11-26. Shown to schools before they connect; Stripe sets the real fee.
export const CARD_FEE_PERCENT = 2.9
export const CARD_FEE_FIXED_CENTS = 30

export function cardFeeCents(amountCents: number): number {
  return Math.round((amountCents * CARD_FEE_PERCENT) / 100) + CARD_FEE_FIXED_CENTS
}

const CAD = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

/** Integer cents as dollars, always with two decimals: 2397 → "$23.97". */
export function formatCents(cents: number): string {
  return CAD.format(cents / 100)
}
