// src/hooks/useObserveQuery.ts
'use client'
// One fetch per page: reloads when the window changes, silently refreshes
// every 30 s while Live is on, and keeps the last good data on screen
// while a refresh is in flight.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useObserveStore } from '@/store/useObserveStore'
import type { WindowKey } from '@/services/types/observe'

export const LIVE_INTERVAL_MS = 30000

export function useObserveQuery<T>(fetcher: (window: WindowKey) => Promise<T>, deps: unknown[] = []) {
  const window = useObserveStore((s) => s.window)
  const live = useObserveStore((s) => s.live)
  const setLastRefreshed = useObserveStore((s) => s.setLastRefreshed)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const seq = useRef(0)

  const load = useCallback(
    async (silent: boolean) => {
      const id = ++seq.current
      if (silent) setRefreshing(true)
      else setLoading(true)
      try {
        const result = await fetcher(window)
        if (id !== seq.current) return
        setData(result)
        setError(null)
        setLastRefreshed(Date.now())
      } catch (e) {
        if (id !== seq.current) return
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (id === seq.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [window, setLastRefreshed, ...deps]
  )

  useEffect(() => {
    load(false)
  }, [load])

  useEffect(() => {
    if (!live) return
    const t = setInterval(() => load(true), LIVE_INTERVAL_MS)
    return () => clearInterval(t)
  }, [live, load])

  return { data, error, loading, refreshing, refetch: () => load(true), window }
}
