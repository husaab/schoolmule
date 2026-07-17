// File: src/app/(user)/classes/[classId]/edit/_components/StudentsCard.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { getStudentsInClass } from '@/services/classService'
import { getAllStudents } from '@/services/studentService'
import type { StudentPayload } from '@/services/types/student'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getGradeDisplayName, GradeValue } from '@/lib/schoolUtils'
import ClassEnrollStudentModal from '@/components/classes/student/enroll/classEnrollStudentModal'
import ClassUnenrollStudentModal from '@/components/classes/student/unenroll/classUnenrollStudentModal'
import ClassUnenrollAllStudentsModal from '@/components/classes/student/unenroll/all/classUnenrollAllStudentModal'
import Spinner from '@/components/Spinner'
import { ChevronDownIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface StudentsCardProps {
  classId: string
  classGrade: GradeValue
}

const StudentsCard: React.FC<StudentsCardProps> = ({ classId, classGrade }) => {
  const user = useUserStore((state) => state.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [enrolledStudents, setEnrolledStudents] = useState<StudentPayload[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [allStudents, setAllStudents] = useState<StudentPayload[]>([])
  const [studentToUnenroll, setStudentToUnenroll] = useState<StudentPayload | null>(null)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showUnenrollAllModal, setShowUnenrollAllModal] = useState(false)

  // All students in the school (for the enroll modal's pick list)
  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await getAllStudents(user.school || '')
        if (res.status === 'success') {
          setAllStudents(res.data)
        } else {
          console.error('Failed to load all students:', res.message)
        }
      } catch (err) {
        console.error('Error fetching all students:', err)
      }
    }
    fetchAll()
  }, [user.school, selectedYearId]) // refetch when the selected school year changes

  // Currently enrolled students
  useEffect(() => {
    async function fetchStudents() {
      setStudentsLoading(true)
      setStudentsError(null)
      try {
        const res = await getStudentsInClass(classId)
        if (res.status === 'success') {
          setEnrolledStudents(res.data)
        } else {
          setStudentsError(res.message || 'Failed to load students')
        }
      } catch (err) {
        console.error('Error fetching students:', err)
        setStudentsError('Error fetching students')
      } finally {
        setStudentsLoading(false)
      }
    }
    fetchStudents()
  }, [classId])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white cursor-pointer hover:from-cyan-600 hover:to-teal-600 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <UserGroupIcon className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold">Manage Students</span>
          <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
            {enrolledStudents.length} enrolled
          </span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 transform transition-transform duration-200 ${
            isCollapsed ? '-rotate-90' : 'rotate-0'
          }`}
        />
      </button>

      {!isCollapsed && (
        <div className="p-6">
          {/* Currently Enrolled */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Currently Enrolled
            </h3>

            {/* Scrollable list */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {studentsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : studentsError ? (
                <p className="text-red-600 text-center py-4">{studentsError}</p>
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No students enrolled yet.</p>
                </div>
              ) : (
                enrolledStudents.map((stu) => (
                  <div
                    key={stu.studentId}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{stu.name}</p>
                      <p className="text-sm text-slate-500">{getGradeDisplayName(stu.grade)}</p>
                    </div>
                    <button
                      onClick={() => setStudentToUnenroll(stu)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer text-sm font-medium"
                    >
                      Unenroll
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowEnrollModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium cursor-pointer text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Enroll Students
            </button>

            <button
              onClick={() => setShowUnenrollAllModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium cursor-pointer text-sm"
            >
              Unenroll All
            </button>
          </div>
        </div>
      )}

      {/* ─ Unenroll Single Student Modal ─ */}
      {studentToUnenroll && (
        <ClassUnenrollStudentModal
          isOpen={!!studentToUnenroll}
          onClose={() => setStudentToUnenroll(null)}
          classId={classId}
          student={studentToUnenroll}
          onUnenrolled={(studentId) => {
            setEnrolledStudents((prev) =>
              prev.filter((s) => s.studentId !== studentId)
            )
            setStudentToUnenroll(null)
          }}
        />
      )}

      {/* ─ Enroll Students Modal ─ */}
      {showEnrollModal && (
        <ClassEnrollStudentModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          classId={classId}
          classGrade={classGrade}
          allStudents={allStudents}
          enrolledStudentIds={enrolledStudents.map((s) => s.studentId)}
          onEnrolled={(newlyEnrolledIds) => {
            setEnrolledStudents((prev) => [
              ...prev,
              ...allStudents.filter((stu) =>
                newlyEnrolledIds.includes(stu.studentId)
              ),
            ])
          }}
        />
      )}

      {/* ─ Unenroll All Students Modal ─ */}
      {showUnenrollAllModal && (
        <ClassUnenrollAllStudentsModal
          isOpen={showUnenrollAllModal}
          onClose={() => setShowUnenrollAllModal(false)}
          classId={classId}
          onUnenrolledAll={() => setEnrolledStudents([])}
        />
      )}
    </div>
  )
}

export default StudentsCard
