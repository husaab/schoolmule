'use client'

// Small labels shared by the grid rows, mobile cards and the family drawer.

import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { InvoiceKind, LedgerWarning } from '@/services/types/finance'
import { KIND_BADGE, kindLabel, warningText } from './format'

const pill = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset'

export const SubsidyBadge = () => <span className={`${pill} bg-cyan-50 text-cyan-700 ring-cyan-200/60`}>Subsidy</span>

export const TeacherBadge = () => <span className={`${pill} bg-purple-50 text-purple-700 ring-purple-200/60`}>Teacher</span>

export const WarningCountBadge = ({ warnings }: { warnings: LedgerWarning[] }) =>
  warnings.length === 0 ? null : (
    <span
      className={`${pill} bg-amber-50 text-amber-800 ring-amber-200/70`}
      title={warnings.map(warningText).join('\n')}
    >
      <ExclamationTriangleIcon className="h-3 w-3" aria-hidden />
      {warnings.length}
      <span className="sr-only"> {warnings.length === 1 ? 'warning' : 'warnings'}</span>
    </span>
  )

export const FamilyBadges = ({
  isSubsidy,
  isTeacher,
  warnings,
}: {
  isSubsidy: boolean
  isTeacher: boolean
  warnings?: LedgerWarning[]
}) => {
  if (!isSubsidy && !isTeacher && !warnings?.length) return null
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {isSubsidy && <SubsidyBadge />}
      {isTeacher && <TeacherBadge />}
      {warnings && <WarningCountBadge warnings={warnings} />}
    </span>
  )
}

export const KindBadge = ({ kind, grantName }: { kind: InvoiceKind | string; grantName: string }) => (
  <span className={`${pill} ${KIND_BADGE[kind] ?? KIND_BADGE.other}`}>{kindLabel(kind, grantName)}</span>
)

/** The family's warnings as a plain-language list. */
export const WarningList = ({ warnings }: { warnings: LedgerWarning[] }) =>
  warnings.length === 0 ? null : (
    <ul className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/70 px-3.5 py-2.5">
      {warnings.map((w, i) => (
        <li key={`${w.code}-${w.month ?? ''}-${i}`} className="flex gap-2 text-xs text-amber-900">
          <ExclamationTriangleIcon className="mt-px h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
          <span>{warningText(w)}</span>
        </li>
      ))}
    </ul>
  )
