// One-tap rating buttons for the progress comment ratings (Core Standards,
// Work Habits, Behavior). Clicking the chosen one again clears it. While
// nothing is chosen, a suggested option is outlined in violet.
'use client'

import React from 'react'

export interface RatingOption {
  value: string
  label: string
  /** The full name, shown on hover ("E - Excellent"). */
  title?: string
}

const SELECTED: Record<string, string> = {
  E: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  G: 'bg-sky-100 text-sky-800 border-sky-300',
  S: 'bg-amber-100 text-amber-800 border-amber-300',
  N: 'bg-rose-100 text-rose-800 border-rose-300',
}
const SELECTED_DEFAULT = 'bg-emerald-100 text-emerald-800 border-emerald-300'

export function RatingButtons({
  label,
  options,
  value,
  suggested,
  onChange,
  disabled,
}: {
  label: string
  options: RatingOption[]
  value: string
  suggested?: string | null
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.value === value
        const isSuggested = !value && suggested === o.value
        return (
          <button
            key={o.value}
            type="button"
            title={o.title ?? o.label}
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(on ? '' : o.value)}
            className={`min-w-9 px-2.5 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              on
                ? `${SELECTED[o.value] ?? SELECTED_DEFAULT} font-semibold`
                : isSuggested
                  ? 'border-dashed border-violet-400 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
