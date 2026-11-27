'use client';

// Finance → Payments, below the Stripe card: what families owe and have paid,
// from forms and payment requests. Summary tiles, then five tabs: Overview
// (months, each form and request, latest activity), Payments (the list:
// filter, search, page, export), Requests (ask families to pay), Payouts to
// the school's bank, and Settings (tax rates and the tax number). A payment
// opens the charge, where the office records, waives and refunds; a request
// opens the request. The list's Tax column and filter appear once the school
// has set up tax.

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownTrayIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import StatTile from '@/components/ui/StatTile';
import EmptyState from '@/components/ui/EmptyState';
import { useNotificationStore } from '@/store/useNotificationStore';
import { downloadChargesCsv, getPaymentSettings, getPaymentsOverview, getPaymentsSummary, getPayouts, listCharges } from '@/services/paymentsService';
import type { Charge, ChargeListFilters, ChargeListStatus, PaymentSettings, PaymentsOverview as Overview, PaymentsSummary, PayoutsData } from '@/services/types/payments';
import { formatCents, paidWith } from '@/lib/paymentField';
import { gradeLabel } from '@/lib/paymentRequests';
import { ledgerShowsTax } from '@/lib/paymentTax';
import { errorMessage } from '@/components/finance/format';
import PaymentChip from './PaymentChip';
import ChargeDetailModal from './ChargeDetailModal';
import PaymentsOverview from './PaymentsOverview';
import PaymentRequestsList from './PaymentRequestsList';
import PaymentRequestDetailModal from './PaymentRequestDetailModal';
import PaymentSettingsPanel from './PaymentSettingsPanel';
import { BanknotesIcon } from '@heroicons/react/24/outline';

type Tab = 'overview' | 'payments' | 'requests' | 'payouts' | 'settings';
const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'payments', label: 'Payments' },
  { value: 'requests', label: 'Requests' },
  { value: 'payouts', label: 'Payouts' },
  { value: 'settings', label: 'Settings' },
];

const SOURCE_FILTERS: { value: '' | 'form' | 'request'; label: string }[] = [
  { value: '', label: 'All sources' },
  { value: 'form', label: 'Forms' },
  { value: 'request', label: 'Requests' },
];

// "All" reads as "All sources" beside the source filter, so it says what it covers.
const TAX_FILTERS: { value: '' | 'taxed' | 'untaxed'; label: string }[] = [
  { value: '', label: 'Taxed or untaxed' },
  { value: 'taxed', label: 'Taxed' },
  { value: 'untaxed', label: 'Untaxed' },
];

const filterSelect = 'rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500';

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
  /** Whether card payments are on right now (connected and active). */
  online: boolean;
}

