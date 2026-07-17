// File: src/app/(user)/classes/[classId]/edit/_components/TeachersCard.tsx
'use client'

import React, { useState } from 'react'
import { addTeacherToClass, removeTeacherFromClass } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import type { TeacherPayload } from '@/services/types/teacher'
import { useNotificationStore } from '@/store/useNotificationStore'
import Spinner from '@/components/Spinner'
import { PlusIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface TeachersCardProps {
  classData: ClassPayload
  teachers: TeacherPayload[]
  loadingTeachers: boolean
  onClassRefetch: () => Promise<void>
}

const TeachersCard: React.FC<TeachersCardProps> = ({
  classData,
  teachers,
  loadingTeachers,
  onClassRefetch,
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [addTeacherId, setAddTeacherId] = useState<string>('')
  const [addingTeacher, setAddingTeacher] = useState(false)
  const [removingTeacherId, setRemovingTeacherId] = useState<string | null>(null)

  const handleAddAdditionalTeacher = async () => {
    if (!addTeacherId) return

    setAddingTeacher(true)
    try {
      const res = await addTeacherToClass(classData.classId, addTeacherId)
      if (res.status === 'success') {
        await onClassRefetch()
        setAddTeacherId('')
        showNotification('Teacher added successfully', 'success')
      } else {
        showNotification(res.message || 'Failed to add teacher', 'error')
      }
    } catch (err) {
      console.error('Error adding teacher:', err)
      showNotification('Failed to add teacher', 'error')
    } finally {
      setAddingTeacher(false)
    }
  }

  const handleRemoveAdditionalTeacher = async (teacherId: string) => {
    setRemovingTeacherId(teacherId)
    try {
      const res = await removeTeacherFromClass(classData.classId, teacherId)
      if (res.status === 'success') {
        await onClassRefetch()
        showNotification('Teacher removed', 'success')
      } else {
        showNotification(res.message || 'Failed to remove teacher', 'error')
      }
    } catch (err) {
      console.error('Error removing teacher:', err)
      showNotification('Failed to remove teacher', 'error')
    } finally {
      setRemovingTeacherId(null)
    }
  }

  // Teachers available to add (exclude primary + already assigned)
  const availableTeachersToAdd = teachers.filter((t) => {
    if (t.userId === classData.teacherId) return false
    if (classData.additionalTeachers?.some((at) => at.teacherId === t.userId)) return false
    return true
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <UserGroupIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Additional Teachers</h2>
            <p className="text-xs text-slate-500">
              Teachers who can also view and edit this class
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Current additional teachers */}
        {(classData.additionalTeachers ?? []).length > 0 ? (
          <div className="space-y-2 mb-4">
            {(classData.additionalTeachers ?? []).map((t) => (
              <div
                key={t.teacherId}
                className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.fullName}</p>
                  <p className="text-xs text-slate-500">{t.email}</p>
                </div>
                <button
                  onClick={() => handleRemoveAdditionalTeacher(t.teacherId)}
                  disabled={removingTeacherId === t.teacherId}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title={`Remove ${t.fullName}`}
                >
                  {removingTeacherId === t.teacherId ? (
                    <Spinner size="sm" />
                  ) : (
                    <XMarkIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 mb-4">
            No additional teachers assigned to this class.
          </p>
        )}

        {/* Add teacher dropdown */}
        <div className="flex items-center gap-2">
          {loadingTeachers ? (
            <p className="text-sm text-slate-500">Loading teachers...</p>
          ) : (
            <>
              <select
                value={addTeacherId}
                onChange={(e) => setAddTeacherId(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-black bg-slate-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Select a teacher to add...</option>
                {availableTeachersToAdd.map((t) => (
                  <option key={t.userId} value={t.userId}>
                    {t.fullName}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddAdditionalTeacher}
                disabled={!addTeacherId || addingTeacher}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {addingTeacher ? (
                  <Spinner size="sm" />
                ) : (
                  <PlusIcon className="w-4 h-4" />
                )}
                Add
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeachersCard
