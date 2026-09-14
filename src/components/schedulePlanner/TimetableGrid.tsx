'use client'

// The big read-only timetable behind /school-schedule. WeeklyGrid stays the
// planner's editing surface; this one trades drag handles for room: a tall
// minute-proportional axis, an hour ruler and column headers that stay put
// while the grid scrolls, a live "now" line, and cards tall enough to name
// the course, the class, the teacher and the room.

import React, { useEffect, useRef } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import type { TimeRange } from '@/services/types/schedulePlanner'
import { packLanes } from './WeeklyGrid'
import { colorForLabel, formatMin } from './timeUtils'

export interface TimetableSession {
  id: string
  startMin: number
  endMin: number
  course: string
  /** Who or what the period is with, beneath the course, in reading order. */
  lines: string[]
  room?: string | null
  /** The signed-in teacher's own period. */
  mine?: boolean
}

export interface TimetableBlock {
  startMin: number
  endMin: number
  label: string
  /** Context only (another class's lunch), drawn as a faint strip. */
  subtle?: boolean
}

export interface TimetableColumn {
  key: string
  label: string
  sublabel?: string | null
  sessions: TimetableSession[]
  fixedBlocks: TimetableBlock[]
  /** Time outside these ranges is greyed out. */
  fillableRanges?: TimeRange[]
  /** Title of the closure when the school is shut that day. */
  closure?: string | null
  /** The column is today: it carries the now line and fades finished periods. */
  today?: boolean
}

interface TimetableGridProps {
  columns: TimetableColumn[]
  rangeStartMin: number
  rangeEndMin: number
  /** Minutes since midnight; omit to hide the now line. */
  nowMin?: number | null
  pxPerHour?: number
  minColumnWidth?: number
  /** Sizing for the scroll area (max height, print overrides). */
  className?: string
}

const RULER_WIDTH = 64
const HEADER_HEIGHT = 52
/** Card text rows are set to this so how many fit is arithmetic, not guesswork. */
const ROW_HEIGHT = 17

/** "9 AM" — the ruler's hour marks. */
const hourLabel = (m: number) => formatMin(m).replace(':00', '')
/** "9:30" — half hours and the now tag lean on the neighbouring hour for AM/PM. */
const shortTime = (m: number) => formatMin(m).replace(/\s[AP]M$/, '')
/** "9:05–9:45 AM" — one AM/PM does for both ends. */
const timeRange = (from: number, to: number) => `${shortTime(from)}–${formatMin(to)}`

/** Before school, after school, and any gaps between fillable ranges. */
const nonFillableGaps = (fillable: TimeRange[], from: number, to: number) => {
  const sorted = [...fillable].sort((a, b) => a.startMin - b.startMin)
  const gaps: { from: number; to: number }[] = []
  let cursor = from
  for (const r of sorted) {
    if (r.startMin > cursor) gaps.push({ from: cursor, to: r.startMin })
    cursor = Math.max(cursor, r.endMin)
  }
  if (cursor < to) gaps.push({ from: cursor, to })
  return gaps
}

const CLOSURE_STRIPES =
  'repeating-linear-gradient(135deg, rgba(245,158,11,0.10) 0 10px, transparent 10px 22px)'
const BREAK_HATCH =
  'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(15,23,42,0.05) 6px, rgba(15,23,42,0.05) 12px)'

