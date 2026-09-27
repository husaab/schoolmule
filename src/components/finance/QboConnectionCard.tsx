'use client'

// Shown in place of an empty grid until QuickBooks is connected.

import React from 'react'
import { BanknotesIcon, CheckIcon, LockClosedIcon } from '@heroicons/react/24/outline'

interface QboConnectionCardProps {
  needsReconnect: boolean
  connecting: boolean
  onConnect: () => void
}

const primaryButton =
  'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2'

const POINTS = [
  'Every family’s invoices and payments by month, next to their students',
  'Who is overdue, by how many days, and what the subsidy still owes',
  'Refreshes automatically; Sync now pulls the latest on demand',
]

const QboConnectionCard: React.FC<QboConnectionCardProps> = ({ needsReconnect, connecting, onConnect }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm">
          <BanknotesIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {needsReconnect ? 'Reconnect QuickBooks' : 'Connect QuickBooks Online'}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            {needsReconnect
              ? 'QuickBooks access expired or was revoked, so this page is showing the last synced data. Sign in again to resume syncing.'
              : 'Sign in with the QuickBooks company you invoice tuition from. SchoolMule reads your customers, invoices and payments to build this page.'}
          </p>
          <ul className="mt-3 space-y-1.5">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-slate-600">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <LockClosedIcon className="h-3.5 w-3.5" />
            Read-only: SchoolMule never creates, edits or sends anything in QuickBooks.
          </p>
        </div>
      </div>
      <button type="button" onClick={onConnect} disabled={connecting} className={`${primaryButton} self-start md:self-center`}>
        {connecting ? 'Opening QuickBooks…' : needsReconnect ? 'Reconnect QuickBooks' : 'Connect QuickBooks'}
      </button>
    </div>
  </div>
)

export default QboConnectionCard
