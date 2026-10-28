// Open and close the Observe alert incident modal from any Observe page. The
// modal (components/observe/alerts/IncidentModalHost) lives in ObserveShell
// and reads ?incident= from the URL; see lib/observeAlerts.
'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { INCIDENT_PARAM, withIncident, withoutIncident } from '@/lib/observeAlerts'
import { hrefWithQuery } from '@/lib/studentProfileUrl'

// True when open() pushed the entry, so closing can step Back. An incident
// reached from an email, a push or a refresh closes by replacing the URL.
let openedByPush = false

export function useIncidentModal() {
  const router = useRouter()
  const pathname = usePathname()

  const open = useCallback(
    (id: string) => {
      const current = window.location.search
      const href = hrefWithQuery(pathname, withIncident(current, id))
      if (new URLSearchParams(current).has(INCIDENT_PARAM)) {
        router.replace(href, { scroll: false })
      } else {
        openedByPush = true
        router.push(href, { scroll: false })
      }
    },
    [router, pathname]
  )

  const close = useCallback(() => {
    if (openedByPush) {
      openedByPush = false
      router.back()
    } else {
      router.replace(hrefWithQuery(pathname, withoutIncident(window.location.search)), { scroll: false })
    }
  }, [router, pathname])

  return { open, close }
}
