import { describe, it, expect } from 'vitest'
import {
  centsToInput, defaultPaymentConfig, formatCents, isOpenDispute, newItemId, paidWith, parseDollars, paymentConfigProblem,
  paymentFilterOptions, paymentStatus, priceRange, priceSummary, selectionTotal,
} from './paymentField'
import type { PaymentFieldConfig } from '@/services/types/registration'

const config = (over: Partial<PaymentFieldConfig> = {}): PaymentFieldConfig => ({
  items: [
    { id: 'trip', label: 'Trip fee', amountCents: 2500, required: true },
    { id: 'lunch', label: 'Pizza lunch', amountCents: 600, required: false },
  ],
  allowOffline: false,
  ...over,
})

describe('prices', () => {
  it('reads what a person types into a price box', () => {
    expect(parseDollars('25')).toBe(2500)
    expect(parseDollars('25.5')).toBe(2550)
    expect(parseDollars('$1,200.00')).toBe(120000)
    expect(parseDollars(' 0.50 ')).toBe(50)
    expect(parseDollars('25.555')).toBeNull()
    expect(parseDollars('abc')).toBeNull()
    expect(parseDollars('')).toBeNull()
    expect(parseDollars('-5')).toBeNull()
  })

  it('writes cents back into the box', () => {
    expect(centsToInput(2500)).toBe('25.00')
    expect(centsToInput(0)).toBe('')
    expect(formatCents(3100)).toBe('$31.00')
  })

  it('gives ids the server accepts', () => {
    const id = newItemId()
    expect(id).toMatch(/^[A-Za-z0-9_-]{1,64}$/)
    expect(newItemId()).not.toBe(id)
  })
})

describe('paymentConfigProblem', () => {
  it('is null for a good list', () => {
    expect(paymentConfigProblem(config())).toBeNull()
  })

  it('says what is wrong in the server’s words', () => {
    expect(paymentConfigProblem(defaultPaymentConfig())).toBe('Item 1 needs a name')
    expect(paymentConfigProblem({ items: [], allowOffline: false })).toMatch(/at least one item/)
    expect(paymentConfigProblem(config({ items: [{ id: 'a', label: 'Sticker', amountCents: 25, required: true }] }))).toBe('“Sticker” needs a price between $0.50 and $10,000.00')
    expect(paymentConfigProblem(null)).toMatch(/at least one item/)
  })
})

describe('totals', () => {
  it('summarises the range a family can pay', () => {
    expect(priceRange(config())).toEqual({ min: 2500, max: 3100 })
    expect(priceSummary(config())).toBe('Parents pay $25.00 to $31.00')
    expect(priceSummary(config({ items: [config().items[0]] }))).toBe('Parents pay $25.00')
    expect(priceSummary(config({ items: [config().items[1]] }))).toBe('Optional, up to $6.00')
    expect(priceSummary({ items: [], allowOffline: false })).toBe('No items yet')
  })

  it('adds the ticked items to the required ones', () => {
    expect(selectionTotal(config(), [])).toBe(2500)
    expect(selectionTotal(config(), ['lunch'])).toBe(3100)
    expect(selectionTotal(config(), ['trip', 'lunch', 'ghost'])).toBe(3100)
  })
})

describe('wording', () => {
  it('names each state with a tone', () => {
    expect(paymentStatus('paid')).toEqual({ label: 'Paid', tone: 'good' })
    expect(paymentStatus('unpaid')).toEqual({ label: 'Unpaid', tone: 'neutral' })
    expect(paymentStatus('unpaid', { offline: true })).toEqual({ label: 'Paying at office', tone: 'info' })
    expect(paymentStatus('settled').label).toBe('Settled')
    expect(paymentStatus('paid', { disputed: true })).toEqual({ label: 'Disputed', tone: 'danger' })
  })

  it('tells an open dispute from a finished one', () => {
    expect(isOpenDispute('needs_response')).toBe(true)
    expect(isOpenDispute('won')).toBe(false)
    expect(isOpenDispute(null)).toBe(false)
  })

  it('says how it was paid', () => {
    expect(paidWith({ kind: 'card', cardBrand: 'visa', cardLast4: '4242', wallet: null })).toBe('Visa 4242')
    expect(paidWith({ kind: 'card', cardBrand: 'visa', cardLast4: '4242', wallet: 'apple_pay' })).toBe('Apple Pay')
    expect(paidWith({ kind: 'cash', cardBrand: null, cardLast4: null, wallet: null })).toBe('Cash')
    expect(paidWith(null)).toBe('')
  })

  it('keeps "Waived" out of the filter for staff without finance', () => {
    expect(paymentFilterOptions(true).map((o) => o.label)).toContain('Waived')
    expect(paymentFilterOptions(false).map((o) => o.label)).not.toContain('Waived')
    expect(paymentFilterOptions(false).map((o) => o.label)).toContain('Paid or settled')
  })
})
