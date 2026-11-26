import { describe, it, expect } from 'vitest'
import { cardFeeCents, connectionCopy, connectionState, formatCents, payoutsPaused, returnMessage } from './paymentsConnection'
import type { PaymentAccount, PaymentsConnection } from '@/services/types/payments'

const account = (over: Partial<PaymentAccount> = {}): PaymentAccount => ({
  connected: true, status: 'onboarding', canTakePayments: false, stripeAccountId: 'acct_1', livemode: false,
  cardPaymentsStatus: 'restricted', payoutsStatus: 'restricted', requirementsDue: 0, requirementsPastDue: false,
  displayName: 'Maple Grove Academy', currency: 'cad', activatedAt: null, lastSyncedAt: null, syncFailed: false,
  connectedAt: '2026-11-26T15:00:00Z', disconnectedAt: null, ...over,
})

const connection = (acct: PaymentAccount | null, over: Partial<PaymentsConnection> = {}): PaymentsConnection => ({
  configured: true, mode: 'test', account: acct, ...over,
})

describe('connectionState', () => {
  it('is unavailable until the server has a Stripe key', () => {
    expect(connectionState(null)).toBe('unavailable')
    expect(connectionState({ configured: false, mode: null, account: null })).toBe('unavailable')
  })

  it('is not_connected before the school has an account', () => {
    expect(connectionState(connection(null))).toBe('not_connected')
  })

  it('otherwise follows the account', () => {
    expect(connectionState(connection(account({ status: 'active' })))).toBe('active')
    expect(connectionState(connection(account({ status: 'disconnected' })))).toBe('disconnected')
  })
})

describe('connectionCopy', () => {
  it('offers Connect to a school that has never connected', () => {
    const copy = connectionCopy(connection(null))
    expect(copy.action).toBe('Connect Stripe')
    expect(copy.badge).toEqual({ label: 'Not connected', tone: 'neutral' })
  })

  it('offers nothing while the server is not set up', () => {
    const copy = connectionCopy({ configured: false, mode: null, account: null })
    expect(copy.action).toBeNull()
    expect(copy.badge).toBeNull()
  })

  it('counts what Stripe is waiting for, in the singular and the plural', () => {
    expect(connectionCopy(connection(account({ requirementsDue: 1 }))).description).toContain('1 item from')
    const two = connectionCopy(connection(account({ requirementsDue: 2 })))
    expect(two.description).toContain('2 items from')
    expect(two.badge?.label).toBe('Setup in progress · 2 items left')
    expect(two.action).toBe('Continue setup')
  })

  it('does not invent a count when Stripe reports none', () => {
    const copy = connectionCopy(connection(account({ requirementsDue: 0 })))
    expect(copy.badge?.label).toBe('Setup in progress')
    expect(copy.description).toContain('a few details')
  })

  it('has no Stripe button while Stripe is reviewing or once active', () => {
    expect(connectionCopy(connection(account({ status: 'pending' }))).action).toBeNull()
    const active = connectionCopy(connection(account({ status: 'active', canTakePayments: true })))
    expect(active.action).toBeNull()
    expect(active.badge?.tone).toBe('good')
  })

  it('sends a restricted school back to Stripe', () => {
    const copy = connectionCopy(connection(account({ status: 'restricted', requirementsDue: 3 })))
    expect(copy.action).toBe('Fix in Stripe')
    expect(copy.title).toBe('Card payments are paused')
    expect(copy.description).toContain('3 items')
  })

  it('offers Reconnect after the school turned payments off', () => {
    expect(connectionCopy(connection(account({ status: 'disconnected', connected: false }))).action).toBe('Reconnect Stripe')
  })
})

describe('payoutsPaused', () => {
  it('is true only when cards work and payouts do not', () => {
    expect(payoutsPaused(account({ status: 'active', payoutsStatus: 'pending' }))).toBe(true)
    expect(payoutsPaused(account({ status: 'active', payoutsStatus: 'active' }))).toBe(false)
    expect(payoutsPaused(account({ status: 'active', payoutsStatus: null }))).toBe(false)
    expect(payoutsPaused(account({ status: 'onboarding', payoutsStatus: 'restricted' }))).toBe(false)
    expect(payoutsPaused(null)).toBe(false)
  })
})

describe('returnMessage', () => {
  it('matches where the school ended up', () => {
    expect(returnMessage(account({ status: 'active' }))[1]).toBe('success')
    expect(returnMessage(account({ status: 'pending' }))[0]).toContain('checking')
    expect(returnMessage(account({ status: 'onboarding' }))[1]).toBe('info')
    expect(returnMessage(null)[1]).toBe('info')
  })
})

describe('fees', () => {
  it('works out Stripe’s card fee to the cent', () => {
    expect(cardFeeCents(2500)).toBe(103)
    expect(cardFeeCents(3100)).toBe(120)
    expect(cardFeeCents(120000)).toBe(3510)
  })

  it('writes cents as dollars with two decimals', () => {
    expect(formatCents(2397)).toBe('$23.97')
    expect(formatCents(2500)).toBe('$25.00')
    expect(formatCents(120000)).toBe('$1,200.00')
  })
})
