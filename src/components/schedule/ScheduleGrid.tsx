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
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00"
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
  // trim off any trailing ":ss"
  const hhmm = timeStr.length > 5 ? timeStr.slice(0, 5) : timeStr
  // now safely parse exactly "HH:mm"
  const parsed = parse(hhmm, 'HH:mm', new Date())
  if (isNaN(parsed.getTime())) {
    // fallback if it still failed
    return hhmm
  }
  return showMilitaryTime
    ? format(parsed, 'HH:mm')
    : format(parsed, 'h:mm a')
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

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const calculateEntryPosition = (entry: ScheduleEntry) => {
    const startMinutes = timeToMinutes(entry.start_time)
    const endMinutes = timeToMinutes(entry.end_time)
    const slotDurationMinutes = 60 // Each slot is 60 minutes
    
    // Find which slot this entry starts in or overlaps with
    let startSlotIndex = -1
    let startOffset = 0
    
    for (let i = 0; i < timeSlots.length; i++) {
      const slotStartMinutes = timeToMinutes(timeSlots[i])
      const slotEndMinutes = slotStartMinutes + slotDurationMinutes
      
      if (startMinutes >= slotStartMinutes && startMinutes < slotEndMinutes) {
        startSlotIndex = i
        startOffset = ((startMinutes - slotStartMinutes) / slotDurationMinutes) * 100
        break
      }
    }
    
    if (startSlotIndex === -1) return null
    
    // Calculate total height based on duration
    const durationMinutes = endMinutes - startMinutes
    const heightPercentage = (durationMinutes / slotDurationMinutes) * 100
    
    return {
      startSlotIndex,
      startOffset,
      heightPercentage,
      durationMinutes
    }
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
            <h3 className="text-base sm:text-lg font-semibold text-left xl:text-center mb-2 text-gray-800">
              {day.label}
            </h3>

            <div className="xl:w-max xl:mx-auto overflow-x-auto border rounded bg-white shadow">
              <table className="text-xs sm:text-sm text-center text-black border-collapse" style={{ minWidth: '800px' }}>
                <thead>
                  <tr className="bg-cyan-100 sticky top-0 z-10">
                    <th className="px-1 sm:px-2 py-2 sm:py-3 border text-xs sm:text-sm">Time</th>
                    {grades.map((grade) => (
                      <th key={grade} className="px-1 sm:px-2 py-2 sm:py-3 border text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]">
                        Grade {grade}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="relative">
                  {timeSlots.map((slot, slotIndex) => (
                    <tr key={`${day.value}-${slot}`} className="h-16 sm:h-20">
                      <td className="border px-1 sm:px-2 py-2 font-medium bg-slate-100 text-xs sm:text-sm">
                        {formatTime(slot)}
                      </td>
                      {grades.map((grade) => (
                        <td
                          key={`${day.value}-${slot}-${grade}`}
                          className="border relative"
                          style={{ height: '64px', minHeight: '64px' }}
                        >
                          {/* Render entries that start in this slot */}
                          {dailySchedules
                            .filter(entry => {
                              const position = calculateEntryPosition(entry)
                              return position && position.startSlotIndex === slotIndex && entry.grade === grade
                            })
                            .map(entry => {
                              const position = calculateEntryPosition(entry)
                              if (!position) return null
                              
                              return (
                                <div
                                  key={entry.schedule_id}
                                  className={`absolute left-0 right-0 rounded-md p-1 text-xs sm:text-sm flex flex-col justify-between ${getRandomColor(entry.subject)} border border-gray-300 z-10`}
                                  style={{
                                    top: `${position.startOffset}%`,
                                    height: `${position.heightPercentage}%`,
                                    minHeight: '32px'
                                  }}
                                >
                                  <div className="flex-grow flex flex-col items-center justify-center text-center px-1">
                                    <div className="font-semibold text-[8px] sm:text-[12px] leading-tight">
                                      {entry.is_lunch ? '🥪 ' + entry.subject : entry.subject}
                                    </div>
                                    <div className="text-[7px] sm:text-[10px] leading-tight">
                                      {entry.is_lunch ? entry.lunch_supervisor : entry.teacher_name}
                                    </div>
                                    <div className="text-[6px] sm:text-[9px] text-gray-600 mt-1 hidden sm:block">
                                      {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-[10px] sm:text-xs px-1 pb-1">
                                    <button
                                      onClick={() => onDeleteClick(entry)}
                                      className="text-red-500 hover:scale-110 transition-transform cursor-pointer touch-manipulation"
                                    >✖</button>
                                    <button 
                                      onClick={() => onEditClick(entry)}
                                      className="text-blue-500 hover:scale-110 transition-transform cursor-pointer touch-manipulation"
                                    >✎</button>
                                  </div>
                                </div>
                              )
                            })}
                          
                          {/* Show placeholder if no entry starts in this slot for this grade */}
                          {!dailySchedules.some(entry => {
                            const position = calculateEntryPosition(entry)
                            return position && position.startSlotIndex === slotIndex && entry.grade === grade
                          }) && (
                            <div className="text-gray-400 text-xs italic absolute inset-0 flex items-center justify-center"></div>
                          )}
                        </td>
                      ))}
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
