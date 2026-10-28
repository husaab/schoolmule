// src/hooks/useAlertStatus.ts
'use client'
// Observe → Alerts status (what's firing, is the engine running) polled once
// by the shell on the same 30 s Live cadence as every page, and kept in the
// Observe store so the nav dot, the Overview banner and the Alerts page all
// read one copy.
import { useEffect } from 'react'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { useObserveStore } from '@/store/useObserveStore'
import { getAlertStatus } from '@/services/observeService'

/** Mount once (ObserveShell). */
export function useAlertStatusPoll() {
  const setAlertStatus = useObserveStore((s) => s.setAlertStatus)
  const { data, error } = useObserveQuery(() => getAlertStatus())
  useEffect(() => {
    if (data || error) setAlertStatus(data, error)
  }, [data, error, setAlertStatus])
}

/** The latest status, or null before the first answer. */
export const useAlertStatus = () => useObserveStore((s) => s.alertStatus)

/** Fetch now (after a rule change) instead of waiting for the next poll. */
export async function refreshAlertStatus() {
  try {
    useObserveStore.getState().setAlertStatus(await getAlertStatus())
  } catch {
    // The next poll tries again.
  }
}
