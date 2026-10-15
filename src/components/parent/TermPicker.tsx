'use client'

import React, { useEffect, useState } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore, useSelectedYear } from '@/store/useSchoolYearStore'
import { getTermsBySchool } from '@/services/termService'
import { TermPayload } from '@/services/types/term'
import SearchableSelect from '@/components/ui/SearchableSelect'

/** Trigger styling shared by the parent portal's filter dropdowns (stone/amber). */
export const PARENT_SELECT_TRIGGER =
  'px-3 py-2 rounded-xl border border-stone-200 bg-white text-slate-700 shadow-sm focus:ring-amber-200'

interface TermPickerProps {
  /** '' = current (active) term — the backend default; 'all' = all terms */
  value: string
  onChange: (termId: string) => void
  includeAll?: boolean
  /** The year's terms once loaded, for pages that need to know which one is active. */
  onTermsLoaded?: (terms: TermPayload[]) => void
}

/** Small term selector for parent pages. */
const TermPicker: React.FC<TermPickerProps> = ({ value, onChange, includeAll = true, onTermsLoaded }) => {
  const user = useUserStore((s) => s.user)
  const [terms, setTerms] = useState<TermPayload[]>([])
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // term list is year-scoped server-side
  const selectedYear = useSelectedYear()

  useEffect(() => {
    if (!user?.school) return
    getTermsBySchool(user.school)
      .then((res) => {
        const list = res.data || []
        setTerms(list)
        onTermsLoaded?.(list)
      })
      .catch(() => {})
    // onTermsLoaded is a notification callback; re-fetching when its identity changes would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.school, selectedYearId])

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={[
        ...terms.map((t) => ({ value: t.termId, label: t.name })),
        ...(includeAll ? [{ value: 'all', label: 'All terms' }] : []),
      ]}
      allLabel={selectedYear && !selectedYear.isActive ? 'Default term' : 'Current term'}
      ariaLabel="Term"
      triggerClassName={PARENT_SELECT_TRIGGER}
    />
  )
}

export default TermPicker
