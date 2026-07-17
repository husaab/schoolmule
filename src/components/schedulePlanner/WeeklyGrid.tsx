'use client'

// Minute-proportional schedule grid. Columns are either days of the week
// (class/teacher weekly views, public page, widget) or arbitrary entities
// like class groups (the "by day" master view). Powers the admin workspace
// (interactive pinning), the public share page, and the dashboard widget.

import React from 'react'
import { MapPinIcon } from '@heroicons/react/24/solid'
import { colorForLabel, dayLabel, formatMin } from './timeUtils'
import type { TimeRange } from '@/services/types/schedulePlanner'

export interface GridSession {
  id: string
  day: number
  startMin: number
  endMin: number
  title: string
  subtitle?: string | null
  roomName?: string | null
  pinned?: boolean
}

export interface GridFixedBlock {
  day: number
  startMin: number
  endMin: number
  label: string
}

/** One rendered column (a day, or a class group in the by-day view). */
export interface GridColumn {
  key: string
  label: string
  sessions: GridSession[]
  fixedBlocks: GridFixedBlock[]
  fillableRanges?: TimeRange[]
}

interface WeeklyGridProps {
  /** Day-columns mode (default): sessions/blocks split across these days */
  sessions?: GridSession[]
  days?: number[]
  fixedBlocks?: GridFixedBlock[]
  /** Fillable ranges per ISO day; time outside them renders greyed */
  fillableRangesByDay?: Record<number, TimeRange[]>
  /** Custom-columns mode: overrides all of the above when provided */
  columns?: GridColumn[]
  rangeStartMin: number
  rangeEndMin: number
  onTogglePin?: (id: string) => void
  compact?: boolean
}

/** Assigns overlapping sessions of one column to side-by-side lanes. */
function packLanes(sessions: GridSession[]): Map<string, { lane: number; lanes: number }> {
  const sorted = [...sessions].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
  const result = new Map<string, { lane: number; lanes: number }>()
  let cluster: GridSession[] = []
  let clusterEnd = -1

  const flush = () => {
    if (cluster.length === 0) return
    const laneEnds: number[] = []
    const assignment = new Map<string, number>()
    for (const s of cluster) {
      let lane = laneEnds.findIndex((end) => end <= s.startMin)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(s.endMin)
      } else {
        laneEnds[lane] = s.endMin
      }
      assignment.set(s.id, lane)
    }
    for (const s of cluster) {
      result.set(s.id, { lane: assignment.get(s.id)!, lanes: laneEnds.length })
    }
    cluster = []
  }

  for (const s of sorted) {
    if (cluster.length > 0 && s.startMin >= clusterEnd) flush()
    cluster.push(s)
    clusterEnd = Math.max(clusterEnd, s.endMin)
  }
  flush()
  return result
}

