'use client';

// One charge, for the office (finance permission): what was asked for, what
// happened, and what can be done next. Record cash, cheque or another
// payment, waive what is left, refund card money, email the family a link to
// pay, take back an entry recorded by mistake, or say which child a form
// payment is for. Every action asks first and keeps the modal open on an
// error.

import React, { useCallback, useEffect, useState } from 'react';
import { BanknotesIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import { Button, ModalBody, ModalFooter, ModalHeader, inputClass, selectClass } from '@/components/shared/modalKit';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  getCharge, recordOfflinePayment, refundCharge, searchPaymentStudents, sendPaymentLink, setChargeStudent, voidChargePayment, waiveCharge,
} from '@/services/paymentsService';
import type { Charge, ChargePayment, OfflineKind, StudentMatch } from '@/services/types/payments';
import { formatDay, gradeLabel } from '@/lib/paymentRequests';
import { centsToInput, formatCents, isOpenDispute, paidWith, parseDollars, paymentKindLabel } from '@/lib/paymentField';
import { errorMessage } from '@/components/finance/format';
import PaymentChip from './PaymentChip';

interface Props {
  chargeId: string | null;
  onClose: () => void;
  /** After any change, with the charge as it now stands. */
  onChanged?: (charge: Charge) => void;
}

type Panel = null | 'offline' | 'waive' | 'refund' | 'link' | 'student' | { void: ChargePayment };

const when = (iso: string) => new Date(iso).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });

function historyLine(p: ChargePayment): string {
  if (p.kind === 'card') return `${paidWith({ kind: 'card', cardBrand: p.cardBrand, cardLast4: p.cardLast4, wallet: p.wallet })}`;
  if (p.kind === 'refund') return p.status === 'pending' ? 'Refund on its way' : p.status === 'failed' ? 'Refund failed' : 'Refund';
  return paymentKindLabel(p.kind);
}

