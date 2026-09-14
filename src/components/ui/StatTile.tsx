'use client'

// A number and what it counts. Colour is reserved for figures that can be
// good or bad — a healthy attendance rate reads green, a slipping one amber,
// a poor one red — so a glance lands on what needs attention. Plain counts
// (students, classes) stay neutral, because there is no "bad" value.
//
// A tile can also be a door: give it an href and it links to the page that
// explains the number. The delta sits on its own line under the value rather
// than beside it, so it never wraps under the number at tablet widths.

import React from 'react'
import Link from 'next/link'

export type StatTone = 'neutral' | 'good' | 'warn' | 'bad'

export interface StatDelta {
  /** Signed change in the value's own unit (percentage points for rates). */
  value: number
  /** What it is compared against, e.g. "vs Term 1". */
  label: string
}

interface StatTileProps {
  label: string
  value: string | number
  tone?: StatTone
  /** Smaller, denser variant for secondary figures. */
  compact?: boolean
  /** Makes the whole tile a link to where the number comes from. */
  href?: string
  /** Change against a previous period, shown under the value. */
  delta?: StatDelta | null
  /** One quiet line of context under the label. */
  sub?: string
  /** Shows a placeholder where the value goes while it is still loading. */
  loading?: boolean
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

const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  tone = 'neutral',
  compact = false,
  href,
  delta,
  sub,
  loading = false,
}) => {
  const t = TONES[tone]

  if (compact) {
    return (
      <div className="flex items-baseline gap-2">
        <span className={`tabular-nums text-sm font-semibold ${t.value}`}>{value}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
    )
  }

  const body = (
    <div
      className={`relative h-full bg-white rounded-2xl border ${t.ring} pl-5 pr-4 py-4 overflow-hidden transition-colors ${
        href ? 'group-hover:border-cyan-300 group-hover:bg-cyan-50/30' : ''
      }`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${t.bar}`} aria-hidden />
      {loading ? (
        <span className="block h-8 w-20 rounded-lg bg-slate-100 animate-pulse" aria-label="Loading" />
      ) : (
        <p className={`tabular-nums text-2xl font-semibold ${t.value}`}>{value}</p>
      )}
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {delta && (
        <p className="mt-1.5 text-xs tabular-nums">
          <span
            className={`font-semibold rounded-full px-1.5 py-0.5 ${
              delta.value >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {delta.value >= 0 ? '+' : '−'}
            {Math.abs(delta.value).toFixed(1)}
          </span>{' '}
          <span className="text-slate-500">{delta.label}</span>
        </p>
      )}
      {sub && !delta && <p className="mt-1.5 text-xs text-slate-500 tabular-nums">{sub}</p>}
    </div>
  )

  return href ? (
    <Link href={href} className="group block h-full">
      {body}
    </Link>
  ) : (
    body
  )
}

export default StatTile
