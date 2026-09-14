'use client'

// One line of live context above the timetable — the time, how many
// teachers are in class, when the next bell goes — that opens into the
// full who-is-where list on demand. A strip rather than a side panel, so
// the grid keeps the width.

import React, { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import type { PublishedSession } from '@/services/types/schedulePlanner'
import SchoolNowList from './SchoolNowList'
import { periodsAround } from './myScheduleUtils'
import { formatMin } from './timeUtils'

interface SchoolNowStripProps {
  /** Today's sessions, after the page's filters. */
  sessions: PublishedSession[]
  nowMin: number
}

const SchoolNowStrip: React.FC<SchoolNowStripProps> = ({ sessions, nowMin }) => {
  const [open, setOpen] = useState(false)
  const { now, next } = periodsAround(sessions, nowMin)
  const done = now.length === 0 && next.length === 0
  const notStarted = now.length === 0 && next.length > 0 && next[0].startMin > nowMin

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] print:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={done}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-default cursor-pointer"
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${done ? 'bg-slate-300' : 'bg-cyan-500 motion-safe:animate-pulse'}`}
          aria-hidden
        />
        <span className="shrink-0 tabular-nums text-sm font-semibold text-slate-900">
          {formatMin(nowMin)}
        </span>
        <span className="min-w-0 truncate text-sm text-slate-600">
          {done ? (
            <>Classes are done for today — {sessions.length} period{sessions.length === 1 ? '' : 's'} taught.</>
          ) : notStarted ? (
            <>
              First bell at <span className="font-medium text-slate-900">{formatMin(next[0].startMin)}</span> —{' '}
              {next.length} period{next.length === 1 ? '' : 's'} start then.
            </>
          ) : (
            <>
              <span className="font-medium text-slate-900">{now.length}</span> in class now
              {next.length > 0 && (
                <>
                  {' '}· next bell{' '}
                  <span className="font-medium text-slate-900">{formatMin(next[0].startMin)}</span> for{' '}
                  {next.length}
                </>
              )}
            </>
          )}
        </span>
        {!done && (
          <ChevronDownIcon
            className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {open && !done && (
        <div className="border-t border-slate-100 px-2 pb-2 pt-1">
          <SchoolNowList sessions={sessions} nowMin={nowMin} />
        </div>
      )}
    </div>
  )
}

export default SchoolNowStrip
