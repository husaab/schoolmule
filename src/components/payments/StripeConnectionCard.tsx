'use client'

// The school's Stripe connection in every state it can be in: never connected,
// part-way through Stripe's sign-up, in review, active, paused by Stripe, or
// turned off here. The words come from lib/paymentsConnection.

import React from 'react'
import { ArrowTopRightOnSquareIcon, CheckIcon, CreditCardIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { connectionCopy, payoutsPaused, type ConnectionTone } from '@/lib/paymentsConnection'
import type { PaymentsConnection } from '@/services/types/payments'

interface StripeConnectionCardProps {
  connection: PaymentsConnection | null
  /** Waiting for the link to Stripe's sign-up. */
  connecting: boolean
  /** Re-reading the account from Stripe. */
  checking: boolean
  onConnect: () => void
  onCheck: () => void
  onDisconnect: () => void
}

const primaryButton =
  'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2'

const secondaryButton =
  'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'

const BADGE: Record<ConnectionTone, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
}

const POINTS = [
  'Parents pay by card, Apple Pay or Google Pay',
  'Payouts go to your school’s own bank account',
  'Stripe’s sign-up asks for your school’s details and bank account',
]

const STRIPE_DASHBOARD = 'https://dashboard.stripe.com/'

const StripeConnectionCard: React.FC<StripeConnectionCardProps> = ({ connection, connecting, checking, onConnect, onCheck, onDisconnect }) => {
  const copy = connectionCopy(connection)
  const account = connection?.account ?? null
  const settingUp = copy.state === 'not_connected' || copy.state === 'onboarding'
  // Nothing can be asked of Stripe while the server has no key.
  const hasAccount = Boolean(account) && copy.state !== 'disconnected' && copy.state !== 'unavailable'

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm">
          <CreditCardIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{copy.title}</h2>
            {copy.badge && (
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE[copy.badge.tone]}`}>{copy.badge.label}</span>
            )}
            {connection?.mode === 'test' && (
              <span className="rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs font-medium text-slate-600" title="No real money moves in test mode">
                Test mode
              </span>
            )}
          </div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">{copy.description}</p>

          {settingUp && (
            <ul className="mt-3 space-y-1.5">
              {POINTS.map((p) => (
                <li key={p} className="flex gap-2 text-sm text-slate-600">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {p}
                </li>
              ))}
            </ul>
          )}

          {payoutsPaused(account) && (
            <p role="status" className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              Payouts to your bank are on hold until Stripe has what it needs. Open Stripe to see what is missing.
            </p>
          )}

          {copy.state !== 'unavailable' && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <LockClosedIcon className="h-3.5 w-3.5 shrink-0" />
              Card details are handled by Stripe. SchoolMule never sees or stores them.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {copy.action && (
              <button type="button" onClick={onConnect} disabled={connecting} className={primaryButton}>
                {connecting ? 'Opening Stripe…' : copy.action}
              </button>
            )}
            {hasAccount && (
              <button type="button" onClick={onCheck} disabled={checking} className={secondaryButton}>
                {checking ? 'Checking…' : 'Check again'}
              </button>
            )}
            {(copy.state === 'active' || copy.state === 'restricted') && (
              <a href={STRIPE_DASHBOARD} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
                Open Stripe
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            )}
            {hasAccount && (
              <button
                type="button"
                onClick={onDisconnect}
                className="ml-auto rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                Turn off payments
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StripeConnectionCard
