'use client';

// Cash, cheque or another payment for a student whose family never filled in
// the form (finance permission, from the form's submissions). Find the
// student, tick the optional items they paid for, see the total with tax, and
// record what came in: the server makes the response ("Entered by the
// office"), its charge and the payment in one go. A student who already has a
// payment on this form is pointed to it instead.

import React, { useCallback, useEffect, useState } from 'react';
import { BanknotesIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import { Button, Field, FieldRow, FormSection, ModalBody, ModalFooter, ModalHeader, inputClass, selectClass } from '@/components/shared/modalKit';
import { useNotificationStore } from '@/store/useNotificationStore';
import { searchPaymentStudents } from '@/services/paymentsService';
import { recordOfficePayment } from '@/services/registrationService';
import type { Charge, OfflineKind, StudentMatch } from '@/services/types/payments';
import type { PaymentFieldConfig } from '@/services/types/registration';
import { alreadyOnFormChargeId, centsToInput, formatCents, officePaymentProblem, parseDollars, paymentKindLabel } from '@/lib/paymentField';
import { priceWithTax, taxBreakdown } from '@/lib/paymentTax';
import { gradeLabel } from '@/lib/paymentRequests';
import { errorMessage } from '@/components/finance/format';

interface Props {
  isOpen: boolean;
  formId: string;
  formTitle: string;
  /** The form's payment field as staff read it: its items, prices and tax. */
  config: PaymentFieldConfig;
  onClose: () => void;
  /** After it is recorded, with the new payment. */
  onRecorded: (charge: Charge) => void;
  /** The student already has a payment on this form: open that one. */
  onOpenCharge: (chargeId: string) => void;
}

export default function OfficePaymentModal({ isOpen, formId, formTitle, config, onClose, onRecorded, onOpenCharge }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [student, setStudent] = useState<StudentMatch | null>(null);
  const [query, setQuery] = useState('');
  // The last search's answer, with the words it was for.
  const [found, setFound] = useState<{ q: string; list: StudentMatch[] }>({ q: '', list: [] });
  const [picked, setPicked] = useState<string[]>([]);
  const [kind, setKind] = useState<OfflineKind>('cash');
  // Null: the amount follows the total.
  const [amountText, setAmountText] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The student's payment already on this form (409 ALREADY_ON_FORM).
  const [existingId, setExistingId] = useState<string | null>(null);

  // Students matching the name typed.
  const q = query.trim();
  useEffect(() => {
    if (student || q.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      searchPaymentStudents(q)
        .then((r) => { if (live) setFound({ q, list: r.data }); })
        .catch(() => { if (live) setFound({ q, list: [] }); });
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q, student]);
  const searched = q.length >= 2 && found.q === q;
  const matches = searched ? found.list : [];

  const price = priceWithTax(config, picked);
  const total = price.totalCents;
  const tax = taxBreakdown(total, price.taxes);
  const shownAmount = amountText ?? centsToInput(total);
  const amountCents = parseDollars(shownAmount);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  // The error sits at the end of a body that scrolls, above the sticky footer; bring it into view when it appears.
  const reveal = useCallback((el: HTMLElement | null) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }), []);

  const choose = (next: StudentMatch | null) => {
    setStudent(next);
    setQuery('');
    setError(null);
    setExistingId(null);
  };

  const save = async () => {
    const problem = officePaymentProblem({ studentId: student?.studentId ?? null, totalCents: total, amountCents });
    if (problem || !student) return setError(problem);
    setBusy(true);
    setError(null);
    setExistingId(null);
    try {
      const res = await recordOfficePayment(formId, {
        studentId: student.studentId,
        itemIds: picked,
        kind,
        // Left as the total, the server takes the whole balance (its own figure).
        amountCents: amountText === null ? null : amountCents,
        note: note.trim() || null,
        sendReceipt,
      });
      showNotification(`${paymentKindLabel(kind)} payment recorded for ${student.name}`, 'success');
      onRecorded(res.data);
    } catch (err) {
      setExistingId(alreadyOnFormChargeId(err));
      setError(errorMessage(err, 'Could not record the payment'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} closeOnEscape={!busy} size="lg" ariaLabel="Record a payment">
      <ModalHeader title="Record a payment" subtitle={`${formTitle} · for a family that didn’t fill in the form`} icon={BanknotesIcon} />
      <ModalBody>
        <FormSection label="Student">
          {student ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><UserIcon className="h-4 w-4" /></span>
              <p className="min-w-0 flex-1 text-sm font-medium text-slate-900">
                {student.name} <span className="font-normal text-slate-500">{gradeLabel(student.grade)}</span>
              </p>
              <button type="button" onClick={() => choose(null)} disabled={busy} className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50">
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type the student’s name"
                  aria-label="Student name"
                  autoFocus
                  className={`${inputClass} pl-9`}
                />
              </div>
              {matches.length > 0 && (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {matches.map((m) => (
                    <li key={m.studentId}>
                      <button type="button" onClick={() => choose(m)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-cyan-50">
                        <span className="text-slate-800">{m.name}</span>
                        <span className="text-xs text-slate-500">{gradeLabel(m.grade)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {searched && matches.length === 0 && <p className="text-xs text-slate-500">No student by that name this year.</p>}
            </div>
          )}
        </FormSection>

        <FormSection label="What it’s for">
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {config.items.map((item) => (
              <li key={item.id}>
                <label className={`flex items-center gap-3 px-3 py-2 text-sm ${item.required ? '' : 'cursor-pointer hover:bg-cyan-50/40'}`}>
                  <input
                    type="checkbox"
                    checked={item.required || picked.includes(item.id)}
                    disabled={item.required}
                    onChange={() => toggle(item.id)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-70"
                  />
                  <span className="flex-1 text-slate-700">
                    {item.label}
                    {!item.required && <span className="ml-1.5 text-xs text-slate-400">optional</span>}
                  </span>
                  <span className="tabular-nums text-slate-900">{formatCents(item.amountCents)}</span>
                </label>
              </li>
            ))}
            {tax.addedRows.length > 0 && (
              <>
                <li className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="tabular-nums text-slate-700">{formatCents(tax.subtotalCents)}</span>
                </li>
                {tax.addedRows.map((row, i) => (
                  <li key={`${row.label}-${i}`} className="flex justify-between px-3 py-2 text-sm">
                    <span className="text-slate-500">{row.label}</span>
                    <span className="tabular-nums text-slate-700">{formatCents(row.cents)}</span>
                  </li>
                ))}
              </>
            )}
            <li className="flex justify-between px-3 py-2 text-sm font-semibold text-slate-900">
              <span>Total</span>
              <span className="tabular-nums">{formatCents(total)}</span>
            </li>
          </ul>
          {tax.includedNote && <p className="text-xs text-slate-500">{tax.includedNote}</p>}
        </FormSection>

        <FormSection label="The payment">
          <FieldRow>
            <Field label="Paid by" htmlFor="office-kind">
              <select id="office-kind" value={kind} onChange={(e) => setKind(e.target.value as OfflineKind)} className={selectClass}>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Amount received" htmlFor="office-amount" hint={amountCents && amountCents < total ? `${formatCents(total - amountCents)} will still be owed.` : undefined}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  id="office-amount"
                  value={shownAmount}
                  onChange={(e) => setAmountText(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`${inputClass} pl-7 tabular-nums`}
                />
              </div>
            </Field>
          </FieldRow>
          <Field label="Note" htmlFor="office-note" hint="Optional. Only staff with Finance see it.">
            <input id="office-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={inputClass} placeholder="e.g. Cheque 1043" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={sendReceipt} onChange={(e) => setSendReceipt(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
            Email a receipt to the guardians
          </label>
        </FormSection>

        {error && existingId ? (
          <div ref={reveal} role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="min-w-0 flex-1">{error}</span>
            <Button variant="secondary" onClick={() => onOpenCharge(existingId)}>Open that payment</Button>
          </div>
        ) : error ? (
          <p ref={reveal} role="alert" className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button onClick={save} loading={busy}>Record payment</Button>
      </ModalFooter>
    </Modal>
  );
}
