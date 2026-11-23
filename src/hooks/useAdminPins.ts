// src/hooks/useAdminPins.ts
// The admin panel tools this person pinned to the top, remembered on this
// browser (localStorage) per account and school (lib/adminPins). A pin is a
// viewing convenience, so it stays out of the URL; blocked or full storage
// only means nothing is remembered.
'use client'

import { useCallback, useState } from 'react'
import { parsePins, pinsKey, togglePin } from '@/lib/adminPins'

export interface AdminPins {
  pins: string[]
  isPinned: (href: string) => boolean
  toggle: (href: string) => void
}

const recall = (key: string | null): string[] => {
  if (!key || typeof window === 'undefined') return []
  try {
    return parsePins(window.localStorage.getItem(key))
  } catch {
    return []
  }
}

export function useAdminPins(userId: string | null, school: string | null): AdminPins {
  const storageKey = userId ? pinsKey(userId, school) : null
  const [state, setState] = useState(() => ({ key: storageKey, pins: recall(storageKey) }))
  // Another person (or the user store filling in after load): their own pins.
  if (state.key !== storageKey) setState({ key: storageKey, pins: recall(storageKey) })

  const toggle = useCallback(
    (href: string) =>
      setState((prev) => {
        const pins = togglePin(prev.pins, href)
        try {
          if (prev.key) window.localStorage.setItem(prev.key, JSON.stringify(pins))
        } catch {
          // Not remembered; the pin still shows until the page reloads.
        }
        return { ...prev, pins }
      }),
    [],
  )

  const isPinned = useCallback((href: string) => state.pins.includes(href), [state.pins])
  return { pins: state.pins, isPinned, toggle }
}
