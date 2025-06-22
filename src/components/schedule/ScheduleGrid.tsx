'use client'

import { FC, useEffect, useRef } from 'react'
import { ScheduleEntry } from '@/services/types/schedule'
import { format, parse } from 'date-fns'

interface Props {
  schedules: ScheduleEntry[]
  weekStartDate: Date
  showMilitaryTime: boolean
  onDeleteClick: (entry: ScheduleEntry) => void
  onEditClick:   (entry: ScheduleEntry) => void
}

const grades = [1, 2, 3, 4, 5, 6, 7, 8]
const timeSlots = [
  "08:00", "08:45", "09:30", "10:15", "11:00", "11:45", "12:00",
  "12:30", "13:15", "14:00", "14:45", "15:30"
]

const daysOfWeek: { label: string; value: string }[] = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
]

const ScheduleGrid: FC<Props> = ({ schedules, showMilitaryTime, onDeleteClick, onEditClick }) => {
  const currentDayLabel = daysOfWeek[new Date().getDay() - 1]?.value // 0 = Sunday, so -1 for Mon–Fri
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (currentDayLabel && dayRefs.current[currentDayLabel]) {
      dayRefs.current[currentDayLabel]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentDayLabel])

  const formatTime = (timeStr: string): string => {
    const parsed = parse(timeStr, 'HH:mm', new Date())
    return showMilitaryTime
      ? format(parsed, 'HH:mm')
      : `${format(parsed, 'h:mm a')}`
  }

  const colorMapRef = useRef<Record<string, string>>({})

  const getRandomColor = (subject: string): string => {
    if (colorMapRef.current[subject]) return colorMapRef.current[subject]
    const colors = [
      'bg-pink-200', 'bg-green-200', 'bg-blue-200',
      'bg-yellow-200', 'bg-purple-200', 'bg-orange-200',
      'bg-rose-200', 'bg-lime-200', 'bg-amber-200'
    ]
    const color = colors[Math.floor(Math.random() * colors.length)]
    colorMapRef.current[subject] = color
    return color
  }

  return (
    <div className="space-y-12">
      {daysOfWeek.map((day) => {
        const dailySchedules = schedules.filter(
          (entry) => entry.day_of_week === day.value
        )

        return (
          <div
              key={day.value}
              ref={(el) => {
                dayRefs.current[day.value] = el
              }}
            >
            <h3 className="text-lg font-semibold text-left mb-2 text-gray-800">
              {day.label}
            </h3>

            <div className="overflow-x-auto border rounded bg-white shadow">
              <table className="min-w-full text-sm text-center text-black border-collapse">
                <thead>
                  <tr className="bg-cyan-100 sticky top-0 z-10">
                    <th className="px-2 py-3 border">Time</th>
                    {grades.map((grade) => (
                      <th key={grade} className="px-2 py-3 border">
                        Grade {grade}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => (
                    <tr key={`${day.value}-${slot}`}>
                      <td className="border px-2 py-2 font-medium bg-slate-100">
                        {formatTime(slot)}
                      </td>
                      {grades.map((grade) => {
                        const entry = dailySchedules.find(
                          (s) =>
                            s.grade === grade &&
                            format(new Date(`1970-01-01T${s.start_time}`), 'HH:mm') === slot
                        )
                        return (
                          <td
                            key={`${day.value}-${slot}-${grade}`}
                            className="border h-20 relative"
                          >
                            {entry ? (
                              <div className={`rounded-md p-1 text-xs h-full flex flex-col justify-between ${getRandomColor(entry.subject)}`}>
                                <div className="flex-grow flex flex-col items-center justify-center text-center px-1">
                                  <div className="font-semibold">
                                    {entry.is_lunch ? '🥪 ' + entry.subject : entry.subject}
                                  </div>
                                  <div className="text-[11px]">
                                    {entry.is_lunch ? entry.lunch_supervisor : entry.teacher_name}
                                  </div>
                                </div>
                                <div className="flex justify-between text-base px-1 pb-1">
                                  <button
                                    onClick={() => onDeleteClick(entry)}
                                    className="text-red-500 hover:scale-110 transition-transform cursor-pointer"
                                  >✖</button>
                                  <button 
                                    onClick={() => onEditClick(entry)}
                                  className="text-blue-500 hover:scale-110 transition-transform cursor-pointer">✎</button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs italic">—</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ScheduleGrid