export default function PaymentsLedger({ stripeConnected, online }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [rows, setRows] = useState<Charge[] | null>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ChargeListStatus | ''>('');
  const [source, setSource] = useState<'' | 'form' | 'request'>('');
  const [taxFilter, setTaxFilter] = useState<'' | 'taxed' | 'untaxed'>('');
  // The school's tax rates and tax number (the Settings tab, and whether the list shows tax).
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsKey, setSettingsKey] = useState(0);
  // A form picked on the Overview: the list shows only its payments.
  const [scope, setScope] = useState<{ formId: string; title: string } | null>(null);
  const [openRequest, setOpenRequest] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<PayoutsData | null>(null);
  const [payoutsError, setPayoutsError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const limit = 25;

  const filters: ChargeListFilters = { status: status || null, q: search || null, source: source || null, tax: taxFilter || null, formId: scope?.formId || null };

  const loadSummary = useCallback(async () => {
    try {
      setSummary((await getPaymentsSummary()).data);
    } catch {
      // The tiles stay as they were; the tab below says what failed.
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setOverviewError(null);
    try {
      const res = await getPaymentsOverview();
      setOverview(res.data);
      setSummary(res.data.summary);
    } catch (err) {
      setOverviewError(errorMessage(err, 'Could not load the overview'));
    }
  }, []);

  const loadList = useCallback(async () => {
    setError(null);
    try {
      const list = await listCharges({ status: status || null, q: search || null, source: source || null, tax: taxFilter || null, formId: scope?.formId || null, page, limit });
      setRows(list.data);
      setTotal(list.pagination.total);
    } catch (err) {
      setError(errorMessage(err, 'Could not load payments'));
    }
  }, [status, search, source, taxFilter, scope, page]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => {
    let live = true;
    getPaymentSettings()
      .then((res) => { if (live) { setSettings(res.data); setSettingsError(null); } })
      .catch((err) => { if (live) setSettingsError(errorMessage(err, 'Could not load your payment settings')); });
    return () => { live = false; };
  }, [settingsKey]);
  useEffect(() => { if (tab === 'overview') loadOverview(); }, [tab, loadOverview, reloadKey]);
  useEffect(() => { if (tab === 'payments') loadList(); }, [tab, loadList, reloadKey]);

  /** After a change anywhere (a charge, a request): every view reloads when next shown. */
  const changed = () => {
    setReloadKey((k) => k + 1);
    loadSummary();
  };

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
      await downloadChargesCsv(filters);
    } catch (err) {
      showNotification(errorMessage(err, 'Could not export'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / limit));
  // Rates removed since still count: their payments are in the list.
  const showsTax = ledgerShowsTax(settings?.taxRates.length ?? 0, rows);
  const taxCollected = summary?.taxCollectedThisMonthCents ?? 0;
  const filtered = Boolean(status || search || source || scope || taxFilter);

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Collected this month"
          value={summary ? formatCents(summary.collectedThisMonthCents) : '—'}
          sub={taxCollected > 0 ? `includes ${formatCents(taxCollected)} tax` : undefined}
          loading={!summary}
          tone="good"
        />
        <StatTile label="Still owed" value={summary ? formatCents(summary.outstandingCents) : '—'} sub={summary ? `${summary.outstandingCount} ${summary.outstandingCount === 1 ? 'payment' : 'payments'}` : undefined} loading={!summary} tone={summary && summary.outstandingCents > 0 ? 'warn' : 'neutral'} />
        <StatTile label="Refunded this month" value={summary ? formatCents(summary.refundedThisMonthCents) : '—'} loading={!summary} />
        <StatTile label="Open disputes" value={summary ? summary.openDisputes : '—'} loading={!summary} tone={summary && summary.openDisputes > 0 ? 'bad' : 'neutral'} />
      </div>

      <div className="flex gap-5 overflow-x-auto border-b border-slate-200" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`-mb-px shrink-0 border-b-2 px-0.5 pb-2 text-sm font-medium transition-colors ${tab === t.value ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <PaymentsOverview
          overview={overview}
          error={overviewError}
          onOpenRequest={setOpenRequest}
          onOpenForm={(formId, title) => { setScope({ formId, title }); setSource(''); setStatus(''); setPage(1); setTab('payments'); }}
          onOpenCharge={setOpen}
        />
      ) : tab === 'requests' ? (
        <PaymentRequestsList online={online} onOpen={setOpenRequest} reloadKey={reloadKey} />
      ) : tab === 'settings' ? (
        <PaymentSettingsPanel settings={settings} error={settingsError} onRetry={() => setSettingsKey((k) => k + 1)} onChange={setSettings} />
      ) : tab === 'payments' ? (
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
            {scope ? (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-cyan-50 py-1 pl-3 pr-1.5 text-xs font-medium text-cyan-800 ring-1 ring-cyan-200">
                <span className="truncate">{scope.title}</span>
                <button type="button" onClick={() => { setScope(null); setPage(1); }} aria-label="Show every form and request" className="rounded-full p-0.5 hover:bg-cyan-100">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <select
                value={source}
                onChange={(e) => { setSource(e.target.value as typeof source); setPage(1); }}
                aria-label="Source"
                className={filterSelect}
              >
                {SOURCE_FILTERS.map((f) => <option key={f.value || 'all'} value={f.value}>{f.label}</option>)}
              </select>
            )}
            {(showsTax || taxFilter) && (
              <select
                value={taxFilter}
                onChange={(e) => { setTaxFilter(e.target.value as typeof taxFilter); setPage(1); }}
                aria-label="Tax"
                className={filterSelect}
              >
                {TAX_FILTERS.map((f) => <option key={f.value || 'all'} value={f.value}>{f.label}</option>)}
              </select>
            )}
            <div className="relative sm:ml-auto sm:w-64">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, form or email" aria-label="Search payments" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
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
              title={filtered ? 'No payments match' : 'No payments yet'}
              description={filtered ? 'Try another filter or search.' : 'Send a payment request, or add a Payment field to a form. What families pay shows here.'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">For</th>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      {showsTax && <th className="px-5 py-3 text-right">Tax</th>}
                      <th className="px-5 py-3">Paid with</th>
                      <th className="px-5 py-3 text-right">Stripe fee</th>
                      <th className="px-5 py-3 text-right">Still owed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.chargeId} onClick={() => setOpen(c.chargeId)} className="cursor-pointer border-b border-slate-50 hover:bg-cyan-50/30">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">{day(c.createdAt)}</td>
                        <td className="max-w-[220px] truncate px-5 py-3 font-medium text-slate-900">{c.formTitle || c.requestTitle || c.description}</td>
                        <td className="max-w-[180px] truncate px-5 py-3 text-slate-700">
                          {c.studentName ? <>{c.studentName}<span className="ml-1 text-xs text-slate-400">{gradeLabel(c.studentGrade)}</span></> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="max-w-[200px] truncate px-5 py-3 text-slate-600">{c.payerEmail}</td>
                        <td className="px-5 py-3"><PaymentChip status={c.status} offline={c.chosenMethod === 'offline'} disputeStatus={c.disputeStatus} /></td>
                        <td className="px-5 py-3 text-right text-slate-900">{formatCents(c.amountCents)}</td>
                        {showsTax && (
                          <td className="px-5 py-3 text-right text-slate-600">{c.taxCents ? formatCents(c.taxCents) : <span className="text-slate-300">—</span>}</td>
                        )}
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

      <ChargeDetailModal chargeId={open} onClose={() => setOpen(null)} onChanged={changed} taxContext={showsTax} />
      <PaymentRequestDetailModal requestId={openRequest} online={online} onClose={() => setOpenRequest(null)} onChanged={changed} taxContext={showsTax} />
    </section>
  );
}
