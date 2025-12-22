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
import { getAllStudents } from '@/services/studentService'
import { useUserStore } from '@/store/useUserStore'
import { getTeachersBySchool } from '@/services/teacherService'
import type { TeacherPayload } from '@/services/types/teacher'
import { getTermsBySchool, getTermByNameAndSchool } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'
import { getGradeOptions, GradeValue } from '@/lib/schoolUtils'
import Spinner from '@/components/Spinner'
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  PlusIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function EditClassPage() {
  const { classId } = useParams() as { classId: string }
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const user = useUserStore((state) => state.user)

  // ───── Manage Students ─────
  const [isStudentsCollapsed, setIsStudentsCollapsed] = useState(false)
  const [enrolledStudents, setEnrolledStudents] = useState<StudentPayload[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [studentToUnenroll, setStudentToUnenroll] = useState<StudentPayload | null>(null)
  const [isAssessmentsCollapsed, setIsAssessmentsCollapsed] = useState(false)
  const [allStudents, setAllStudents] = useState<StudentPayload[]>([])
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showUnenrollAllModal, setShowUnenrollAllModal] = useState(false)

  // ───── Class Details ─────
  const [classData, setClassData] = useState<ClassPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editSubject, setEditSubject] = useState('')
  const [editGrade, setEditGrade] = useState<GradeValue | ''>('')
  const [editTeacherId, setEditTeacherId] = useState<string>('')    // store selected teacherId
  const [editTermId, setEditTermId] = useState<string>('')         // store selected termId
  const [teachers, setTeachers] = useState<TeacherPayload[]>([])     // list of teacher options
  const [terms, setTerms] = useState<TermPayload[]>([])             // list of term options
  const [currentTermData, setCurrentTermData] = useState<TermPayload | null>(null) // current term details for display
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [loadingTerms, setLoadingTerms] = useState(false)

  // ───── Assessments ─────
  const [assessments, setAssessments] = useState<AssessmentPayload[]>([])
  const [assessLoading, setAssessLoading] = useState(false)
  const [assessError, setAssessError] = useState<string | null>(null)
  const [searchAssess, setSearchAssess] = useState('')
  const [weightSort, setWeightSort] = useState<'asc' | 'desc'>('asc')
  const [editingAssessment, setEditingAssessment] = useState<AssessmentPayload | null>(null)
  const [deleteAssessmentTarget, setDeleteAssessmentTarget] = useState<AssessmentPayload | null>(null)
  const [showAddAssessmentModal, setShowAddAssessmentModal] = useState(false)

  // ───── Fetch “all students” once ─────
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
  }, [user.school])

  // ───── Fetch class on mount ─────
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

  // ───── Fetch current term details when classData becomes available ─────
  useEffect(() => {
    if (!classData?.termName || !classData?.school) return

    const fetchCurrentTermData = async () => {
      try {
        const res = await getTermByNameAndSchool(classData.termName, classData.school)
        if (res.status === 'success') {
          setCurrentTermData(res.data)
        }
      } catch (err) {
        console.error('Error fetching current term data:', err)
      }
    }

    fetchCurrentTermData()
  }, [classData?.termName, classData?.school])

  // ───── Fetch enrolled students once classData is available ─────
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

  // ───── Fetch assessments once classData is available ─────
  useEffect(() => {
    if (!classData) return

    async function fetchAssessments() {
      setAssessLoading(true)
      setAssessError(null)
      try {
        const res = await getAssessmentsByClass(classId)
        if (res.status === 'success') {
          console.log(res.data);
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

  // ───── Fetch teachers and terms once entering edit mode ─────
  useEffect(() => {
    if (!isEditing || !user.school) return

    const fetchTeachers = async () => {
      setLoadingTeachers(true)
      try {
        const res = await getTeachersBySchool(user.school!)
        if (res.status === 'success') {
          setTeachers(res.data)
        } else {
          console.error('Failed to fetch teachers:', res.message)
          showNotification('Failed to load teacher list', 'error')
        }
      } catch (err) {
        console.error('Error loading teachers:', err)
        showNotification('Error loading teacher list', 'error')
      } finally {
        setLoadingTeachers(false)
      }
    }

    const fetchTerms = async () => {
      setLoadingTerms(true)
      try {
        const res = await getTermsBySchool(user.school!)
        if (res.status === 'success') {
          setTerms(res.data)
        } else {
          showNotification('Failed to load terms list', 'error')
        }
      } catch (err) {
        console.error('Error loading terms:', err)
        showNotification('Error loading terms list', 'error')
      } finally {
        setLoadingTerms(false)
      }
    }

    fetchTeachers()
    fetchTerms()
  }, [isEditing, user.school, showNotification])

  // ───── Populate “edit” fields when starting to edit ─────
  useEffect(() => {
    if (isEditing && classData) {
      setEditSubject(classData.subject)
      setEditGrade(classData.grade)
      setEditTeacherId(classData.teacherId)
      setEditTermId(classData.termId || '')
    }
  }, [isEditing, classData])

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="flex justify-center items-center py-32">
            <Spinner size="lg" />
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="p-6 lg:p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Class</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/classes')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium cursor-pointer"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Classes
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!classData) return null

  // Destructure using new fields
  const {
    subject,
    grade,
    teacherName,    // ← renamed
    // teacherId not displayed in this component
    termName,       // ← term name
    // termId not displayed in this component
    school,
    createdAt,
    lastModifiedAt,
  } = classData

  // ─── Save changes on class details ───
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      editSubject.trim() === '' ||
      editGrade === '' ||
      editTeacherId.trim() === '' ||
      editTermId.trim() === ''
    ) {
      showNotification('All fields are required', 'error')
      return
    }

    // Find full name of selected teacher
    const selectedTeacher = teachers.find((t) => t.userId === editTeacherId)
    if (!selectedTeacher) {
      showNotification('Selected teacher not found', 'error')
      return
    }

    // Find selected term's name
    const selectedTerm = terms.find((t) => t.termId === editTermId)
    if (!selectedTerm) {
      showNotification('Selected term not found', 'error')
      return
    }

    try {
      const payload = {
        grade:       editGrade as GradeValue,
        subject:     editSubject.trim(),
        teacherName: selectedTeacher.fullName,
        teacherId:   selectedTeacher.userId,
        termId:      selectedTerm.termId,
        termName:    selectedTerm.name,
      }
      const res = await updateClass(classId, payload)
      if (res.status === 'success') {
        const updatedRaw = res.data
        setClassData({
          classId:       updatedRaw.classId,
          school:        updatedRaw.school,
          grade:         updatedRaw.grade,
          subject:       updatedRaw.subject,
          teacherName:   updatedRaw.teacherName,
          teacherId:     updatedRaw.teacherId,
          termId:        updatedRaw.termId,
          termName:      updatedRaw.termName,
          createdAt:     updatedRaw.createdAt,
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
    .sort((a, b) => {
      const aPoints = a.weightPoints || a.weightPercent || 0
      const bPoints = b.weightPoints || b.weightPercent || 0
      return weightSort === 'asc' ? aPoints - bPoints : bPoints - aPoints
    })

  // ─── Compute total points (only parent and standalone assessments) ───
  const totalPoints = assessments
    .filter(a => !a.parentAssessmentId) // Only include parent and standalone assessments
    .reduce((sum, a) => sum + Number(a.weightPoints || a.weightPercent || 0), 0)

  // ─── Remove a student (opens confirm modal) ───
  const handleRemoveClick = (stu: StudentPayload) => {
    setStudentToUnenroll(stu)
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/classes')}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                Edit Class
              </h1>
              <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg text-sm font-medium">
                Grade {grade}
              </span>
            </div>
            <p className="text-slate-500 ml-12">{subject} • {teacherName}</p>
          </div>

          {/* Container for class details + sections */}
          <div className="space-y-6">
            {/* ---------------- Class Details Card ---------------- */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                    <AcademicCapIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Class Details</h2>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all font-medium cursor-pointer text-sm"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancel}
                      className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="cursor-pointer px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium text-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-6">
                {!isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Subject</p>
                      <p className="text-slate-900 font-medium">{subject}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Grade</p>
                      <p className="text-slate-900 font-medium">Grade {grade}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Teacher</p>
                      <p className="text-slate-900 font-medium">{teacherName || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">School</p>
                      <p className="text-slate-900 font-medium">{school}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl md:col-span-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Term</p>
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                        <p className="text-slate-900 font-medium">{termName || 'Not assigned'}</p>
                        {currentTermData && (
                          <span className="text-sm text-slate-500">
                            ({new Date(currentTermData.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })} - {new Date(currentTermData.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Created</p>
                      <p className="text-slate-900 font-medium">{new Date(createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Last Modified</p>
                      <p className="text-slate-900 font-medium">{lastModifiedAt ? new Date(lastModifiedAt).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                        <input
                          required
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-black bg-slate-50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
                        <select
                          required
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value as GradeValue)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-black bg-slate-50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer"
                        >
                          <option value="" disabled>
                            Select grade
                          </option>
                          {getGradeOptions().map((gradeOption) => (
                            <option key={gradeOption.value} value={gradeOption.value}>
                              {gradeOption.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Teacher Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Teacher</label>
                        {loadingTeachers ? (
                          <p className="text-slate-500 py-2">Loading teachers…</p>
                        ) : (
                          <select
                            required
                            value={editTeacherId}
                            onChange={(e) => setEditTeacherId(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-black bg-slate-50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer"
                          >
                            <option value="" disabled>
                              Select teacher
                            </option>
                            {teachers.map((t) => (
                              <option key={t.userId} value={t.userId}>
                                {t.fullName}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Term Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Term</label>
                        {loadingTerms ? (
                          <p className="text-slate-500 py-2">Loading terms…</p>
                        ) : (
                          <select
                            required
                            value={editTermId}
                            onChange={(e) => setEditTermId(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-black bg-slate-50 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer"
                          >
                            <option value="" disabled>
                              Select term
                            </option>
                            {terms.map((t) => (
                              <option key={t.termId} value={t.termId}>
                                {t.name} ({t.academicYear})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* ─────────────── Manage Students Section ─────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => setIsStudentsCollapsed((prev) => !prev)}
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
                    isStudentsCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
              </button>

              {!isStudentsCollapsed && (
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
                              <p className="text-sm text-slate-500">Grade {stu.grade}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveClick(stu)}
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
            </div>
            {/* ───────────── End Manage Students ───────────── */}

            {/* ─────────────── Assessments Section ─────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => setIsAssessmentsCollapsed((prev) => !prev)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white cursor-pointer hover:from-cyan-600 hover:to-teal-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <ClipboardDocumentListIcon className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-semibold">Assessments</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                    {assessments.filter(a => !a.parentAssessmentId).length} total
                  </span>
                </div>
                <ChevronDownIcon
                  className={`w-5 h-5 transform transition-transform duration-200 ${
                    isAssessmentsCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
              </button>

              {!isAssessmentsCollapsed && (
                <div>
                  {/* Controls: Search / Sort / Add */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <input
                      type="text"
                      placeholder="Search assessments…"
                      value={searchAssess}
                      onChange={(e) => setSearchAssess(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-black"
                    />

                    <select
                      value={weightSort}
                      onChange={(e) => setWeightSort(e.target.value as 'asc' | 'desc')}
                      className="w-full sm:w-40 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-black cursor-pointer"
                    >
                      <option value="asc">Points ↑</option>
                      <option value="desc">Points ↓</option>
                    </select>

                    <button
                      onClick={() => setShowAddAssessmentModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium cursor-pointer text-sm whitespace-nowrap"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Assessment
                    </button>
                  </div>

                  {/* Total Points Banner */}
                  {totalPoints !== 100 ? (
                    <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-b border-amber-100">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-amber-700 font-medium">
                          Total: <strong>{totalPoints.toFixed(1)} points</strong>
                        </p>
                        <p className="text-amber-600 text-sm">
                          Assessments should total 100 points for proper grade calculation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 border-b border-emerald-100">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <p className="text-emerald-700 font-medium">
                        Total: <strong>{totalPoints.toFixed(1)} points</strong>
                      </p>
                    </div>
                  )}

                  {/* Assessment List */}
                  <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
                    {assessLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="md" />
                      </div>
                    ) : assessError ? (
                      <p className="text-red-600 text-center py-4">{assessError}</p>
                    ) : filteredAssessments.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                          <ClipboardDocumentListIcon className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-slate-500">No assessments found.</p>
                      </div>
                    ) : (
                      filteredAssessments.map((a) => {
                        if (a.parentAssessmentId) return null;

                        const childAssessments = a.isParent
                          ? filteredAssessments.filter(child => child.parentAssessmentId === a.assessmentId)
                          : [];

                        return (
                          <div key={a.assessmentId} className="space-y-2">
                            {/* Parent/Standalone Assessment */}
                            <div
                              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                a.isParent
                                  ? 'bg-blue-50 border-blue-100 hover:bg-blue-100'
                                  : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-slate-900">{a.name}</p>
                                  {a.isParent && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                                      Multiple
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                  <span className="font-medium text-slate-700">
                                    {a.weightPoints || a.weightPercent || 0} pts
                                  </span>
                                  {a.maxScore && !a.isParent && (
                                    <span>Max: {a.maxScore}</span>
                                  )}
                                  <span>{a.date ? a.date.split('T')[0] : "No date"}</span>
                                  {a.isParent && childAssessments.length > 0 && (
                                    <span className="text-blue-600">
                                      {childAssessments.length} sub-assessment{childAssessments.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingAssessment(a)}
                                  className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors cursor-pointer text-sm font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteAssessmentTarget(a)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title={a.isParent ? "Delete parent and all child assessments" : "Delete assessment"}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Child Assessments */}
                            {a.isParent && childAssessments.length > 0 && (
                              <div className="ml-6 space-y-1">
                                {childAssessments.map((child) => (
                                  <div
                                    key={child.assessmentId}
                                    className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-300">└─</span>
                                        <p className="font-medium text-slate-700 text-sm">{child.name}</p>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                                          Individual
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4 ml-6 mt-1 text-xs text-slate-400">
                                        <span>{child.weightPoints || child.weightPercent || 0} pts</span>
                                        {child.maxScore && <span>Max: {child.maxScore}</span>}
                                        <span>{child.date ? child.date.split('T')[0] : "No date"}</span>
                                      </div>
                                    </div>
                                    <span className="text-xs text-slate-400 italic">Edit via parent</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }).filter(Boolean)
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* ───────────── End Assessments ───────────── */}
          </div>
        </div>
      </main>

      {/* ─ Assessment Edit Modal ─ */}
      {editingAssessment && (
        <AssessmentEditModal
          isOpen={!!editingAssessment}
          assessment={editingAssessment}
          allAssessments={assessments}
          onClose={() => setEditingAssessment(null)}
          onUpdate={(updated) => {
            setAssessments((prev) =>
              prev.map((a) => (a.assessmentId === updated.assessmentId ? updated : a))
            )
            setEditingAssessment(null)
          }}
          onBatchUpdate={(updated, deleted) => {
            setAssessments((prev) => {
              // Remove deleted assessments
              const filteredAssessments = prev.filter(a => !deleted.includes(a.assessmentId))
              
              // Update existing assessments and add new ones
              const updatedAssessments = [...filteredAssessments]
              updated.forEach(updatedAssessment => {
                const existingIndex = updatedAssessments.findIndex(a => a.assessmentId === updatedAssessment.assessmentId)
                if (existingIndex >= 0) {
                  updatedAssessments[existingIndex] = updatedAssessment
                } else {
                  updatedAssessments.push(updatedAssessment)
                }
              })
              
              return updatedAssessments
            })
            setEditingAssessment(null)
          }}
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

      {/* ─ Add Assessment Modal ─ */}
      {showAddAssessmentModal && (
        <AssessmentAddModal
          isOpen={showAddAssessmentModal}
          classId={classId}
          onClose={() => setShowAddAssessmentModal(false)}
          onAdd={(newA) => {
            setAssessments((prev) => [newA, ...prev])
            setShowAddAssessmentModal(false)
          }}
          onBatchAdd={(newAssessments) => {
            setAssessments((prev) => [...newAssessments, ...prev])
            setShowAddAssessmentModal(false)
          }}
        />
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
          classGrade={classData!.grade}
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
    </>
  )
}
