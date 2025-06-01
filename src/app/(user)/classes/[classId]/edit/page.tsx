// File: src/app/(user)/classes/[classId]/edit/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { StudentPayload } from '@/services/types/student'
import {
  getClassById,
  updateClass,
  getAssessmentsByClass,
  getStudentsInClass,
} from '@/services/classService'
import { ClassPayload } from '@/services/types/class'
import { AssessmentPayload } from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'
import AssessmentEditModal from '@/components/assessments/edit/assessmentEditModal'
import AssessmentDeleteModal from '@/components/assessments/delete/assessmentDeleteModal'
import AssessmentAddModal from '@/components/assessments/add/assessmentAddModal'
import ClassUnenrollStudentModal from '@/components/classes/student/unenroll/classUnenrollStudentModal'
import ClassEnrollStudentModal from '@/components/classes/student/enroll/classEnrollStudentModal'
import ClassUnenrollAllStudentsModal from '@/components/classes/student/unenroll/all/classUnenrollAllStudentModal'
import { getAllStudents } from '@/services/studentService' // your studentService
import { useUserStore } from '@/store/useUserStore'

export default function EditClassPage() {
  const { classId } = useParams() as { classId: string }
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const user = useUserStore((state) => state.user)

  const [isStudentsCollapsed, setIsStudentsCollapsed] = useState(false)
  const [enrolledStudents, setEnrolledStudents] = useState<StudentPayload[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)

  // Only track which student to confirm removal for
  const [studentToUnenroll, setStudentToUnenroll] = useState<StudentPayload | null>(null)

  const [isAssessmentsCollapsed, setIsAssessmentsCollapsed] = useState(false)

  // “All students” list (used by the modal)
  const [allStudents, setAllStudents] = useState<StudentPayload[]>([])

  // Controls the “Enroll Students” modal
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showUnenrollAllModal, setShowUnenrollAllModal] = useState(false)

  // — Class Details State —
  const [classData, setClassData] = useState<ClassPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editSubject, setEditSubject] = useState('')
  const [editGrade, setEditGrade] = useState<number | ''>('')
  const [editTeacher, setEditTeacher] = useState('')

  // — Assessment State —
  const [assessments, setAssessments] = useState<AssessmentPayload[]>([])
  const [assessLoading, setAssessLoading] = useState(false)
  const [assessError, setAssessError] = useState<string | null>(null)

  const [searchAssess, setSearchAssess] = useState('')
  const [weightSort, setWeightSort] = useState<'asc' | 'desc'>('asc')

  // Track which assessment is being edited / deleted
  const [editingAssessment, setEditingAssessment] = useState<AssessmentPayload | null>(null)
  const [deleteAssessmentTarget, setDeleteAssessmentTarget] = useState<AssessmentPayload | null>(null)
  const [showAddAssessmentModal, setShowAddAssessmentModal] = useState(false)

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // Fetch “all students” once (so the enroll modal can filter by grade)
  useEffect(() => {
    async function fetchAll() {
      try {
        // Assuming your studentService has getAllStudents(school)
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
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // ─ Fetch class on mount ─
  useEffect(() => {
    async function fetchClass() {
      setLoading(true)
      setError(null)
      try {
        const res = await getClassById(classId)
        if (res.status === 'success') {
          setClassData(res.data)
        } else {
          setError(res.message || 'Failed to load class')
        }
      } catch (err) {
        console.error('Error fetching class:', err)
        setError('Error fetching class')
      } finally {
        setLoading(false)
      }
    }
    fetchClass()
  }, [classId])

  // ─ Fetch “currently enrolled” students once classData is available ─
  useEffect(() => {
    if (!classData) return

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
  }, [classData, classId])

  // ─ Populate “edit” fields when entering edit mode ─
  useEffect(() => {
    if (isEditing && classData) {
      setEditSubject(classData.subject)
      setEditGrade(classData.grade)
      setEditTeacher(classData.homeroomTeacherName)
    }
  }, [isEditing, classData])

  // ─ Fetch assessments once classData is available ─
  useEffect(() => {
    if (!classData) return

    async function fetchAssessments() {
      setAssessLoading(true)
      setAssessError(null)
      try {
        const res = await getAssessmentsByClass(classId)
        if (res.status === 'success') {
          setAssessments(res.data)
        } else {
          setAssessError(res.message || 'Failed to load assessments')
        }
      } catch (err) {
        console.error('Error fetching assessments:', err)
        setAssessError('Error fetching assessments')
      } finally {
        setAssessLoading(false)
      }
    }

    fetchAssessments()
  }, [classData, classId])

  if (loading) {
    return (
      <div className="ml-32 bg-white min-h-screen p-10 text-center">
        <p className="text-black">Loading class data…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="ml-32 bg-white min-h-screen p-10 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.push('/classes')}
          className="mt-4 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
        >
          Back to Classes
        </button>
      </div>
    )
  }
  if (!classData) return null

  const { subject, grade, homeroomTeacherName, school, createdAt, lastModifiedAt } = classData

  // ─── Save changes on class details ───
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editSubject.trim() === '' || editGrade === '' || editTeacher.trim() === '') {
      showNotification('All fields are required', 'error')
      return
    }

    try {
      const payload = {
        grade: editGrade as number,
        subject: editSubject.trim(),
        homeroom_teacher_name: editTeacher.trim(),
      }
      const res = await updateClass(classId, payload)
      if (res.status === 'success') {
        const updatedRaw = res.data as any
        setClassData({
          classId: updatedRaw.classId,
          school: updatedRaw.school,
          grade: updatedRaw.grade,
          subject: updatedRaw.subject,
          homeroomTeacherName: updatedRaw.homeroomTeacherName,
          createdAt: updatedRaw.createdAt,
          lastModifiedAt: updatedRaw.lastModifiedAt,
        })
        showNotification('Class updated successfully', 'success')
        setIsEditing(false)
      } else {
        showNotification(res.message || 'Failed to update class', 'error')
      }
    } catch (err) {
      console.error('Error updating class:', err)
      showNotification('Error updating class', 'error')
    }
  }
  const handleCancel = () => {
    setIsEditing(false)
  }

  // ─── Filter & Sort Assessments ───
  const filteredAssessments = assessments
    .filter((a) => a.name.toLowerCase().includes(searchAssess.toLowerCase()))
    .sort((a, b) =>
      weightSort === 'asc'
        ? a.weightPercent - b.weightPercent
        : b.weightPercent - a.weightPercent
    )

  // ─── Compute total weight ───
  const totalWeight = assessments.reduce((sum, a) => sum + a.weightPercent, 0)

  // ─── “Remove” a student (opens the confirm modal) ───
  const handleRemoveClick = (stu: StudentPayload) => {
    setStudentToUnenroll(stu)
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-32 bg-white min-h-screen p-10">
        {/* Page header */}
        <div className="pt-30 pb-10 text-black">
          <h1 className="text-3xl text-center">Edit Class</h1>
        </div>

        {/* Container for class details + assessments */}
        <div className="w-[70%] mx-auto space-y-8">
          {/* ---------------- Class Details Box ---------------- */}
          <div className="border border-gray-300 rounded-lg shadow-lg p-6 bg-gray-50 relative">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition cursor-pointer"
              >
                Edit
              </button>
            ) : (
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="cursor-pointer px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="cursor-pointer px-3 py-1 bg-green-400 text-white rounded hover:bg-green-500 transition"
                >
                  Save
                </button>
              </div>
            )}

            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Class Details</h2>

            {!isEditing ? (
              <div className="space-y-3 text-gray-800">
                <div>
                  <strong>Subject:</strong> {subject}
                </div>
                <div>
                  <strong>Grade:</strong> {grade}
                </div>
                <div>
                  <strong>Homeroom Teacher:</strong> {homeroomTeacherName || '-'}
                </div>
                <div>
                  <strong>School:</strong> {school}
                </div>
                <div>
                  <strong>Created At:</strong> {new Date(createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>Last Modified:</strong>{' '}
                  {lastModifiedAt ? new Date(lastModifiedAt).toLocaleDateString() : '-'}
                </div>
              </div>
            ) : (
              <form className="space-y-4 text-gray-800" onSubmit={handleSave}>
                <div>
                  <label className="block text-sm mb-1">Subject</label>
                  <input
                    required
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Grade</label>
                  <select
                    required
                    value={editGrade}
                    onChange={(e) => setEditGrade(Number(e.target.value))}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="" disabled>
                      Select grade
                    </option>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Homeroom Teacher Name</label>
                  <input
                    required
                    value={editTeacher}
                    onChange={(e) => setEditTeacher(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </form>
            )}
          </div>

          {/* ─────────────── Manage Students Section ─────────────── */}
          <div>
            {/* Header: click to expand/collapse */}
            <div
              onClick={() => setIsStudentsCollapsed((prev) => !prev)}
              className={`flex items-center justify-between cursor-pointer px-4 py-2 bg-cyan-600 ${
                isStudentsCollapsed ? 'rounded-lg' : 'rounded-t-lg'
              }`}
            >
              <span className="text-2xl font-semibold text-white">Manage Students</span>
              <svg
                className={`w-6 h-6 transform transition-transform ${
                  isStudentsCollapsed ? '-rotate-90' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {!isStudentsCollapsed && (
              <div className="border border-t-0 border-gray-300 rounded-b-lg shadow-lg bg-gray-50 text-black">
                {/* ─ Currently Enrolled ─ */}
                <div className="px-6 py-4 space-y-2">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Currently Enrolled
                  </h3>

                  {/* Make the list scrollable past a certain height */}
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {studentsLoading ? (
                      <p className="text-gray-600">Loading students…</p>
                    ) : studentsError ? (
                      <p className="text-red-600">{studentsError}</p>
                    ) : enrolledStudents.length === 0 ? (
                      <p className="text-gray-600">No students enrolled yet.</p>
                    ) : (
                      enrolledStudents.map((stu) => (
                        <div
                          key={stu.studentId}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
                        >
                          <div>
                            <p className="font-medium text-gray-800">{stu.name}</p>
                            <p className="text-sm text-gray-600">Grade {stu.grade}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveClick(stu)}
                            className="px-2 py-1 bg-cyan-700 text-white rounded hover:bg-cyan-800 cursor-pointer"
                          >
                            Unenroll
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ─ Enroll / Unenroll All Buttons ─ */}
                <div className="px-6 py-4 flex space-x-4">
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-600 cursor-pointer"
                  >
                    + Enroll Students
                  </button>

                  <button
                    onClick={() => setShowUnenrollAllModal(true)}
                    className="px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 cursor-pointer"
                  >
                    Unenroll All
                  </button>
                </div>

              </div>
            )}
          </div>
          {/* ───────────── End Manage Students ───────────── */}

          {/* ─────────────── Toggleable Assessments Section ─────────────── */}
          <div>
            {/* Header: click to expand/collapse */}
            <div
              onClick={() => setIsAssessmentsCollapsed((prev) => !prev)}
              className={`flex items-center justify-between cursor-pointer px-4 py-2 bg-cyan-600 ${
                isAssessmentsCollapsed ? 'rounded-lg' : 'rounded-t-lg'
              }`}
            >
              <span className="text-2xl font-semibold text-white">Assessments</span>
              <svg
                className={`w-6 h-6 transform transition-transform ${
                  isAssessmentsCollapsed ? '-rotate-90' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {!isAssessmentsCollapsed && (
              <div className="border border-t-0 border-gray-300 rounded-b-lg shadow-lg bg-gray-50 text-black">
                {/* ─ Top controls: Search / Sort / +Add ─ */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 pt-4 pb-4 border-b border-gray-200 gap-2">
                  {/* Search by name */}
                  <input
                    type="text"
                    placeholder="Search assessments…"
                    value={searchAssess}
                    onChange={(e) => setSearchAssess(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                  />

                  {/* Sort by weight */}
                  <select
                    value={weightSort}
                    onChange={(e) => setWeightSort(e.target.value as 'asc' | 'desc')}
                    className="w-full bg-white sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="asc">Weight ↑</option>
                    <option value="desc">Weight ↓</option>
                  </select>

                  {/* + Add Assessment button */}
                  <button
                    onClick={() => setShowAddAssessmentModal(true)}
                    className="px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-500 cursor-pointer"
                  >
                    + Add Assessment
                  </button>
                </div>

                {/* total‐weight warning if not exactly 100 */}
                {totalWeight !== 100 && (
                  <div className="px-6 py-3 bg-red-100 border border-red-300 text-red-700">
                    ⚠️ Sum of all assessment weights is <strong>{totalWeight}%</strong>; it
                    must equal <strong>100%</strong>.
                  </div>
                )}

                {/* Scrollable list area */}
                <div className="p-6 max-h-96 overflow-y-auto space-y-4 text-black">
                  {assessLoading ? (
                    <p className="text-gray-600">Loading assessments…</p>
                  ) : assessError ? (
                    <p className="text-red-600">{assessError}</p>
                  ) : filteredAssessments.length === 0 ? (
                    <p className="text-gray-600">No assessments found.</p>
                  ) : (
                    filteredAssessments.map((a) => (
                      <div
                        key={a.assessmentId}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded shadow-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{a.name}</p>
                          <p className="text-sm text-gray-600">Weight: {a.weightPercent}%</p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(a.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setEditingAssessment(a)}
                            className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteAssessmentTarget(a)}
                            className="text-2xl text-red-600 hover:text-red-800 font-bold px-2 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* ───────────── End Toggleable Assessments ───────────── */}
        </div>
      </main>

      {/* ─ Assessment Edit Modal ─ */}
      {editingAssessment && (
        <AssessmentEditModal
          isOpen={!!editingAssessment}
          assessment={editingAssessment}
          onClose={() => setEditingAssessment(null)}
          onUpdate={(updated) => {
            setAssessments((prev) =>
              prev.map((a) => (a.assessmentId === updated.assessmentId ? updated : a))
            )
            setEditingAssessment(null)
          }}
        />
      )}

      {showUnenrollAllModal && (
      <ClassUnenrollAllStudentsModal
        isOpen={showUnenrollAllModal}
        onClose={() => setShowUnenrollAllModal(false)}
        classId={classId}
        onUnenrolledAll={() => setEnrolledStudents([])}
      />
      )}

      {/* ─ Assessment Delete Modal ─ */}
      {deleteAssessmentTarget && (
        <AssessmentDeleteModal
          isOpen={!!deleteAssessmentTarget}
          assessment={deleteAssessmentTarget}
          onClose={() => setDeleteAssessmentTarget(null)}
          onDeleted={(deletedId) => {
            setAssessments((prev) =>
              prev.filter((a) => a.assessmentId !== deletedId)
            )
            setDeleteAssessmentTarget(null)
          }}
        />
      )}

      {showAddAssessmentModal && (
        <AssessmentAddModal
          isOpen={showAddAssessmentModal}
          classId={classId}
          onClose={() => setShowAddAssessmentModal(false)}
          onAdd={(newA) => {
            setAssessments((prev) => [newA, ...prev])
            setShowAddAssessmentModal(false)
          }}
        />
      )}

      {studentToUnenroll && (
        <ClassUnenrollStudentModal
          isOpen={!!studentToUnenroll}
          onClose={() => setStudentToUnenroll(null)}
          classId={classId}
          student={studentToUnenroll}
          onUnenrolled={(studentId) => {
            // Update local state
            setEnrolledStudents((prev) =>
              prev.filter((s) => s.studentId !== studentId)
            )
            setStudentToUnenroll(null)
          }}
        />
      )}

      {showEnrollModal && (
        <ClassEnrollStudentModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          classId={classId}
          classGrade={classData!.grade}
          allStudents={allStudents}
          enrolledStudentIds={enrolledStudents.map((s) => s.studentId)}
          onEnrolled={(newlyEnrolledIds) => {
            // Merge newly enrolled into local state
            setEnrolledStudents((prev) => [
              ...prev,
              ...allStudents.filter((stu) =>
                newlyEnrolledIds.includes(stu.studentId)
              ),
            ])
          }}
        />
      )}
    </>
  )
}
