import { describe, it, expect } from 'vitest'
import {
  PERCENT_PROBLEM, addedTaxParts, fieldHasTax, includedNote, ledgerShowsTax, linesWithTax, parsePercent, percentForServer,
  percentInput, percentLabel, priceWithTax, rateChoices, rateLabel, taxBreakdown, taxFor, taxLineLabel, taxModeOf, taxNames,
  taxRateProblem,
} from './paymentTax'
import { alreadyOnFormChargeId, officePaymentProblem, priceRange, priceSummary, selectionTotal } from './paymentField'
import { perStudentLabel, requestPrice, requestPriceLine, requestTaxFields } from './paymentRequests'
import type { PaymentFieldConfig } from '@/services/types/registration'
import type { ChargeTax, TaxRate } from '@/services/types/payments'

const HST = { name: 'HST', rateMilli: 13000 }
const QST = { name: 'QST', rateMilli: 9975 }

const field = (over: Partial<PaymentFieldConfig> = {}): PaymentFieldConfig => ({
  items: [
    { id: 'trip', label: 'Trip fee', amountCents: 2500, required: true, taxRateId: 'hst', tax: HST },
    { id: 'lunch', label: 'Pizza lunch', amountCents: 600, required: false, taxRateId: 'hst', tax: HST },
    { id: 'book', label: 'Book', amountCents: 1000, required: false, taxRateId: null, tax: null },
  ],
  allowOffline: false,
  taxMode: 'added',
  ...over,
})

describe('taxFor (the spec’s vectors)', () => {
  it('adds tax on top', () => {
    expect(taxFor(2500, 13000, 'added')).toBe(325)
    expect(taxFor(600, 13000, 'added')).toBe(78)
    expect(taxFor(1999, 5000, 'added')).toBe(100)
    expect(taxFor(1000, 9975, 'added')).toBe(100)
  })

  it('finds the tax already in a price', () => {
    expect(taxFor(2500, 13000, 'included')).toBe(288)
    expect(taxFor(11300, 13000, 'included')).toBe(1300)
  })

  it('is 0 without a rate or a price, and added by default', () => {
    expect(taxFor(2500, null, 'added')).toBe(0)
    expect(taxFor(2500, 0, 'included')).toBe(0)
    expect(taxFor(0, 13000, 'added')).toBe(0)
    expect(taxFor(2500, 13000)).toBe(325)
  })

  it('reads anything but "included" as added', () => {
    expect(taxModeOf('included')).toBe('included')
    expect(taxModeOf('added')).toBe('added')
    expect(taxModeOf(undefined)).toBe('added')
    expect(taxModeOf('sideways')).toBe('added')
  })
})

