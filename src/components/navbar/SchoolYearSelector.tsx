'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore, useSelectedYear, useYearStoreHydrated } from '@/store/useSchoolYearStore'
import { getSchoolYears } from '@/services/schoolYearService'

export default function SchoolYearSelector() {
  const hasHydrated = useYearStoreHydrated()
  const user = useUserStore((s) => s.user)
  const years = useSchoolYearStore((s) => s.years)
  const setYears = useSchoolYearStore((s) => s.setYears)
  const selectYear = useSchoolYearStore((s) => s.selectYear)
  const selected = useSelectedYear()

  // Refresh the year list on mount (covers stale persisted state and years
  // created in another session).
  useEffect(() => {
    if (!hasHydrated || !user?.school) return
    getSchoolYears()
      .then((res) => { if (res.status === 'success') setYears(res.data) })
      .catch(() => { /* keep whatever is persisted */ })
  }, [hasHydrated, user?.school, setYears])

  if (!hasHydrated || user?.role === 'PARENT' || years.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected?.schoolYearId ?? ''}
        onChange={(e) => selectYear(e.target.value)}
        // Only disable when there's exactly one year and it's already the
        // selected active one — otherwise a lone draft year (first-year
        // bootstrap, or nothing selected yet) must stay pickable.
        disabled={years.length < 2 && !!selected?.isActive}
        aria-label="School year"
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 cursor-pointer disabled:cursor-default"
      >
        {!selected && <option value="">Select year…</option>}
        {years.map((y) => (
          <option key={y.schoolYearId} value={y.schoolYearId}>
            {y.label}{y.isActive ? ' (current)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
