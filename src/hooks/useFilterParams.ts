// Shared URL-backed filter state. Filters live in the query string so the
// browser Back/forward buttons, refresh, and shared links all restore them.
//
// On top of that, every page remembers the last query it showed (per tab,
// per user, per school year: src/lib/filterMemory.ts). A bare URL (the
// sidebar, an in-app Back arrow, a dashboard tile) is re-expanded from that
// memory, so "Students filtered to Grade 2 → open a class → back" lands on
// Grade 2 again whichever way the user came back. The URL still wins the
// moment it carries anything, so deep links and bookmarks behave as before.
//
// NOTE: any component calling this hook reads useSearchParams(), so on a
// statically-prerendered route it MUST be rendered under a <Suspense> boundary
// or `next build` will fail.
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import {
  DEFAULT_TRANSIENT_KEYS,
  filterMemoryKey,
  getFilterMemoryStorage,
  getFilterMemoryVersion,
  hasFilterParams,
  recallQuery,
  rememberQuery,
  rememberedHref,
  resolveQuery,
  subscribeFilterMemory,
} from '@/lib/filterMemory'

export type FilterPatch = Record<string, string | null | undefined>

export interface FilterParamsOptions {
  /** Extra query keys this page treats as momentary (never remembered). */
  transient?: string[]
  /** Opt the page out of memory entirely (URL-only, the old behaviour). */
  remember?: boolean
}

export interface FilterParams {
  /** Read one filter, with a fallback when absent. */
  get: (key: string, fallback?: string) => string
  /** Every effective param (URL, or the remembered query on a bare URL). */
  params: URLSearchParams
  /** Merge a patch into the query string and replace the URL (no scroll, no history push). */
  setParams: (patch: FilterPatch) => void
  /** Update the memory only, without touching the URL (used when leaving the page mid-debounce). */
  remember: (patch: FilterPatch) => void
}

const applyPatch = (base: string, patch: FilterPatch): string => {
  const next = new URLSearchParams(base)
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === '') next.delete(key)
    else next.set(key, value)
  }
  return next.toString()
}

export function useFilterParams(options: FilterParamsOptions = {}): FilterParams {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const userId = useUserStore((s) => s.user.id)
  const yearId = useSchoolYearStore((s) => s.selectedYearId)

  const { remember: rememberEnabled = true } = options
  // Options are usually inline literals; key them by value so they are stable.
  const transientKey = (options.transient ?? []).join(',')
  const transient = useMemo(
    () => (transientKey ? [...DEFAULT_TRANSIENT_KEYS, ...transientKey.split(',')] : DEFAULT_TRANSIENT_KEYS),
    [transientKey],
  )

  const storage = rememberEnabled && userId ? getFilterMemoryStorage() : null
  const memoryKey = userId ? filterMemoryKey(userId, yearId, pathname) : null

  const urlQs = searchParams.toString()
  // Synchronous resolve: the first render (and the first fetch) already use
  // the remembered filters; only the address bar catches up in the effect.
  const remembered = storage && memoryKey ? recallQuery(storage, memoryKey) : null
  const effectiveQs = resolveQuery(urlQs, remembered)
  const params = useMemo(() => new URLSearchParams(effectiveQs), [effectiveQs])

  // Two setParams calls in one tick used to clobber each other (both merged
  // into the same stale snapshot). Track the last query we wrote until the
  // URL catches up, and merge into that instead.
  const pendingQsRef = useRef<string | null>(null)
  useEffect(() => {
    pendingQsRef.current = null
  }, [urlQs])

  useEffect(() => {
    if (!storage || !memoryKey) return
    if (urlQs === '') {
      if (remembered) router.replace(`${pathname}?${remembered}`, { scroll: false })
    } else if (hasFilterParams(urlQs, transient)) {
      // Deep links update the memory too, so a later bare visit shows them.
      rememberQuery(storage, memoryKey, urlQs, transient)
    }
  }, [storage, memoryKey, urlQs, remembered, pathname, router, transient])

  const get = useCallback((key: string, fallback = '') => params.get(key) ?? fallback, [params])

  const setParams = useCallback(
    (patch: FilterPatch) => {
      const base = pendingQsRef.current ?? effectiveQs
      const qs = applyPatch(base, patch)
      pendingQsRef.current = qs
      // Memory first, so a "Clear filters" (qs === '') is not undone by the
      // bare-URL restore in the effect above.
      if (storage && memoryKey) rememberQuery(storage, memoryKey, qs, transient)
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, effectiveQs, storage, memoryKey, transient],
  )

  const remember = useCallback(
    (patch: FilterPatch) => {
      if (!storage || !memoryKey) return
      rememberQuery(storage, memoryKey, applyPatch(pendingQsRef.current ?? effectiveQs, patch), transient)
    },
    [storage, memoryKey, effectiveQs, transient],
  )

  return { get, params, setParams, remember }
}

/**
 * A text input bound to one URL filter with a short delay, so typing stays
 * snappy while the URL (and memory) follow. The draft resyncs whenever the
 * URL value changes from outside (Clear filters, a sidebar re-click, Back),
 * and a pending write is still remembered if the user leaves mid-typing.
 */
export function useDebouncedParam(
  filters: Pick<FilterParams, 'get' | 'setParams' | 'remember'>,
  key: string,
  delay = 250,
): [string, (value: string) => void] {
  const urlValue = filters.get(key)
  const [draft, setDraft] = useState(urlValue)
  // Adjust state during render when the URL moves under us (React's
  // "derive, don't sync in an effect" pattern). An echo of our own write
  // leaves newer keystrokes alone; any other change is adopted.
  const [syncedUrl, setSyncedUrl] = useState(urlValue)
  const [pushed, setPushed] = useState<string | null>(null)
  if (urlValue !== syncedUrl) {
    setSyncedUrl(urlValue)
    setPushed(null)
    if (urlValue !== pushed) setDraft(urlValue)
  }

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The timer fires after later renders: always use the latest draft and the
  // latest setParams so it merges into the current URL, not a stale snapshot.
  const latest = useRef({ filters, draft, urlValue })
  useEffect(() => {
    latest.current = { filters, draft, urlValue }
  })

  useEffect(
    () => () => {
      if (!timer.current) return
      clearTimeout(timer.current)
      timer.current = null
      // Leaving mid-debounce: keep what was typed for the next visit, but do
      // not touch the URL of the page we are leaving.
      const { filters: f, draft: d, urlValue: u } = latest.current
      if (d !== u) f.remember({ [key]: d })
    },
    [key],
  )

  const update = useCallback(
    (value: string) => {
      setDraft(value)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        const { filters: f, draft: d, urlValue: u } = latest.current
        if (d === u) return
        setPushed(d)
        f.setParams({ [key]: d })
      }, delay)
    },
    [key, delay],
  )

  return [draft, update]
}

/**
 * The href for a bare path with that page's remembered filters appended, for
 * sidebar items and in-app Back arrows. Reads no search params, so it needs
 * no Suspense boundary; it re-renders when any page updates its memory.
 */
export function useRememberedHref(to: string): string {
  const version = useSyncExternalStore(subscribeFilterMemory, getFilterMemoryVersion, () => -1)
  const userId = useUserStore((s) => s.user.id)
  const yearId = useSchoolYearStore((s) => s.selectedYearId)
  return useMemo(() => {
    // version < 0 is the server snapshot: render the bare href until hydrated.
    if (version < 0 || !userId) return to
    return rememberedHref(getFilterMemoryStorage(), filterMemoryKey(userId, yearId, to), to)
  }, [to, userId, yearId, version])
}
