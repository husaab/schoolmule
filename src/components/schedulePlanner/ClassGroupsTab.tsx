'use client'

import React, { useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  createClassGroup,
  updateClassGroup,
  deleteClassGroup,
  createCourse,
  updateCourse,
  deleteCourse,
} from '@/services/schedulePlannerService'
import type {
  ClassGroup,
  CourseRequirement,
  PlannerRoom,
  PlannerSettings,
  PlannerTeacher,
} from '@/services/types/schedulePlanner'

interface ClassGroupsTabProps {
  classGroups: ClassGroup[]
  teachers: PlannerTeacher[]
  rooms: PlannerRoom[]
  settings: PlannerSettings
  onChanged: () => void
}

interface CourseForm {
  name: string
  sessionsPerWeek: string
  durationMinutes: string
  maxPerDay: string
  teacherMode: 'assigned' | 'pool'
  assignedTeacherId: string
  candidateTeacherIds: string[]
  requiredRoomId: string
}

const emptyCourseForm: CourseForm = {
  name: '',
  sessionsPerWeek: '3',
  durationMinutes: '',
  maxPerDay: '1',
  teacherMode: 'assigned',
  assignedTeacherId: '',
  candidateTeacherIds: [],
  requiredRoomId: '',
}

const ClassGroupsTab: React.FC<ClassGroupsTabProps> = ({
  classGroups,
  teachers,
  rooms,
  settings,
  onChanged,
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  // Course editing: which group + which course ('new' for adds)
  const [courseTarget, setCourseTarget] = useState<{ groupId: string; courseId: string | 'new' } | null>(null)
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm)
  const [saving, setSaving] = useState(false)

  const teacherName = (id?: string | null) =>
    teachers.find((t) => t.plannerTeacherId === id)?.displayName || 'Unknown'

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      showNotification('Class group name is required', 'error')
      return
    }
    setSaving(true)
    try {
      if (editingGroupId) {
        await updateClassGroup(editingGroupId, { name: groupName.trim() })
        showNotification('Class group updated', 'success')
      } else {
        await createClassGroup({ name: groupName.trim(), sortOrder: classGroups.length })
        showNotification('Class group added', 'success')
      }
      setAddingGroup(false)
      setEditingGroupId(null)
      setGroupName('')
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving class group', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = async (group: ClassGroup) => {
    if (!confirm(`Delete ${group.name} and all its course requirements?`)) return
    try {
      await deleteClassGroup(group.classGroupId)
      showNotification('Class group deleted', 'success')
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error deleting class group', 'error')
    }
  }

  const startAddCourse = (groupId: string) => {
    setCourseForm({ ...emptyCourseForm, assignedTeacherId: teachers[0]?.plannerTeacherId || '' })
    setCourseTarget({ groupId, courseId: 'new' })
  }

  const startEditCourse = (groupId: string, course: CourseRequirement) => {
    setCourseForm({
      name: course.name,
      sessionsPerWeek: String(course.sessionsPerWeek),
      durationMinutes: course.durationMinutes != null ? String(course.durationMinutes) : '',
      maxPerDay: String(course.maxPerDay),
      teacherMode: course.assignedTeacherId ? 'assigned' : 'pool',
      assignedTeacherId: course.assignedTeacherId || teachers[0]?.plannerTeacherId || '',
      candidateTeacherIds: course.candidateTeacherIds || [],
      requiredRoomId: course.requiredRoomId || '',
    })
    setCourseTarget({ groupId, courseId: course.courseId })
  }

  const handleSaveCourse = async () => {
    if (!courseTarget) return
    const sessionsPerWeek = parseInt(courseForm.sessionsPerWeek, 10)
    const maxPerDay = parseInt(courseForm.maxPerDay, 10)
    if (!courseForm.name.trim() || !Number.isInteger(sessionsPerWeek) || sessionsPerWeek < 1) {
      showNotification('Course name and sessions per week are required', 'error')
      return
    }
    if (courseForm.teacherMode === 'assigned' && !courseForm.assignedTeacherId) {
      showNotification('Choose a teacher', 'error')
      return
    }
    if (courseForm.teacherMode === 'pool' && courseForm.candidateTeacherIds.length === 0) {
      showNotification('Choose at least one teacher for the pool', 'error')
      return
    }
    const durationMinutes =
      courseForm.durationMinutes.trim() === '' ? null : parseInt(courseForm.durationMinutes, 10)
    const payload = {
      name: courseForm.name.trim(),
      sessionsPerWeek,
      durationMinutes,
      maxPerDay: Number.isInteger(maxPerDay) && maxPerDay >= 1 ? maxPerDay : 1,
      assignedTeacherId: courseForm.teacherMode === 'assigned' ? courseForm.assignedTeacherId : null,
      candidateTeacherIds: courseForm.teacherMode === 'pool' ? courseForm.candidateTeacherIds : [],
      requiredRoomId: courseForm.requiredRoomId || null,
    }
    setSaving(true)
    try {
      if (courseTarget.courseId === 'new') {
        await createCourse(courseTarget.groupId, payload)
        showNotification('Course added', 'success')
      } else {
        await updateCourse(courseTarget.courseId, payload)
        showNotification('Course updated', 'success')
      }
      setCourseTarget(null)
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving course', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async (course: CourseRequirement) => {
    if (!confirm(`Delete ${course.name}?`)) return
    try {
      await deleteCourse(course.courseId)
      showNotification('Course deleted', 'success')
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error deleting course', 'error')
    }
  }

  const togglePoolTeacher = (id: string) => {
    setCourseForm((f) => ({
      ...f,
      candidateTeacherIds: f.candidateTeacherIds.includes(id)
        ? f.candidateTeacherIds.filter((x) => x !== id)
        : [...f.candidateTeacherIds, id],
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Class groups (homerooms) and what each needs every week — e.g. Grade 5: Math × 5.
        </p>
        <button
          onClick={() => {
            setGroupName('')
            setEditingGroupId(null)
            setAddingGroup(true)
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" /> Add class group
        </button>
      </div>

      {(addingGroup || editingGroupId) && (
        <div className="border border-cyan-200 bg-cyan-50/40 rounded-lg p-4 mb-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {editingGroupId ? 'Rename class group' : 'Class group name'}
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              placeholder="Grade 1"
            />
          </div>
          <button
            onClick={handleSaveGroup}
            disabled={saving}
            className="px-4 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 cursor-pointer"
          >
            Save
          </button>
          <button
            onClick={() => {
              setAddingGroup(false)
              setEditingGroupId(null)
            }}
            className="px-3 py-1.5 text-sm text-gray-500 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {classGroups.length === 0 && !addingGroup ? (
        <p className="text-sm text-gray-400 py-6 text-center">No class groups yet.</p>
      ) : (
        classGroups.map((group) => (
          <div key={group.classGroupId} className="border border-gray-200 rounded-lg mb-3">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => toggleExpand(group.classGroupId)}
                className="flex items-center gap-2 font-semibold cursor-pointer"
              >
                {expanded.has(group.classGroupId) ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
                {group.name}
                <span className="text-xs font-normal text-gray-400">
                  {(group.courses || []).length} course{(group.courses || []).length === 1 ? '' : 's'}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startAddCourse(group.classGroupId)}
                  className="text-xs text-cyan-700 hover:underline cursor-pointer"
                >
                  + Add course
                </button>
                <button
                  onClick={() => {
                    setGroupName(group.name)
                    setEditingGroupId(group.classGroupId)
                    setAddingGroup(false)
                  }}
                  className="cursor-pointer"
                >
                  <PencilIcon className="h-4 w-4 text-gray-400 hover:text-cyan-600" />
                </button>
                <button onClick={() => handleDeleteGroup(group)} className="cursor-pointer">
                  <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {courseTarget?.groupId === group.classGroupId && (
              <div className="border-t border-cyan-100 bg-cyan-50/40 px-4 py-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold">
                    {courseTarget.courseId === 'new' ? 'New course' : 'Edit course'}
                  </h4>
                  <button onClick={() => setCourseTarget(null)} className="cursor-pointer">
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Course</label>
                    <input
                      type="text"
                      value={courseForm.name}
                      onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Math"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Sessions / week</label>
                    <input
                      type="number"
                      min="1"
                      value={courseForm.sessionsPerWeek}
                      onChange={(e) => setCourseForm((f) => ({ ...f, sessionsPerWeek: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Minutes (blank = {settings.defaultDurationMinutes})
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={courseForm.durationMinutes}
                      onChange={(e) => setCourseForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max / day</label>
                    <input
                      type="number"
                      min="1"
                      value={courseForm.maxPerDay}
                      onChange={(e) => setCourseForm((f) => ({ ...f, maxPerDay: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Teacher</label>
                    <select
                      value={courseForm.teacherMode}
                      onChange={(e) =>
                        setCourseForm((f) => ({ ...f, teacherMode: e.target.value as 'assigned' | 'pool' }))
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-1"
                    >
                      <option value="assigned">Specific teacher</option>
                      <option value="pool">Let the generator pick from a pool</option>
                    </select>
                    {courseForm.teacherMode === 'assigned' ? (
                      <select
                        value={courseForm.assignedTeacherId}
                        onChange={(e) => setCourseForm((f) => ({ ...f, assignedTeacherId: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="">Choose…</option>
                        {teachers.map((t) => (
                          <option key={t.plannerTeacherId} value={t.plannerTeacherId}>
                            {t.displayName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {teachers.map((t) => (
                          <button
                            key={t.plannerTeacherId}
                            onClick={() => togglePoolTeacher(t.plannerTeacherId)}
                            className={`px-2 py-0.5 rounded text-xs border transition cursor-pointer ${
                              courseForm.candidateTeacherIds.includes(t.plannerTeacherId)
                                ? 'bg-cyan-600 text-white border-cyan-600'
                                : 'bg-white text-gray-500 border-gray-300'
                            }`}
                          >
                            {t.displayName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Room (optional)</label>
                    <select
                      value={courseForm.requiredRoomId}
                      onChange={(e) => setCourseForm((f) => ({ ...f, requiredRoomId: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Homeroom (no shared room)</option>
                      {rooms.map((r) => (
                        <option key={r.roomId} value={r.roomId}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleSaveCourse}
                  disabled={saving}
                  className="px-4 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving…' : 'Save course'}
                </button>
              </div>
            )}

            {expanded.has(group.classGroupId) && (group.courses || []).length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="py-1 pr-4">Course</th>
                      <th className="py-1 pr-4">Per week</th>
                      <th className="py-1 pr-4">Minutes</th>
                      <th className="py-1 pr-4">Teacher</th>
                      <th className="py-1 pr-4">Room</th>
                      <th className="py-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {(group.courses || []).map((course) => (
                      <tr key={course.courseId} className="border-t border-gray-50">
                        <td className="py-1.5 pr-4 font-medium">{course.name}</td>
                        <td className="py-1.5 pr-4">{course.sessionsPerWeek}×</td>
                        <td className="py-1.5 pr-4">
                          {course.durationMinutes ?? settings.defaultDurationMinutes}
                        </td>
                        <td className="py-1.5 pr-4">
                          {course.assignedTeacherId
                            ? teacherName(course.assignedTeacherId)
                            : `Pool: ${course.candidateTeacherIds.map((id) => teacherName(id)).join(', ')}`}
                        </td>
                        <td className="py-1.5 pr-4">
                          {rooms.find((r) => r.roomId === course.requiredRoomId)?.name || '—'}
                        </td>
                        <td className="py-1.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEditCourse(group.classGroupId, course)}
                            className="mr-2 cursor-pointer"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-400 hover:text-cyan-600" />
                          </button>
                          <button onClick={() => handleDeleteCourse(course)} className="cursor-pointer">
                            <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default ClassGroupsTab
