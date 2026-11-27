'use client';

// Finance → Payments → Overview: money in over the last six months (card and
// office), every form and request with how far along it is, and the latest
// payments. A collection opens its request, or the list filtered to its form;
// an activity row opens that payment.

import React, { useState } from 'react';
import { ArrowUturnLeftIcon, BanknotesIcon, CreditCardIcon, DocumentTextIcon, ClipboardDocumentListIcon, GiftIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/ui/EmptyState';
import type { PaymentsActivity, PaymentsCollection, PaymentsOverview as Overview } from '@/services/types/payments';
import { dueStatus, monthIn, monthShort, monthsPeak, settledPercent } from '@/lib/paymentRequests';
import { formatCents, paymentKindLabel } from '@/lib/paymentField';

// Series colours (validated together for colour-blind separation): card, office.
const CARD = '#0891b2';
const OFFICE = '#f59e0b';

const when = (iso: string) => new Date(iso).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

interface Props {
  overview: Overview | null;
  error: string | null;
  onOpenRequest: (requestId: string) => void;
  onOpenForm: (formId: string, title: string) => void;
  onOpenCharge: (chargeId: string) => void;
}

function MonthsChart({ months }: { months: Overview['months'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const peak = monthsPeak(months);
  const H = 140;
  const total = months.reduce((s, m) => s + monthIn(m), 0);
  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <figcaption>
          <h2 className="text-sm font-semibold text-slate-900">Money in, last six months</h2>
          <p className="text-xs text-slate-500">{formatCents(total)} in all, before refunds</p>
        </figcaption>
        <div className="flex items-center gap-4 text-xs text-slate-600" aria-hidden="true">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CARD }} />Card</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: OFFICE }} />At the office</span>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-6 items-end gap-2" style={{ height: H + 36 }} aria-hidden="true">
        {months.map((m, i) => {
          const card = Math.round((m.cardCents / peak) * H);
          const office = Math.round((m.officeCents / peak) * H);
          const value = monthIn(m);
          return (
            <div
              key={m.month}
              className="relative flex h-full flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 w-max rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                  <p className="font-semibold text-slate-900">{monthShort(m.month)}: {formatCents(value)}</p>
                  <p className="text-slate-600">Card {formatCents(m.cardCents)} · Office {formatCents(m.officeCents)}</p>
                  {m.refundedCents > 0 && <p className="text-slate-600">Refunded {formatCents(m.refundedCents)}</p>}
                  {m.stripeFeeCents > 0 && <p className="text-slate-500">Stripe fees {formatCents(m.stripeFeeCents)}</p>}
                </div>
              )}
              <span className="mb-1 text-[11px] tabular-nums text-slate-600">{value > 0 ? formatCents(value).replace(/\.00$/, '') : ''}</span>
              <div className="flex w-full max-w-[24px] flex-col items-stretch gap-[2px]">
                {office > 0 && <div className="rounded-t-[4px]" style={{ height: Math.max(office, 2), background: OFFICE }} />}
                {card > 0 && <div className={office > 0 ? '' : 'rounded-t-[4px]'} style={{ height: Math.max(card, 2), background: CARD }} />}
              </div>
              <div className="h-px w-full bg-slate-200" />
              <span className="mt-1.5 text-xs text-slate-500">{monthShort(m.month)}</span>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>Money in per month</caption>
        <thead><tr><th>Month</th><th>Card</th><th>At the office</th><th>Refunded</th></tr></thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}><td>{m.month}</td><td>{formatCents(m.cardCents)}</td><td>{formatCents(m.officeCents)}</td><td>{formatCents(m.refundedCents)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function CollectionRow({ c, onOpen }: { c: PaymentsCollection; onOpen: () => void }) {
  const pct = settledPercent(c.stats);
  const due = c.stats.open > 0 ? dueStatus(c.dueDate) : null;
  const Icon = c.source === 'request' ? ClipboardDocumentListIcon : DocumentTextIcon;
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-cyan-50/30">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Icon className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-900">{c.title}</span>
            {due && <span className={`shrink-0 text-[11px] font-medium ${due.tone === 'overdue' ? 'text-rose-700' : due.tone === 'soon' ? 'text-amber-700' : 'text-slate-500'}`}>{due.label}</span>}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-slate-500">{c.stats.settled}/{c.stats.count}</span>
          </div>
        </div>
        <div className="shrink-0 text-right tabular-nums">
          <div className="text-sm font-semibold text-slate-900">{formatCents(c.stats.collectedCents)}</div>
          <div className="text-xs text-slate-500">{c.stats.outstandingCents > 0 ? `${formatCents(c.stats.outstandingCents)} owed` : 'nothing owed'}</div>
        </div>
      </button>
    </li>
  );
}

const ACTIVITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  card: CreditCardIcon, cash: BanknotesIcon, cheque: BanknotesIcon, other: BanknotesIcon, refund: ArrowUturnLeftIcon, waiver: GiftIcon,
};

function activityLine(a: PaymentsActivity): string {
  if (a.kind === 'refund') return a.status === 'pending' ? 'Refund on its way' : 'Refund';
  if (a.kind === 'waiver') return 'Waived';
  return a.paidWith || paymentKindLabel(a.kind);
}

export default function PaymentsOverview({ overview, error, onOpenRequest, onOpenForm, onOpenCharge }: Props) {
  if (error) return <p role="alert" className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700">{error}</p>;
  if (!overview) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }
  const empty = overview.collections.length === 0 && overview.activity.length === 0;
  if (empty) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <EmptyState
          icon={BanknotesIcon}
          title="Nothing collected yet"
          description="Send a payment request from the Requests tab, or add a Payment field to a form. Everything families pay shows here."
        />
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2"><MonthsChart months={overview.months} /></div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Forms and requests</h2>
        {overview.collections.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No forms or requests with payments yet.</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {overview.collections.map((c) => (
              <CollectionRow key={`${c.source}-${c.id}`} c={c} onOpen={() => (c.source === 'request' ? onOpenRequest(c.id) : onOpenForm(c.id, c.title))} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Latest activity</h2>
        {overview.activity.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">Nothing paid yet.</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {overview.activity.map((a) => {
              const Icon = ACTIVITY_ICON[a.kind] || BanknotesIcon;
              const out = a.kind === 'refund';
              return (
                <li key={a.paymentId}>
                  <button type="button" onClick={() => onOpenCharge(a.chargeId)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-cyan-50/30">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${out ? 'bg-rose-50 text-rose-600' : a.kind === 'waiver' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{a.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {activityLine(a)}{a.studentName ? ` · ${a.studentName}` : a.payerEmail ? ` · ${a.payerEmail}` : ''} · {when(a.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${out ? 'text-rose-700' : a.kind === 'waiver' ? 'text-slate-500' : 'text-slate-900'}`}>
                      {out ? '−' : ''}{formatCents(a.amountCents)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
