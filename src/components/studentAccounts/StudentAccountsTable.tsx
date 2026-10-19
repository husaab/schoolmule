// src/components/studentAccounts/StudentAccountsTable.tsx
// The Student accounts table: one row per student of the selected year, with
// their own address, SchoolMule status, consent, QR card and last sign-in.
'use client'

import { useEffect, useRef } from 'react'
import type { ClassroomSettings, StudentAccountRow } from '@/services/types/studentAccount'
import {
  consentText,
  displayEmail,
  inviteSubline,
  lastSignedInText,
  qrCardText,
  studentSubline,
  type RowAction,
} from '@/lib/studentAccounts'
import Avatar from '@/components/avatar/Avatar'
import AccountStatusPill from './AccountStatusPill'
import StudentAccountActionsMenu from './StudentAccountActionsMenu'

interface Props {
  rows: StudentAccountRow[]
  settings: ClassroomSettings
  selected: ReadonlySet<string>
  onToggle: (studentId: string) => void
  /** Select (true) or clear (false) every row shown. */
  onToggleAll: (checked: boolean) => void
  onAction: (row: StudentAccountRow, action: RowAction) => void
  /** Rows with a request in flight. */
  busyIds: ReadonlySet<string>
}

const TH = 'px-3 py-3 text-left text-xs font-medium text-slate-500 whitespace-nowrap'

export default function StudentAccountsTable({ rows, settings, selected, onToggle, onToggleAll, onAction, busyIds }: Props) {
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.studentId))
  const someChecked = !allChecked && rows.some((r) => selected.has(r.studentId))
  const headerBox = useRef<HTMLInputElement>(null)
  const now = new Date()

  useEffect(() => {
    if (headerBox.current) headerBox.current.indeterminate = someChecked
  }, [someChecked])

  return (
    <div className="max-h-[calc(100vh-22rem)] min-h-[16rem] overflow-auto">
      <table className="w-full min-w-[1040px]">
        <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
          <tr>
            <th className="w-10 py-3 pl-4 pr-1">
              <input
                ref={headerBox}
                type="checkbox"
                checked={allChecked}
                onChange={(e) => onToggleAll(e.target.checked)}
                aria-label="Select every student shown"
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
            </th>
            <th className={TH}>Student</th>
            <th className={TH}>Email</th>
            <th className={TH}>SchoolMule</th>
            <th className={TH}>Consent</th>
            <th className={TH}>QR card</th>
            <th className={TH}>Last signed in</th>
            <th className="w-12 py-3 pr-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const email = displayEmail(row)
            const checked = selected.has(row.studentId)
            return (
              <tr key={row.studentId} className={`text-sm transition-colors ${checked ? 'bg-cyan-50/40' : 'hover:bg-slate-50/70'}`}>
                <td className="py-2.5 pl-4 pr-1">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(row.studentId)}
                    aria-label={`Select ${row.name}`}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    {/* The student's pick when the server sends it (M7), else the neutral one. */}
                    <Avatar name={row.name} avatar={row.studentAvatar ?? null} size={36} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">{row.name}</div>
                      <div className="truncate text-xs text-slate-500">{studentSubline(row)}</div>
                    </div>
                  </div>
                </td>
                <td className="max-w-[260px] px-3 py-2.5">
                  {email ? (
                    <span className="block truncate text-slate-700" title={email}>
                      {email}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAction(row, 'edit_email')}
                      className="cursor-pointer font-medium text-cyan-700 hover:text-cyan-800 hover:underline"
                    >
                      Add email
                    </button>
                  )}
                  {row.conflict ? (
                    <p className="mt-0.5 text-xs leading-snug text-rose-600">{row.conflict.message}</p>
                  ) : (
                    row.warnings?.map((w) => (
                      <p key={w.code} className="mt-0.5 text-xs leading-snug text-amber-700">
                        {w.message}
                      </p>
                    ))
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <AccountStatusPill status={row.status} />
                  {(() => {
                    const line = inviteSubline(row, settings, now)
                    return line ? (
                      <p className={`mt-1 whitespace-nowrap text-xs ${row.needsAttention ? 'font-medium text-amber-700' : 'text-slate-500'}`}>
                        {line}
                      </p>
                    ) : null
                  })()}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{consentText(row, now)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{qrCardText(row, settings, now)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                  {row.account ? lastSignedInText(row.account.lastLoginAt, now) : '—'}
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <StudentAccountActionsMenu
                    row={row}
                    settings={settings}
                    busy={busyIds.has(row.studentId)}
                    onSelect={(action) => onAction(row, action)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
