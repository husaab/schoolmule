// src/hooks/useAlertIncident.ts
'use client'
// One Observe alert incident, for its modal (web) or sheet (app). Each id
// starts clean, so a "no longer exists" or an error from the last incident
// never shows on the next one; it refreshes every 30 s while the incident is
// still open and Live is on.
import { useEffect, useState } from 'react'
import type { AlertIncident } from '@/services/types/observe'
import { getAlertIncident } from '@/services/observeService'
import { isApiError } from '@/services/apiClient'
import { useObserveStore } from '@/store/useObserveStore'
import { LIVE_INTERVAL_MS } from '@/hooks/useObserveQuery'

interface Loaded {
  id: string | null
  incident: AlertIncident | null
  error: string | null
  notFound: boolean
}

const blank = (id: string | null): Loaded => ({ id, incident: null, error: null, notFound: false })

export function useAlertIncident(id: string | null) {
  const live = useObserveStore((s) => s.live)
  const [loaded, setLoaded] = useState<Loaded>(blank(null))
  // Bumped to fetch again: Retry, and the 30 s refresh.
  const [tick, setTick] = useState(0)
  const current = loaded.id === id ? loaded : blank(id)

  useEffect(() => {
    if (!id) return
    let alive = true
    getAlertIncident(id)
      .then((incident) => {
        if (alive) setLoaded({ id, incident, error: null, notFound: false })
      })
      .catch((e) => {
        if (!alive) return
        const notFound = isApiError(e) && e.status === 404
        const error = notFound ? null : e instanceof Error ? e.message : 'Could not load the incident'
        // A failed refresh keeps what was on screen.
        setLoaded((prev) => ({ id, incident: notFound || prev.id !== id ? null : prev.incident, error, notFound }))
      })
    return () => {
      alive = false
    }
  }, [id, tick])

  const firing = current.incident?.status === 'open'
  useEffect(() => {
    if (!live || !firing) return
    const t = setInterval(() => setTick((n) => n + 1), LIVE_INTERVAL_MS)
    return () => clearInterval(t)
  }, [live, firing])

  return { incident: current.incident, error: current.error, notFound: current.notFound, retry: () => setTick((n) => n + 1) }
}
