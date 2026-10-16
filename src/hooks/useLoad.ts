// src/hooks/useLoad.ts
// Loads one thing for a page: `scope` names what is being loaded (a class id,
// a child and class, …). Answers arrive in callbacks, and an answer for an
// older scope or an earlier reload is dropped, so switching class or child
// never shows the previous one's data. A failed reload keeps what is on
// screen. `scope: null` waits (nothing is loaded and `loading` is false).
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface LoadState<T> {
  scope: string
  version: number
  data: T | null
  error: Error | null
}

export interface Loaded<T> {
  data: T | null
  /** While a new scope loads: the last answer of the scope before it (a picker can stay put). */
  previous: T | null
  error: Error | null
  loading: boolean
  /** Fetch again, keeping what is shown until the answer arrives. */
  reload: () => void
  /** Change what is shown without asking the server (after a write it already confirmed). */
  patch: (change: (data: T) => T) => void
}

export function useLoad<T>(scope: string | null, load: () => Promise<T>): Loaded<T> {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState<LoadState<T> | null>(null)
  // The loader is usually an inline closure; the effect runs only when the scope or version moves.
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    if (scope === null) return
    let cancelled = false
    loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ scope, version, data, error: null })
      },
      (err: unknown) => {
        if (cancelled) return
        const error = err instanceof Error ? err : new Error('Something went wrong')
        setState((prev) => ({ scope, version, data: prev?.scope === scope ? prev.data : null, error }))
      },
    )
    return () => {
      cancelled = true
    }
  }, [scope, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const patch = useCallback((change: (data: T) => T) => {
    setState((prev) => (prev && prev.data !== null ? { ...prev, data: change(prev.data) } : prev))
  }, [])

  const current = scope !== null && state?.scope === scope ? state : null
  return {
    data: current?.data ?? null,
    previous: current ? null : (state?.data ?? null),
    error: current && current.version === version ? current.error : null,
    loading: scope !== null && (!current || current.version !== version),
    reload,
    patch,
  }
}
