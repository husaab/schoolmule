'use client';

// Finance → Payments → Settings: the school's tax rates, for form items and
// payment requests, and the tax number its receipts show. A rate is added,
// edited in place, or removed after asking. A removed rate stays on the forms
// and requests that use it until they are changed, so a past payment never
// changes.

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button, Field, FormSection, inputClass } from '@/components/shared/modalKit';
import { useNotificationStore } from '@/store/useNotificationStore';
import { addTaxRate, removeTaxRate, updatePaymentSettings, updateTaxRate } from '@/services/paymentsService';
import type { PaymentSettings, TaxRate } from '@/services/types/payments';
import { MAX_RATE_NAME, parsePercent, percentForServer, percentInput, percentLabel, rateLabel, taxRateProblem } from '@/lib/paymentTax';
import { errorMessage } from '@/components/finance/format';

interface Props {
  /** Null while loading. */
  settings: PaymentSettings | null;
  error: string | null;
  onRetry: () => void;
  /** Every change answers with the whole settings. */
  onChange: (settings: PaymentSettings) => void;
}

const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm';

/** A percent box with the % sign inside it. */
function PercentInput({ id, value, onChange, label }: { id?: string; value: string; onChange: (text: string) => void; label?: string }) {
  return (
    <div className="relative sm:w-28">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder="13"
        aria-label={label}
        className={`${inputClass} pr-8 text-right tabular-nums`}
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
    </div>
  );
}

