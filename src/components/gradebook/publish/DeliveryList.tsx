'use client'

// One publish's emails to parents, student by student: Queued, Sent to 2,
// Didn't send (with why) or why none was sent, refreshed while any are
// queued, with "Retry failed" once something didn't send.

import React from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { useBatchDelivery } from '@/hooks/useBatchDelivery'
import { deliveryLine, failedCount, isDelivering, studentDeliveryLabel, type DeliveryTone } from '@/lib/emailDelivery'

const toneClass: Record<DeliveryTone, string> = {
  muted: 'text-slate-500',
  success: 'text-emerald-700',
  danger: 'text-rose-700',
}

interface DeliveryListProps {
  classId: string
  batchId: string
  /** Shown before the first answer, e.g. "Emailing 22 families" from the publish itself. */
  initialLine?: string
  /** Hide the "keeps sending if you close this" note (the history window). */
  compact?: boolean
}

export default function DeliveryList({ classId, batchId, initialLine, compact = false }: DeliveryListProps) {
  const { delivery, error, retrying, retry } = useBatchDelivery(classId, batchId)
  const counts = delivery?.counts
  const failed = failedCount(counts)
  const line = counts ? deliveryLine(counts) : initialLine

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-700" aria-live="polite">
          {(!delivery || isDelivering(counts)) && <Spinner size="sm" />}
          {line ?? 'Checking the emails…'}
        </p>
        {failed > 0 && (
          <button
            type="button"
            onClick={() => void retry()}
            disabled={retrying}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying…' : `Retry failed (${failed})`}
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p>
      )}

      {delivery && delivery.students.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {delivery.students.map((s) => {
            const label = studentDeliveryLabel(s)
            return (
              <li key={s.studentId} className="flex items-start justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-sm text-slate-700">{s.studentName || 'Student'}</span>
                <span className={`max-w-[60%] text-right text-xs ${toneClass[label.tone]}`}>
                  <span className="whitespace-nowrap">{label.text}</span>
                  {label.detail && <span className="block break-words text-rose-600/90">{label.detail}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {!compact && isDelivering(counts) && (
        <p className="text-xs text-slate-500">Emails keep sending if you close this window.</p>
      )}
    </div>
  )
}
