// Shared URL-backed filter state. Filters live in the query string so the
// browser Back/forward buttons, refresh, and shared links all restore them.
// Mirrors the convention in analytics/_hooks/useAnalyticsParams.ts.
//
// NOTE: any component calling this hook reads useSearchParams(), so on a
// statically-prerendered route it MUST be rendered under a <Suspense> boundary
// or `next build` will fail.
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function useFilterParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const get = useCallback(
    (key: string, fallback = '') => searchParams.get(key) ?? fallback,
    [searchParams]
  )

  // Merge a patch into the current query string and replace the URL (no scroll,
  // no history push). Empty/null values are removed to keep URLs clean.
  const setParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === '') next.delete(key)
        else next.set(key, value)
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return { get, setParams }
}