export default function PaymentSettingsPanel({ settings, error, onRetry, onChange }: Props) {
  if (error && !settings) {
    return (
      <div className={`${card} p-6`}>
        <p role="alert" className="text-sm text-rose-600">{error}</p>
        <Button variant="secondary" className="mt-3" onClick={onRetry}>Try again</Button>
      </div>
    );
  }
  if (!settings) {
    return (
      <div className={`${card} flex justify-center py-12`}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }
  return <TaxCard settings={settings} onChange={onChange} />;
}

function TaxCard({ settings, onChange }: { settings: PaymentSettings; onChange: (s: PaymentSettings) => void }) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const live = settings.taxRates.filter((r) => !r.archived);

  // The tax number.
  const [numberText, setNumberText] = useState(settings.taxNumber ?? '');
  const [savingNumber, setSavingNumber] = useState(false);
  const [numberError, setNumberError] = useState<string | null>(null);

  // One rate at a time is edited in place or asked about before removing.
  const [editing, setEditing] = useState<{ id: string; name: string; percentText: string } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  // A new rate.
  const [newName, setNewName] = useState('');
  const [newPercent, setNewPercent] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const saveNumber = async () => {
    setSavingNumber(true);
    setNumberError(null);
    try {
      const res = await updatePaymentSettings({ taxNumber: numberText.trim() || null });
      onChange(res.data);
      setNumberText(res.data.taxNumber ?? '');
      showNotification(res.data.taxNumber ? 'Tax number saved' : 'Tax number cleared', 'success');
    } catch (err) {
      setNumberError(errorMessage(err, 'Could not save the tax number'));
    } finally {
      setSavingNumber(false);
    }
  };

  const startEdit = (rate: TaxRate) => {
    setRemoving(null);
    setRowError(null);
    setEditing({ id: rate.taxRateId, name: rate.name, percentText: percentInput(rate.rateMilli) });
  };

  const startRemove = (rate: TaxRate) => {
    setEditing(null);
    setRowError(null);
    setRemoving(rate.taxRateId);
  };

  const closeRow = () => {
    setEditing(null);
    setRemoving(null);
    setRowError(null);
  };

  const saveEdit = async (rate: TaxRate) => {
    if (!editing) return;
    const problem = taxRateProblem({ name: editing.name, percentText: editing.percentText }, settings.taxRates, rate.taxRateId);
    if (problem) return setRowError(problem);
    const name = editing.name.trim();
    const body: { name?: string; percent?: string } = {};
    if (name !== rate.name) body.name = name;
    if (parsePercent(editing.percentText) !== rate.rateMilli) body.percent = percentForServer(editing.percentText) ?? undefined;
    if (!body.name && !body.percent) return closeRow();
    setRowBusy(true);
    setRowError(null);
    try {
      const res = await updateTaxRate(rate.taxRateId, body);
      onChange(res.data);
      closeRow();
      showNotification('Rate saved', 'success');
    } catch (err) {
      setRowError(errorMessage(err, 'Could not save the rate'));
    } finally {
      setRowBusy(false);
    }
  };

  const remove = async (rate: TaxRate) => {
    setRowBusy(true);
    setRowError(null);
    try {
      const res = await removeTaxRate(rate.taxRateId);
      onChange(res.data);
      closeRow();
      showNotification(`${rateLabel(rate)} removed`, 'success');
    } catch (err) {
      setRowError(errorMessage(err, 'Could not remove the rate'));
    } finally {
      setRowBusy(false);
    }
  };

  const add = async () => {
    const problem = taxRateProblem({ name: newName, percentText: newPercent }, settings.taxRates);
    if (problem) return setAddError(problem);
    setAdding(true);
    setAddError(null);
    try {
      const res = await addTaxRate({ name: newName.trim(), percent: percentForServer(newPercent) as string });
      onChange(res.data);
      setNewName('');
      setNewPercent('');
      showNotification('Rate added', 'success');
    } catch (err) {
      setAddError(errorMessage(err, 'Could not add the rate'));
    } finally {
      setAdding(false);
    }
  };

  const numberChanged = numberText.trim() !== (settings.taxNumber ?? '');

  return (
    <div className={card}>
      <div className="border-b border-slate-100 p-4">
        <h2 className="text-sm font-semibold text-slate-900">Tax</h2>
        <p className="text-xs text-slate-500">Rates to put on form items and payment requests, and the number your receipts show.</p>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FormSection label="Rates">
            {live.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                Your school doesn’t add tax to payments yet. Add a rate, like HST 13%, to use it on forms and payment requests.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {live.map((rate) => {
                  const isEditing = editing?.id === rate.taxRateId;
                  const isRemoving = removing === rate.taxRateId;
                  return (
                    <li key={rate.taxRateId} className={`px-3 py-2.5 ${isEditing || isRemoving ? 'bg-cyan-50/40' : ''}`}>
                      {isEditing && editing ? (
                        <form onSubmit={(e) => { e.preventDefault(); saveEdit(rate); }} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            value={editing.name}
                            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                            maxLength={MAX_RATE_NAME}
                            aria-label="Rate name"
                            autoFocus
                            className={`${inputClass} sm:flex-1`}
                          />
                          <PercentInput value={editing.percentText} onChange={(percentText) => setEditing({ ...editing, percentText })} label="Rate percent" />
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={closeRow} disabled={rowBusy}>Cancel</Button>
                            <Button type="submit" loading={rowBusy}>Save</Button>
                          </div>
                        </form>
                      ) : isRemoving ? (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-700">
                            Remove <span className="font-medium text-slate-900">{rateLabel(rate)}</span>? Forms and requests that use it keep it until you change them.
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={closeRow} disabled={rowBusy}>Cancel</Button>
                            <Button variant="danger" onClick={() => remove(rate)} loading={rowBusy}>Remove rate</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{rate.name}</span>
                          <span className="text-sm tabular-nums text-slate-700">{percentLabel(rate.rateMilli)}</span>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => startEdit(rate)} className="rounded-lg px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50">
                              Edit
                            </button>
                            <button type="button" onClick={() => startRemove(rate)} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700">
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      {(isEditing || isRemoving) && rowError && (
                        <p role="alert" className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{rowError}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <form onSubmit={(e) => { e.preventDefault(); add(); }} className="space-y-2 pt-1">
              <p className="text-sm font-medium text-slate-700">Add a rate</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={MAX_RATE_NAME}
                  placeholder="Name, like HST"
                  aria-label="New rate name"
                  className={`${inputClass} sm:flex-1`}
                />
                <PercentInput value={newPercent} onChange={setNewPercent} label="New rate percent" />
                <Button type="submit" loading={adding}><PlusIcon className="h-4 w-4" />Add rate</Button>
              </div>
              {addError && <p role="alert" className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{addError}</p>}
            </form>
          </FormSection>
        </div>

        <div className="lg:col-span-2 lg:border-l lg:border-slate-100 lg:pl-6">
          <FormSection label="On receipts">
            <form onSubmit={(e) => { e.preventDefault(); saveNumber(); }}>
              <Field label="Tax number" htmlFor="payments-tax-number" hint="Shown on receipts. Leave empty if your school isn’t registered.">
                <div className="flex gap-2">
                  <input
                    id="payments-tax-number"
                    value={numberText}
                    onChange={(e) => setNumberText(e.target.value)}
                    maxLength={60}
                    placeholder="12345 6789 RT0001"
                    className={inputClass}
                  />
                  <Button type="submit" variant="secondary" loading={savingNumber} disabled={!numberChanged}>Save</Button>
                </div>
              </Field>
              {numberError && <p role="alert" className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{numberError}</p>}
            </form>
          </FormSection>
        </div>
      </div>
    </div>
  );
}
