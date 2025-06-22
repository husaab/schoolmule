// File: src/components/schedule/edit/ScheduleEditModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { updateSchedule } from '@/services/scheduleService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ScheduleEntry } from '@/services/types/schedule'
import { addDays, format, isMonday, startOfMonth, endOfMonth } from 'date-fns'

interface ScheduleEditModalProps {
  isOpen: boolean
  onClose: () => void
  schedule: ScheduleEntry
  onUpdated: (updated: ScheduleEntry) => void
}

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onUpdated,
}) => {
  const showNotification = useNotificationStore(s => s.showNotification)

  // local form state
  const [grade, setGrade] = useState<number>(1)
  const [subject, setSubject] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('Monday')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('08:45')
  const [weekStartDate, setWeekStartDate] = useState('')
  const [isLunch, setIsLunch] = useState(false)
  const [lunchSupervisor, setLunchSupervisor] = useState('')

  // generate Mondays for date picker
  const generateMondays = (): string[] => {
    const today = new Date()
    const start = startOfMonth(today)
    const end = endOfMonth(addDays(today, 60))
    const mondays: string[] = []
    let cur = start
    while (cur <= end) {
      if (isMonday(cur)) mondays.push(format(cur, 'yyyy-MM-dd'))
      cur = addDays(cur, 1)
    }
    return mondays
  }
  const mondays = generateMondays()

  // prefill when opened
  useEffect(() => {
    if (!isOpen) return
    setGrade(schedule.grade)
    setSubject(schedule.subject)
    setTeacherName(schedule.teacher_name)
    setDayOfWeek(schedule.day_of_week)
    // strip seconds
    setStartTime(schedule.start_time.slice(0,5))
    setEndTime(schedule.end_time.slice(0,5))
    setWeekStartDate(schedule.week_start_date.slice(0,10))
    setIsLunch(schedule.is_lunch)
    setLunchSupervisor(schedule.lunch_supervisor || '')
  }, [isOpen, schedule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !startTime || !endTime || !weekStartDate) {
      showNotification('Please fill all required fields', 'error')
      return
    }
    const payload = {
      school: schedule.school,
      grade,
      subject: subject.trim(),
      teacher_name: isLunch ? '' : teacherName.trim(),
      teacher_id: schedule.teacher_id,  // unchanged
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      week_start_date: weekStartDate,
      is_lunch: isLunch,
      lunch_supervisor: isLunch ? lunchSupervisor.trim() : '',
    }
    try {
      const res = await updateSchedule(schedule.schedule_id, payload)
      if (res.status === 'success') {
        onUpdated(res.data)
        showNotification('Schedule updated', 'success')
        onClose()
      } else {
        showNotification(res.status || 'Update failed', 'error')
      }
    } catch (err) {
      console.error(err)
      showNotification('Server error', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl mb-4 text-black">Edit Schedule</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {/* Grade */}
        <div>
          <label className="block text-sm">Grade</label>
          <select
            value={grade}
            onChange={e => setGrade(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
            required
          >
            {Array.from({length:8},(_,i)=>i+1).map(g=>(
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm">Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>

        {/* Lunch toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isLunch}
            onChange={e => setIsLunch(e.target.checked)}
          />
          <label className="text-sm">Lunch period</label>
        </div>

        {/* Teacher / Supervisor */}
        {isLunch ? (
          <div>
            <label className="block text-sm">Lunch Supervisor</label>
            <input
              value={lunchSupervisor}
              onChange={e => setLunchSupervisor(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm">Teacher Name</label>
            <input
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
        )}

        {/* Times */}
        <div className="flex space-x-2">
          <div className="w-1/2">
            <label className="block text-sm">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
        </div>

        {/* Day */}
        <div>
          <label className="block text-sm">Day of Week</label>
          <select
            value={dayOfWeek}
            onChange={e => setDayOfWeek(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          >
            {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d=>(
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Week Start (Mondays) */}
        <div>
          <label className="block text-sm">Week Start Date (Monday)</label>
          <select
            value={weekStartDate}
            onChange={e => setWeekStartDate(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          >
            <option value="" disabled>Select Monday</option>
            {mondays.map(m=>(
              <option key={m} value={m}>
                {format(new Date(m), 'MMMM d, yyyy')}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ScheduleEditModal