describe('rates in words', () => {
  it('drops trailing zeros from a percent', () => {
    expect(percentLabel(13000)).toBe('13%')
    expect(percentLabel(9975)).toBe('9.975%')
    expect(percentLabel(12500)).toBe('12.5%')
    expect(percentLabel(5000)).toBe('5%')
    expect(percentLabel(1)).toBe('0.001%')
    expect(percentLabel(100000)).toBe('100%')
    expect(percentInput(13000)).toBe('13')
    expect(percentInput(9975)).toBe('9.975')
  })

  it('names a rate for a picker, marking a removed one', () => {
    expect(rateLabel({ name: 'HST', rateMilli: 13000 })).toBe('HST 13%')
    expect(rateLabel({ name: 'HST', rateMilli: 13000, archived: true })).toBe('HST 13% (removed)')
    expect(rateLabel(null)).toBe('No tax')
    expect(taxLineLabel(QST)).toBe('QST (9.975%)')
  })

  it('reads what a person types into a percent box', () => {
    expect(parsePercent('13')).toBe(13000)
    expect(parsePercent('9.975')).toBe(9975)
    expect(parsePercent(' 13 % ')).toBe(13000)
    expect(parsePercent('13.')).toBe(13000)
    expect(parsePercent('.5')).toBe(500)
    expect(parsePercent('0.001')).toBe(1)
    expect(parsePercent('100')).toBe(100000)
    expect(parsePercent(9.975)).toBe(9975)
    expect(parsePercent('0')).toBeNull()
    expect(parsePercent('100.001')).toBeNull()
    expect(parsePercent('9.9755')).toBeNull()
    expect(parsePercent('-5')).toBeNull()
    expect(parsePercent('abc')).toBeNull()
    expect(parsePercent('.')).toBeNull()
    expect(parsePercent('')).toBeNull()
    expect(parsePercent(null)).toBeNull()
  })

  it('sends the server the rate as typed, cleaned', () => {
    expect(percentForServer(' 13 % ')).toBe('13')
    expect(percentForServer('9.9750')).toBeNull()
    expect(percentForServer('9.970')).toBe('9.97')
  })

  it('says what is wrong with a rate before it is saved', () => {
    const rates: TaxRate[] = [
      { taxRateId: 'hst', name: 'HST', rateMilli: 13000, archived: false },
      { taxRateId: 'old', name: 'PST', rateMilli: 8000, archived: true },
    ]
    expect(taxRateProblem({ name: 'GST', percentText: '5' }, rates)).toBeNull()
    expect(taxRateProblem({ name: '  ', percentText: '5' }, rates)).toBe('Give the rate a name, like HST')
    expect(taxRateProblem({ name: 'x'.repeat(31), percentText: '5' }, rates)).toBe('Keep the name to 30 characters')
    expect(taxRateProblem({ name: 'GST', percentText: '0' }, rates)).toBe(PERCENT_PROBLEM)
    expect(taxRateProblem({ name: 'hst ', percentText: '13' }, rates)).toBe('You already have a rate called HST')
    // A removed rate's name is free again, and a rate can keep its own name.
    expect(taxRateProblem({ name: 'PST', percentText: '7' }, rates)).toBeNull()
    expect(taxRateProblem({ name: 'HST', percentText: '15' }, rates, 'hst')).toBeNull()
  })

  it('lists live rates in a picker, and a removed one only while it is chosen', () => {
    const rates = [
      { taxRateId: 'hst', name: 'HST', rateMilli: 13000, archived: false },
      { taxRateId: 'old', name: 'PST', rateMilli: 8000, archived: true },
    ]
    expect(rateChoices(rates)).toEqual([{ value: '', label: 'No tax' }, { value: 'hst', label: 'HST 13%' }])
    expect(rateChoices(rates, 'old').map((c) => c.label)).toEqual(['No tax', 'HST 13%', 'PST 8% (removed)'])
    // The form builder only gets live rates; the item names its removed one.
    expect(rateChoices([rates[0]], 'gone', { name: 'GST', rateMilli: 5000 }).at(-1)).toEqual({ value: 'gone', label: 'GST 5% (removed)' })
    expect(rateChoices([rates[0]], 'gone').at(-1)).toEqual({ value: 'gone', label: 'A removed rate' })
    expect(rateChoices([rates[0]], 'hst')).toHaveLength(2)
  })
})

describe('priceWithTax', () => {
  it('adds tax per line and sums it by rate', () => {
    expect(priceWithTax(field(), [])).toEqual({
      subtotalCents: 2500, taxes: [{ name: 'HST', rateMilli: 13000, cents: 325, included: false }], taxAddedCents: 325, totalCents: 2825,
    })
    // 325 + 78 on separate lines, not 13% of 3100 rounded once.
    const all = priceWithTax(field(), ['lunch', 'book'])
    expect(all).toEqual({
      subtotalCents: 4100, taxes: [{ name: 'HST', rateMilli: 13000, cents: 403, included: false }], taxAddedCents: 403, totalCents: 4503,
    })
  })

  it('keeps tax that is already in the prices out of the total', () => {
    const p = priceWithTax(field({ taxMode: 'included' }), ['lunch'])
    expect(p.subtotalCents).toBe(3100)
    expect(p.taxes).toEqual([{ name: 'HST', rateMilli: 13000, cents: 288 + 69, included: true }])
    expect(p.taxAddedCents).toBe(0)
    expect(p.totalCents).toBe(3100)
  })

  it('lists each rate once, largest first', () => {
    const p = linesWithTax([
      { amountCents: 1000, tax: QST },
      { amountCents: 2500, tax: HST },
      { amountCents: 1000, tax: QST },
      { amountCents: 500, tax: null },
    ], 'added')
    expect(p.taxes.map((t) => [t.name, t.cents])).toEqual([['HST', 325], ['QST', 200]])
    expect(p.totalCents).toBe(5000 + 525)
  })

  it('is the untaxed total when nothing names a rate', () => {
    const plain: PaymentFieldConfig = {
      items: [{ id: 'trip', label: 'Trip fee', amountCents: 2500, required: true }, { id: 'lunch', label: 'Pizza lunch', amountCents: 600, required: false }],
      allowOffline: false,
    }
    expect(priceWithTax(plain, ['lunch'])).toEqual({ subtotalCents: 3100, taxes: [], taxAddedCents: 0, totalCents: 3100 })
    expect(priceWithTax(null, [])).toEqual({ subtotalCents: 0, taxes: [], taxAddedCents: 0, totalCents: 0 })
    expect(fieldHasTax(plain)).toBe(false)
    expect(fieldHasTax(field())).toBe(true)
  })

  it('leaves a rate that comes to nothing off the list', () => {
    expect(linesWithTax([{ amountCents: 50, tax: { name: 'Tiny', rateMilli: 1 } }], 'added').taxes).toEqual([])
  })

  it('is what the existing totals use', () => {
    expect(selectionTotal(field(), [])).toBe(2825)
    expect(selectionTotal(field(), ['lunch', 'ghost'])).toBe(2825 + 678)
    expect(priceRange(field())).toEqual({ min: 2825, max: 4503 })
  })
})

