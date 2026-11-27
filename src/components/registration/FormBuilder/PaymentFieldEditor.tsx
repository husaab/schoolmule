'use client';

// The payment field's settings in the builder: its price list (each item a
// name, a price, and whether every family pays it), whether families may pay
// at the office instead, and an accounting code for the school's books.
// Prices are edited as text and kept as whole cents.

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { PaymentFieldConfig, PaymentItem } from '@/services/types/registration';
import { MAX_ITEMS, centsToInput, formatCents, newPaymentItem, parseDollars, priceSummary } from '@/lib/paymentField';

interface Props {
  config: PaymentFieldConfig;
  onChange: (config: PaymentFieldConfig) => void;
  /** Whether the school can take card payments now; null while unknown. */
  online: boolean | null;
}

const input =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';

export default function PaymentFieldEditor({ config, onChange, online }: Props) {
  // What is typed in each price box, so "25." can be typed on the way to "25.50".
  const [priceText, setPriceText] = useState<Record<string, string>>(
    () => Object.fromEntries(config.items.map((i) => [i.id, centsToInput(i.amountCents)])),
  );

  const setItems = (items: PaymentItem[]) => onChange({ ...config, items });
  const update = (id: string, patch: Partial<PaymentItem>) =>
    setItems(config.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const setPrice = (id: string, text: string) => {
    setPriceText((p) => ({ ...p, [id]: text }));
    update(id, { amountCents: parseDollars(text) ?? 0 });
  };

  const add = () => {
    const item = newPaymentItem({ required: false });
    setPriceText((p) => ({ ...p, [item.id]: '' }));
    setItems([...config.items, item]);
  };

  const move = (index: number, by: -1 | 1) => {
    const next = [...config.items];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    setItems(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label className="block text-sm font-medium text-slate-700">Items</label>
          <span className="text-xs text-slate-500">{priceSummary(config)}</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Every family pays the required items. Optional ones are ticked by the family, like a lunch or a T-shirt.
        </p>
        <div className="mt-3 space-y-2">
          {config.items.map((item, index) => {
            const typed = priceText[item.id] ?? '';
            const badPrice = typed !== '' && parseDollars(typed) === null;
            return (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => update(item.id, { label: e.target.value })}
                    placeholder="e.g. Trip fee"
                    aria-label={`Item ${index + 1} name`}
                    maxLength={80}
                    className={`${input} sm:flex-1`}
                  />
                  <div className="relative sm:w-32">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={typed}
                      onChange={(e) => setPrice(item.id, e.target.value)}
                      onBlur={() => item.amountCents > 0 && setPriceText((p) => ({ ...p, [item.id]: centsToInput(item.amountCents) }))}
                      placeholder="0.00"
                      aria-label={`Item ${index + 1} price`}
                      aria-invalid={badPrice}
                      className={`${input} pl-6 text-right tabular-nums ${badPrice ? 'border-rose-400' : ''}`}
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div role="radiogroup" aria-label={`Item ${index + 1} is`} className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs">
                    {[true, false].map((required) => (
                      <button
                        key={String(required)}
                        type="button"
                        role="radio"
                        aria-checked={item.required === required}
                        onClick={() => update(item.id, { required })}
                        className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                          item.required === required ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {required ? 'Every family pays' : 'Optional'}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move item ${index + 1} up`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30">
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === config.items.length - 1} aria-label={`Move item ${index + 1} down`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30">
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setItems(config.items.filter((i) => i.id !== item.id))} disabled={config.items.length === 1} aria-label={`Remove item ${index + 1}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {config.items.length < MAX_ITEMS && (
          <button type="button" onClick={add} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700">
            <PlusIcon className="h-4 w-4" />
            Add item
          </button>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700">Ways to pay</span>
        <p className="mt-1 text-sm text-slate-600">
          {online === false ? (
            <>
              Card payments are off for your school.{' '}
              <Link href="/finance/payments" className="font-medium text-cyan-700 hover:underline">Connect Stripe</Link>{' '}
              to take them, or let families pay at the office.
            </>
          ) : (
            'Card, Apple Pay and Google Pay, on a secure Stripe page.'
          )}
        </p>
        <label className="mt-2 flex items-start gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={config.allowOffline}
            onChange={(e) => onChange({ ...config, allowOffline: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <span>Families can choose to pay at the office instead (cash or cheque)</span>
        </label>
      </div>

      <div>
        <label htmlFor="payment-accounting-code" className="block text-sm font-medium text-slate-700">
          Accounting code <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="payment-accounting-code"
          type="text"
          value={config.accountingCode ?? ''}
          onChange={(e) => onChange({ ...config, accountingCode: e.target.value || null })}
          placeholder="e.g. 4210 Field trips"
          maxLength={40}
          className={`${input} mt-1`}
        />
        <p className="mt-1 text-xs text-slate-500">Shown in the payments export for your bookkeeper. Families never see it.</p>
      </div>

      <p className="text-xs text-slate-500">
        Stripe charges your school 2.9% + {formatCents(30)} per card payment. Prices you change later apply to new responses only.
      </p>
    </div>
  );
}
