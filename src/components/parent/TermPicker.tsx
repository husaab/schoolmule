'use client'

import React, { useEffect, useState } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore, useSelectedYear } from '@/store/useSchoolYearStore'
import { getTermsBySchool } from '@/services/termService'
import { TermPayload } from '@/services/types/term'

interface TermPickerProps {
  /** '' = current (active) term — the backend default; 'all' = all terms */
  value: string
  onChange: (termId: string) => void
  includeAll?: boolean
}

/** Small term selector for parent pages. */
const TermPicker: React.FC<TermPickerProps> = ({ value, onChange, includeAll = true }) => {
  const user = useUserStore((s) => s.user)
  const [terms, setTerms] = useState<TermPayload[]>([])
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // term list is year-scoped server-side
  const selectedYear = useSelectedYear()

  useEffect(() => {
    if (!user?.school) return
    getTermsBySchool(user.school)
      .then((res) => setTerms(res.data || []))
      .catch(() => {})
  }, [user?.school, selectedYearId])

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
    >
      <option value="">
        {selectedYear && !selectedYear.isActive ? 'Default term' : 'Current term'}
      </option>
      {terms.map((t) => (
        <option key={t.termId} value={t.termId}>
          {t.name}
        </option>
      ))}
      {includeAll && <option value="all">All terms</option>}
    </select>
  )
}

export default TermPicker
