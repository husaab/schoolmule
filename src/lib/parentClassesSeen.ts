// src/lib/parentClassesSeen.ts
// Whether the parent has opened the Classes page yet, for the small "New"
// pill beside it in the sidebar. Kept in localStorage (sm.parent.classesSeen);
// when storage is unavailable the pill goes away for this tab only. The server
// snapshot says "seen", so the pill never flashes before hydration.

import { useSyncExternalStore } from 'react'

export const PARENT_CLASSES_SEEN_KEY = 'sm.parent.classesSeen'

let seenInThisTab = false
const listeners = new Set<() => void>()

const read = (): boolean => {
  if (seenInThisTab) return true
  try {
    return window.localStorage.getItem(PARENT_CLASSES_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The parent opened the Classes page: the pill goes away, for good where storage allows. */
export function markParentClassesSeen(): void {
  seenInThisTab = true
  try {
    window.localStorage.setItem(PARENT_CLASSES_SEEN_KEY, '1')
  } catch {
    // Storage unavailable: seen for this tab only.
  }
  listeners.forEach((l) => l())
}

/** True once the Classes page has been opened. */
export const useParentClassesSeen = (): boolean => useSyncExternalStore(subscribe, read, () => true)
