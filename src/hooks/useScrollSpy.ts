// src/hooks/useScrollSpy.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseScrollSpyOptions {
  /** DOM ids of the sections to track, in page order */
  sectionIds: string[]
  /** Pixels hidden under the fixed navbar plus breathing room */
  offsetPx?: number
}

/**
 * Tracks which page section is currently in view (scroll-spy) and provides
 * a scroll helper that accounts for the fixed navbar.
 */
export function useScrollSpy({ sectionIds, offsetPx = 100 }: UseScrollSpyOptions) {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null)
  const visibleIds = useRef<Set<string>>(new Set())
  // Suppresses observer updates while a programmatic smooth-scroll is in
  // flight, so sections passing by don't flicker the highlight
  const scrollLockUntil = useRef(0)

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleIds.current.add(entry.target.id)
          else visibleIds.current.delete(entry.target.id)
        })
        if (Date.now() < scrollLockUntil.current) return
        // Topmost (DOM-order) section inside the band under the navbar wins
        const firstVisible = sectionIds.find((id) => visibleIds.current.has(id))
        if (firstVisible) setActiveId(firstVisible)
      },
      {
        // Thin horizontal band starting just under the fixed navbar; a section
        // counts as "current" only while it overlaps that band
        rootMargin: `-${offsetPx}px 0px -70% 0px`,
        threshold: 0,
      }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIds.join(','), offsetPx])

  const scrollTo = useCallback(
    (id: string, opts?: { behavior?: ScrollBehavior; updateHash?: boolean }) => {
      const el = document.getElementById(id)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - offsetPx + 4
      scrollLockUntil.current = Date.now() + 800
      window.scrollTo({ top, behavior: opts?.behavior ?? 'smooth' })
      if (opts?.updateHash !== false) {
        window.history.replaceState(null, '', `#${id}`)
      }
      setActiveId(id)
    },
    [offsetPx]
  )

  return { activeId, scrollTo }
}
