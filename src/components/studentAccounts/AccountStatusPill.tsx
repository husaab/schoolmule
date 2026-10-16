// src/components/studentAccounts/AccountStatusPill.tsx
// A student's SchoolMule account status, as the Student accounts table and
// the class People tab show it.

import type { AccountStatus } from '@/services/types/studentAccount'
import { STATUS_LABELS } from '@/lib/studentAccounts'

const STYLES: Record<AccountStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  invited: 'bg-blue-100 text-blue-700',
  not_invited: 'bg-slate-100 text-slate-600',
  archived: 'bg-stone-100 text-stone-600',
  not_eligible: 'bg-slate-50 text-slate-400',
}

export default function AccountStatusPill({ status }: { status: AccountStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
