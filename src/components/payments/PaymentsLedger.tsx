'use client';

// Finance → Payments, below the Stripe card: what families owe and have paid
// across every form. Summary tiles, the list (filter, search, page, export),
// and the payouts Stripe has sent to the school's bank. A row opens the
// charge, where the office records, waives and refunds.

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import StatTile from '@/components/ui/StatTile';
import EmptyState from '@/components/ui/EmptyState';
import { useNotificationStore } from '@/store/useNotificationStore';
import { downloadChargesCsv, getPaymentsSummary, getPayouts, listCharges } from '@/services/paymentsService';
import type { Charge, ChargeListStatus, PaymentsSummary, PayoutsData } from '@/services/types/payments';
import { formatCents, paidWith } from '@/lib/paymentField';
import { errorMessage } from '@/components/finance/format';
import PaymentChip from './PaymentChip';
import ChargeDetailModal from './ChargeDetailModal';
import { BanknotesIcon } from '@heroicons/react/24/outline';

const STATUS_FILTERS: { value: ChargeListStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'waived', label: 'Waived' },
  { value: 'refunded', label: 'Refunded' },
];

const PAYOUT_STATUS: Record<string, string> = { paid: 'Paid', pending: 'Pending', in_transit: 'On its way', canceled: 'Cancelled', failed: 'Failed' };

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

interface Props {
  /** Whether Stripe is connected here (payouts only exist then). */
  stripeConnected: boolean;
}

export default function PaymentsLedger({ stripeConnected }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [tab, setTab] = useState<'payments' | 'payouts'>('payments');
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [rows, setRows] = useState<Charge[] | null>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ChargeListStatus | ''>('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<PayoutsData | null>(null);
  const [payoutsError, setPayoutsError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const limit = 25;

  const loadList = useCallback(async () => {
    setError(null);
    try {
      const [list, sum] = await Promise.all([
        listCharges({ status: status || null, q: search || null, page, limit }),
        getPaymentsSummary(),
      ]);
      setRows(list.data);
      setTotal(list.pagination.total);
      setSummary(sum.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load payments'));
    }
  }, [status, search, page]);

  useEffect(() => { loadList(); }, [loadList]);

  // Search as you stop typing.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (tab !== 'payouts' || payouts || !stripeConnected) return;
    getPayouts().then((r) => setPayouts(r.data)).catch((err) => setPayoutsError(errorMessage(err, 'Could not load payouts')));
  }, [tab, payouts, stripeConnected]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadChargesCsv({ status: status || null, q: search || null });
    } catch (err) {
      showNotification(errorMessage(err, 'Could not export'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Collected this month" value={summary ? formatCents(summary.collectedThisMonthCents) : '—'} loading={!summary} tone="good" />
        <StatTile label="Still owed" value={summary ? formatCents(summary.outstandingCents) : '—'} sub={summary ? `${summary.outstandingCount} ${summary.outstandingCount === 1 ? 'payment' : 'payments'}` : undefined} loading={!summary} tone={summary && summary.outstandingCents > 0 ? 'warn' : 'neutral'} />
        <StatTile label="Refunded this month" value={summary ? formatCents(summary.refundedThisMonthCents) : '—'} loading={!summary} />
        <StatTile label="Open disputes" value={summary ? summary.openDisputes : '—'} loading={!summary} tone={summary && summary.openDisputes > 0 ? 'bad' : 'neutral'} />
      </div>

      <div className="flex gap-5 border-b border-slate-200" role="tablist">
        {(['payments', 'payouts'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-0.5 pb-2 text-sm font-medium transition-colors ${tab === t ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'payments' ? 'Payments' : 'Payouts'}
          </button>
        ))}
      </div>

      {tab === 'payments' ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value || 'all'}
                  onClick={() => { setStatus(f.value); setPage(1); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${status === f.value ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto sm:w-64">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search form or email" aria-label="Search payments" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <button onClick={exportCsv} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <ArrowDownTrayIcon className="h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>

          {error ? (
            <p role="alert" className="p-6 text-sm text-rose-600">{error}</p>
          ) : !rows ? (
            <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" /></div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={BanknotesIcon}
              title={status || search ? 'No payments match' : 'No payments yet'}
              description={status || search ? 'Try another filter or search.' : 'Add a Payment field to a form. What families pay through it shows here.'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">For</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3">Paid with</th>
                      <th className="px-5 py-3 text-right">Stripe fee</th>
                      <th className="px-5 py-3 text-right">Still owed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.chargeId} onClick={() => setOpen(c.chargeId)} className="cursor-pointer border-b border-slate-50 hover:bg-cyan-50/30">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">{day(c.createdAt)}</td>
                        <td className="max-w-[220px] truncate px-5 py-3 font-medium text-slate-900">{c.formTitle || c.description}</td>
                        <td className="max-w-[200px] truncate px-5 py-3 text-slate-600">{c.payerEmail}</td>
                        <td className="px-5 py-3"><PaymentChip status={c.status} offline={c.chosenMethod === 'offline'} disputeStatus={c.disputeStatus} /></td>
                        <td className="px-5 py-3 text-right text-slate-900">{formatCents(c.amountCents)}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">{paidWith(c.lastPayment)}</td>
                        <td className="px-5 py-3 text-right text-slate-500">{c.stripeFeeCents ? formatCents(c.stripeFeeCents) : ''}</td>
                        <td className="px-5 py-3 text-right text-slate-900">{c.balanceCents ? formatCents(c.balanceCents) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-xs text-slate-500">
                <span>{total} {total === 1 ? 'payment' : 'payments'}</span>
                {pages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-40">Previous</button>
                    <span>Page {page} of {pages}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= pages} className="rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-40">Next</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!stripeConnected ? (
            <p className="text-sm text-slate-500">Connect Stripe to see payouts to your bank.</p>
          ) : payoutsError ? (
            <p role="alert" className="text-sm text-rose-600">{payoutsError}</p>
          ) : !payouts ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" /></div>
          ) : (
            <div className="space-y-4">
              {payouts.balance && (
                <p className="text-sm text-slate-600">
                  In your Stripe balance: <span className="font-semibold text-slate-900">{formatCents(payouts.balance.availableCents)}</span> ready to pay out,{' '}
                  <span className="font-semibold text-slate-900">{formatCents(payouts.balance.pendingCents)}</span> still clearing.
                </p>
              )}
              {payouts.payouts.length === 0 ? (
                <p className="text-sm text-slate-500">No payouts yet. Stripe sends your first one 7 to 14 days after your first payment.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {payouts.payouts.map((p) => (
                    <li key={p.payoutId} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-slate-700">{p.status === 'paid' ? 'Arrived' : 'Arrives'} {day(p.arrivalDate)}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{PAYOUT_STATUS[p.status] || p.status}</span>
                        <span className="font-medium tabular-nums text-slate-900">{formatCents(p.amountCents)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-500">Each payout’s payments are listed in your Stripe Dashboard under Balances.</p>
            </div>
          )}
        </div>
      )}

      <ChargeDetailModal chargeId={open} onClose={() => setOpen(null)} onChanged={() => loadList()} />
    </section>
  );
}