export default function ChargeDetailModal({ chargeId, onClose, onChanged }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [charge, setCharge] = useState<Charge | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The action forms.
  const [kind, setKind] = useState<OfflineKind>('cash');
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentMatches, setStudentMatches] = useState<StudentMatch[]>([]);

  const load = useCallback(async () => {
    if (!chargeId) return;
    setLoadError(null);
    try {
      const res = await getCharge(chargeId);
      setCharge(res.data);
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load this payment'));
    }
  }, [chargeId]);

  useEffect(() => {
    setCharge(null);
    setPanel(null);
    load();
  }, [load]);

  // Students matching the name typed in the "which child" panel.
  useEffect(() => {
    if (panel !== 'student') return;
    const q = studentQuery.trim();
    if (q.length < 2) { setStudentMatches([]); return; }
    let live = true;
    const t = setTimeout(() => {
      searchPaymentStudents(q).then((r) => live && setStudentMatches(r.data)).catch(() => live && setStudentMatches([]));
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [panel, studentQuery]);

  const open = (next: Panel) => {
    setError(null);
    setStudentQuery('');
    setStudentMatches([]);
    setNote('');
    setSendReceipt(true);
    setKind('cash');
    if (next === 'offline') setAmountText(centsToInput(charge?.balanceCents ?? 0));
    if (next === 'refund') setAmountText(centsToInput(charge?.refundableCents ?? 0));
    setPanel(next);
  };

  const run = async (action: () => Promise<{ data: Charge }>, done: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await action();
      setCharge(res.data);
      setPanel(null);
      onChanged?.(res.data);
      showNotification(done, 'success');
    } catch (err) {
      setError(errorMessage(err, 'That didn’t work'));
    } finally {
      setBusy(false);
    }
  };

  const amountCents = parseDollars(amountText);

  const confirm = () => {
    if (!charge || !panel) return;
    if (panel === 'offline') {
      if (!amountCents) return setError('Enter the amount received');
      return run(() => recordOfflinePayment(charge.chargeId, { kind, amountCents, note: note.trim() || null, sendReceipt }), `${paymentKindLabel(kind)} payment recorded`);
    }
    if (panel === 'waive') return run(() => waiveCharge(charge.chargeId, note.trim() || null), 'Fee waived');
    if (panel === 'refund') {
      if (!amountCents) return setError('Enter the amount to refund');
      return run(() => refundCharge(charge.chargeId, { amountCents, note: note.trim() || null }), 'Refund sent');
    }
    if (panel === 'link') return run(() => sendPaymentLink(charge.chargeId), 'Payment link emailed');
    if (panel === 'student') return;
    return run(() => voidChargePayment(charge.chargeId, panel.void.paymentId), 'Entry removed');
  };

  const isOpen = Boolean(chargeId);
  const owed = charge?.balanceCents ?? 0;
  const refundable = charge?.refundableCents ?? 0;

  const isRequest = charge?.sourceType === 'request';
  // Who hears about it: whoever gave an email, otherwise (a request) the student's guardians.
  const emailTo = charge?.payerEmail || (isRequest ? 'the student’s guardians' : null);
  const linkStudent = (studentId: string | null, name: string | null) =>
    charge && run(() => setChargeStudent(charge.chargeId, studentId), studentId ? `Linked to ${name}` : 'Student unlinked');

  const panelTitle = panel === 'student' ? 'Which child is this for?'
    : panel === 'offline' ? 'Record a payment'
    : panel === 'waive' ? `Waive ${formatCents(owed)}`
      : panel === 'refund' ? 'Refund to the card'
        : panel === 'link' ? 'Email a payment link'
          : panel ? `Remove this ${paymentKindLabel(panel.void.kind).toLowerCase()} entry` : '';

  const confirmLabel = panel === 'offline' ? 'Record payment'
    : panel === 'waive' ? 'Waive fee'
      : panel === 'refund' ? `Refund ${amountCents ? formatCents(amountCents) : ''}`.trim()
        : panel === 'link' ? 'Send email'
          : 'Remove entry';

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} closeOnEscape={!busy && !panel} size="lg" ariaLabel="Payment">
      <ModalHeader
        title={charge?.formTitle || charge?.requestTitle || charge?.description || 'Payment'}
        subtitle={charge?.payerEmail || (charge?.sourceType === 'request' ? 'Payment request' : undefined)}
        icon={BanknotesIcon}
        actions={charge ? <PaymentChip status={charge.status} offline={charge.chosenMethod === 'offline'} disputeStatus={charge.disputeStatus} /> : null}
      />
      <ModalBody>
        {!charge && !loadError && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        )}
        {loadError && <p role="alert" className="text-sm text-rose-600">{loadError}</p>}

        {charge && (
          <>
            {isOpenDispute(charge.disputeStatus) && (
              <div role="status" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                The family disputed this card payment with their bank. Respond in your Stripe Dashboard; Stripe holds the money until it’s decided.
              </div>
            )}

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><UserIcon className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1 text-sm">
                {charge.studentName ? (
                  <p className="font-medium text-slate-900">{charge.studentName} <span className="font-normal text-slate-500">{gradeLabel(charge.studentGrade)}</span></p>
                ) : (
                  <p className="text-slate-500">Not linked to a student</p>
                )}
                {isRequest && (
                  <p className="text-xs text-slate-500">Payment request{charge.dueDate ? ` · due ${formatDay(charge.dueDate)}` : ''}</p>
                )}
              </div>
              {!isRequest && !panel && (
                <button type="button" onClick={() => open('student')} className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50">
                  {charge.studentName ? 'Change' : 'Link a student'}
                </button>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Total', charge.amountCents],
                ['Paid', charge.amountPaidCents],
                ['Refunded', charge.amountRefundedCents],
                ['Still owed', owed],
              ].map(([label, cents]) => (
                <div key={label as string} className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-sm font-semibold tabular-nums text-slate-900">{formatCents(cents as number)}</dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Items</h3>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {(charge.lines || []).map((l) => (
                  <li key={l.lineId} className="flex justify-between px-3 py-2 text-sm">
                    <span className="text-slate-700">{l.label}</span>
                    <span className="tabular-nums text-slate-900">{formatCents(l.amountCents)}</span>
                  </li>
                ))}
              </ul>
              {charge.accountingCode && <p className="mt-1 text-xs text-slate-500">Accounting code {charge.accountingCode}</p>}
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">History</h3>
              {(charge.payments || []).length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  Nothing paid yet{charge.chosenMethod === 'offline' ? '. The family chose to pay at the office.' : '.'}
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {(charge.payments || []).map((p) => {
                    const gone = p.status === 'voided' || p.status === 'failed';
                    const canRemove = p.status === 'succeeded' && ['cash', 'cheque', 'other', 'waiver'].includes(p.kind);
                    return (
                      <li key={p.paymentId} className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-2">
                        <div className={`min-w-0 flex-1 text-sm ${gone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-medium text-slate-900">{historyLine(p)}</span>
                            <span className="tabular-nums">{p.kind === 'refund' ? '−' : ''}{formatCents(p.amountCents)}</span>
                            {p.kind === 'card' && p.stripeFeeCents != null && <span className="text-xs text-slate-400">Stripe fee {formatCents(p.stripeFeeCents)}</span>}
                          </div>
                          <div className="text-xs text-slate-500">
                            {when(p.createdAt)}{p.recordedByName ? ` · ${p.recordedByName}` : ''}{p.voidedAt ? ' · removed' : ''}
                          </div>
                          {p.note && <p className="mt-0.5 text-xs text-slate-600">“{p.note}”</p>}
                        </div>
                        {canRemove && (
                          <button type="button" onClick={() => open({ void: p })} className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700">
                            Remove
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {charge.linkSentAt && <p className="mt-2 text-xs text-slate-500">Payment link last emailed {when(charge.linkSentAt)}</p>}
            </section>

            {panel && (
              <section className="space-y-3 rounded-xl border border-cyan-100 bg-cyan-50/40 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{panelTitle}</h3>
                {panel === 'student' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={studentQuery}
                        onChange={(e) => setStudentQuery(e.target.value)}
                        placeholder="Type the student’s name"
                        aria-label="Student name"
                        autoFocus
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                    {studentMatches.length > 0 && (
                      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                        {studentMatches.map((m) => (
                          <li key={m.studentId}>
                            <button type="button" disabled={busy} onClick={() => linkStudent(m.studentId, m.name)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-cyan-50 disabled:opacity-50">
                              <span className="text-slate-800">{m.name}</span>
                              <span className="text-xs text-slate-500">{gradeLabel(m.grade)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {studentQuery.trim().length >= 2 && studentMatches.length === 0 && <p className="text-xs text-slate-500">No student by that name this year.</p>}
                  </div>
                )}
                {panel === 'offline' && (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-sm text-slate-700">
                        Paid by
                        <select value={kind} onChange={(e) => setKind(e.target.value as OfflineKind)} className={`${selectClass} mt-1`}>
                          <option value="cash">Cash</option>
                          <option value="cheque">Cheque</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label className="text-sm text-slate-700">
                        Amount received
                        <input value={amountText} onChange={(e) => setAmountText(e.target.value)} inputMode="decimal" className={`${inputClass} mt-1 tabular-nums`} placeholder="0.00" />
                      </label>
                    </div>
                    <label className="block text-sm text-slate-700">
                      Note <span className="text-slate-400">(optional, only staff with Finance see it)</span>
                      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={`${inputClass} mt-1`} placeholder="e.g. Cheque 1043" />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={sendReceipt} onChange={(e) => setSendReceipt(e.target.checked)} disabled={!emailTo} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                      Email a receipt{emailTo ? ` to ${emailTo}` : ' (no email on this response)'}
                    </label>
                  </>
                )}
                {panel === 'waive' && (
                  <>
                    <p className="text-sm text-slate-600">The family won’t be asked to pay the {formatCents(owed)} left. Staff without Finance see it as settled, not waived.</p>
                    <label className="block text-sm text-slate-700">
                      Why <span className="text-slate-400">(optional, private)</span>
                      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={`${inputClass} mt-1`} placeholder="e.g. Bursary" />
                    </label>
                  </>
                )}
                {panel === 'refund' && (
                  <>
                    <p className="text-sm text-slate-600">
                      Up to {formatCents(refundable)} can go back to the card. Stripe keeps its fee, and the refund comes out of your school’s Stripe balance. It takes 5 to 10 business days to reach the family.
                    </p>
                    <label className="block text-sm text-slate-700">
                      Amount to refund
                      <input value={amountText} onChange={(e) => setAmountText(e.target.value)} inputMode="decimal" className={`${inputClass} mt-1 tabular-nums`} />
                    </label>
                    <label className="block text-sm text-slate-700">
                      Note <span className="text-slate-400">(optional, private)</span>
                      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={`${inputClass} mt-1`} placeholder="e.g. Trip cancelled" />
                    </label>
                  </>
                )}
                {panel === 'link' && (
                  <p className="text-sm text-slate-600">
                    {isRequest && !charge.payerEmail ? 'The student’s guardians get a reminder' : `${charge.payerEmail} gets an email`} with a button to pay {formatCents(owed)} by card.
                  </p>
                )}
                {typeof panel === 'object' && panel && (
                  <p className="text-sm text-slate-600">
                    The {formatCents(panel.void.amountCents)} {paymentKindLabel(panel.void.kind).toLowerCase()} entry is taken off this payment. It stays in the history, struck through.
                  </p>
                )}
                {error && <p role="alert" className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setPanel(null)} disabled={busy}>Cancel</Button>
                  {panel === 'student' ? (
                    charge.studentId && <Button variant="secondary" onClick={() => linkStudent(null, null)} loading={busy}>Unlink {charge.studentName}</Button>
                  ) : (
                    <Button variant={panel === 'refund' || typeof panel === 'object' ? 'danger' : 'primary'} onClick={confirm} loading={busy}>{confirmLabel}</Button>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </ModalBody>
      {charge && !panel && (
        <ModalFooter>
          <div className="flex w-full flex-wrap justify-end gap-2">
            {owed > 0 && emailTo && <Button variant="secondary" onClick={() => open('link')}>Email payment link</Button>}
            {owed > 0 && <Button variant="secondary" onClick={() => open('waive')}>Waive</Button>}
            {refundable > 0 && <Button variant="secondary" onClick={() => open('refund')}>Refund</Button>}
            {owed > 0 && <Button onClick={() => open('offline')}>Record a payment</Button>}
            {owed === 0 && refundable === 0 && <Button variant="secondary" onClick={onClose}>Close</Button>}
          </div>
        </ModalFooter>
      )}
    </Modal>
  );
}
