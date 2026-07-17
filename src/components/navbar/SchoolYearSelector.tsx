'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore, useSelectedYear } from '@/store/useSchoolYearStore'
import { getSchoolYears } from '@/services/schoolYearService'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

// The year store has no hasHydrated field (unlike useUserStore), so we read
// the persist middleware's hydration flag directly via useSyncExternalStore.
// This avoids a flash of the pre-hydration default ([]/null) and prevents
// setYears/selectYear from firing against stale state before rehydration.
function useYearStoreHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => useSchoolYearStore.persist.onFinishHydration(onStoreChange),
    () => useSchoolYearStore.persist.hasHydrated(),
    () => false,
  )
}

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
    <>
      <div className="flex items-center gap-2">
        <CalendarDaysIcon className="h-5 w-5 text-slate-400 hidden sm:block" />
        <select
          value={selected?.schoolYearId ?? ''}
          onChange={(e) => selectYear(e.target.value)}
          disabled={years.length < 2}
          aria-label="School year"
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 cursor-pointer disabled:cursor-default"
        >
          {years.map((y) => (
            <option key={y.schoolYearId} value={y.schoolYearId}>
              {y.label}{y.isActive ? ' (current)' : ''}
            </option>
          ))}
        </select>
      </div>

      {selected && !selected.isActive && (
        <div className="fixed top-[5.5rem] left-1/2 -translate-x-1/2 z-40 mt-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium shadow-sm whitespace-nowrap">
          Viewing {selected.label}
          {user?.role !== 'ADMIN' ? ' — read-only' : ' (past year — edits apply to that year)'}
        </div>
      )}
    </>
  )
}
