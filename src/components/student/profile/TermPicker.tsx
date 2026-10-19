'use client'

import React from 'react'
import type { ProfileTerm } from '@/services/types/studentProfile'

/** Segmented term switch; a school year has a handful of terms at most. */
const TermPicker: React.FC<{ terms: ProfileTerm[]; value: string | null; onChange: (termId: string) => void }> = ({
  terms,
  value,
  onChange,
}) => {
  if (terms.length === 0) return null
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1" role="tablist" aria-label="Term">
      {terms.map((t) => {
        const active = t.termId === value
        return (
          <button
            key={t.termId}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.termId)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 ring-1 ring-cyan-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {t.name}
            {t.isActive && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" title="Current term" />}
          </button>
        )
      })}
    </div>
  )
}

export default TermPicker
