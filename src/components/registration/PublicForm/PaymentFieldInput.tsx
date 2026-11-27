'use client';

// The payment field as a family fills it in: the items (required ones ticked
// and fixed, optional ones to tick), the total with any tax, and how they
// will pay. The server works out the real total from the form's own prices.

import type { FormField } from '@/services/types/registration';
import { formatCents } from '@/lib/paymentField';
import { priceWithTax, taxBreakdown } from '@/lib/paymentTax';
import { LockClosedIcon } from '@heroicons/react/24/outline';

interface Props {
  field: FormField;
  index: number;
  picked: string[];
  onPick: (ids: string[]) => void;
  method: 'card' | 'offline';
  onMethod: (method: 'card' | 'offline') => void;
  /** Whether the school can take card payments right now. */
  online: boolean;
  schoolName: string;
}

export default function PaymentFieldInput({ field, index, picked, onPick, method, onMethod, online, schoolName }: Props) {
  const config = field.payment;
  if (!config) return null;
  const price = priceWithTax(config, picked);
  const total = price.totalCents;
  const tax = taxBreakdown(total, price.taxes);
  const allowOffline = config.allowOffline;
  const noWayToPay = total > 0 && !online && !allowOffline;

  const toggle = (id: string) => onPick(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <p className="block text-sm font-medium text-slate-800 mb-3">{`${index + 1}. ${field.label}`}</p>

      <ul className="space-y-2.5">
        {config.items.map((item) => {
          const checked = item.required || picked.includes(item.id);
          return (
            <li key={item.id}>
              <label className={`flex items-center gap-3 ${item.required ? '' : 'cursor-pointer group'}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={item.required}
                  onChange={() => toggle(item.id)}
                  className="w-4 h-4 rounded text-cyan-600 border-slate-300 focus:ring-cyan-500 disabled:opacity-70"
                />
                <span className="flex-1 text-sm text-slate-700 group-hover:text-slate-900">
                  {item.label}
                  {!item.required && <span className="ml-1.5 text-xs text-slate-400">optional</span>}
                </span>
                <span className="text-sm font-medium text-slate-900 tabular-nums">{formatCents(item.amountCents)}</span>
              </label>
            </li>
          );
        })}
      </ul>

      {tax.addedRows.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="tabular-nums text-slate-900">{formatCents(tax.subtotalCents)}</span>
          </div>
          {tax.addedRows.map((row, i) => (
            <div key={`${row.label}-${i}`} className="flex justify-between">
              <span className="text-slate-600">{row.label}</span>
              <span className="tabular-nums text-slate-900">{formatCents(row.cents)}</span>
            </div>
          ))}
        </div>
      )}
      <div className={`flex items-baseline justify-between border-t border-slate-100 pt-3 ${tax.addedRows.length > 0 ? 'mt-3' : 'mt-4'}`}>
        <span className="text-sm font-semibold text-slate-900">Total</span>
        <span className="text-lg font-bold text-slate-900 tabular-nums">{formatCents(total)}</span>
      </div>
      {tax.includedNote && <p className="mt-1 text-right text-xs text-slate-500">{tax.includedNote}</p>}

      {total > 0 && (online || allowOffline) && (
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">How you will pay</legend>
          {online && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name={`pay-${field.fieldId}`} checked={method === 'card'} onChange={() => onMethod('card')} className="mt-0.5 w-4 h-4 text-cyan-600 border-slate-300 focus:ring-cyan-500" />
              <span className="text-sm text-slate-700">Pay now by card, Apple Pay or Google Pay</span>
            </label>
          )}
          {allowOffline && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name={`pay-${field.fieldId}`} checked={method === 'offline'} onChange={() => onMethod('offline')} className="mt-0.5 w-4 h-4 text-cyan-600 border-slate-300 focus:ring-cyan-500" />
              <span className="text-sm text-slate-700">I’ll pay cash or cheque at the office</span>
            </label>
          )}
        </fieldset>
      )}

      {total > 0 && method === 'card' && online && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
          <LockClosedIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          You’ll pay securely through Stripe. {schoolName} will appear on your card statement.
        </p>
      )}
      {noWayToPay && (
        <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This school can’t take payments online right now. Please contact {schoolName}.
        </p>
      )}
    </div>
  );
}
