// src/components/tours/useTourCtx.ts
// Everything the shared tour rules need to know about the person and page.
'use client'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { TourCtx } from '@/lib/tours'
import { useAnyModalOpen } from '@/components/shared/modal'
import { useImpersonationStore } from '@/store/useImpersonationStore'
import { usePatchNotesStore } from '@/store/usePatchNotesStore'
import { useTourStore } from '@/store/useTourStore'
import { useUserStore } from '@/store/useUserStore'
import { useTourConditions } from './tourConditions'
import { routeAt } from './tourRoutes'

/** The time, refreshed each minute (offer windows and Later are measured in days). */
function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function useTourCtx(): TourCtx {
  const clock = useNow()
  const user = useUserStore((s) => s.user)
  const impersonating = useImpersonationStore((s) => Boolean(s.session))
  const checked = usePatchNotesStore((s) => s.checked)
  const whatsNewOpen = usePatchNotesStore((s) => s.modalOpen)
  const createdAt = useTourStore((s) => s.createdAt)
  const skewMs = useTourStore((s) => s.skewMs)
  const pathname = usePathname()
  const conditions = useTourConditions()
  const dialogOpen = useAnyModalOpen()
  return useMemo(
    () => ({
      now: new Date(clock + skewMs),
      platform: 'web',
      user,
      userCreatedAt: createdAt,
      impersonating,
      // Students have no What's New: AuthGuard marks the check done for them.
      // Never offer over an open dialog either (a link can open one, like the
      // meetings invitation's Plan my visit).
      blocked: !checked || whatsNewOpen || dialogOpen,
      here: routeAt(pathname, user.role),
      conditions,
    }),
    [clock, user, createdAt, skewMs, impersonating, checked, whatsNewOpen, dialogOpen, pathname, conditions]
  )
}
