// src/hooks/useBatchDelivery.ts
//
// One publish's parent emails, refreshed every few seconds while any are
// still queued (they go out from the server's queue shortly after Publish),
// with Retry for the ones that didn't send. Remount (key) for another batch.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { getBatchDelivery, retryBatchEmails } from '@/services/assessmentPublicationService'
import type { BatchDelivery } from '@/services/types/assessmentPublication'
import { isDelivering } from '@/lib/emailDelivery'

const POLL_MS = 4000
// A queue that is stuck shows its state; the teacher can reopen to look again.
const MAX_POLL_MS = 10 * 60 * 1000

export function useBatchDelivery(classId: string, batchId: string | null) {
  const [delivery, setDelivery] = useState<BatchDelivery | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  // Bumped by a Retry: refreshing starts again.
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!batchId) return undefined
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const started = Date.now()
    const tick = async () => {
      let again = true
      try {
        const res = await getBatchDelivery(classId, batchId)
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
  }, [classId, batchId, round])

  const retry = useCallback(async () => {
    if (!batchId) return
    setRetrying(true)
    try {
      const res = await retryBatchEmails(classId, batchId)
      if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not retry the emails')
      setDelivery(res.data)
      setError(null)
      setRound((n) => n + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not retry the emails')
    } finally {
      setRetrying(false)
    }
  }, [classId, batchId])

  return { delivery, error, retrying, retry }
}
