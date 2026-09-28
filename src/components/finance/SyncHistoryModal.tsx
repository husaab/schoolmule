'use client'

// The QuickBooks sync log: one row per run, newest first. It answers the
// questions the header pill can't — "did the 3 o'clock sync actually pull
// anything?", "why did it fail?", "how long has it been failing?".

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowPathIcon, ArrowUturnUpIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { getSyncRuns } from '@/services/financeService'
import type { SyncRun, SyncRunKind } from '@/services/types/finance'
import { errorMessage, formatDateTime, relativeTime } from './format'

const PAGE_SIZE = 20
/** How often the background worker pulls changes (backend CDC schedule). */
const SCHEDULE_TEXT = 'every 15 minutes'

interface SyncHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  /** connection.lastSuccessAt from the sync status hook. */
  lastSuccessAt: string | null
  /** Changes whenever the latest run changes, so an open log refreshes itself. */
  latestRunKey?: string
  /** Queue a sync; omitted when syncing isn't possible (needs reconnect). */
  onSyncNow?: () => void
  /** Queue a full refresh (re-reads everything); omitted alongside onSyncNow. */
  onFullRefresh?: () => void
  syncing?: boolean
  /** A sync is already queued or running. */
  syncPending?: boolean
}

const TRIGGER_LABEL: Record<SyncRunKind, string> = {
  manual: 'Manual',
  cdc: 'Scheduled',
  backfill: 'Backfill',
}

const MODE_LABEL: Record<SyncRun['mode'], string> = {
  full: 'Full refresh',
  cdc: 'Changes only',
}

