'use client'

import React from 'react'
import type { AnnouncementEmails, Receipt } from '@/services/types/announcement'
import { formatListStamp } from '@/components/messaging/formatters'

interface Props {
  seenCount: number
  audienceCount: number
  receipts: { seen: Receipt[]; notYet: Receipt[] }
  emails: AnnouncementEmails
  canRetry: boolean
  onRetry: () => void
}

const STATE_LABEL: Record<Receipt['state'], string> = {
  seen: 'seen',
  emailed: 'emailed',
  pending: 'email queued',
  invited: 'invited, not signed up',
  'no-account': 'no account, sign-up link sent',
  failed: 'email failed',
}

const Row: React.FC<{ r: Receipt }> = ({ r }) => (
  <li className="flex items-baseline justify-between gap-2 text-xs">
    <span className="min-w-0 truncate text-slate-700">
      {r.name}
      <span className="text-slate-400"> ({[r.studentNames.join(', '), r.relation].filter(Boolean).join(' · ')})</span>
    </span>
    <span
      className={`flex-shrink-0 ${
        r.state === 'failed' ? 'text-rose-600' : r.state === 'no-account' || r.state === 'invited' ? 'text-amber-700' : 'text-slate-400'
      }`}
    >
      {r.state === 'seen' && r.readAt ? formatListStamp(r.readAt) : STATE_LABEL[r.state]}
    </span>
  </li>
)

/** "Seen by 14 of 22 guardians" with who, and the email delivery line. */
const ReadReceipts: React.FC<Props> = ({ seenCount, audienceCount, receipts, emails, canRetry, onRetry }) => {
  const pct = audienceCount > 0 ? Math.round((seenCount / audienceCount) * 100) : 0
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-800">
          Seen by {seenCount} of {audienceCount} guardians
        </p>
        <span className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
          <span className="block h-full bg-gradient-to-r from-cyan-500 to-teal-500" style={{ width: `${pct}%` }} />
        </span>
        <span className="ml-auto text-xs text-slate-500">
          Emails: {emails.sent} sent
          {emails.pending > 0 && ` · ${emails.pending} queued`}
          {emails.signup + emails.invite > 0 && <span className="text-amber-700"> · {emails.signup + emails.invite} sign-up links</span>}
          {emails.failed > 0 && (
            <span className="text-rose-600">
              {' '}
              · {emails.failed} failed
              {canRetry && (
                <button type="button" onClick={onRetry} className="ml-1 underline cursor-pointer">
                  retry
                </button>
              )}
            </span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Seen</p>
          {receipts.seen.length === 0 ? (
            <p className="text-xs text-slate-400">Nobody yet</p>
          ) : (
            <ul className="space-y-1">
              {receipts.seen.map((r) => (
                <Row key={`${r.userId}-${r.name}`} r={r} />
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Not yet</p>
          {receipts.notYet.length === 0 ? (
            <p className="text-xs text-slate-400">Everyone has seen it</p>
          ) : (
            <ul className="space-y-1">
              {receipts.notYet.map((r) => (
                <Row key={`${r.userId}-${r.name}`} r={r} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export default ReadReceipts
