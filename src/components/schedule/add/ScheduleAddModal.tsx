'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createSchedule } from '@/services/scheduleService'
import { getTeachersBySchool } from '@/services/teacherService'
import type { TeacherPayload } from '@/services/types/teacher'
import { addDays, format, isMonday, startOfMonth, endOfMonth, parse, startOfWeek } from 'date-fns'

interface ScheduleAddModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void // can be passed to refetch grid
}

const ScheduleAddModal: React.FC<ScheduleAddModalProps> = ({ isOpen, onClose, onAdd }) => {
  const user = useUserStore((state) => state.user)
  const showNotification = useNotificationStore((state) => state.showNotification)

  const [grade, setGrade] = useState<number | ''>('')
  const [subject, setSubject] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teachers, setTeachers] = useState<TeacherPayload[]>([])
  const [dayOfWeek, setDayOfWeek] = useState('Monday')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [weekStartDate, setWeekStartDate] = useState<string>(() => {
    try {
      return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    } catch (error) {
      console.error('Error initializing weekStartDate:', error)
      return format(new Date(), 'yyyy-MM-dd')
    }
  })
  const [isLunch, setIsLunch] = useState(false)
  const [lunchSupervisor, setLunchSupervisor] = useState('')

  const generateMondays = (): string[] => {
    try {
      const today = new Date()
      const start = startOfMonth(today)
      const end = endOfMonth(addDays(today, 40)) // roughly next 2 months

      const mondays: string[] = []
      let current = start

      while (current <= end) {
        if (isMonday(current)) {
          const dateStr = format(current, 'yyyy-MM-dd')
          if (dateStr && dateStr !== 'Invalid Date') {
            mondays.push(dateStr)
          }
        }
        current = addDays(current, 1)
      }

      return mondays
    } catch (error) {
      console.error('Error generating Mondays:', error)
      return []
    }
  }

  const mondays = generateMondays()

  useEffect(() => {
    if (isOpen) {
      try {
        setWeekStartDate(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      } catch (error) {
        console.error('Error setting weekStartDate:', error)
        setWeekStartDate(format(new Date(), 'yyyy-MM-dd'))
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !user?.school) return
    const fetchTeachers = async () => {
      try {
        if(user.school == null) return
        const res = await getTeachersBySchool(user.school)
        if (res.status === 'success') setTeachers(res.data)
        else showNotification('Failed to fetch teachers', 'error')
      } catch {
        showNotification('Error loading teachers', 'error')
      }
    }
    fetchTeachers()
  }, [isOpen, user?.school, showNotification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
        !grade ||
        !subject ||
        !startTime ||
        !endTime ||
        !weekStartDate ||
        (isLunch ? !lunchSupervisor : !teacherName && !teacherId)
        ) {
        showNotification('All required fields must be filled', 'error')
        return
        }

    const payload = {
      school: user.school!,
      grade: grade,
      subject: subject.trim(),
      teacher_name: isLunch ? '' : teacherName.trim(),
      teacher_id: isLunch ? '' : teacherId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      week_start_date: weekStartDate,
      is_lunch: isLunch,
      lunch_supervisor: isLunch ? lunchSupervisor.trim() : '',
    }

    try {
      const res = await createSchedule(payload)
      if (res.status === 'success') {
        onAdd()
        showNotification('Schedule added', 'success')
        onClose()
        setGrade('')
        setSubject('')
        setTeacherId('')
        setTeacherName('')
        setStartTime('08:00')
        setEndTime('08:45')
        setDayOfWeek('Monday')
        setWeekStartDate('')
        setIsLunch(false)
        setLunchSupervisor('')
      } else {
        showNotification('Failed to add schedule', 'error')
      }
    } catch {
      showNotification('Server error', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl mb-4 text-black">Add Schedule Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-sm">Grade</label>
          <select
            required
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
          >
            <option value="" disabled>Select grade</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm">Subject</label>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isLunch}
            onChange={(e) => setIsLunch(e.target.checked)}
          />
          <label className="text-sm">This is a lunch period</label>
        </div>

        {isLunch ? (
          <div>
            <label className="block text-sm">Lunch Supervisor</label>
            <input
              required
              value={lunchSupervisor}
              onChange={(e) => setLunchSupervisor(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm">Teacher (select or type)</label>
              <input
                required={!teacherId}
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full border rounded px-2 py-1"
                placeholder="Type teacher's name"
              />
            </div>
            <div>
              <label className="block text-sm">(Optional) Select Teacher from System</label>
              <select
                value={teacherId}
                onChange={(e) => {
                    const selectedId = e.target.value
                    setTeacherId(selectedId)

                    const selectedTeacher = teachers.find(t => t.userId === selectedId)
                    if (selectedTeacher) {
                    setTeacherName(selectedTeacher.fullName)
                    } else {
                    setTeacherName('')
                    }
                }}
                className="w-full border rounded px-2 py-1"
                >
                <option value="">-- None --</option>
                {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>{t.fullName}</option>
                ))}
</select>
            </div>
          </>
        )}

        <div className="flex space-x-2">
          <div className="w-1/2">
            <label className="block text-sm">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm">Day of Week</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          >
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
        <label className="block text-sm">Week Start Date (Monday only)</label>
        <select
            value={weekStartDate}
            onChange={(e) => setWeekStartDate(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
        >
            <option value="" disabled>Select a Monday</option>
            {mondays.map((date) => (
            <option key={date} value={date}>
                {(() => {
                  try {
                    return format(parse(date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')
                  } catch {
                    return date
                  }
                })()}
            </option>
            ))}
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Defaulting to this week’s Monday:{' '}
{(() => {
            try {
              return format(parse(weekStartDate, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')
            } catch {
              return 'Loading...'
            }
          })()}
        </p>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md cursor-pointer">
            Add Schedule
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ScheduleAddModal
