'use client'

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  format,
  isSameMonth,
  isToday,
  isAfter,
  isWeekend,
} from 'date-fns'

interface AttendanceRecord {
  attendanceDate: string
  status: 'PRESENT' | 'ABSENT'
  notes?: string | null
}

interface AttendanceCalendarProps {
  month: Date
  records: AttendanceRecord[]
  onDayClick?: (date: string, currentStatus: string | null) => void
  readOnly?: boolean
}

export default function AttendanceCalendar({
  month,
  records,
  onDayClick,
  readOnly = false,
}: AttendanceCalendarProps) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Build lookup map
  const recordMap: Record<string, AttendanceRecord> = {}
  records.forEach((r) => {
    const key = r.attendanceDate.substring(0, 10)
    recordMap[key] = r
  })

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-slate-500 py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, month)
          const weekend = isWeekend(day)
          const today = isToday(day)
          const tooFarAhead = isAfter(day, addDays(new Date(), 7))
          const record = recordMap[dateStr] || null
          const status = record?.status ?? null
          const hasNote = !!(record?.notes)
          const disabled = !inMonth || weekend || tooFarAhead || readOnly

          let bgClass = 'bg-white'
          if (!inMonth) bgClass = 'bg-transparent'
          else if (weekend) bgClass = 'bg-slate-50'
          else if (status === 'PRESENT') bgClass = 'bg-emerald-100'
          else if (status === 'ABSENT') bgClass = 'bg-red-100'

          let textClass = 'text-slate-400'
          if (inMonth && !weekend) textClass = 'text-slate-700'
          if (status === 'PRESENT') textClass = 'text-emerald-700'
          if (status === 'ABSENT') textClass = 'text-red-700'

          return (
            <button
              key={dateStr}
              disabled={disabled}
              title={hasNote ? record!.notes! : undefined}
              onClick={() => {
                if (!disabled && onDayClick) {
                  onDayClick(dateStr, status)
                }
              }}
              className={`
                group relative flex flex-col items-center justify-center
                rounded-xl p-2 min-h-[48px] transition-all duration-150
                ${bgClass} ${textClass}
                ${!inMonth ? 'opacity-0 pointer-events-none' : ''}
                ${!disabled ? 'hover:ring-2 hover:ring-cyan-300 cursor-pointer' : 'cursor-default'}
                ${today ? 'ring-2 ring-cyan-500' : ''}
              `}
            >
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              {inMonth && !weekend && status && (
                <span className="text-[10px] font-semibold mt-0.5">
                  {status === 'PRESENT' ? 'P' : 'A'}
                </span>
              )}
              {inMonth && !weekend && hasNote && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] leading-tight text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 whitespace-pre-wrap">
                    {record!.notes}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
          Present
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          Absent
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-50 border border-slate-200" />
          Weekend
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          Has note
        </div>
      </div>
    </div>
  )
}
