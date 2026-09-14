'use client'

// "Who is where" for the whole school: every teacher in class right now, then
// everyone in the next period to start. Shared by the admin navbar popover and
// the admin dashboard card.

import React from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import type { PublishedSession } from '@/services/types/schedulePlanner'
import { colorForLabel, formatMin } from './timeUtils'
import { periodsAround } from './myScheduleUtils'

interface SchoolNowListProps {
  /** Today's sessions across the school */
  sessions: PublishedSession[]
  nowMin: number
  /** Tighter rows for the navbar popover */
  compact?: boolean
}

const SessionRow: React.FC<{ s: PublishedSession; time: string; compact: boolean }> = ({
  s,
  time,
  compact,
}) => (
  <li className={`flex items-center gap-3 rounded-xl ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} hover:bg-slate-50`}>
    <span
      className="h-8 w-1 shrink-0 rounded-full"
      style={{ background: colorForLabel(s.courseName) }}
      aria-hidden
    />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-slate-900 truncate">{s.teacherName}</p>
      <p className="text-xs font-medium text-slate-700 truncate">
        {s.courseName} · {s.classGroupName}
      </p>
    </div>
    <div className="shrink-0 text-right">
      <p className="tabular-nums text-xs font-medium text-slate-700">{time}</p>
      {s.roomName && (
        <p className="flex items-center justify-end gap-0.5 text-[11px] text-slate-500">
          <MapPinIcon className="h-3 w-3" />
          {s.roomName}
        </p>
      )}
    </div>
  </li>
)

const SectionLabel: React.FC<{ children: React.ReactNode; live?: boolean }> = ({ children, live }) => (
  <p className="flex items-center gap-1.5 px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
    {live && <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 motion-safe:animate-pulse" />}
    {children}
  </p>
)

const SchoolNowList: React.FC<SchoolNowListProps> = ({ sessions, nowMin, compact = false }) => {
  if (sessions.length === 0) {
    return <p className="px-3 py-6 text-sm text-slate-400 text-center">No classes scheduled today.</p>
  }

  const { now, next } = periodsAround(sessions, nowMin)

  if (now.length === 0 && next.length === 0) {
    return (
      <p className="px-3 py-6 text-sm text-slate-500 text-center">
        Classes are done for today — {sessions.length} period{sessions.length === 1 ? '' : 's'} taught.
      </p>
    )
  }

  // Side by side on the dashboard; stacked in the narrow popover.
  return (
    <div className={compact ? '' : 'grid gap-x-6 gap-y-2 lg:grid-cols-2'}>
      {now.length > 0 && (
        <div>
          <SectionLabel live>
            In class now · {now.length} teacher{now.length === 1 ? '' : 's'}
          </SectionLabel>
          <ul>
            {now.map((s) => (
              <SessionRow key={s.sessionId} s={s} time={`until ${formatMin(s.endMin)}`} compact={compact} />
            ))}
          </ul>
        </div>
      )}
      {next.length > 0 && (
        <div>
          <SectionLabel>Up next · {formatMin(next[0].startMin)}</SectionLabel>
          <ul>
            {next.map((s) => (
              <SessionRow
                key={s.sessionId}
                s={s}
                time={`${formatMin(s.startMin)}–${formatMin(s.endMin)}`}
                compact={compact}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SchoolNowList
