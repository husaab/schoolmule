'use client'

// Teacher dashboard widget: the logged-in teacher's sessions from the
// published schedule. Renders nothing when no schedule is published or the
// teacher has no sessions, so schools not using the planner see no change.

import React, { useState, useEffect, useMemo } from 'react'
import { getMySchedule } from '@/services/schedulePlannerService'
import type { PublishedSession } from '@/services/types/schedulePlanner'
import { dayLabel, formatMin } from './timeUtils'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

const MyScheduleWidget: React.FC = () => {
  const [sessions, setSessions] = useState<PublishedSession[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getMySchedule()
      .then((res) => {
        if (res.status === 'success') setSessions(res.data.sessions)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // JS getDay(): Sunday = 0 → ISO 1-7
  const todayIso = useMemo(() => {
    const jsDay = new Date().getDay()
    return jsDay === 0 ? 7 : jsDay
  }, [])

  const todaySessions = sessions.filter((s) => s.dayOfWeek === todayIso)
  const byDay = useMemo(() => {
    const map = new Map<number, PublishedSession[]>()
    for (const s of sessions) {
      if (!map.has(s.dayOfWeek)) map.set(s.dayOfWeek, [])
      map.get(s.dayOfWeek)!.push(s)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [sessions])

  if (!loaded || sessions.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDaysIcon className="w-5 h-5 text-cyan-600" />
        <h2 className="text-lg font-semibold text-slate-900">My Schedule</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today */}
        <div>
          <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">
            Today · {dayLabel(todayIso)}
          </h3>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-slate-400">No classes today.</p>
          ) : (
            <div className="space-y-1.5">
              {todaySessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="flex items-center justify-between rounded-lg bg-cyan-50/60 border border-cyan-100 px-3 py-1.5"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{s.courseName}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {s.classGroupName}
                      {s.roomName ? ` · ${s.roomName}` : ''}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 whitespace-nowrap ml-3">
                    {formatMin(s.startMin)}–{formatMin(s.endMin)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Week overview */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">This week</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {byDay.map(([day, daySessions]) => (
              <div
                key={day}
                className={`rounded-lg border p-2 ${
                  day === todayIso ? 'border-cyan-300 bg-cyan-50/40' : 'border-slate-100'
                }`}
              >
                <div className="text-[10px] font-semibold text-slate-500 mb-1">
                  {dayLabel(day, true)}
                </div>
                {daySessions
                  .sort((a, b) => a.startMin - b.startMin)
                  .map((s) => (
                    <div key={s.sessionId} className="mb-1 last:mb-0">
                      <div className="text-[10px] font-medium text-slate-700 truncate">
                        {formatMin(s.startMin)} {s.courseName}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{s.classGroupName}</div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyScheduleWidget
