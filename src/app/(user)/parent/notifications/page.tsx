'use client'

// A parent's email preferences: the weekly (or daily) summary and the
// missing-work alert. The weekly email's "Get it daily" and "Turn it off"
// links open this page with ?set=daily or ?set=off; that change is saved
// straight away, confirmed with a toast, and dropped from the address.

import { Suspense, useCallback, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import NotificationPrefsForm from '@/components/parent/NotificationPrefsForm'
import ParentPageShell from '@/components/parent/ParentPageShell'
import { parseSetParam } from '@/lib/notificationPrefs'

function NotificationsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Read once: dropping ?set= from the address must not undo the pre-applied change.
  const [autoSet] = useState(() => parseSetParam(searchParams.get('set')))
  const dropSet = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('set')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  return (
    <ParentPageShell
      title="Email preferences"
      subtitle="Choose which emails you get about your children's classes."
      badge={{ icon: EnvelopeIcon, label: 'Parent' }}
    >
      <NotificationPrefsForm autoSet={autoSet} onAutoSetDone={dropSet} />
    </ParentPageShell>
  )
}

export default function ParentNotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsContent />
    </Suspense>
  )
}
