'use client'

// Parent portal → Payments: what the family owes the school, across its
// children, and what it paid in the last year. Each entry opens the family's
// own payment page, the same one their emails link to. Switched off for now
// (src/lib/parentPayments.ts).

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { BanknotesIcon, CheckCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import Spinner from '@/components/Spinner'
import { getParentPayments } from '@/services/parentPaymentsService'
import type { ParentPaymentEntry, ParentPayments } from '@/services/types/payments'
import { PARENT_PAYMENTS_ENABLED, entryStatusLabel, overdueCount } from '@/lib/parentPayments'
import { dueStatus, formatDay } from '@/lib/paymentRequests'
import { formatCents } from '@/lib/paymentField'
import { errorMessage } from '@/components/finance/format'

const DUE_TONE = { neutral: 'text-slate-500', soon: 'text-amber-700', overdue: 'text-rose-700' } as const

function OwingRow({ e }: { e: ParentPaymentEntry }) {
  const due = dueStatus(e.dueDate)
  return (
    <li>
      <Link href={e.payPath} className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/40">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">{e.title}</p>
          <p className="text-sm text-slate-500">
            {[e.studentName, due ? <span key="due" className={DUE_TONE[due.tone]}>{due.label}</span> : null]
              .filter(Boolean)
              .reduce<React.ReactNode[]>((acc, part, i) => (i === 0 ? [part] : [...acc, ' · ', part]), [])}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold tabular-nums text-slate-900">{formatCents(e.balanceCents)}</p>
          <p className="text-xs font-medium text-cyan-700">{e.canPayOnline ? 'Pay now' : 'View'}</p>
        </div>
        <ChevronRightIcon className="h-4 w-4 text-slate-300" />
      </Link>
    </li>
  )
}

export default function ParentPaymentsPage() {
  const [data, setData] = useState<ParentPayments | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!PARENT_PAYMENTS_ENABLED) return
    getParentPayments().then((r) => setData(r.data)).catch((err) => setError(errorMessage(err, 'Could not load your payments')))
  }, [])

  if (!PARENT_PAYMENTS_ENABLED) {
    return (
      <ParentPageShell title="Payments">
        <ParentEmptyState icon={BanknotesIcon} title="Not available yet" message="Your school will let you know when you can see and pay school fees here." />
      </ParentPageShell>
    )
  }

  const overdue = data ? overdueCount(data.owing) : 0

  return (
    <ParentPageShell title="Payments" subtitle="What you owe the school, and what you’ve paid">
      {error ? (
        <p role="alert" className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700">{error}</p>
      ) : !data ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          <div className={`rounded-2xl border p-6 ${data.totalOwingCents > 0 ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-emerald-100 bg-emerald-50'}`}>
            {data.totalOwingCents > 0 ? (
              <>
                <p className="text-sm font-medium text-amber-800">To pay</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{formatCents(data.totalOwingCents)}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {data.owing.length} {data.owing.length === 1 ? 'payment' : 'payments'}{overdue > 0 ? `, ${overdue} overdue` : ''}
                </p>
              </>
            ) : (
              <p className="flex items-center gap-2 text-base font-semibold text-emerald-800">
                <CheckCircleIcon className="h-6 w-6" /> You’re all paid up
              </p>
            )}
          </div>

          {data.owing.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
              <h2 className="border-b border-stone-100 px-5 py-3 text-sm font-semibold text-slate-900">To pay</h2>
              <ul className="divide-y divide-stone-100">
                {data.owing.map((e) => <OwingRow key={e.chargeId} e={e} />)}
              </ul>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
            <h2 className="border-b border-stone-100 px-5 py-3 text-sm font-semibold text-slate-900">Paid this year</h2>
            {data.history.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">Nothing yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {data.history.map((e) => (
                  <li key={e.chargeId}>
                    <Link href={e.payPath} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{e.title}</p>
                        <p className="text-xs text-slate-500">{[e.studentName, e.paidAt ? formatDay(e.paidAt.slice(0, 10)) : null].filter(Boolean).join(' · ')}</p>
                      </div>
                      <span className="text-xs font-medium text-emerald-700">{entryStatusLabel(e.status)}</span>
                      <span className="w-20 text-right text-sm tabular-nums text-slate-700">{formatCents(e.amountPaidCents - e.amountRefundedCents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </ParentPageShell>
  )
}
