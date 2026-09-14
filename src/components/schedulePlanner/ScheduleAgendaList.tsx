'use client'

// The phone-width fallback for the school timetable: a day's periods as a
// list grouped by start time, since a dozen columns will never fit on a
// 400px screen. Same data and filters as the grid, just stacked.

import React from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import type { PublishedSession } from '@/services/types/schedulePlanner'
import { colorForLabel, formatMin } from './timeUtils'

interface ScheduleAgendaListProps {
  /** One day's sessions, already filtered. */
  sessions: PublishedSession[]
  /** Minutes since midnight when the list is for today; null otherwise. */
  nowMin?: number | null
  userId?: string | null
  emptyText?: string
}

const ScheduleAgendaList: React.FC<ScheduleAgendaListProps> = ({
  sessions,
  nowMin = null,
  userId = null,
  emptyText = 'No periods to show.',
}) => {
  if (sessions.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-slate-400">{emptyText}</p>
  }

  // Group by start time so a bell with six classes reads as one moment.
  const groups = new Map<number, PublishedSession[]>()
  for (const s of [...sessions].sort((a, b) => a.startMin - b.startMin)) {
    groups.set(s.startMin, [...(groups.get(s.startMin) ?? []), s])
  }

  return (
    <ol className="divide-y divide-slate-100">
      {[...groups.entries()].map(([startMin, items]) => {
        const live = nowMin != null && startMin <= nowMin && items.some((s) => nowMin < s.endMin)
        const past = nowMin != null && items.every((s) => s.endMin <= nowMin)
        return (
          <li key={startMin} className={`flex gap-3 px-4 py-3 ${past ? 'opacity-60' : ''}`}>
            <div className="w-16 shrink-0 pt-1">
              <p
                className={`tabular-nums text-xs font-semibold ${
                  live ? 'text-cyan-700' : 'text-slate-700'
                }`}
              >
                {formatMin(startMin)}
              </p>
              {live && <p className="mt-0.5 text-[10px] font-medium text-cyan-600">Now</p>}
            </div>
            <ul className="min-w-0 flex-1 space-y-2">
              {items
                .sort((a, b) => a.teacherName.localeCompare(b.teacherName))
                .map((s) => {
                  const mine = Boolean(userId) && s.teacherUserId === userId
                  return (
                    <li
                      key={s.sessionId}
                      className={`rounded-xl border border-slate-200 bg-white px-3 py-2 ${
                        mine ? 'ring-2 ring-cyan-500' : ''
                      }`}
                      style={{ borderLeft: `4px solid ${colorForLabel(s.courseName)}` }}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-900">{s.courseName}</p>
                        <p className="shrink-0 tabular-nums text-[11px] font-medium text-slate-700">
                          until {formatMin(s.endMin)}
                        </p>
                      </div>
                      <p className="truncate text-xs font-medium text-slate-800">
                        {s.classGroupName} · {s.teacherName}
                      </p>
                      {s.roomName && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPinIcon className="h-3 w-3" />
                          {s.roomName}
                        </p>
                      )}
                    </li>
                  )
                })}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}

export default ScheduleAgendaList
