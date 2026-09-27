'use client'

// QuickBooks freshness in the page header, styled after SheetSyncStatus.
// A stale ledger must announce itself — a failed sync or a dead grant shows
// here, not only in a settings screen — because silent drift is what would
// quietly undermine trust in the numbers.

import React, { useEffect, useRef, useState } from 'react'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  LinkSlashIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline'
import { syncNow } from '@/services/financeService'
import type { SyncStatus } from '@/services/types/finance'
import { useNotificationStore } from '@/store/useNotificationStore'
import { errorMessage, formatDateTime, relativeTime } from './format'

interface QboSyncStatusProps {
  status: SyncStatus | null
  /** Refetch the status (after queueing a sync). */
  onRefresh: () => Promise<void> | void
  /** Start the Intuit OAuth round-trip (not connected / needs reconnect). */
  onConnect: () => void
  onDisconnect: () => void
  connecting?: boolean
  /** Set when the status couldn't be read; shows a retry instead of a skeleton. */
  error?: string | null
}

const base = 'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border transition-colors'
const quiet = 'bg-white text-slate-600 border-slate-200'
const iconButton =
  'flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 border border-l-0 border-slate-200 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed'

/** Re-render periodically so "3 min ago" keeps moving. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

function DisconnectMenu({ onDisconnect }: { onDisconnect: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="QuickBooks options"
        onClick={() => setOpen((v) => !v)}
        className={`${iconButton} rounded-r-xl px-2`}
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDisconnect()
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <LinkSlashIcon className="h-4 w-4" />
            Disconnect QuickBooks
          </button>
        </div>
      )}
    </div>
  )
}

const QboSyncStatus: React.FC<QboSyncStatusProps> = ({ status, onRefresh, onConnect, onDisconnect, connecting = false, error = null }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const now = useNow()
  const [queueing, setQueueing] = useState(false)

  if (!status) {
    if (error) {
      return (
        <button
          type="button"
          onClick={() => onRefresh()}
          title={error}
          className={`${base} rounded-xl border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer`}
        >
          <ExclamationTriangleIcon className="h-4 w-4" />
          Sync status unavailable — retry
        </button>
      )
    }
    return <span className="block h-[38px] w-40 animate-pulse rounded-xl bg-slate-200/70" aria-label="Loading sync status" />
  }

  const conn = status.connection

  if (!conn.connected && conn.status !== 'needs_reconnect') {
    return (
      <button
        type="button"
        onClick={onConnect}
        disabled={connecting}
        className={`${base} ${quiet} rounded-xl hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer disabled:opacity-50`}
        title="Connect QuickBooks to fill this page"
      >
        <SignalSlashIcon className="h-4 w-4" />
        Not connected
      </button>
    )
  }

  if (conn.status === 'needs_reconnect') {
    return (
      <div className="flex items-center">
        <button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          className={`${base} rounded-l-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer disabled:opacity-50`}
          title={conn.lastError ?? 'QuickBooks access expired or was revoked'}
        >
          <ExclamationTriangleIcon className="h-4 w-4" />
          Reconnect QuickBooks
        </button>
        <DisconnectMenu onDisconnect={onDisconnect} />
      </div>
    )
  }

  const pending = status.pendingSync || status.job?.state === 'pending' || status.job?.state === 'running'
  // A permanently failed job row can outlive later successful syncs (those
  // rows are deleted), so a failed job only counts if it is newer than the
  // last success.
  const jobFailedSinceSuccess =
    status.job?.state === 'failed' &&
    (!conn.lastSuccessAt || new Date(status.job.createdAt).getTime() > new Date(conn.lastSuccessAt).getTime())
  const failed = conn.consecutiveFailures > 0 || jobFailedSinceSuccess
  const failureText = (jobFailedSinceSuccess ? status.job?.lastError : null) ?? conn.lastError ?? 'The last sync failed'

  const label = pending
    ? 'Syncing…'
    : failed
      ? 'Sync failed — retrying'
      : conn.lastSuccessAt
        ? `Synced ${relativeTime(conn.lastSuccessAt, now)}`
        : 'Not synced yet'

  const title = failed
    ? failureText
    : [conn.companyName, conn.lastSuccessAt ? `Last synced ${formatDateTime(conn.lastSuccessAt)}` : null].filter(Boolean).join(' · ')

  const handleSync = async () => {
    setQueueing(true)
    try {
      const res = await syncNow()
      showNotification(res.data.alreadyQueued ? 'A sync is already queued' : 'Sync queued', 'success')
      await onRefresh()
    } catch (err) {
      showNotification(errorMessage(err, 'Could not queue a sync'), 'error')
    } finally {
      setQueueing(false)
    }
  }

  return (
    <div className="flex items-center">
      <span
        title={title || undefined}
        className={`${base} rounded-l-xl ${
          failed && !pending ? 'border-amber-200 bg-amber-50 text-amber-800' : quiet
        }`}
        role="status"
      >
        {pending ? (
          <ArrowPathIcon className="h-4 w-4 animate-spin text-cyan-600" />
        ) : failed ? (
          <ExclamationTriangleIcon className="h-4 w-4" />
        ) : (
          <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
        )}
        {label}
      </span>
      <button type="button" onClick={handleSync} disabled={pending || queueing} className={iconButton} title="Pull the latest from QuickBooks">
        <ArrowPathIcon className={`h-4 w-4 ${queueing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Sync now</span>
      </button>
      <DisconnectMenu onDisconnect={onDisconnect} />
    </div>
  )
}

export default QboSyncStatus