const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  sessions = [],
  days = [],
  fixedBlocks = [],
  fillableRangesByDay,
  columns,
  rangeStartMin,
  rangeEndMin,
  onTogglePin,
  compact = false,
}) => {
  const span = Math.max(rangeEndMin - rangeStartMin, 1)
  const topPct = (min: number) => ((min - rangeStartMin) / span) * 100
  const heightPct = (from: number, to: number) => ((to - from) / span) * 100

  // Normalize both modes into columns
  const renderColumns: GridColumn[] =
    columns ??
    days.map((day) => ({
      key: String(day),
      label: dayLabel(day, compact),
      sessions: sessions.filter((s) => s.day === day),
      fixedBlocks: fixedBlocks.filter((b) => b.day === day),
      fillableRanges: fillableRangesByDay?.[day],
    }))

  const hourMarks: number[] = []
  for (let m = Math.ceil(rangeStartMin / 60) * 60; m <= rangeEndMin; m += 60) hourMarks.push(m)

  const gridHeight = compact ? 220 : Math.max(640, (span / 60) * 118)

  return (
    <div className="flex w-full select-none" style={{ height: gridHeight }}>
      {/* Hour ruler */}
      <div className={`${compact ? 'w-10' : 'w-16'} shrink-0 flex flex-col`}>
        <div className={`${compact ? 'h-6' : 'h-9'}`} />
        <div className="relative flex-1">
          {hourMarks.map((m) => (
            <div
              key={m}
              className={`absolute right-1.5 -translate-y-1/2 ${compact ? 'text-[9px]' : 'text-[11px]'} text-gray-400`}
              style={{ top: `${topPct(m)}%` }}
            >
              {formatMin(m)}
            </div>
          ))}
        </div>
      </div>

      {renderColumns.map((col) => {
        const lanes = packLanes(col.sessions)

        return (
          <div key={col.key} className="flex-1 min-w-0 flex flex-col border-l border-gray-200 last:border-r">
            <div
              className={`${compact ? 'h-6 text-[10px]' : 'h-9 text-sm'} flex items-center justify-center font-semibold bg-cyan-50 text-cyan-900 border-b border-gray-200 truncate px-1`}
            >
              {col.label}
            </div>
            <div className="relative flex-1 bg-white">
              {/* Non-fillable shading */}
              {col.fillableRanges && (
                <NonFillableShading
                  fillable={col.fillableRanges}
                  rangeStartMin={rangeStartMin}
                  rangeEndMin={rangeEndMin}
                  topPct={topPct}
                  heightPct={heightPct}
                />
              )}
              {/* Hour lines */}
              {hourMarks.map((m) => (
                <div
                  key={m}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: `${topPct(m)}%` }}
                />
              ))}
              {/* Fixed blocks */}
              {col.fixedBlocks.map((b, i) => (
                <div
                  key={`${b.label}-${i}`}
                  className="absolute left-0 right-0 bg-gray-200/70 border-y border-gray-300 flex items-center justify-center overflow-hidden"
                  style={{
                    top: `${topPct(b.startMin)}%`,
                    height: `${heightPct(b.startMin, b.endMin)}%`,
                    backgroundImage:
                      'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.05) 6px, rgba(0,0,0,0.05) 12px)',
                  }}
                >
                  <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-medium text-gray-500 truncate px-1`}>{b.label}</span>
                </div>
              ))}
              {/* Sessions */}
              {col.sessions.map((s) => {
                const { lane, lanes: laneCount } = lanes.get(s.id) ?? { lane: 0, lanes: 1 }
                const width = 100 / laneCount
                return (
                  <div
                    key={s.id}
                    className={`absolute rounded-md border border-black/10 overflow-hidden group ${
                      compact ? 'px-1 py-0.5' : 'px-2 py-1'
                    } ${
                      onTogglePin ? 'cursor-pointer hover:ring-2 hover:ring-cyan-400' : ''
                    } ${s.pinned ? 'ring-2 ring-cyan-600' : ''}`}
                    style={{
                      top: `${topPct(s.startMin)}%`,
                      height: `${heightPct(s.startMin, s.endMin)}%`,
                      left: `calc(${lane * width}% + 2px)`,
                      width: `calc(${width}% - 4px)`,
                      background: colorForLabel(s.title),
                    }}
                    onClick={onTogglePin ? () => onTogglePin(s.id) : undefined}
                    title={
                      `${s.title} · ${formatMin(s.startMin)}–${formatMin(s.endMin)}` +
                      (s.subtitle ? ` · ${s.subtitle}` : '') +
                      (s.roomName ? ` · ${s.roomName}` : '') +
                      (onTogglePin ? (s.pinned ? ' — click to unpin' : ' — click to pin') : '')
                    }
                  >
                    {s.pinned && (
                      <MapPinIcon className={`absolute top-1 right-1 ${compact ? 'h-3 w-3' : 'h-4 w-4'} text-cyan-700`} />
                    )}
                    <div className={`font-semibold truncate ${compact ? 'text-[8px]' : 'text-[13px]'}`}>
                      {s.title}
                    </div>
                    {!compact && (
                      <div className="text-[11px] text-gray-600 truncate">
                        {formatMin(s.startMin)}–{formatMin(s.endMin)}
                      </div>
                    )}
                    {!compact && s.subtitle && (
                      <div className="text-[11px] text-gray-600 truncate">{s.subtitle}</div>
                    )}
                    {!compact && s.roomName && (
                      <div className="text-[11px] text-gray-500 truncate">{s.roomName}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const NonFillableShading: React.FC<{
  fillable: TimeRange[]
  rangeStartMin: number
  rangeEndMin: number
  topPct: (min: number) => number
  heightPct: (from: number, to: number) => number
}> = ({ fillable, rangeStartMin, rangeEndMin, topPct, heightPct }) => {
  const sorted = [...fillable].sort((a, b) => a.startMin - b.startMin)
  const gaps: { from: number; to: number }[] = []
  let cursor = rangeStartMin
  for (const r of sorted) {
    if (r.startMin > cursor) gaps.push({ from: cursor, to: r.startMin })
    cursor = Math.max(cursor, r.endMin)
  }
  if (cursor < rangeEndMin) gaps.push({ from: cursor, to: rangeEndMin })
  return (
    <>
      {gaps.map((g, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 bg-gray-100"
          style={{ top: `${topPct(g.from)}%`, height: `${heightPct(g.from, g.to)}%` }}
        />
      ))}
    </>
  )
}

export default WeeklyGrid
