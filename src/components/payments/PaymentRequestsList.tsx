'use client';

// Finance → Payments → Requests: everything the office has asked families to
// pay outside a form, with how far along each one is. New request opens the
// editor; a row opens the request.

import React, { useEffect, useState } from 'react';
import { ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/shared/modalKit';
import { useNotificationStore } from '@/store/useNotificationStore';
import { listPaymentRequests } from '@/services/paymentsService';
import type { PaymentRequest } from '@/services/types/payments';
import { dueStatus, settledPercent } from '@/lib/paymentRequests';
import { formatCents } from '@/lib/paymentField';
import { errorMessage } from '@/components/finance/format';
import PaymentRequestEditor from './PaymentRequestEditor';

const DUE_TONE = {
  neutral: 'bg-slate-100 text-slate-600',
  soon: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  overdue: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
} as const;

interface Props {
  online: boolean;
  /** Opens a request (the ledger owns the detail modal so the overview can open it too). */
  onOpen: (requestId: string) => void;
  /** Bumped by the ledger after a change elsewhere, to reload. */
  reloadKey: number;
}

export default function PaymentRequestsList({ online, onOpen, reloadKey }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<PaymentRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Bumped here after a new request; reloadKey is bumped by the ledger.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    listPaymentRequests()
      .then((res) => { if (live) { setRows(res.data); setError(null); } })
      .catch((err) => { if (live) setError(errorMessage(err, 'Could not load requests')); });
    return () => { live = false; };
  }, [reloadKey, tick]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-900">Payment requests</h2>
          <p className="text-xs text-slate-500">Ask a grade, a class or chosen students to pay. Each family gets an email with their own link.</p>
        </div>
        <Button onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" />New request</Button>
      </div>

      {error ? (
        <p role="alert" className="p-6 text-sm text-rose-600">{error}</p>
      ) : !rows ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" /></div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardDocumentListIcon}
          title="No requests yet"
          description="A trip, books, a uniform: send families a request to pay, without making a form."
          action={<Button onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" />New request</Button>}
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => {
            const pct = settledPercent(r.stats);
            const due = r.stats.open > 0 ? dueStatus(r.dueDate) : null;
            return (
              <li key={r.requestId}>
                <button type="button" onClick={() => onOpen(r.requestId)} className="flex w-full flex-col gap-2 px-5 py-4 text-left hover:bg-cyan-50/30 sm:flex-row sm:items-center sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-slate-900">{r.title}</span>
                      {due && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${DUE_TONE[due.tone]}`}>{due.label}</span>}
                      {r.stats.open === 0 && r.stats.students > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">All settled</span>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatCents(r.amountCents)} per student · {r.stats.students} {r.stats.students === 1 ? 'student' : 'students'}
                    </p>
                  </div>
                  <div className="w-full sm:w-56">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{r.stats.settled} of {r.stats.students} settled</span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-left tabular-nums sm:w-32 sm:text-right">
                    <div className="text-sm font-semibold text-slate-900">{formatCents(r.stats.collectedCents)}</div>
                    <div className="text-xs text-slate-500">of {formatCents(r.stats.expectedCents)}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <PaymentRequestEditor
        isOpen={creating}
        online={online}
        onClose={() => setCreating(false)}
        onSaved={(r) => {
          setCreating(false);
          setTick((t) => t + 1);
          const sent = r.charges.filter((c) => c.linkSentAt).length;
          showNotification(sent > 0 ? `Request sent to ${sent} ${sent === 1 ? 'family' : 'families'}` : 'Request created', 'success');
          onOpen(r.requestId);
        }}
      />
    </div>
  );
}
