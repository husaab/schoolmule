import { describe, it, expect } from 'vitest'
import { PARENT_PAYMENTS_ENABLED, entryStatusLabel, overdueCount } from './parentPayments'
import type { ParentPaymentEntry } from '@/services/types/payments'

const entry = (over: Partial<ParentPaymentEntry> = {}): ParentPaymentEntry => ({
  chargeId: 'c', title: 'Trip', sourceType: 'request', studentName: 'Aisha', currency: 'cad', amountCents: 3500,
  amountPaidCents: 0, amountRefundedCents: 0, balanceCents: 3500, status: 'unpaid', dueDate: null, paidAt: null,
  createdAt: '2026-11-01T00:00:00Z', canPayOnline: true, payPath: '/pay/x', ...over,
})

describe('the parent payments page', () => {
  it('stays off until schools are ready', () => {
    expect(PARENT_PAYMENTS_ENABLED).toBe(false)
  })

  it('counts what is overdue', () => {
    const owing = [entry({ dueDate: '2026-11-20' }), entry({ dueDate: '2026-12-20' }), entry()]
    expect(overdueCount(owing, '2026-11-27')).toBe(1)
  })

  it('never says waived to a family', () => {
    expect(entryStatusLabel('waived')).toBe('Settled')
    expect(entryStatusLabel('settled')).toBe('Settled')
    expect(entryStatusLabel('paid')).toBe('Paid')
    expect(entryStatusLabel('partially_paid')).toBe('Part paid')
    expect(entryStatusLabel('unpaid')).toBe('To pay')
  })
})
