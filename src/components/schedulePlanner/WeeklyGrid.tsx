'use client'

// Minute-proportional schedule grid. Columns are either days of the week
// (class/teacher weekly views, public page, widget) or arbitrary entities
// like class groups (the "by day" master view). Powers the admin workspace
// (interactive pinning), the public share page, and the dashboard widget.

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
  /** Render as a slim low-contrast strip instead of a hatched band — for
   * blocks that are context, not a break for the column's subject (e.g.
   * class-group lunches in the by-teacher view). */
  subtle?: boolean
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

  // ─── Manual editing (admin builder) ───────────────────────────────────
  // All optional: without them the grid behaves exactly as a read-only view.
  /** Click empty time in a column to place a new session there. */
  onSlotClick?: (columnKey: string, startMin: number) => void
  /** Click an existing session (edit/delete). Takes precedence over pinning. */
  onSessionClick?: (id: string) => void
  /** Drag a session to a new column and/or start time. */
  onSessionMove?: (id: string, columnKey: string, startMin: number) => void
  /** Drag a session's bottom edge to change its end time. */
  onSessionResize?: (id: string, endMin: number) => void
  /** Minute granularity for click placement and dragging. */
  snapMinutes?: number
  /** Sessions to outline in red (double-booked teacher, class or room). */
  conflictIds?: Set<string>
}

/** Live drag being previewed before it is committed on pointer-up. */
interface DragState {
  id: string
  mode: 'move' | 'resize'
  originY: number
  originStartMin: number
  originEndMin: number
  columnKey: string
  startMin: number
  endMin: number
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
  onSlotClick,
  onSessionClick,
  onSessionMove,
  onSessionResize,
  snapMinutes = 5,
  conflictIds,
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
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

  // Half-hour marks between the hours ("9:30", "10:30") — hour-only rulers are
  // hard to read against 45-minute periods. Hidden in compact (widget) mode.
  const halfHourMarks: number[] = []
  for (let m = Math.ceil(rangeStartMin / 30) * 30; m <= rangeEndMin; m += 30) {
    if (m % 60 !== 0) halfHourMarks.push(m)
  }
  // "9:30" without AM/PM — the neighboring hour labels carry the period.
  const formatHalf = (m: number) => formatMin(m).replace(/\s[AP]M$/, '')

  const gridHeight = compact ? 220 : Math.max(640, (span / 60) * 118)

  // ─── Drag/resize plumbing ───────────────────────────────────────────────
  // Column bodies are `gridHeight` minus the sticky header, so a pixel delta
  // converts to minutes through that height, not the whole grid's.
  const headerHeight = compact ? 24 : 36
  const bodyHeight = Math.max(gridHeight - headerHeight, 1)
  const minutesPerPixel = span / bodyHeight
  const editable = Boolean(onSessionMove || onSessionResize)

  const snap = useCallback(
    (min: number) => Math.round(min / snapMinutes) * snapMinutes,
    [snapMinutes]
  )

  /** Column under the pointer, so a drag can cross day columns. */
  const columnKeyAt = (clientX: number, clientY: number): string | null => {
    const el = document.elementFromPoint(clientX, clientY)
    const body = el?.closest('[data-col-key]')
    return body?.getAttribute('data-col-key') ?? null
  }

  const startDrag = (
    e: React.PointerEvent,
    session: GridSession,
    columnKey: string,
    mode: 'move' | 'resize'
  ) => {
    if (!editable) return
    // No preventDefault: it suppresses the follow-up click in some browsers,
    // which is how a session is opened for editing. Text selection is already
    // off via the grid's select-none, and touch scrolling via touch-none.
    e.stopPropagation()
    setDrag({
      id: session.id,
      mode,
      originY: e.clientY,
      originStartMin: session.startMin,
      originEndMin: session.endMin,
      columnKey,
      startMin: session.startMin,
      endMin: session.endMin,
    })
  }

  useEffect(() => {
    if (!drag) return

    const onMove = (e: PointerEvent) => {
      const deltaMin = snap((e.clientY - drag.originY) * minutesPerPixel)
      setDrag((prev) => {
        if (!prev) return prev
        if (prev.mode === 'resize') {
          // Never shorter than one snap step, never past the end of the day.
          const endMin = Math.min(
            Math.max(prev.originEndMin + deltaMin, prev.startMin + snapMinutes),
            rangeEndMin
          )
          return { ...prev, endMin }
        }
        const duration = prev.originEndMin - prev.originStartMin
        const startMin = Math.min(
          Math.max(prev.originStartMin + deltaMin, rangeStartMin),
          rangeEndMin - duration
        )
        const columnKey = columnKeyAt(e.clientX, e.clientY) ?? prev.columnKey
        return { ...prev, startMin, endMin: startMin + duration, columnKey }
      })
    }

    const onUp = () => {
      setDrag((prev) => {
        if (prev) {
          const moved =
            prev.startMin !== prev.originStartMin || prev.columnKey !== drag.columnKey
          if (prev.mode === 'resize' && prev.endMin !== prev.originEndMin) {
            onSessionResize?.(prev.id, prev.endMin)
          } else if (prev.mode === 'move' && moved) {
            onSessionMove?.(prev.id, prev.columnKey, prev.startMin)
          }
        }
        return null
      })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, minutesPerPixel, snap, snapMinutes, rangeStartMin, rangeEndMin, onSessionMove, onSessionResize])

  /** Minute the pointer landed on inside a column body. */
  const handleSlotClick = (e: React.MouseEvent<HTMLDivElement>, columnKey: string) => {
    if (!onSlotClick || drag) return
    const rect = e.currentTarget.getBoundingClientRect()
    const minute = rangeStartMin + ((e.clientY - rect.top) / rect.height) * span
    onSlotClick(columnKey, Math.max(rangeStartMin, Math.min(snap(minute), rangeEndMin - snapMinutes)))
  }

  return (
    <div ref={rootRef} className="flex w-full select-none" style={{ height: gridHeight }}>
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
          {!compact &&
            halfHourMarks.map((m) => (
              <div
                key={m}
                className="absolute right-1.5 -translate-y-1/2 text-[9px] text-gray-300"
                style={{ top: `${topPct(m)}%` }}
              >
                {formatHalf(m)}
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
            <div
              className={`relative flex-1 bg-white ${onSlotClick ? 'cursor-copy' : ''}`}
              data-col-key={col.key}
              onClick={onSlotClick ? (e) => handleSlotClick(e, col.key) : undefined}
            >
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
              {/* Half-hour lines (lighter, dashed) */}
              {!compact &&
                halfHourMarks.map((m) => (
                  <div
                    key={m}
                    className="absolute left-0 right-0 border-t border-dashed border-gray-100/80"
                    style={{ top: `${topPct(m)}%` }}
                  />
                ))}
              {/* Fixed blocks */}
              {col.fixedBlocks.map((b, i) =>
                b.subtle ? (
                  // Context-only strip: no hatching, barely-there tint, quiet label.
                  <div
                    key={`${b.label}-${i}`}
                    className="absolute left-0 right-0 bg-gray-50/70 border-y border-dashed border-gray-200 flex items-center justify-center overflow-hidden"
                    style={{
                      top: `${topPct(b.startMin)}%`,
                      height: `${heightPct(b.startMin, b.endMin)}%`,
                    }}
                  >
                    <span className="text-[9px] italic text-gray-300 truncate px-1">{b.label}</span>
                  </div>
                ) : (
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
                )
              )}
              {/* Sessions */}
              {col.sessions.map((s) => {
                const { lane, lanes: laneCount } = lanes.get(s.id) ?? { lane: 0, lanes: 1 }
                const width = 100 / laneCount
                // While dragging, the block follows the pointer; the commit
                // happens on pointer-up so the parent only sees final values.
                const dragging = drag?.id === s.id
                const startMin = dragging ? drag!.startMin : s.startMin
                const endMin = dragging ? drag!.endMin : s.endMin
                const interactive = Boolean(onSessionClick || onTogglePin)
                const conflicted = conflictIds?.has(s.id)
                return (
                  <div
                    key={s.id}
                    className={`absolute rounded-md border border-black/10 overflow-hidden group ${
                      compact ? 'px-1 py-0.5' : 'px-2 py-1'
                    } ${interactive ? 'cursor-pointer hover:ring-2 hover:ring-cyan-400' : ''} ${
                      editable ? 'touch-none' : ''
                    } ${dragging ? 'z-20 opacity-90 shadow-lg ring-2 ring-cyan-500' : ''} ${
                      conflicted ? 'ring-2 ring-red-500' : ''
                    } ${s.pinned ? 'ring-2 ring-cyan-600' : ''}`}
                    style={{
                      top: `${topPct(startMin)}%`,
                      height: `${heightPct(startMin, endMin)}%`,
                      left: `calc(${lane * width}% + 2px)`,
                      width: `calc(${width}% - 4px)`,
                      background: colorForLabel(s.title),
                    }}
                    onPointerDown={
                      onSessionMove ? (e) => startDrag(e, s, col.key, 'move') : undefined
                    }
                    onClick={
                      onSessionClick || onTogglePin
                        ? (e) => {
                            e.stopPropagation()
                            if (onSessionClick) onSessionClick(s.id)
                            else onTogglePin?.(s.id)
                          }
                        : undefined
                    }
                    title={
                      `${s.title} · ${formatMin(startMin)}–${formatMin(endMin)}` +
                      (s.subtitle ? ` · ${s.subtitle}` : '') +
                      (s.roomName ? ` · ${s.roomName}` : '') +
                      (conflicted ? ' — conflict' : '') +
                      (onSessionClick
                        ? ' — click to edit, drag to move'
                        : onTogglePin
                          ? s.pinned
                            ? ' — click to unpin'
                            : ' — click to pin'
                          : '')
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
                    {onSessionResize && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize touch-none opacity-0 group-hover:opacity-100 bg-cyan-600/60"
                        onPointerDown={(e) => startDrag(e, s, col.key, 'resize')}
                        title="Drag to change the end time"
                      />
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
