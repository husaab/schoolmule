'use client'

import { useUserStore } from '@/store/useUserStore'
import { useSelectedYear, useYearStoreHydrated } from '@/store/useSchoolYearStore'

// Rendered once, outside any transformed ancestor (see Navbar.tsx), so that
// `position: fixed` resolves against the viewport rather than a transformed
// container (e.g. Sidebar's <aside>, which has `transform` for its off-canvas
// slide animation and would otherwise become the containing block).
export default function PastYearBanner() {
  const hasHydrated = useYearStoreHydrated()
  const user = useUserStore((s) => s.user)
  const selected = useSelectedYear()

  if (!hasHydrated || user?.role === 'PARENT') return null
  if (!selected || selected.isActive) return null

  return (
    <div className="fixed top-[5.5rem] left-1/2 -translate-x-1/2 lg:left-[calc(50%+9rem)] z-40 mt-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium shadow-sm whitespace-nowrap">
      Viewing {selected.label}
      {user?.role !== 'ADMIN' ? ' — read-only' : ' (past year — edits apply to that year)'}
    </div>
  )
}
