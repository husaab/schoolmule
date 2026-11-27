'use client';

// A family's own payment page: the items, what was paid and how, and a way to
// pay what is still owed. Coming back from Stripe with ?session_id=… it
// confirms the payment with Stripe straight away, and waits a little longer
// if Stripe hasn't finished.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { getPublicPayment, startPublicPayment } from '@/services/registrationPublicService';
import type { PublicPayment } from '@/services/types/payments';
import { formatCents, paidWith } from '@/lib/paymentField';
import { formatDay } from '@/lib/paymentRequests';
import { canPayHere, stripePublishableKey } from '@/lib/stripeEmbedded';
import EmbeddedStripePayment from '@/components/payments/EmbeddedStripePayment';

const SETTLED = new Set(['paid', 'partially_refunded', 'refunded', 'settled']);
const settledStatus = (status: string) => SETTLED.has(status);
// How long to wait for Stripe to confirm a payment the family just made.
const CONFIRM_TRIES = 8;
const CONFIRM_EVERY_MS = 2500;

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

export default function PaymentLinkPage() {
  const { token } = useParams<{ token: string }>();
  const search = useSearchParams();
  const sessionId = search.get('session_id');
  const cancelled = search.get('cancelled') === '1';

  const [payment, setPayment] = useState<PublicPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(Boolean(sessionId));
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  // Stripe's form inside this page, and whether it failed here (then Stripe's own page).
  const [payingHere, setPayingHere] = useState(false);
  const [hereFailed, setHereFailed] = useState(false);
  const tries = useRef(0);

  const load = useCallback(async () => {
    try {
      const data = await getPublicPayment(token, sessionId);
      setPayment(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment not found');
      return null;
    }
  }, [token, sessionId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const run = async () => {
      const data = await load();
      // Just back from Stripe and not confirmed yet: ask again for a little while.
      if (sessionId && data && !SETTLED.has(data.status) && tries.current < CONFIRM_TRIES) {
        tries.current += 1;
        timer = setTimeout(run, CONFIRM_EVERY_MS);
      } else {
        setConfirming(false);
      }
    };
    run();
    return () => { if (timer) clearTimeout(timer); };
  }, [load, sessionId]);

  // Back from Stripe's page through the browser's cache: put the button back.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setStarting(false); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const pay = async () => {
    setStartError(null);
    if (payment && !hereFailed && canPayHere(stripePublishableKey(), payment.testMode)) {
      setPayingHere(true);
      return;
    }
    setStarting(true);
    try {
      const res = await startPublicPayment(token);
      if (res.url) {
        window.location.assign(res.url);
        return;
      }
      await load();
      setStarting(false);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Could not open the payment page');
      setStarting(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="max-w-xl mx-auto px-4 py-8">
      <nav className="mb-6">
        <Link href="/"><Image src="/logo/trimmedlogo.png" alt="SchoolMule" width={200} height={60} className="h-14 w-auto" /></Link>
      </nav>
      {children}
      <p className="mt-8 text-center text-xs text-slate-400">
        Payments are processed by Stripe. Powered by <a href="https://schoolmule.ca" className="font-medium hover:text-slate-600">SchoolMule</a>
      </p>
    </div>
  );

  if (!payment && !error) {
    return shell(
      <div className="py-16 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-500">{sessionId ? 'Confirming your payment…' : 'Loading…'}</p>
      </div>,
    );
  }
  if (!payment) {
    return shell(
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ExclamationTriangleIcon className="mx-auto mb-3 h-12 w-12 text-slate-300" />
        <h1 className="text-lg font-bold text-slate-900">Payment not found</h1>
        <p className="mt-1 text-sm text-slate-500">This link may be incorrect. Please contact the school.</p>
      </div>,
    );
  }

  const settled = SETTLED.has(payment.status);
  const waitingOnStripe = Boolean(sessionId) && !settled;

  return shell(
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 border-t-4 border-t-cyan-500 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{payment.formTitle}</h1>
            {payment.schoolName && <p className="text-sm text-slate-500">{payment.schoolName}</p>}
            {(payment.studentName || (payment.dueDate && !settledStatus(payment.status))) && (
              <p className="mt-1 text-sm text-slate-600">
                {[
                  payment.studentName ? `For ${payment.studentName}` : null,
                  payment.dueDate && !settledStatus(payment.status) ? `Due ${formatDay(payment.dueDate)}` : null,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          {payment.testMode && <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500">Test</span>}
        </div>

        {payment.requestDescription && <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{payment.requestDescription}</p>}

        <ul className="mt-5 space-y-2">
          {payment.lines.map((line) => (
            <li key={line.lineId} className="flex justify-between gap-3 text-sm">
              <span className="text-slate-700">{line.label}</span>
              <span className="font-medium text-slate-900 tabular-nums">{formatCents(line.amountCents)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-slate-900">
          <span>Total</span>
          <span className="tabular-nums">{formatCents(payment.amountCents)}</span>
        </div>
        {payment.amountRefundedCents > 0 && (
          <div className="mt-1 flex justify-between text-sm text-rose-700">
            <span>Refunded</span>
            <span className="tabular-nums">−{formatCents(payment.amountRefundedCents)}</span>
          </div>
        )}
      </div>

      {settled ? (
        <div role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-8 w-8 shrink-0 text-emerald-500" />
            <div className="text-sm text-emerald-900">
              <p className="text-base font-semibold">
                {payment.status === 'refunded' ? 'Refunded' : payment.status === 'settled' ? 'Settled' : `Paid · ${formatCents(payment.amountPaidCents)}`}
              </p>
              {payment.card && <p className="mt-0.5">Paid with {paidWith({ kind: 'card', cardBrand: payment.card.brand, cardLast4: payment.card.last4, wallet: payment.card.wallet })}</p>}
              {payment.paidAt && <p>{dateOf(payment.paidAt)}</p>}
              <p className="mt-2 text-emerald-800">Reference {payment.reference}. A receipt was emailed to you.</p>
            </div>
          </div>
        </div>
      ) : waitingOnStripe && confirming ? (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          <div className="animate-spin h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full" />
          Confirming your payment with Stripe…
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          {waitingOnStripe ? (
            <p className="flex items-start gap-2 text-sm text-slate-700">
              <ClockIcon className="h-5 w-5 shrink-0 text-amber-500" />
              Stripe hasn’t confirmed your payment yet. If you paid, it will show here shortly and a receipt will be emailed to you. Please don’t pay again.
            </p>
          ) : cancelled ? (
            <p className="text-sm text-slate-700">
              You left the payment page before paying.{payment.sourceType === 'request' ? '' : ' Your form was received.'}
            </p>
          ) : payment.chosenMethod === 'offline' ? (
            <p className="text-sm text-slate-700">
              You chose to pay at the office. Please bring {formatCents(payment.balanceCents)} in cash or a cheque.
            </p>
          ) : (
            <p className="text-sm text-slate-700">
              {formatCents(payment.balanceCents)} is still to pay.
              {payment.sourceType === 'request' && payment.allowOffline && ' You can pay here by card, or at the office in cash or by cheque.'}
            </p>
          )}

          {!waitingOnStripe && payment.canPayOnline && payingHere && (
            <div className="mt-4">
              <EmbeddedStripePayment
                token={token}
                onPaid={() => { setPayingHere(false); load(); }}
                onUnavailable={() => {
                  setPayingHere(false);
                  setHereFailed(true);
                  setStartError('The payment form couldn’t open here. Pay on Stripe’s secure page instead.');
                }}
              />
            </div>
          )}
          {!waitingOnStripe && payment.canPayOnline && !payingHere && (
            <>
              <button
                type="button"
                onClick={pay}
                disabled={starting}
                className="mt-4 w-full rounded-lg bg-cyan-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cyan-700 disabled:opacity-50"
              >
                {starting ? 'Opening the payment page…' : hereFailed ? `Pay ${formatCents(payment.balanceCents)} on Stripe’s page` : `${payment.chosenMethod === 'offline' ? 'Pay online instead' : 'Pay'} ${formatCents(payment.balanceCents)}`}
              </button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <LockClosedIcon className="h-3.5 w-3.5" />
                Card, Apple Pay or Google Pay, processed securely by Stripe.
              </p>
            </>
          )}
          {!waitingOnStripe && !payment.canPayOnline && payment.chosenMethod !== 'offline' && (
            <p className="mt-3 text-sm text-amber-800">
              {payment.allowOffline ? 'Online payment isn’t available right now. Please pay at the office.' : 'Online payment isn’t available right now. Please contact the school.'}
            </p>
          )}
          {startError && <p role="alert" className="mt-3 text-sm text-rose-600">{startError}</p>}
        </div>
      )}

      {payment.formPath && (
        <p className="text-center text-xs text-slate-400">
          <Link href={payment.formPath} className="hover:text-slate-600">Back to the form</Link>
        </p>
      )}
    </div>,
  );
}
