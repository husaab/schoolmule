'use client'

import { useUserStore } from '@/store/useUserStore'
import { useSelectedYear, useYearStoreHydrated } from '@/store/useSchoolYearStore'
import { can } from '@/lib/permissions'

// Inline navbar chip shown while a non-active school year is selected.
// Lives inside the navbar's action row (next to the year selector) so it
// never floats over page content.
export default function PastYearBanner() {
  const hasHydrated = useYearStoreHydrated()
  const user = useUserStore((s) => s.user)
  const selected = useSelectedYear()

  if (!hasHydrated) return null
  if (!selected || selected.isActive) return null

  // Past-year writes need school setup (and an admin account); the API
  // refuses everyone else, so their banner says read-only.
  const suffix =
    user?.role === 'ADMIN' && can(user, 'school_setup')
      ? ' (past year — edits apply to that year)'
      : user?.role === 'PARENT'
        ? ''
        : ' — read-only'

  return (
    <div
      className="flex items-center px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium whitespace-nowrap"
      title={`Viewing ${selected.label}${suffix}`}
    >
      Viewing {selected.label}
      {suffix && <span className="hidden xl:inline">{suffix}</span>}
    </div>
  )
}
