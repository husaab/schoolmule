'use client'

// What taking payments costs a school, said before it connects: Stripe's card
// fee, a worked example, and what happens to the fee on a refund.

import React from 'react'
import { CARD_FEE_FIXED_CENTS, CARD_FEE_PERCENT, cardFeeCents, formatCents } from '@/lib/paymentsConnection'

const EXAMPLE_CENTS = 2500

const PaymentsCostCard: React.FC = () => {
  const fee = cardFeeCents(EXAMPLE_CENTS)
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">What it costs</h2>
      <p className="mt-2 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">{CARD_FEE_PERCENT}% + {formatCents(CARD_FEE_FIXED_CENTS)}</span> per card payment, charged by Stripe.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        On a {formatCents(EXAMPLE_CENTS)} trip fee your school receives{' '}
        <span className="font-semibold text-slate-900">{formatCents(EXAMPLE_CENTS - fee)}</span>. SchoolMule adds no fee.
      </p>
      <ul className="mt-3 space-y-1 text-xs text-slate-500">
        <li>Stripe keeps its fee when you refund a payment.</li>
        <li>Cards from outside Canada cost a little more.</li>
        <li>Your first payout arrives 7 to 14 days after your first payment.</li>
      </ul>
    </div>
  )
}

export default PaymentsCostCard
