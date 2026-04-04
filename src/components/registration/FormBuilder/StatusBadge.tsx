'use client';

import type { FormStatus } from '@/services/types/registration';

const statusConfig: Record<FormStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-600' },
  published: { label: 'Published', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  closed: { label: 'Closed', bg: 'bg-rose-100', text: 'text-rose-700' },
};

export default function StatusBadge({ status }: { status: FormStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
