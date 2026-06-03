'use client'

// Horizontal box-plot rows rendered with pure CSS (Recharts has no native
// boxplot and the SVG-overlay workaround is brittle). Each row shows
// min—max whiskers, the q1→q3 box, a median tick and a mean dot on a
// 0–100% track.

import React, { useState } from 'react'
import { SummaryStats } from '@/services/types/analytics'

export interface QuartileRow {
  label: string
  stats: SummaryStats | null
  /** Drill-down handler — row becomes clickable when provided. */
  onClick?: () => void
}

interface QuartileChartProps {
  rows: QuartileRow[]
}

const pct = (v: number) => `${Math.max(0, Math.min(100, v))}%`

const QuartileChart: React.FC<QuartileChartProps> = ({ rows }) => {
  const [hovered, setHovered] = useState<string | null>(null)

  if (rows.length === 0) {
    return <div className="py-10 text-center text-sm text-slate-400">No data for this selection</div>
  }

  return (
    <div className="space-y-1">
      {/* Scale header */}
      <div className="flex items-center gap-3">
        <div className="w-28 sm:w-36 flex-shrink-0" />
        <div className="flex-1 flex justify-between text-[10px] text-slate-400 px-0.5">
          {[0, 25, 50, 75, 100].map((t) => (
            <span key={t}>{t}%</span>
          ))}
        </div>
      </div>

      {rows.map((row) => {
        const s = row.stats
        const isHovered = hovered === row.label
        return (
          <div
            key={row.label}
            className={`flex items-center gap-3 rounded-xl px-0.5 py-2 transition-colors ${
              row.onClick ? 'cursor-pointer hover:bg-cyan-50/40' : ''
            }`}
            onClick={row.onClick}
            onMouseEnter={() => setHovered(row.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="w-28 sm:w-36 flex-shrink-0 text-xs font-medium text-slate-600 truncate" title={row.label}>
              {row.label}
            </div>

            <div className="flex-1 relative h-7">
              {/* Track with quartile gridlines */}
              <div className="absolute inset-y-2.5 inset-x-0 bg-slate-100 rounded-full" />
              {[25, 50, 75].map((t) => (
                <div key={t} className="absolute inset-y-1.5 w-px bg-slate-200" style={{ left: pct(t) }} />
              ))}

              {s ? (
                <>
                  {/* Whisker min → max */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-slate-300 rounded-full"
                    style={{ left: pct(s.min), width: pct(Math.max(0.5, s.max - s.min)) }}
                  />
                  {/* Whisker caps */}
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-slate-400 rounded-full" style={{ left: pct(s.min) }} />
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-slate-400 rounded-full" style={{ left: pct(s.max) }} />
                  {/* IQR box */}
                  <div
                    className="absolute inset-y-1 bg-gradient-to-r from-cyan-500/70 to-teal-500/70 rounded-md border border-cyan-600/30"
                    style={{ left: pct(s.q1), width: pct(Math.max(1, s.q3 - s.q1)) }}
                  />
                  {/* Median tick */}
                  <div
                    className="absolute inset-y-0.5 w-[3px] bg-cyan-800 rounded-full"
                    style={{ left: `calc(${pct(s.median)} - 1px)` }}
                  />
                  {/* Mean dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-2 border-amber-500 rounded-full shadow-sm"
                    style={{ left: `calc(${pct(s.avg)} - 4px)` }}
                  />

                  {isHovered && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                      min {s.min} · q1 {s.q1} · <span className="font-semibold">med {s.median}</span> · q3 {s.q3} · max {s.max} · avg {s.avg}
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center text-[10px] text-slate-400 pl-2">no graded data</div>
              )}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 pl-1 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-2 bg-gradient-to-r from-cyan-500/70 to-teal-500/70 rounded-sm inline-block" /> q1–q3
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-0.5 h-3 bg-cyan-800 rounded-full inline-block" /> median
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 bg-white border-2 border-amber-500 rounded-full inline-block" /> mean
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-slate-300 inline-block" /> min–max
        </span>
      </div>
    </div>
  )
}

export default QuartileChart
