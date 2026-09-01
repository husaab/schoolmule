'use client'

// A number and what it counts. Colour is reserved for figures that can be
// good or bad — a healthy attendance rate reads green, a slipping one amber,
// a poor one red — so a glance lands on what needs attention. Plain counts
// (students, classes) stay neutral, because there is no "bad" value.

import React from 'react'

export type StatTone = 'neutral' | 'good' | 'warn' | 'bad'

interface StatTileProps {
  label: string
  value: string | number
  tone?: StatTone
  /** Smaller, denser variant for secondary figures. */
  compact?: boolean
}

const TONES: Record<StatTone, { bar: string; value: string; ring: string }> = {
  neutral: { bar: 'bg-slate-200', value: 'text-slate-900', ring: 'border-slate-200/70' },
  good: { bar: 'bg-emerald-500', value: 'text-emerald-700', ring: 'border-emerald-200' },
  warn: { bar: 'bg-amber-500', value: 'text-amber-700', ring: 'border-amber-200' },
  bad: { bar: 'bg-rose-500', value: 'text-rose-700', ring: 'border-rose-200' },
}

/** Maps a 0–1 rate to a tone. Null stays neutral — missing is not bad. */
export const toneForRate = (rate: number | null | undefined): StatTone => {
  if (typeof rate !== 'number') return 'neutral'
  if (rate >= 0.93) return 'good'
  if (rate >= 0.85) return 'warn'
  return 'bad'
}

/** Same idea for a 0–100 percentage score. */
export const toneForScore = (score: number | null | undefined): StatTone => {
  if (typeof score !== 'number') return 'neutral'
  if (score >= 75) return 'good'
  if (score >= 60) return 'warn'
  return 'bad'
}

const StatTile: React.FC<StatTileProps> = ({ label, value, tone = 'neutral', compact = false }) => {
  const t = TONES[tone]

  if (compact) {
    return (
      <div className="flex items-baseline gap-2">
        <span className={`font-mono tabular-nums text-sm font-semibold ${t.value}`}>{value}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
    )
  }

  return (
    <div className={`relative bg-white rounded-2xl border ${t.ring} pl-5 pr-4 py-4 overflow-hidden`}>
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${t.bar}`} aria-hidden />
      <p className={`font-mono tabular-nums text-2xl font-semibold ${t.value}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

export default StatTile
