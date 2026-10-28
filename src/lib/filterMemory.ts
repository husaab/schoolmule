// Filter memory: the last query string each page wrote, remembered per tab so
// a sidebar click or an in-app Back arrow (both bare hrefs) lands the user on
// the page exactly as they left it. Pure functions only; the React side is
// src/hooks/useFilterParams.ts.
//
// Keys are scoped by user and school year so a sign-in as someone else, or a
// year switch, never resurrects filters (class ids, term names) that are not
// theirs. sessionStorage keeps two tabs from fighting and empties with the tab.

import { STUDENT_PROFILE_PARAMS } from './studentProfileUrl'
import { ASK_LINK_PARAMS } from './askLink'
import { INCIDENT_PARAM } from './observeAlerts'

export const FILTER_MEMORY_PREFIX = 'sm.filters.v1:'

/** Query keys that describe a moment, not a filter: never remembered. */
export const DEFAULT_TRANSIENT_KEYS: readonly string[] = [
  'thread',
  'announcement',
  'preview',
  'duplicateFrom',
  'manual',
  'variations',
  'next',
  'token',
  'invite',
  'reset',
  // OAuth round-trip outcomes (see useOAuthOutcome)
  'qbo',
  'google',
  // The student profile modal, open over any page (see lib/studentProfileUrl)
  ...Object.values(STUDENT_PROFILE_PARAMS),
  // An email's "Ask the teacher about this" (see lib/askLink)
  ...Object.values(ASK_LINK_PARAMS),
  // An Observe alert incident open in its modal (see lib/observeAlerts)
  INCIDENT_PARAM,
]

/** The subset of the Storage interface the memory needs; sessionStorage fits. */
export type MemoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>

export const filterMemoryKey = (userId: string, yearId: string | null | undefined, pathname: string): string =>
  `${FILTER_MEMORY_PREFIX}${userId}:${yearId ?? 'none'}:${pathname}`

/** Drop transient keys from a query string; the remaining order is preserved. */
export const stripTransient = (qs: string, transient: readonly string[] = DEFAULT_TRANSIENT_KEYS): string => {
  const params = new URLSearchParams(qs)
  for (const key of transient) params.delete(key)
  return params.toString()
}

/** True when the query carries at least one key that is a real filter. */
export const hasFilterParams = (qs: string, transient: readonly string[] = DEFAULT_TRANSIENT_KEYS): boolean =>
  stripTransient(qs, transient) !== ''

/** Keep only the transient keys of a query string (to carry them through a restore). */
export const onlyTransient = (qs: string, transient: readonly string[] = DEFAULT_TRANSIENT_KEYS): string => {
  const params = new URLSearchParams(qs)
  for (const key of Array.from(params.keys())) {
    if (!transient.includes(key)) params.delete(key)
  }
  return params.toString()
}

// Links that embed a remembered query (sidebar, Back arrows) subscribe here
// so they re-render when a page writes its memory. A plain version counter is
// enough for useSyncExternalStore.
let memoryVersion = 0
const listeners = new Set<() => void>()
const notifyFilterMemory = (): void => {
  memoryVersion += 1
  for (const listener of listeners) listener()
}
export const subscribeFilterMemory = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const getFilterMemoryVersion = (): number => memoryVersion

/** Remember a query string ("" is a valid value: the user cleared the filters). */
export const rememberQuery = (
  storage: MemoryStorage | null,
  key: string,
  qs: string,
  transient: readonly string[] = DEFAULT_TRANSIENT_KEYS,
): void => {
  if (!storage) return
  try {
    const next = stripTransient(qs, transient)
    if (storage.getItem(key) === next) return
    storage.setItem(key, next)
    notifyFilterMemory()
  } catch {
    // Quota or privacy mode: the page simply does not remember.
  }
}

/** The href for a bare path, re-expanded with that page's remembered query. */
export const rememberedHref = (storage: MemoryStorage | null, key: string, to: string): string => {
  if (to.includes('?')) return to
  const qs = recallQuery(storage, key)
  return qs ? `${to}?${qs}` : to
}

/** The remembered query string, or null when the page was never visited. */
export const recallQuery = (storage: MemoryStorage | null, key: string): string | null => {
  if (!storage) return null
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Which query string the page should show. The URL wins as soon as it carries
 * anything (deep links, bookmarks, a thread param); a bare URL is re-expanded
 * from memory.
 */
export const resolveQuery = (urlQs: string, remembered: string | null): string =>
  urlQs !== '' ? urlQs : remembered ?? ''

/** Forget every page for every user: called when a session ends. */
export const clearFilterMemory = (storage: MemoryStorage | null): void => {
  if (!storage) return
  try {
    const doomed: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith(FILTER_MEMORY_PREFIX)) doomed.push(key)
    }
    for (const key of doomed) storage.removeItem(key)
    if (doomed.length > 0) notifyFilterMemory()
  } catch {
    // Nothing to clear, or storage is unavailable.
  }
}

/** The browser's per-tab storage, or null outside a browser / when blocked. */
export const getFilterMemoryStorage = (): MemoryStorage | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}
