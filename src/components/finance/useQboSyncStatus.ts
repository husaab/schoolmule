'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSyncStatus } from '@/services/financeService'
import type { SyncStatus } from '@/services/types/finance'
import { errorMessage } from './format'

const POLL_MS = 15_000
const IDLE_POLL_MS = 5 * 60_000

/**
 * QuickBooks connection + sync queue state for the tuition page.
 *
 * Polls every 15 s while a sync is queued or running, and while the first
 * (backfill) sync hasn't finished, so "Syncing…" turns into "Synced just now"
 * without a manual refresh. Otherwise it polls every 5 minutes so scheduled
 * worker syncs show up and "Synced N min ago" stays honest.
 */
export function useQboSyncStatus(enabled: boolean) {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Promise callbacks (not an async body) so the effect below only subscribes
  // to the result rather than setting state synchronously.
  const refresh = useCallback(
    (): Promise<void> =>
      getSyncStatus().then(
        (res) => {
          setStatus(res.data)
          setError(null)
        },
        (err: unknown) => {
          setError(errorMessage(err, 'Could not read the QuickBooks sync status'))
        }
      ),
    []
  )

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getSyncStatus().then(
      (res) => {
        if (cancelled) return
        setStatus(res.data)
        setError(null)
      },
      (err: unknown) => {
        if (!cancelled) setError(errorMessage(err, 'Could not read the QuickBooks sync status'))
      }
    )
    return () => {
      cancelled = true
    }
  }, [enabled])

  const shouldPoll =
    !!status &&
    (status.pendingSync ||
      status.job?.state === 'pending' ||
      status.job?.state === 'running' ||
      (status.connection.status === 'active' && !status.connection.backfillCompletedAt))

  // Fast poll while there is something to wait for; otherwise a slow idle
  // poll so the background worker's scheduled syncs are still noticed (the
  // page reloads the grid when lastSuccessAt moves).
  const interval = shouldPoll ? POLL_MS : IDLE_POLL_MS

  useEffect(() => {
    if (!enabled) return
    const t = setInterval(refresh, interval)
    return () => clearInterval(t)
  }, [enabled, interval, refresh])

  return { status, error, refresh }
}
