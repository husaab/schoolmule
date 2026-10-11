'use client'

import React from 'react'
import type { AnnouncementEmails, Receipt } from '@/services/types/announcement'
import { formatListStamp } from '@/components/messaging/formatters'

interface Props {
  seenCount: number
  audienceCount: number
  /** The author asked for "Got it": show the acknowledged column and count. */
  ackRequested: boolean
  ackCount: number
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

const Row: React.FC<{ r: Receipt; mode?: 'ack' | 'seen' }> = ({ r, mode = 'seen' }) => (
  <li className="flex items-baseline justify-between gap-2 text-xs">
    <span className="min-w-0 truncate text-slate-700">
      {r.name}
      <span className="text-slate-400"> ({[r.studentNames.join(', '), r.relation].filter(Boolean).join(' · ')})</span>
    </span>
    <span
      className={`flex-shrink-0 ${
        mode === 'ack' ? 'text-emerald-700' : r.state === 'failed' ? 'text-rose-600' : r.state === 'no-account' || r.state === 'invited' ? 'text-amber-700' : 'text-slate-400'
      }`}
    >
      {mode === 'ack' && r.ackedAt ? formatListStamp(r.ackedAt) : r.state === 'seen' && r.readAt ? `seen ${formatListStamp(r.readAt)}` : STATE_LABEL[r.state]}
    </span>
  </li>
)

const Column: React.FC<{ title: string; titleClass?: string; rows: Receipt[]; empty: string; mode?: 'ack' | 'seen' }> = ({ title, titleClass = 'text-slate-400', rows, empty, mode }) => (
  <div>
    <p className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wider ${titleClass}`}>
      {title} · {rows.length}
    </p>
    {rows.length === 0 ? (
      <p className="text-xs text-slate-400">{empty}</p>
    ) : (
      <ul className="space-y-1">
        {rows.map((r) => (
          <Row key={`${r.userId}-${r.name}`} r={r} mode={mode} />
        ))}
      </ul>
    )}
  </div>
)

/** "Seen by 14 of 22 guardians" (and "Acknowledged 9 of 22" when asked for) with who, and the email delivery line. */
const ReadReceipts: React.FC<Props> = ({ seenCount, audienceCount, ackRequested, ackCount, receipts, emails, canRetry, onRetry }) => {
  const pct = audienceCount > 0 ? Math.round((seenCount / audienceCount) * 100) : 0
  const ackPct = audienceCount > 0 ? Math.round((ackCount / audienceCount) * 100) : 0
  const acked = receipts.seen.filter((r) => r.ackedAt)
  const seenOnly = receipts.seen.filter((r) => !r.ackedAt)
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-800">
          Seen by {seenCount} of {audienceCount} guardians
        </p>
        <span className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
          <span className="block h-full bg-gradient-to-r from-cyan-500 to-teal-500" style={{ width: `${pct}%` }} />
        </span>
        {ackRequested && (
          <>
            <p className="text-sm font-medium text-slate-800">
              Acknowledged {ackCount} of {audienceCount}
            </p>
            <span className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
              <span className="block h-full bg-emerald-500" style={{ width: `${ackPct}%` }} />
            </span>
          </>
        )}
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
      {ackRequested ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-3">
          <Column title="Acknowledged" titleClass="text-emerald-700" rows={acked} empty="Nobody yet" mode="ack" />
          <Column title="Seen, not acknowledged" titleClass="text-cyan-700" rows={seenOnly} empty="Nobody" />
          <Column title="Not yet" rows={receipts.notYet} empty="Everyone has seen it" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-2">
          <Column title="Seen" rows={receipts.seen} empty="Nobody yet" />
          <Column title="Not yet" rows={receipts.notYet} empty="Everyone has seen it" />
        </div>
      )}
    </section>
  )
}

export default ReadReceipts
