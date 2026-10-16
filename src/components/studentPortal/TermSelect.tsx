// src/components/studentPortal/TermSelect.tsx
// The term picker in the Grades page's top bar ("Term 1 ▾"). A native select,
// so it works with a keyboard and on a phone without extra code.
'use client'

import { ChevronDownIcon } from '@heroicons/react/24/outline'
import type { GradeTerm } from '@/services/types/studentPortal'

interface TermSelectProps {
  terms: GradeTerm[]
  value: string
  onChange: (termId: string) => void
}

export default function TermSelect({ terms, value, onChange }: TermSelectProps) {
  if (terms.length === 0) return null
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Term</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-[10px] border border-slate-200 bg-white py-2 pl-3.5 pr-9 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {terms.map((t) => (
          <option key={t.termId} value={t.termId}>
            {t.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
    </label>
  )
}
