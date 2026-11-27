'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

import { formatCents } from '@/lib/paymentField';
import { taxBreakdown } from '@/lib/paymentTax';
import type { ChargeTax } from '@/services/types/payments';

interface Props {
  schoolName: string;
  /** Set when the family chose to pay at the office. `taxes`: the tax in the total, when there is any. */
  payAtOffice?: { totalCents: number; payPath: string; taxes?: ChargeTax[] } | null;
}

export default function SuccessMessage({ schoolName, payAtOffice = null }: Props) {
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
  const tax = payAtOffice ? taxBreakdown(payAtOffice.totalCents, payAtOffice.taxes) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Nav */}
      <nav className="flex items-center justify-between mb-6">
        <Link href="/">
          <Image
            src="/logo/trimmedlogo.png"
            alt="SchoolMule"
            width={200}
            height={60}
            className="h-16 w-auto"
          />
        </Link>
        {isLoggedIn && (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            Dashboard &rarr;
          </Link>
        )}
      </nav>

      <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm text-center mt-12">
        <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Submission Received!</h2>
        <p className="text-slate-600 mb-6">
          Thank you for submitting your form. {schoolName} has received your submission
          and will review it shortly.
        </p>
        {payAtOffice && (
          <div className="mx-auto mb-6 max-w-md rounded-xl border border-cyan-100 bg-cyan-50 px-5 py-4 text-left">
            <p className="text-sm font-semibold text-cyan-900">Please pay {formatCents(payAtOffice.totalCents)} at the office</p>
            {tax && tax.addedRows.length > 0 && (
              <dl className="mt-2 space-y-1 border-t border-cyan-100 pt-2 text-sm text-cyan-900">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatCents(tax.subtotalCents)}</dd>
                </div>
                {tax.addedRows.map((row, i) => (
                  <div key={`${row.label}-${i}`} className="flex justify-between">
                    <dt>{row.label}</dt>
                    <dd className="tabular-nums">{formatCents(row.cents)}</dd>
                  </div>
                ))}
                <div className="flex justify-between font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatCents(tax.totalCents)}</dd>
                </div>
              </dl>
            )}
            {tax?.includedNote && <p className="mt-1 text-xs text-cyan-800">{tax.includedNote}</p>}
            <p className={`${tax?.hasTax ? 'mt-2' : 'mt-1'} text-sm text-cyan-800`}>
              Bring cash or a cheque to {schoolName}.{' '}
              <Link href={payAtOffice.payPath} className="font-medium underline">Keep this link</Link> to check what you owe.
            </p>
          </div>
        )}
        <p className="text-sm text-slate-400">You may close this page.</p>
      </div>
    </div>
  );
}