describe('the builder’s summary', () => {
  it('shows what a family pays with the tax', () => {
    const one = field({ items: [field().items[0]] })
    expect(priceSummary(one)).toBe('Parents pay $28.25 ($25.00 + $3.25 HST)')
    expect(priceSummary(field())).toBe('Parents pay $28.25 to $45.03 with HST')
    expect(priceSummary(field({ items: [field().items[1]] }))).toBe('Optional, up to $6.78 with HST')
  })

  it('says when the prices already include it', () => {
    expect(priceSummary(field({ items: [field().items[0]], taxMode: 'included' }))).toBe('Parents pay $25.00 (includes $2.88 HST)')
    expect(priceSummary(field({ taxMode: 'included' }))).toBe('Parents pay $25.00 to $41.00 (prices include HST)')
  })

  it('names two taxes', () => {
    const two = field({ items: [field().items[0], { id: 'q', label: 'Kit', amountCents: 1000, required: true, taxRateId: 'qst', tax: QST }] })
    expect(priceSummary(two)).toBe('Parents pay $39.25 ($35.00 + $3.25 HST + $1.00 QST)')
  })

  it('reads as before when nothing is taxed', () => {
    const plain = field({ items: field().items.map((i) => ({ ...i, taxRateId: null, tax: null })) })
    expect(priceSummary(plain)).toBe('Parents pay $25.00 to $41.00')
  })
})

describe('showing tax under the items', () => {
  const added: ChargeTax[] = [{ name: 'HST', rateMilli: 13000, cents: 325, included: false }]
  const included: ChargeTax[] = [{ name: 'HST', rateMilli: 13000, cents: 288, included: true }]

  it('adds Subtotal and a row per rate when tax is added', () => {
    expect(taxBreakdown(2825, added)).toEqual({
      hasTax: true, subtotalCents: 2500, addedRows: [{ label: 'HST (13%)', cents: 325 }], includedNote: null, totalCents: 2825,
    })
  })

  it('adds one line under the total when tax is included', () => {
    expect(taxBreakdown(2500, included)).toEqual({ hasTax: true, subtotalCents: 2500, addedRows: [], includedNote: 'Includes $2.88 HST', totalCents: 2500 })
  })

  it('shows nothing extra for an untaxed payment, or for tax that came to nothing', () => {
    const none = { hasTax: false, subtotalCents: 2500, addedRows: [], includedNote: null, totalCents: 2500 }
    expect(taxBreakdown(2500, [])).toEqual(none)
    expect(taxBreakdown(2500, undefined)).toEqual(none)
    expect(taxBreakdown(2500, [{ name: 'HST', rateMilli: 13000, cents: 0, included: false }])).toEqual(none)
  })

  it('words two taxes', () => {
    const two: ChargeTax[] = [{ name: 'PST', rateMilli: 7000, cents: 175, included: true }, { name: 'GST', rateMilli: 5000, cents: 110, included: true }]
    expect(includedNote(two)).toBe('Includes $1.75 PST and $1.10 GST')
    expect(taxNames(two)).toBe('PST and GST')
    expect(addedTaxParts([...added, { name: 'GST', rateMilli: 5000, cents: 125, included: false }])).toBe('$3.25 HST + $1.25 GST')
  })

  it('shows the ledger’s Tax column once the school has a rate or a row has tax', () => {
    expect(ledgerShowsTax(0, [{ taxCents: 0 }])).toBe(false)
    expect(ledgerShowsTax(0, null)).toBe(false)
    expect(ledgerShowsTax(1, [])).toBe(true)
    expect(ledgerShowsTax(0, [{ taxCents: 0 }, { taxCents: 325 }])).toBe(true)
  })
})

