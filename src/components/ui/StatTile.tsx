'use client'

// A number and what it counts. Deliberately unadorned — the dashboard's
// emphasis belongs to the schedule, so the metrics read as a quiet row.

import React from 'react'

interface StatTileProps {
  label: string
  value: string | number
  /** Smaller, denser variant for secondary figures. */
  compact?: boolean
}

const StatTile: React.FC<StatTileProps> = ({ label, value, compact = false }) =>
  compact ? (
    <div className="flex items-baseline gap-2">
      <span className="font-mono tabular-nums text-sm font-semibold text-slate-800">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  ) : (
    <div className="bg-white rounded-2xl border border-slate-200/70 px-5 py-4">
      <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )

export default StatTile
