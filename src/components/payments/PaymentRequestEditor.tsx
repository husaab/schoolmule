'use client';

// A new payment request, or an edit to one. New: the name, the amount per
// student, its tax (once the school has a rate), a due date and a note for
// families, then who it goes to. Sending makes a payment for each student and
// emails their guardians a link. Edit: the same details (the amount and its
// tax only while nobody has paid).

import React, { useEffect, useState } from 'react';
import { PaperAirplaneIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import { Button, Field, FieldRow, FormSection, ModalBody, ModalFooter, ModalHeader, inputClass, selectClass, textareaClass } from '@/components/shared/modalKit';
import { createPaymentRequest, getPaymentSettings, getPaymentsRoster, updatePaymentRequest } from '@/services/paymentsService';
import type { PaymentRequest, PaymentRequestDetail, PaymentRequestTarget, PaymentsRoster, TaxRate } from '@/services/types/payments';
import type { TaxMode } from '@/services/types/registration';
import { audienceStudents, emptyTarget, requestDraftProblem, requestPrice, requestPriceLine, requestTaxFields, targetIsEmpty } from '@/lib/paymentRequests';
import { centsToInput, formatCents, parseDollars } from '@/lib/paymentField';
import { rateChoices } from '@/lib/paymentTax';
import { errorMessage } from '@/components/finance/format';
import AudiencePicker from './AudiencePicker';

interface Props {
  isOpen: boolean;
  /** Editing this request; otherwise a new one. */
  request?: PaymentRequest | null;
  /** Whether card payments are on (Stripe connected and active). */
  online: boolean;
  onClose: () => void;
  onSaved: (request: PaymentRequestDetail) => void;
}

export default function PaymentRequestEditor({ isOpen, request, online, onClose, onSaved }: Props) {
  const editing = Boolean(request);
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [allowOffline, setAllowOffline] = useState(true);
  const [accountingCode, setAccountingCode] = useState('');
  const [taxRateId, setTaxRateId] = useState('');
  const [taxMode, setTaxMode] = useState<TaxMode>('added');
  const [notify, setNotify] = useState(true);
  const [target, setTarget] = useState<Required<PaymentRequestTarget>>(emptyTarget());
  const [roster, setRoster] = useState<PaymentsRoster | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);
  // The school's tax rates, read each time the editor opens (Settings may have changed them).
  const [rates, setRates] = useState<TaxRate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(request?.title || '');
    setAmountText(request ? centsToInput(request.amountCents) : '');
    setDueDate(request?.dueDate || '');
    setDescription(request?.description || '');
    setAllowOffline(request ? request.allowOffline : true);
    setAccountingCode(request?.accountingCode || '');
    setTaxRateId(request?.taxRateId || '');
    setTaxMode(request?.taxMode === 'included' ? 'included' : 'added');
    setNotify(true);
    setTarget(emptyTarget());
    setError(null);
    if (!request && !roster) {
      getPaymentsRoster().then((r) => setRoster(r.data)).catch((err) => setRosterError(errorMessage(err, 'Could not load your students')));
    }
  }, [isOpen, request, roster]);

  useEffect(() => {
    if (!isOpen) return;
    let live = true;
    getPaymentSettings()
      .then((r) => { if (live) setRates(r.data.taxRates); })
      // Without the list, a request keeps the rate it has; nothing new can be picked.
      .catch(() => { if (live) setRates([]); });
    return () => { live = false; };
  }, [isOpen]);

  const paidAlready = Boolean(request && (request.stats.collectedCents > 0 || request.stats.settled > 0));
  const amountCents = parseDollars(amountText);
  const count = roster ? audienceStudents(roster, target).length : 0;

  // The request's own rate, named by the request when Settings no longer lists it.
  const ownTax = request?.taxRateId && request.taxName ? { name: request.taxName, rateMilli: request.taxRateMilli ?? 0 } : null;
  const chosenRate = taxRateId
    ? (rates ?? []).find((r) => r.taxRateId === taxRateId) ?? (taxRateId === request?.taxRateId ? ownTax : null)
    : null;
  const taxChoices = rateChoices(rates ?? [], taxRateId || null, taxRateId === request?.taxRateId ? ownTax : null);
  const showTax = (rates ?? []).some((r) => !r.archived) || Boolean(taxRateId) || Boolean(request?.taxRateId);
  const price = amountCents ? requestPrice(amountCents, chosenRate, taxMode) : null;
  const priceLine = price && taxRateId ? requestPriceLine(price) : null;

  const save = async () => {
    const problem = requestDraftProblem({ title, amountText, dueDate });
    if (problem) return setError(problem);
    if (!online && !allowOffline) return setError('Card payments aren’t on yet, so allow paying at the office (or connect Stripe first).');
    if (!editing && targetIsEmpty(target)) return setError('Choose who to send it to: a grade, a class or students.');
    if (!editing && count === 0) return setError('Nobody matches who you chose.');
    const details = {
      title: title.trim(),
      amountCents: amountCents as number,
      dueDate: dueDate || null,
      description: description.trim() || null,
      allowOffline,
      accountingCode: accountingCode.trim() || null,
      ...requestTaxFields(editing ? request : null, { taxRateId: taxRateId || null, taxMode }),
    };
    setBusy(true);
    setError(null);
    try {
      const res = editing && request
        ? await updatePaymentRequest(request.requestId, details)
        : await createPaymentRequest({ ...details, ...target, notify });
      onSaved(res.data);
    } catch (err) {
      setError(errorMessage(err, editing ? 'Could not save the request' : 'Could not send the request'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} size="xl" ariaLabel={editing ? 'Edit payment request' : 'New payment request'}>
      <ModalHeader
        title={editing ? 'Edit payment request' : 'New payment request'}
        subtitle={editing ? 'Changes show on every family’s payment page.' : 'Ask families to pay for a trip, books or a uniform, without a form.'}
        icon={editing ? PencilSquareIcon : PaperAirplaneIcon}
      />
      <ModalBody>
        <FormSection label="What it’s for">
          <Field label="Name" htmlFor="req-title" required>
            <input id="req-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={inputClass} placeholder="Grade 5 museum trip" />
          </Field>
          <FieldRow>
            <Field label="Amount per student" htmlFor="req-amount" required hint={paidAlready ? 'Families have paid, so the amount is fixed. Waive or refund instead.' : undefined}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input id="req-amount" value={amountText} onChange={(e) => setAmountText(e.target.value)} inputMode="decimal" disabled={paidAlready} className={`${inputClass} pl-7 tabular-nums`} placeholder="35.00" />
              </div>
            </Field>
            <Field label="Due date" htmlFor="req-due" hint="Optional. Families still owing get one reminder three days before.">
              <input id="req-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </Field>
          </FieldRow>
          {showTax && (
            <FieldRow>
              <Field label="Tax" htmlFor="req-tax" hint={paidAlready ? 'Families have paid, so the tax is fixed too.' : undefined}>
                <select id="req-tax" value={taxRateId} onChange={(e) => setTaxRateId(e.target.value)} disabled={paidAlready} className={selectClass}>
                  {taxChoices.map((c) => <option key={c.value || 'none'} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              {taxRateId ? (
                <fieldset disabled={paidAlready} className="space-y-1.5 sm:pt-7">
                  <legend className="sr-only">How the tax applies</legend>
                  {([['added', 'Tax is added on top of this amount'], ['included', 'This amount already includes tax']] as const).map(([mode, label]) => (
                    <label key={mode} className="flex items-start gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="req-tax-mode"
                        checked={taxMode === mode}
                        onChange={() => setTaxMode(mode)}
                        className="mt-0.5 h-4 w-4 border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>
              ) : <div />}
            </FieldRow>
          )}
          {priceLine && <p className="text-sm text-slate-600">{priceLine}</p>}
          <Field label="A note for families" htmlFor="req-desc" hint="Optional. It goes in the email and on their payment page.">
            <textarea id="req-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} className={textareaClass} placeholder="Covers the bus and museum entry. The trip is on December 15." />
          </Field>
          <FieldRow>
            <Field label="Accounting code" htmlFor="req-code" hint="Optional, for your books. Families never see it.">
              <input id="req-code" value={accountingCode} onChange={(e) => setAccountingCode(e.target.value)} maxLength={60} className={inputClass} placeholder="4210 Field trips" />
            </Field>
            <div className="flex items-end pb-2.5">
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={allowOffline} onChange={(e) => setAllowOffline(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600" />
                <span>Families can also pay at the office (cash or cheque)</span>
              </label>
            </div>
          </FieldRow>
          {!online && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Card payments aren’t on yet. Families will be asked to pay at the office until Stripe is connected.
            </p>
          )}
        </FormSection>

        {!editing && (
          <FormSection label="Who it goes to">
            <AudiencePicker roster={roster} rosterError={rosterError} target={target} onChange={setTarget} />
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600" />
              <span>Email each family now, with a link to pay{online ? ' by card' : ''}</span>
            </label>
          </FormSection>
        )}

        {error && <p role="alert" className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </ModalBody>
      <ModalFooter>
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {!editing && price && count > 0 && (
            <span className="mr-auto text-sm text-slate-500">
              {count} × {formatCents(price.totalCents)} = <span className="font-semibold text-slate-900">{formatCents(count * price.totalCents)}</span>
            </span>
          )}
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy}>{editing ? 'Save changes' : notify ? 'Send request' : 'Create request'}</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
