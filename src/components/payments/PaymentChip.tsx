'use client';

// A payment's state as a small pill: Unpaid, Paid, Part refunded, Disputed…

import React from 'react';
import type { ChargeStatus } from '@/services/types/registration';
import { isOpenDispute, paymentStatus, type PaymentTone } from '@/lib/paymentField';

const TONES: Record<PaymentTone, string> = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  muted: 'border-dashed border-slate-300 bg-white text-slate-600',
};

interface Props {
  status: ChargeStatus;
  offline?: boolean;
  disputeStatus?: string | null;
  className?: string;
}

const PaymentChip: React.FC<Props> = ({ status, offline = false, disputeStatus = null, className = '' }) => {
  const { label, tone } = paymentStatus(status, { offline, disputed: isOpenDispute(disputeStatus) });
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>
      {label}
    </span>
  );
};

export default PaymentChip;