const TimetableGrid: React.FC<TimetableGridProps> = ({
  columns,
  rangeStartMin,
  rangeEndMin,
  nowMin = null,
  pxPerHour = 150,
  minColumnWidth = 180,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const span = Math.max(rangeEndMin - rangeStartMin, 1)
  const bodyHeight = (span / 60) * pxPerHour
  const px = (min: number) => ((min - rangeStartMin) / span) * bodyHeight

  const hourMarks: number[] = []
  for (let m = Math.ceil(rangeStartMin / 60) * 60; m <= rangeEndMin; m += 60) hourMarks.push(m)
  const halfHourMarks: number[] = []
  for (let m = Math.ceil(rangeStartMin / 30) * 30; m <= rangeEndMin; m += 30) {
    if (m % 60 !== 0) halfHourMarks.push(m)
  }

  // Labels sit centred on their mark, except at the very edges where half
  // the text would slip under the header or off the bottom.
  const labelShift = (top: number) =>
    top < 8 ? 'translate-y-0' : top > bodyHeight - 8 ? '-translate-y-full' : '-translate-y-1/2'

  const nowVisible =
    nowMin != null &&
    nowMin >= rangeStartMin &&
    nowMin <= rangeEndMin &&
    columns.some((c) => c.today)

  // Open with "now" in the upper third, the way you'd hold a paper timetable.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !nowVisible || nowMin == null) return
    el.scrollTop = Math.max(0, px(nowMin) - el.clientHeight / 3)
    // Only on first paint and when the view first lands on today — following
    // the clock would fight the reader's own scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowVisible])

  const columnStyle = { flex: `1 0 ${minColumnWidth}px` }

  return (
    <div ref={scrollRef} className={`relative overflow-auto ${className}`}>
      {/* Wide as the widest of the container and the columns, so both rows share one width. */}
      <div className="inline-block min-w-full align-top">
        <div
          className="sticky top-0 z-30 flex border-b border-slate-200 bg-white"
          style={{ height: HEADER_HEIGHT }}
        >
          <div
            className="sticky left-0 z-40 shrink-0 border-r border-slate-200 bg-white"
            style={{ width: RULER_WIDTH }}
          />
          {columns.map((col) => (
            <div
              key={col.key}
              className={`flex min-w-0 flex-col justify-center border-l border-slate-200 px-3 ${
                col.closure ? 'bg-amber-50' : col.today ? 'bg-cyan-50/70' : 'bg-white'
              }`}
              style={columnStyle}
              title={col.label}
            >
              <p className="font-display text-sm font-semibold text-slate-900 truncate">{col.label}</p>
              {(col.closure || col.sublabel) && (
                <p className={`text-[11px] truncate ${col.closure ? 'text-amber-800' : 'text-slate-500'}`}>
                  {col.closure ? `Closed · ${col.closure}` : col.sublabel}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex" style={{ height: bodyHeight }}>
          {/* Hour ruler */}
          <div
            className="sticky left-0 z-20 shrink-0 border-r border-slate-200 bg-white relative"
            style={{ width: RULER_WIDTH }}
          >
            {hourMarks.map((m) => (
              <div
                key={m}
                className={`absolute right-2 font-mono tabular-nums text-[11px] font-medium text-slate-500 ${labelShift(px(m))}`}
                style={{ top: px(m) }}
              >
                {hourLabel(m)}
              </div>
            ))}
            {halfHourMarks.map((m) => (
              <div
                key={m}
                className={`absolute right-2 font-mono tabular-nums text-[10px] text-slate-400 ${labelShift(px(m))}`}
                style={{ top: px(m) }}
              >
                {shortTime(m)}
              </div>
            ))}
            {nowVisible && nowMin != null && (
              <div
                className="absolute right-1 z-10 -translate-y-1/2 rounded-md bg-cyan-600 px-1.5 py-0.5 font-mono tabular-nums text-[10px] font-semibold text-white"
                style={{ top: px(nowMin) }}
              >
                {shortTime(nowMin)}
              </div>
            )}
          </div>

          {columns.map((col) => {
            const lanes = packLanes(col.sessions)
            const gaps = col.fillableRanges
              ? nonFillableGaps(col.fillableRanges, rangeStartMin, rangeEndMin)
              : []
            return (
              <div
                key={col.key}
                className="relative min-w-0 border-l border-slate-200 bg-white"
                style={columnStyle}
              >
                {gaps.map((g, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 bg-slate-100"
                    style={{ top: px(g.from), height: px(g.to) - px(g.from) }}
                  />
                ))}
                {hourMarks.map((m) => (
                  <div
                    key={m}
                    className="absolute left-0 right-0 border-t border-slate-200/80"
                    style={{ top: px(m) }}
                  />
                ))}
                {halfHourMarks.map((m) => (
                  <div
                    key={m}
                    className="absolute left-0 right-0 border-t border-dashed border-slate-200/70"
                    style={{ top: px(m) }}
                  />
                ))}

                {col.fixedBlocks.map((b, i) =>
                  b.subtle ? (
                    <div
                      key={`${b.label}-${i}`}
                      className="absolute left-0 right-0 flex items-center justify-center overflow-hidden border-y border-dashed border-slate-200 bg-slate-50/70"
                      style={{ top: px(b.startMin), height: px(b.endMin) - px(b.startMin) }}
                    >
                      <span className="truncate px-1 text-[10px] italic text-slate-400">{b.label}</span>
                    </div>
                  ) : (
                    <div
                      key={`${b.label}-${i}`}
                      className="absolute left-0 right-0 flex items-center justify-center overflow-hidden border-y border-slate-300/70 bg-slate-200/60"
                      style={{
                        top: px(b.startMin),
                        height: px(b.endMin) - px(b.startMin),
                        backgroundImage: BREAK_HATCH,
                      }}
                    >
                      <span className="truncate px-1 text-[11px] font-medium text-slate-500">{b.label}</span>
                    </div>
                  )
                )}

                {col.sessions.map((s) => {
                  const { lane, lanes: laneCount } = lanes.get(s.id) ?? { lane: 0, lanes: 1 }
                  const width = 100 / laneCount
                  const height = px(s.endMin) - px(s.startMin)
                  // Rows of text the card can hold; the course always gets the first.
                  const rows = Math.max(1, Math.floor((height - 10) / ROW_HEIGHT))
                  const lines = s.lines.slice(0, Math.max(0, rows - 1))
                  const showFooter = rows >= s.lines.length + 2
                  const past = Boolean(col.today) && nowMin != null && s.endMin <= nowMin
                  return (
                    <div
                      key={s.id}
                      className={`absolute overflow-hidden rounded-lg border border-black/10 px-2 py-1 ${
                        s.mine ? 'ring-2 ring-cyan-500' : ''
                      } ${col.closure ? 'opacity-50' : past ? 'opacity-60' : ''}`}
                      style={{
                        top: px(s.startMin) + 1,
                        height: Math.max(height - 2, 18),
                        left: `calc(${lane * width}% + 3px)`,
                        width: `calc(${width}% - 6px)`,
                        background: colorForLabel(s.course),
                        boxShadow: 'inset 3px 0 0 rgba(15,23,42,0.18)',
                      }}
                      title={[s.course, ...s.lines, s.room, timeRange(s.startMin, s.endMin)]
                        .filter(Boolean)
                        .join(' · ')}
                    >
                      <p className="truncate text-[13px] font-semibold text-slate-900" style={{ lineHeight: `${ROW_HEIGHT}px` }}>
                        {s.course}
                      </p>
                      {lines.map((line, i) => (
                        <p key={i} className="truncate text-xs text-slate-700" style={{ lineHeight: `${ROW_HEIGHT}px` }}>
                          {line}
                        </p>
                      ))}
                      {showFooter && (
                        <p
                          className="flex items-center justify-between gap-2 text-[11px] text-slate-500"
                          style={{ lineHeight: `${ROW_HEIGHT}px` }}
                        >
                          <span className="flex min-w-0 items-center gap-0.5 truncate">
                            {s.room && (
                              <>
                                <MapPinIcon className="h-3 w-3 shrink-0" />
                                <span className="truncate">{s.room}</span>
                              </>
                            )}
                          </span>
                          <span className="shrink-0 font-mono tabular-nums">{timeRange(s.startMin, s.endMin)}</span>
                        </p>
                      )}
                    </div>
                  )
                })}

                {col.closure && (
                  <div
                    className="pointer-events-none absolute inset-0 z-[5]"
                    style={{ backgroundImage: CLOSURE_STRIPES }}
                    aria-hidden
                  />
                )}

                {col.today && nowVisible && nowMin != null && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-cyan-600"
                    style={{ top: px(nowMin) }}
                    aria-hidden
                  >
                    <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-cyan-600" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TimetableGrid
