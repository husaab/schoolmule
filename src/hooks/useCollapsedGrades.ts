// src/hooks/useCollapsedGrades.ts
// Which grade sections the Classes home has collapsed, remembered per person
// on this browser (localStorage). A collapsed section is a viewing
// convenience, not a filter, so it stays out of the URL. Storage that is
// blocked or full only means nothing is remembered.
'use client'

import { useCallback, useState } from 'react'
import { collapsedKey, readCollapsed } from '@/lib/classGradeSections'

export interface CollapsedGrades {
  collapsed: Set<string>
  toggle: (key: string) => void
  /** Collapse (or expand) every key at once: Collapse all / Expand all. */
  setMany: (keys: string[], collapse: boolean) => void
}

const recall = (key: string | null): Set<string> => {
  if (!key || typeof window === 'undefined') return new Set()
  try {
    return readCollapsed(window.localStorage.getItem(key))
  } catch {
    return new Set()
  }
}

export function useCollapsedGrades(school: string, userId: string | null): CollapsedGrades {
  const storageKey = userId ? collapsedKey(school, userId) : null
  const [state, setState] = useState(() => ({ key: storageKey, collapsed: recall(storageKey) }))
  // Another person (or the user store filling in after load): their own set.
  if (state.key !== storageKey) setState({ key: storageKey, collapsed: recall(storageKey) })

  const update = useCallback(
    (next: (prev: Set<string>) => Set<string>) =>
      setState((prev) => {
        const collapsed = next(prev.collapsed)
        try {
          if (prev.key) window.localStorage.setItem(prev.key, JSON.stringify([...collapsed]))
        } catch {
          // Blocked or full storage: the change still applies for this visit.
        }
        return { key: prev.key, collapsed }
      }),
    [],
  )

  const toggle = useCallback(
    (key: string) =>
      update((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      }),
    [update],
  )

  const setMany = useCallback(
    (keys: string[], collapse: boolean) =>
      update((prev) => {
        const next = new Set(prev)
        for (const key of keys) {
          if (collapse) next.add(key)
          else next.delete(key)
        }
        return next
      }),
    [update],
  )

  return { collapsed: state.collapsed, toggle, setMany }
}
