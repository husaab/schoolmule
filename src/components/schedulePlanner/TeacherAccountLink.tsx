'use client'

// Pieces of the Teachers tab that show whether each planner teacher is linked
// to their SchoolMule login. A teacher only sees their schedule once linked,
// so status is shown on every row rather than buried in the edit form.

import React from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { TeacherPayload } from '@/services/types/teacher'
import type { PlannerTeacher } from '@/services/types/schedulePlanner'

/**
 * `<option>`s for every linkable account. An account backs one planner teacher
 * only (the backend enforces this too), so ones already taken by another
 * teacher are shown but disabled.
 */
export const AccountOptions: React.FC<{
  accounts: TeacherPayload[]
  linkedTo: Map<string, PlannerTeacher>
  /** The teacher being linked; their own current account stays selectable. */
  forTeacherId: string | null
}> = ({ accounts, linkedTo, forTeacherId }) => (
  <>
    {accounts.map((account) => {
      const owner = linkedTo.get(account.userId)
      const taken = owner && owner.plannerTeacherId !== forTeacherId
      return (
        <option key={account.userId} value={account.userId} disabled={Boolean(taken)}>
          {account.fullName} ({account.email}){taken ? ` — linked to ${owner.displayName}` : ''}
        </option>
      )
    })}
  </>
)

interface TeacherAccountCellProps {
  teacher: PlannerTeacher
  accounts: TeacherPayload[]
  linkedTo: Map<string, PlannerTeacher>
  /** Name-based guess for an unlinked teacher, if one is unambiguous. */
  suggestion?: TeacherPayload
  busy: boolean
  onLink: (userId: string | null) => void
}

export const TeacherAccountCell: React.FC<TeacherAccountCellProps> = ({
  teacher,
  accounts,
  linkedTo,
  suggestion,
  busy,
  onLink,
}) => {
  if (teacher.userId) {
    const account = accounts.find((a) => a.userId === teacher.userId)
    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 max-w-[14rem] px-2 py-0.5 rounded-full text-xs font-medium ${
            account ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}
          title={account ? account.email : 'Linked account is no longer a teacher in this school'}
        >
          {account ? (
            <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{account ? account.fullName : 'Unknown account'}</span>
        </span>
        <button
          onClick={() => onLink(null)}
          disabled={busy}
          title="Unlink account"
          className="p-0.5 rounded text-gray-400 hover:text-red-500 disabled:opacity-50 cursor-pointer"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium whitespace-nowrap">
          <ExclamationTriangleIcon className="h-3.5 w-3.5" />
          Not linked
        </span>
        <select
          value=""
          disabled={busy || accounts.length === 0}
          onChange={(e) => e.target.value && onLink(e.target.value)}
          className="min-w-0 max-w-[10rem] border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-600 bg-white disabled:opacity-50"
        >
          <option value="">{accounts.length === 0 ? 'No accounts' : 'Link account…'}</option>
          <AccountOptions accounts={accounts} linkedTo={linkedTo} forTeacherId={teacher.plannerTeacherId} />
        </select>
      </div>
      {suggestion && (
        <button
          onClick={() => onLink(suggestion.userId)}
          disabled={busy}
          title={`Link to ${suggestion.fullName} (${suggestion.email})`}
          className="inline-flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-900 hover:underline disabled:opacity-50 cursor-pointer"
        >
          <SparklesIcon className="h-3.5 w-3.5" />
          Suggested: <span className="font-medium">{suggestion.fullName}</span> · Link
        </button>
      )}
    </div>
  )
}

interface LinkSummaryBarProps {
  linkedCount: number
  total: number
  unlinkedOnly: boolean
  onUnlinkedOnlyChange: (value: boolean) => void
}

/** "9 of 13 linked" with a progress bar: green when complete, amber otherwise. */
export const LinkSummaryBar: React.FC<LinkSummaryBarProps> = ({
  linkedCount,
  total,
  unlinkedOnly,
  onUnlinkedOnlyChange,
}) => {
  const unlinked = total - linkedCount
  const done = unlinked === 0
  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 ${
        done ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {done ? (
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />
          )}
          <div>
            <p className={`text-sm font-semibold ${done ? 'text-green-900' : 'text-amber-900'}`}>
              {linkedCount} of {total} teachers linked to a SchoolMule account
            </p>
            <p className={`text-xs ${done ? 'text-green-700' : 'text-amber-700'}`}>
              {done
                ? 'Every teacher can see their schedule on their dashboard.'
                : `${unlinked} teacher${unlinked === 1 ? '' : 's'} can't see their schedule until linked. Links apply to the published schedule instantly — no need to republish.`}
            </p>
          </div>
        </div>
        {!done && (
          <label className="flex items-center gap-2 text-xs font-medium text-amber-900 cursor-pointer">
            <input
              type="checkbox"
              checked={unlinkedOnly}
              onChange={(e) => onUnlinkedOnlyChange(e.target.checked)}
              className="rounded border-amber-300"
            />
            Show unlinked only
          </label>
        )}
      </div>
      <div className="mt-2.5 h-1.5 rounded-full bg-white/80 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'bg-amber-500'}`}
          style={{ width: `${total === 0 ? 0 : (linkedCount / total) * 100}%` }}
        />
      </div>
    </div>
  )
}
