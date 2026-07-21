'use client'

import React from 'react'
import { AttendanceDay, ParentAttendanceStatus } from '@/services/types/parentPortal'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_STYLES: Record<ParentAttendanceStatus, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700',
  LATE: 'bg-amber-100 text-amber-700',
  ABSENT: 'bg-rose-100 text-rose-700',
}

const STATUS_LABELS: Record<ParentAttendanceStatus, string> = {
  PRESENT: 'Present',
  LATE: 'Late',
  ABSENT: 'Absent',
}

const pad = (n: number) => String(n).padStart(2, '0')

interface AttendanceMonthGridProps {
  year: number
  month: number // 1-12
  days: AttendanceDay[]
}

/** Month grid coloring each recorded day by attendance status, with legend. */
const AttendanceMonthGrid: React.FC<AttendanceMonthGridProps> = ({ year, month, days }) => {
  // Dates arrive as ISO strings (possibly with a time part) — key on YYYY-MM-DD.
  const statusByDate = new Map(days.map((d) => [d.date.slice(0, 10), d.status]))

  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-stone-100">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-semibold text-slate-500 uppercase"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={i} className="h-16 border-b border-r border-stone-50 bg-stone-50/50" />
            }
            const isoDate = `${year}-${pad(month)}-${pad(day)}`
            const status = statusByDate.get(isoDate)
            return (
              <div
                key={i}
                className="h-16 border-b border-r border-stone-50 p-1.5"
                title={status ? `${isoDate}: ${STATUS_LABELS[status]}` : isoDate}
              >
                <span className="text-xs font-medium text-slate-600">{day}</span>
                {status && (
                  <span
                    className={`mt-1 block rounded-md px-1 py-0.5 text-center text-[10px] font-medium ${STATUS_STYLES[status]}`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
        {(Object.keys(STATUS_STYLES) as ParentAttendanceStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-3 h-3 rounded ${STATUS_STYLES[status].split(' ')[0]}`} />
            {STATUS_LABELS[status]}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded bg-white border border-stone-200" />
          No record
        </span>
      </div>
    </div>
  )
}

export default AttendanceMonthGrid
