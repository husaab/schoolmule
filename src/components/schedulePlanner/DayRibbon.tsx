'use client'

// The dashboard hero: today drawn as a single minute-proportional strip.
// A school day is a sequence in time, so periods are laid out left to right at
// their true width, breaks sit in the gaps at their real length, and a live
// marker shows where the day currently is. It answers "where am I supposed to
// be, and how long until the bell" without reading a single row of a table.

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { useMyScheduleStore } from '@/store/useMyScheduleStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { colorForLabel, formatMin } from './timeUtils'
import { closureOn, isoDayOf, sessionsOn } from './myScheduleUtils'

/** Minutes since midnight, refreshed each minute so the marker stays honest. */
const useMinuteOfDay = (): number => {
  const [now, setNow] = useState(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setNow(d.getHours() * 60 + d.getMinutes())
    }
    const timer = window.setInterval(tick, 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

const DayRibbon: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const { data, load, loaded } = useMyScheduleStore()
  const nowMin = useMinuteOfDay()

  useEffect(() => {
    if (!user?.id || user.role === 'PARENT') return
    load(true)
  }, [user?.id, user?.role, selectedYearId, load])

  const today = useMemo(() => new Date(), [])
  const todayIso = isoDayOf(today)

  const sessions = data ? sessionsOn(data.sessions, todayIso) : []
  const closure = data ? closureOn(data.closures, today) : null

  const blocks = useMemo(
    () =>
      (data?.fixedBlocks ?? [])
        .filter((b) => b.dayOfWeek === todayIso)
        .sort((a, b) => a.startMin - b.startMin),
    [data, todayIso]
  )

  // The ribbon spans the school's open hours when they're configured, so an
  // empty morning still reads as empty rather than being cropped away.
  const [startMin, endMin] = useMemo(() => {
    const ranges = data?.dayTemplates.find((d) => d.dayOfWeek === todayIso)?.fillableRanges ?? []
    const candidates = [
      ...ranges.flatMap((r) => [r.startMin, r.endMin]),
      ...sessions.flatMap((s) => [s.startMin, s.endMin]),
      ...blocks.flatMap((b) => [b.startMin, b.endMin]),
    ]
    if (candidates.length === 0) return [480, 930]
    return [Math.min(...candidates), Math.max(...candidates)]
  }, [data, todayIso, sessions, blocks])

  const span = Math.max(endMin - startMin, 1)
  const pct = (min: number) => ((min - startMin) / span) * 100
  const nowVisible = nowMin >= startMin && nowMin <= endMin && !closure

  const current = sessions.find((s) => nowMin >= s.startMin && nowMin < s.endMin) ?? null
  const next = sessions.find((s) => s.startMin > nowMin) ?? null

  const hourMarks = useMemo(() => {
    const marks: number[] = []
    for (let m = Math.ceil(startMin / 60) * 60; m <= endMin; m += 60) marks.push(m)
    return marks
  }, [startMin, endMin])

  if (!loaded) return null

  // No published schedule at all: say what will fill the space, and who fills it.
  if (!data || data.sessions.length === 0) {
    return (
      <Card className="mb-6">
        <EmptyState
          icon={CalendarDaysIcon}
          title="Your day will appear here"
          description={
            user?.role === 'ADMIN'
              ? 'Build the school timetable in the schedule planner, then publish it to put every teacher’s day on their dashboard.'
              : 'Once your administrator publishes the school timetable, today’s periods show up here.'
          }
          action={
            user?.role === 'ADMIN' ? (
              <Link
                href="/admin-panel/schedule-planner"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-700 transition"
              >
                Open the schedule planner
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : undefined
          }
        />
      </Card>
    )
  }

  return (
    <Card className="mb-6" flush>
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 lg:px-6 pt-5 lg:pt-6">
        <h2 className="font-display text-base font-semibold text-slate-900">Your day</h2>
        <Link
          href="/my-schedule"
          className="flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800"
        >
          Full schedule
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {closure ? (
        <div className="m-5 lg:m-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">School is closed today</p>
          <p className="text-xs text-amber-700 mt-0.5">{closure.title}</p>
        </div>
      ) : sessions.length === 0 ? (
        <p className="px-5 lg:px-6 py-8 text-sm text-slate-400">
          Nothing scheduled for you today.
        </p>
      ) : (
        <>
          {/* Time ruler */}
          <div className="relative h-5 mt-4 mx-5 lg:mx-6">
            {hourMarks.map((m) => (
              <span
                key={m}
                className="absolute -translate-x-1/2 font-mono tabular-nums text-[10px] text-slate-400"
                style={{ left: `${pct(m)}%` }}
              >
                {formatMin(m).replace(':00', '')}
              </span>
            ))}
          </div>

          {/* The ribbon */}
          <div className="relative h-24 mx-5 lg:mx-6 rounded-xl bg-slate-50 border border-slate-200/70 overflow-hidden">
            {hourMarks.map((m) => (
              <div
                key={m}
                className="absolute top-0 bottom-0 border-l border-slate-200/70"
                style={{ left: `${pct(m)}%` }}
              />
            ))}

            {blocks.map((b, i) => (
              <div
                key={`${b.label}-${i}`}
                className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden border-x border-slate-200"
                style={{
                  left: `${pct(b.startMin)}%`,
                  width: `${pct(b.endMin) - pct(b.startMin)}%`,
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(15,23,42,0.05) 5px, rgba(15,23,42,0.05) 10px)',
                }}
                title={`${b.label} · ${formatMin(b.startMin)}–${formatMin(b.endMin)}`}
              >
                <span className="text-[10px] font-medium text-slate-500 truncate px-1 [writing-mode:vertical-rl] sm:[writing-mode:horizontal-tb]">
                  {b.label}
                </span>
              </div>
            ))}

            {sessions.map((s, i) => {
              const active = current?.sessionId === s.sessionId
              const past = s.endMin <= nowMin
              return (
                <div
                  key={s.sessionId}
                  className={`absolute top-1.5 bottom-1.5 rounded-lg px-2 py-1.5 overflow-hidden border transition-opacity motion-safe:animate-[ribbonIn_.35s_ease-out_both] ${
                    active ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-black/5'
                  } ${past ? 'opacity-55' : ''}`}
                  style={{
                    left: `calc(${pct(s.startMin)}% + 2px)`,
                    width: `calc(${pct(s.endMin) - pct(s.startMin)}% - 4px)`,
                    background: colorForLabel(s.courseName),
                    animationDelay: `${i * 40}ms`,
                  }}
                  title={`${s.courseName} · ${s.classGroupName} · ${formatMin(s.startMin)}–${formatMin(s.endMin)}`}
                >
                  <p className="text-[11px] font-semibold text-slate-800 truncate">{s.courseName}</p>
                  <p className="text-[10px] text-slate-600 truncate">{s.classGroupName}</p>
                  <p className="font-mono tabular-nums text-[10px] text-slate-500 truncate">
                    {formatMin(s.startMin)}
                  </p>
                </div>
              )
            })}

            {nowVisible && (
              <div
                className="absolute top-0 bottom-0 w-px bg-cyan-600 z-10"
                style={{ left: `${pct(nowMin)}%` }}
              >
                <span className="absolute -top-0.5 -translate-x-1/2 h-2 w-2 rounded-full bg-cyan-600 motion-safe:animate-pulse" />
              </div>
            )}
          </div>

          {/* What matters right now, in words */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-5 lg:px-6 py-4 text-sm">
            {current ? (
              <>
                <span className="text-slate-500">Now</span>
                <span className="font-medium text-slate-900">{current.courseName}</span>
                <span className="text-slate-500">· {current.classGroupName}</span>
                <span className="font-mono tabular-nums text-slate-500">
                  · until {formatMin(current.endMin)}
                </span>
                {current.roomName && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {current.roomName}
                  </span>
                )}
              </>
            ) : next ? (
              <>
                <span className="text-slate-500">Up next</span>
                <span className="font-medium text-slate-900">{next.courseName}</span>
                <span className="text-slate-500">· {next.classGroupName}</span>
                <span className="font-mono tabular-nums text-slate-500">
                  · {formatMin(next.startMin)}
                </span>
                {next.roomName && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {next.roomName}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-500">
                That&apos;s everything for today — {sessions.length} class
                {sessions.length === 1 ? '' : 'es'} taught.
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  )
}

export default DayRibbon