describe('payment requests with tax', () => {
  it('prices one student', () => {
    expect(requestPrice(3500, HST, 'added')).toMatchObject({ subtotalCents: 3500, taxAddedCents: 455, totalCents: 3955 })
    expect(requestPrice(3500, HST, 'included')).toMatchObject({ taxAddedCents: 0, totalCents: 3500 })
    expect(requestPrice(3500, null, 'added')).toEqual({ subtotalCents: 3500, taxes: [], taxAddedCents: 0, totalCents: 3500 })
  })

  it('words the amount per student', () => {
    expect(perStudentLabel({ amountCents: 3500 })).toBe('$35.00 per student')
    expect(perStudentLabel({ amountCents: 3500, taxPerStudentCents: 0, taxName: null, taxMode: 'added' })).toBe('$35.00 per student')
    expect(perStudentLabel({ amountCents: 3500, taxPerStudentCents: 455, taxName: 'HST', taxMode: 'added' })).toBe('$35.00 + $4.55 HST per student')
    expect(perStudentLabel({ amountCents: 3500, taxPerStudentCents: 403, taxName: 'HST', taxMode: 'included' })).toBe('$35.00 per student (includes $4.03 HST)')
  })

  it('says what each family pays under the tax choice', () => {
    expect(requestPriceLine(requestPrice(3500, HST, 'added'))).toBe('Each family pays $39.55 ($35.00 + $4.55 HST)')
    expect(requestPriceLine(requestPrice(3500, HST, 'included'))).toBe('Each family pays $35.00 (includes $4.03 HST)')
    expect(requestPriceLine(requestPrice(3500, null, 'added'))).toBeNull()
  })

  it('sends the tax fields only when there is something to say', () => {
    expect(requestTaxFields(null, { taxRateId: null, taxMode: 'added' })).toEqual({})
    expect(requestTaxFields(null, { taxRateId: 'hst', taxMode: 'included' })).toEqual({ taxRateId: 'hst', taxMode: 'included' })
    const untaxed = { taxRateId: null, taxMode: 'added' as const }
    expect(requestTaxFields(untaxed, { taxRateId: null, taxMode: 'added' })).toEqual({})
    expect(requestTaxFields(untaxed, { taxRateId: null, taxMode: 'included' })).toEqual({})
    expect(requestTaxFields(untaxed, { taxRateId: 'hst', taxMode: 'added' })).toEqual({ taxRateId: 'hst', taxMode: 'added' })
    const taxed = { taxRateId: 'hst', taxMode: 'added' as const }
    expect(requestTaxFields(taxed, { taxRateId: 'hst', taxMode: 'added' })).toEqual({})
    expect(requestTaxFields(taxed, { taxRateId: 'hst', taxMode: 'included' })).toEqual({ taxRateId: 'hst', taxMode: 'included' })
    expect(requestTaxFields(taxed, { taxRateId: null, taxMode: 'added' })).toEqual({ taxRateId: null, taxMode: 'added' })
  })
})

describe('cash for a student who never submitted the form', () => {
  it('says what is missing', () => {
    expect(officePaymentProblem({ studentId: null, totalCents: 2825, amountCents: 2825 })).toBe('Choose the student this payment is for.')
    expect(officePaymentProblem({ studentId: 's', totalCents: 0, amountCents: null })).toBe('Tick what the family is paying for.')
    expect(officePaymentProblem({ studentId: 's', totalCents: 2825, amountCents: null })).toBe('Enter the amount received.')
    expect(officePaymentProblem({ studentId: 's', totalCents: 2825, amountCents: 3000 })).toBe('That’s more than the $28.25 owed.')
    expect(officePaymentProblem({ studentId: 's', totalCents: 2825, amountCents: 1000 })).toBeNull()
  })

  it('finds the payment the student already has from the server’s refusal', () => {
    const refusal = Object.assign(new Error('This student already has a payment on this form. Open it to record the payment.'), {
      status: 409, code: 'ALREADY_ON_FORM', data: { chargeId: 'c1' },
    })
    expect(alreadyOnFormChargeId(refusal)).toBe('c1')
    expect(alreadyOnFormChargeId({ code: 'ALREADY_ON_FORM', data: null })).toBeNull()
    expect(alreadyOnFormChargeId({ code: 'HAS_PAYMENTS', data: { chargeId: 'c1' } })).toBeNull()
    expect(alreadyOnFormChargeId(new Error('nope'))).toBeNull()
    expect(alreadyOnFormChargeId(null)).toBeNull()
  })
})
