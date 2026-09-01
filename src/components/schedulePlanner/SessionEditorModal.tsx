'use client'

// Add or edit one hand-placed session in the manual schedule builder.
// Course choices come from the class group's configured courses, so a manual
// schedule stays describable by the same planner config the solver uses.

import React, { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/shared/modal'
import { TrashIcon } from '@heroicons/react/24/outline'
import { dayLabel, minToTimeStr, timeStrToMin } from './timeUtils'
import type { PlannerConfig, ScheduleSession } from '@/services/types/schedulePlanner'

export interface SessionDraft {
  courseId: string
  courseName: string
  classGroupId: string
  teacherId: string
  roomId: string | null
  day: number
  startMin: number
  endMin: number
}

interface Props {
  isOpen: boolean
  config: PlannerConfig
  days: number[]
  /** Editing an existing session, or null when placing a new one. */
  session: ScheduleSession | null
  /** Seed values for a new session (the slot that was clicked). */
  seed: { classGroupId: string | null; day: number; startMin: number } | null
  onSave: (draft: SessionDraft) => void
  onDelete?: () => void
  onClose: () => void
}

const SessionEditorModal: React.FC<Props> = ({
  isOpen,
  config,
  days,
  session,
  seed,
  onSave,
  onDelete,
  onClose,
}) => {
  const defaultDuration = config.settings.defaultDurationMinutes || 45

  const [classGroupId, setClassGroupId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [day, setDay] = useState(days[0] ?? 1)
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(defaultDuration)
  const [error, setError] = useState<string | null>(null)

  // Re-seed whenever the modal opens against a different slot or session.
  useEffect(() => {
    if (!isOpen) return
    setError(null)
    if (session) {
      setClassGroupId(session.classGroupId)
      setCourseId(session.courseId)
      setTeacherId(session.teacherId)
      setRoomId(session.roomId ?? '')
      setDay(session.day)
      setStartTime(minToTimeStr(session.startMin))
      setDuration(session.endMin - session.startMin)
    } else if (seed) {
      setClassGroupId(seed.classGroupId ?? config.classGroups[0]?.classGroupId ?? '')
      setCourseId('')
      setTeacherId('')
      setRoomId('')
      setDay(seed.day)
      setStartTime(minToTimeStr(seed.startMin))
      setDuration(defaultDuration)
    }
  }, [isOpen, session, seed, config.classGroups, defaultDuration])

  const courses = useMemo(
    () => config.classGroups.find((g) => g.classGroupId === classGroupId)?.courses ?? [],
    [config.classGroups, classGroupId]
  )
  const course = courses.find((c) => c.courseId === courseId) ?? null

  // Picking a course pre-fills the teacher/room/duration it was configured
  // with, so the common case is one click rather than four.
  useEffect(() => {
    if (!course) return
    setTeacherId((prev) => prev || course.assignedTeacherId || course.candidateTeacherIds[0] || '')
    setRoomId((prev) => prev || course.requiredRoomId || '')
    if (course.durationMinutes) setDuration(course.durationMinutes)
  }, [course])

  // A course's own teacher pool when it has one; otherwise every teacher.
  const teacherOptions = useMemo(() => {
    const pool = course
      ? course.assignedTeacherId
        ? [course.assignedTeacherId]
        : course.candidateTeacherIds
      : []
    if (pool.length === 0) return config.teachers
    return config.teachers.filter((t) => pool.includes(t.plannerTeacherId))
  }, [course, config.teachers])

  const handleSubmit = () => {
    const startMin = timeStrToMin(startTime)
    if (!classGroupId) return setError('Pick a class group')
    if (!course) return setError('Pick a course')
    if (!teacherId) return setError('Pick a teacher')
    if (startMin === null) return setError('Enter a valid start time')
    if (duration < 5) return setError('Duration must be at least 5 minutes')
    if (startMin + duration > 1440) return setError('That runs past midnight')

    onSave({
      courseId: course.courseId,
      courseName: course.name,
      classGroupId,
      teacherId,
      roomId: roomId || null,
      day,
      startMin,
      endMin: startMin + duration,
    })
  }

  const label = 'block text-xs font-medium text-slate-600 mb-1'
  const field =
    'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={session ? 'Edit session' : 'Add session'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Class group</label>
            <select
              value={classGroupId}
              onChange={(e) => {
                setClassGroupId(e.target.value)
                setCourseId('')
              }}
              className={field}
            >
              <option value="">Select…</option>
              {config.classGroups.map((g) => (
                <option key={g.classGroupId} value={g.classGroupId}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={field}
              disabled={!classGroupId}
            >
              <option value="">Select…</option>
              {courses.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.name}
                </option>
              ))}
            </select>
            {classGroupId && courses.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                This class group has no courses yet — add them in Setup first.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Teacher</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={field}>
              <option value="">Select…</option>
              {teacherOptions.map((t) => (
                <option key={t.plannerTeacherId} value={t.plannerTeacherId}>
                  {t.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Room (optional)</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={field}>
              <option value="">No room</option>
              {config.rooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Day</label>
            <select
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value, 10))}
              className={field}
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {dayLabel(d)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Starts</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={label}>Minutes</label>
            <input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
              className={field}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
            >
              <TrashIcon className="h-4 w-4" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 cursor-pointer"
            >
              {session ? 'Save changes' : 'Add session'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default SessionEditorModal