/** 'Sep 27, 7:33 PM' — the year only when it isn't this year. */
function formatStarted(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** '12 s' · '1m 04s' · '1h 02m' · 'running…' while unfinished. */
function formatDuration(run: SyncRun): string {
  if (!run.finishedAt) return run.status === 'running' ? 'running…' : '—'
  const ms = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const total = Math.round(ms / 1000)
  if (total < 1) return '<1 s'
  if (total < 60) return `${total} s`
  const minutes = Math.floor(total / 60)
  if (minutes < 60) return `${minutes}m ${String(total % 60).padStart(2, '0')}s`
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** '3 invoices · 1 payment · 2 customers · 1 removed', zero counts omitted. */
function changesText(run: SyncRun): string {
  const parts = [
    run.invoicesUpserted ? plural(run.invoicesUpserted, 'invoice') : null,
    run.paymentsUpserted ? plural(run.paymentsUpserted, 'payment') : null,
    run.customersUpserted ? plural(run.customersUpserted, 'customer') : null,
    run.deletedFlagged ? `${run.deletedFlagged} removed` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'no changes'
}

function changesTitle(run: SyncRun): string {
  const lines = [plural(run.apiCalls, 'QuickBooks API call')]
  if (run.cursorFrom || run.cursorTo) {
    lines.push(`Window: ${formatDateTime(run.cursorFrom)} → ${formatDateTime(run.cursorTo)}`)
  }
  if (run.triggeredBy) lines.push(`Started by ${run.triggeredBy}`)
  return lines.join('\n')
}

function ResultCell({ run }: { run: SyncRun }) {
  if (run.status === 'success') {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Success
      </span>
    )
  }
  if (run.status === 'running') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        <ArrowPathIcon className="h-3 w-3 animate-spin" />
        Running
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
      Failed
    </span>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-2" aria-label="Loading sync history">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  )
}

const SyncHistoryModal: React.FC<SyncHistoryModalProps> = ({
  isOpen,
  onClose,
  lastSuccessAt,
  latestRunKey,
  onSyncNow,
  onFullRefresh,
  syncing = false,
  syncPending = false,
}) => {
  const [runs, setRuns] = useState<SyncRun[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  // Drops responses from a request that a newer one has superseded.
  const requestId = useRef(0)

  const loadFirst = useCallback((): Promise<void> => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    setMoreError(null)
    return getSyncRuns(PAGE_SIZE, 0).then(
      (res) => {
        if (id !== requestId.current) return
        setRuns(res.data.runs)
        setTotal(res.data.total)
        setNow(Date.now())
        setLoading(false)
      },
      (err: unknown) => {
        if (id !== requestId.current) return
        setError(errorMessage(err, 'Could not load the sync history'))
        setLoading(false)
      }
    )
  }, [])

  const loadMore = () => {
    const id = ++requestId.current
    setLoadingMore(true)
    setMoreError(null)
    getSyncRuns(PAGE_SIZE, runs.length).then(
      (res) => {
        if (id !== requestId.current) return
        setRuns((prev) => {
          const seen = new Set(prev.map((r) => r.runId))
          return [...prev, ...res.data.runs.filter((r) => !seen.has(r.runId))]
        })
        setTotal(res.data.total)
        setLoadingMore(false)
      },
      (err: unknown) => {
        if (id !== requestId.current) return
        setMoreError(errorMessage(err, 'Could not load older syncs'))
        setLoadingMore(false)
      }
    )
  }

  // Load on open, and again whenever the latest run changes while open (a
  // sync started or finished) so the log never lags the header pill.
  useEffect(() => {
    if (!isOpen) return
    // Deferred so the effect only schedules the fetch rather than setting
    // state synchronously.
    const t = setTimeout(() => void loadFirst(), 0)
    return () => clearTimeout(t)
  }, [isOpen, latestRunKey, loadFirst])

  useEffect(() => {
    if (!isOpen) return
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [isOpen])

  const summary = lastSuccessAt
    ? `Last success ${relativeTime(lastSuccessAt, now)} · ${SCHEDULE_TEXT}`
    : `No successful sync yet · ${SCHEDULE_TEXT}`

  const hasMore = runs.length < total
  const initialLoading = loading && runs.length === 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-3xl">
      <ModalHeader title="Sync history" subtitle={summary} icon={ClockIcon} />
      <ModalBody>
        {initialLoading ? (
          <SkeletonRows />
        ) : error && runs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
            <p className="text-sm text-amber-900">{error}</p>
            <Button variant="secondary" onClick={() => void loadFirst()}>
              Retry
            </Button>
          </div>
        ) : runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">No syncs yet</p>
            <p className="mt-1 text-xs text-slate-500">Runs appear here once SchoolMule starts reading from QuickBooks.</p>
          </div>
        ) : (
          <>
            {error && (
              <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => void loadFirst()} className="font-medium underline cursor-pointer">
                  Retry
                </button>
              </p>
            )}
            <div className="-mx-6 overflow-x-auto px-6">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-3 font-semibold">Started</th>
                    <th className="py-2 pr-3 font-semibold">Duration</th>
                    <th className="py-2 pr-3 font-semibold">Trigger</th>
                    <th className="py-2 pr-3 font-semibold">Mode</th>
                    <th className="py-2 pr-3 font-semibold">Result</th>
                    <th className="py-2 font-semibold">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => {
                    const changes = changesText(run)
                    return (
                      <React.Fragment key={run.runId}>
                        <tr className={`align-top ${run.status === 'failed' && run.error ? '' : 'border-b border-slate-100'}`}>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-slate-700" title={formatDateTime(run.startedAt)}>
                            {formatStarted(run.startedAt)}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-slate-600">{formatDuration(run)}</td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-slate-600">{TRIGGER_LABEL[run.kind] ?? run.kind}</td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-slate-600">{MODE_LABEL[run.mode] ?? run.mode}</td>
                          <td className="whitespace-nowrap py-2.5 pr-3">
                            <ResultCell run={run} />
                          </td>
                          <td
                            className={`py-2.5 ${changes === 'no changes' ? 'text-slate-400' : 'text-slate-700'}`}
                            title={changesTitle(run)}
                          >
                            {changes}
                          </td>
                        </tr>
                        {run.status === 'failed' && run.error && (
                          <tr className="border-b border-slate-100">
                            <td colSpan={6} className="pb-2.5">
                              <details className="group rounded-lg bg-rose-50/70 px-3 py-1.5 text-xs text-rose-800">
                                <summary className="cursor-pointer select-none truncate font-medium marker:text-rose-400 group-open:whitespace-normal">
                                  <span className="group-open:hidden">{run.error}</span>
                                  <span className="hidden group-open:inline">What went wrong</span>
                                </summary>
                                <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">{run.error}</p>
                              </details>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col items-center gap-2">
              {moreError && (
                <p className="text-xs text-rose-700">
                  {moreError}{' '}
                  <button type="button" onClick={loadMore} className="font-medium underline cursor-pointer">
                    Retry
                  </button>
                </p>
              )}
              {hasMore ? (
                <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                  Load more
                </Button>
              ) : (
                <p className="text-xs text-slate-400">
                  {plural(total, 'sync', 'syncs')} shown
                </p>
              )}
            </div>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {onFullRefresh && (
          <Button
            variant="secondary"
            onClick={onFullRefresh}
            disabled={syncing || syncPending}
            title="Re-reads everything from QuickBooks. Use after merging or renaming customers there."
          >
            <ArrowUturnUpIcon className="h-4 w-4" />
            Full refresh
          </Button>
        )}
        {onSyncNow && (
          <Button onClick={onSyncNow} loading={syncing} disabled={syncPending} title="Pull the latest from QuickBooks">
            {!syncing && <ArrowPathIcon className={`h-4 w-4 ${syncPending ? 'animate-spin' : ''}`} />}
            {syncPending ? 'Syncing…' : 'Sync now'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}

export default SyncHistoryModal
