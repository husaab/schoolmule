'use client'

// The Approvals page's student account requests: pending ones with the
// likeliest student on file (Review & approve, Decline), declined ones
// (Restore, Delete). Same row look as the signups table above it.

import { FC } from 'react'
import { formatDate } from '@/components/adminUsers/userDisplay'
import { gradeLabel } from '@/lib/studentAccounts'
import { suggestionLabel } from '@/lib/studentRequests'
import type { StudentRequest } from '@/services/types/studentRequest'
import {
  ArchiveBoxXMarkIcon,
  ArrowUturnLeftIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface Props {
  rows: StudentRequest[]
  tab: 'pending' | 'declined'
  /** A small heading above the table (when it sits under the signups). */
  heading?: boolean
  onReview: (r: StudentRequest) => void
  onDecline: (r: StudentRequest) => void
  onRestore: (r: StudentRequest) => void
  onDelete: (r: StudentRequest) => void
}

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'

const Suggestion: FC<{ r: StudentRequest }> = ({ r }) => {
  if (!r.suggestion) return <span className="text-xs text-slate-400">No match yet</span>
  const s = r.suggestion
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
      <SparklesIcon className="h-4 w-4 flex-shrink-0 text-amber-500" aria-hidden />
      <span className="min-w-0">
        <span className="font-medium">{s.name}</span>
        <span className="text-slate-500"> · {gradeLabel(s.grade)}</span>
        <span className="block text-xs text-slate-400">
          {s.hasLogin ? 'Already has an account' : suggestionLabel(s.kind)}
        </span>
      </span>
    </span>
  )
}

const StudentRequestsTable: FC<Props> = ({ rows, tab, heading, onReview, onDecline, onRestore, onDelete }) => {
  const isPending = tab === 'pending'
  return (
    <div>
      {heading && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-700">
            Student account requests
            <span className="ml-1.5 font-mono tabular-nums text-xs font-normal text-slate-400">{rows.length}</span>
          </h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white shadow-[0_1px_0_0_#f1f5f9]">
            <tr>
              <th className={th}>Student</th>
              <th className={th}>Typed grade</th>
              {isPending && <th className={th}>On file</th>}
              <th className={th}>{isPending ? 'Asked' : 'Declined'}</th>
              <th className={`${th} text-right`}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r) => (
              <tr
                key={r.requestId}
                onClick={() => (isPending ? onReview(r) : onRestore(r))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (isPending) onReview(r)
                    else onRestore(r)
                  }
                }}
                tabIndex={0}
                aria-label={`${isPending ? 'Review' : 'Restore'} ${r.name}'s request`}
                className={`group cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 ${
                  isPending ? '' : 'opacity-75'
                }`}
              >
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{r.name}</div>
                    <div className="truncate text-xs text-slate-500">{r.email}</div>
                    {r.addressTaken && (
                      <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-700">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden />
                        An account already uses this address
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200/60">
                    Student · {gradeLabel(r.grade)}
                  </span>
                </td>
                {isPending && (
                  <td className="px-4 py-3">
                    <Suggestion r={r} />
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                  {formatDate(isPending ? r.createdAt : r.decidedAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {isPending ? (
                      <>
                        <button
                          onClick={() => onReview(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Review &amp; approve
                        </button>
                        <button
                          onClick={() => onDecline(r)}
                          title="Decline"
                          aria-label={`Decline ${r.name}'s request`}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
                        >
                          <ArchiveBoxXMarkIcon className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onRestore(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer"
                        >
                          <ArrowUturnLeftIcon className="h-4 w-4" />
                          Restore
                        </button>
                        <button
                          onClick={() => onDelete(r)}
                          title="Delete"
                          aria-label={`Delete ${r.name}'s request`}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StudentRequestsTable
