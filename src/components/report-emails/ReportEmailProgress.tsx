'use client'

// A report card or progress report send as it goes out from the server's
// queue: a bar, "Sending report cards · 37 of 83", then each student's
// emails (Sent to 2, Didn't send with why, or why none was sent), with Retry
// for the failed ones. Closing the window stops nothing.

import React, { useEffect, useRef } from 'react'
import { DeliveryView } from '@/components/gradebook/publish/DeliveryList'
import { useDeliveryPolling } from '@/hooks/useDeliveryPolling'
import { getReportEmailRun, retryReportEmailRun } from '@/services/reportEmailService'
import { sendProgress } from '@/lib/emailDelivery'

interface ReportEmailProgressProps {
  runId: string
  reportType: 'progress_report' | 'report_card'
  /** Once everything queued is out (sent or failed): the page's "emailed" marks changed. */
  onFinished?: () => void
}

export default function ReportEmailProgress({ runId, reportType, onFinished }: ReportEmailProgressProps) {
  const { delivery, error, retrying, retry } = useDeliveryPolling(runId, getReportEmailRun, retryReportEmailRun)
  const progress = delivery ? sendProgress(delivery.counts, reportType) : null
  const finished = progress?.finished ?? false

  // Tell the page once per finish (a Retry starts the send again).
  const told = useRef(false)
  useEffect(() => {
    if (!finished) {
      told.current = false
      return
    }
    if (!told.current) {
      told.current = true
      onFinished?.()
    }
  }, [finished, onFinished])

  const pct = progress?.pct ?? 0
  return (
    <DeliveryView
      delivery={delivery}
      error={error}
      retrying={retrying}
      onRetry={() => void retry()}
      line={progress?.line ?? 'Sending…'}
      header={
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Emails sent"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${delivery && delivery.counts.failed > 0 ? 'bg-amber-500' : 'bg-cyan-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      }
    />
  )
}
