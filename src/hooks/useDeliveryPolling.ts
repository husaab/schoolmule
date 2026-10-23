// src/hooks/useDeliveryPolling.ts
//
// Follows a send's emails from the server's queue: reads them now, again
// every few seconds while any are still queued, and resends the failed ones
// on Retry (then follows again). `key` names the send (null: nothing yet);
// `load` and `retry` must be stable (module functions, or useCallback).
'use client'

import { useCallback, useEffect, useState } from 'react'
import { isDelivering, type DeliveryCounts } from '@/lib/emailDelivery'

const POLL_MS = 3000
// A queue that is stuck shows its state; reopening looks again.
const MAX_POLL_MS = 10 * 60 * 1000

interface Envelope<T> {
  status: string
  data?: T
  message?: string
}

export function useDeliveryPolling<T extends { counts: DeliveryCounts }>(
  key: string | null,
  load: (key: string) => Promise<Envelope<T>>,
  retryFn: (key: string) => Promise<Envelope<T>>,
) {
  const [delivery, setDelivery] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  // Bumped by a Retry: following starts again.
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!key) return undefined
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const started = Date.now()
    const tick = async () => {
      let again = true
      try {
        const res = await load(key)
        if (cancelled) return
        if (res.status === 'success' && res.data) {
          setDelivery(res.data)
          setError(null)
          again = isDelivering(res.data.counts)
        } else {
          setError(res.message || 'Could not check the emails')
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not check the emails')
      }
      if (again && Date.now() - started < MAX_POLL_MS) timer = setTimeout(tick, POLL_MS)
    }
    void tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [key, load, round])

  const retry = useCallback(async () => {
    if (!key) return
    setRetrying(true)
    try {
      const res = await retryFn(key)
      if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not retry the emails')
      setDelivery(res.data)
      setError(null)
      setRound((n) => n + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not retry the emails')
    } finally {
      setRetrying(false)
    }
  }, [key, retryFn])

  return { delivery, error, retrying, retry }
}
