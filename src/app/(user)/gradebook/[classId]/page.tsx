'use client'

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'

import {
  getClassById,
  getStudentsInClass,
  getAssessmentsByClass,
  getScoresByClass,
  upsertScoresByClass,
  downloadGradebookExcel
} from '@/services/classService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import type { AssessmentPayload } from '@/services/types/assessment'
import { getTermByNameAndSchool } from '@/services/termService'
import StudentAssessmentsModal from '@/components/assessments/student/studentAssessmentsModal'
import type { TermPayload } from '@/services/types/term'
import OpenFeedBackModal from '@/components/feedback/openFeedbackModal';
import ChildAssessmentsModal from '@/components/assessments/child/ChildAssessmentsModal';
import ProgressReportModal from '@/components/progress-report/ProgressReportModal';
import ExcludedAssessmentsModal from '@/components/assessments/excluded/excludedAssessmentsModal';
import { getExclusionsByClass, createExclusion, deleteExclusion } from '@/services/excludedAssessmentService';
import {
  MinusCircleIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import Spinner from '@/components/Spinner';

interface ScoreRow {
  student_id: string
  student_name: string
  assessment_id: string
  assessment_name: string
  weight_percent: number
  weight_points: number
  max_score: number
  is_parent: boolean
  parent_assessment_id: string | null
  score: number | null
  is_excluded: boolean
}

const GradebookClass = () => {
  const { classId } = useParams() as { classId: string }
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [classData, setClassData] = useState<ClassPayload | null>(null)
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [assessments, setAssessments] = useState<AssessmentPayload[]>([])
  const [scoresMatrix, setScoresMatrix] = useState<ScoreRow[]>([])
  const [termData, setTermData] = useState<TermPayload | null>(null)

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isProgressReportModalOpen, setIsProgressReportModalOpen] = useState(false);

  // Child assessments modal state
  const [selectedParentAssessment, setSelectedParentAssessment] = useState<AssessmentPayload | null>(null);
  const [isChildAssessmentsModalOpen, setIsChildAssessmentsModalOpen] = useState(false);

  // Student assessments modal state
  const [selectedStudent, setSelectedStudent] = useState<{ studentId: string; name: string } | null>(null);
  const [isStudentAssessmentsModalOpen, setIsStudentAssessmentsModalOpen] = useState(false);

  // Exclusions modal state
  const [selectedExclusionStudent, setSelectedExclusionStudent] = useState<{ studentId: string; name: string } | null>(null);
  const [isExclusionsModalOpen, setIsExclusionsModalOpen] = useState(false);
  const [exclusionsData, setExclusionsData] = useState<{ [studentId: string]: number }>({});

  // Edited scores: keyed by "studentId|assessmentId" → number or '' (empty means "no entry yet")
  const [editedScores, setEditedScores] = useState<{ [key: string]: number | '' }>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(editedScores).length > 0

  // Load exclusions data for all students in one efficient API call
  const loadExclusionsData = useCallback(async () => {
    try {
      const res = await getExclusionsByClass(classId)
      if (res.status === 'success') {
        const exclusionCounts: { [studentId: string]: number } = {}
        res.data.forEach(exclusion => {
          exclusionCounts[exclusion.studentId] = (exclusionCounts[exclusion.studentId] || 0) + 1
        })
        setExclusionsData(exclusionCounts)
      } else {
        setExclusionsData({})
      }
    } catch (error) {
      console.error('Error loading exclusions data:', error)
      setExclusionsData({})
    }
  }, [classId])

  // Refresh exclusions data AND scores matrix to update visual indicators
  const refreshExclusionsData = async () => {
    await Promise.all([
      loadExclusionsData(),
      refreshScoresMatrix()
    ])
  }

  // Refresh scores matrix from backend
  const refreshScoresMatrix = async () => {
    try {
      const refreshed = await getScoresByClass(classId)
      if (refreshed.status === 'success') {
        setScoresMatrix(refreshed.data as ScoreRow[])
      }
    } catch (error) {
      console.error('Error refreshing scores matrix:', error)
    }
  }

  useEffect(() => {
    if (!classId) return

    setLoading(true)
    setError(null)

    Promise.all([
      getClassById(classId),
      getStudentsInClass(classId),
      getAssessmentsByClass(classId),
      getScoresByClass(classId),
    ])
      .then(([classRes, stuRes, assessRes, scoreRes]) => {
        if (classRes.status !== 'success') {
          throw new Error(classRes.message || 'Failed to load class info')
        }
        setClassData(classRes.data)

        if (stuRes.status !== 'success') {
          throw new Error(stuRes.message || 'Failed to load students')
        }
        setStudents(stuRes.data)

        if (assessRes.status !== 'success') {
          throw new Error(assessRes.message || 'Failed to load assessments')
        }
        setAssessments(assessRes.data)

        if (scoreRes.status !== 'success') {
          throw new Error(scoreRes.message || 'Failed to load scores')
        }
        setScoresMatrix(scoreRes.data as ScoreRow[])

        loadExclusionsData()
      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'Unexpected error')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [classId, loadExclusionsData])

  // Fetch term details when classData becomes available
  useEffect(() => {
    if (!classData?.termName || !classData?.school) return

    const fetchTermData = async () => {
      try {
        const res = await getTermByNameAndSchool(classData.termName, classData.school)
        if (res.status === 'success') {
          setTermData(res.data)
        }
      } catch (err) {
        console.error('Error fetching term data:', err)
      }
    }

    fetchTermData()
  }, [classData?.termName, classData?.school])

  // Warn user about unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have not saved your grade changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    const handlePopState = () => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm('You have not saved your grade changes. Are you sure you want to leave?')
        if (!confirmLeave) {
          window.history.pushState(null, '', window.location.href)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    if (hasUnsavedChanges) {
      window.history.pushState(null, '', window.location.href)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasUnsavedChanges])

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
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Gradebook</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/gradebook')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium cursor-pointer"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Gradebook
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!classData) return null

  // Filter assessments to show only parent and standalone (hide children)
  const displayedAssessments = assessments.filter(a => !a.parentAssessmentId)

  // Build quick lookups
  const existingScoreMap: Record<string, number | null> = {}
  const exclusionMap: Record<string, boolean> = {}
  scoresMatrix.forEach((row) => {
    const key = `${row.student_id}|${row.assessment_id}`
    existingScoreMap[key] = row.score
    exclusionMap[key] = row.is_excluded
  })

  const handleExportExcel = async () => {
    try {
      const blob = await downloadGradebookExcel(classId);
      const safeSubject = String(classData.subject)
        .trim()
        .replace(/\s+/g, '_');
      const fileName = `Gradebook_Grade_${classData.grade}_${safeSubject}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Failed to download Excel sheet');
    }
  };

  const handleScoreChange = (
    studentId: string,
    assessmentId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value

    let val: number | '' = ''
    if (raw !== '') {
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        const assessment = assessments.find(a => a.assessmentId === assessmentId)
        if (assessment) {
          const maxScore = Number(assessment.maxScore || 100)
          val = Math.min(Math.max(parsed, 0), maxScore)
        } else {
          val = Math.min(Math.max(parsed, 0), 100)
        }
      } else {
        val = ''
      }
    }

    const compositeKey = `${studentId}|${assessmentId}`
    const existingValue = existingScoreMap[compositeKey] ?? null

    setEditedScores((prev) => {
      const newState = { ...prev }

      const isBackToOriginal = (
        (val === '' && existingValue === null) ||
        (typeof val === 'number' && val === existingValue)
      )

      if (isBackToOriginal) {
        delete newState[compositeKey]
      } else {
        newState[compositeKey] = val
      }

      return newState
    })
  }

  const computeTotalForStudent = (studentId: string) => {
    let total = 0
    let totalActiveWeight = 0

    displayedAssessments.forEach((a) => {
      const key = `${studentId}|${a.assessmentId}`
      const isExcluded = exclusionMap[key] || false

      if (isExcluded) {
        return
      }
      let scoreToUse = 0
      const assessmentWeight = Number(a.weightPoints || a.weightPercent || 0)
      totalActiveWeight += assessmentWeight

      if (a.isParent) {
        const childAssessments = assessments.filter(child => child.parentAssessmentId === a.assessmentId)
        if (childAssessments.length > 0) {
          let totalPoints = 0
          let maxPossiblePoints = 0

          childAssessments.forEach(child => {
            const childKey = `${studentId}|${child.assessmentId}`
            const isChildExcluded = exclusionMap[childKey] || false

            if (isChildExcluded) {
              return
            }
            const childRawValue = editedScores[childKey] !== undefined
              ? editedScores[childKey]
              : existingScoreMap[childKey] ?? null

            const rawScore = typeof childRawValue === 'number'
              ? childRawValue
              : childRawValue !== null && childRawValue !== undefined
              ? parseFloat(String(childRawValue)) || 0
              : 0

            const maxScore = Number(child.maxScore || 100)
            const childPoints = Number(child.weightPoints || child.weightPercent || 0)

            const percentage = maxScore > 0 ? Math.min(rawScore / maxScore, 1) : 0
            const earnedPoints = percentage * childPoints

            totalPoints += earnedPoints
            maxPossiblePoints += childPoints
          })
          scoreToUse = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0
        }
      } else {
        const key = `${studentId}|${a.assessmentId}`
        const rawValue = editedScores[key] !== undefined
          ? editedScores[key]
          : existingScoreMap[key] ?? null

        const rawScore = typeof rawValue === 'number'
          ? rawValue
          : rawValue !== null && rawValue !== undefined
          ? parseFloat(String(rawValue)) || 0
          : 0

        const maxScore = Number(a.maxScore || 100)
        scoreToUse = maxScore > 0 ? (rawScore / maxScore) * 100 : 0
      }

      total += (scoreToUse * assessmentWeight) / 100
    })

    if (totalActiveWeight > 0 && totalActiveWeight < 100) {
      total = (total / totalActiveWeight) * 100
    }

    return total
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setError(null)

    const toUpsert: Array<{ studentId: string; assessmentId: string; score: number | null }> = []

    Object.entries(editedScores).forEach(([compositeKey, newScore]) => {
      const [stuId, assessId] = compositeKey.split('|')
      const existing = existingScoreMap[compositeKey] ?? null

      if (typeof newScore === 'number' && newScore !== existing) {
        toUpsert.push({
          studentId: stuId,
          assessmentId: assessId,
          score: newScore,
        })
      } else if (newScore === '' && existing !== null) {
        toUpsert.push({
          studentId: stuId,
          assessmentId: assessId,
          score: null,
        })
      }
    })

    if (toUpsert.length === 0) {
      setSaving(false)
      showNotification('No changes to save', 'success')
      return
    }

    try {
      await upsertScoresByClass(classId, toUpsert)
      const refreshed = await getScoresByClass(classId)
      if (refreshed.status === 'success') {
        setScoresMatrix(refreshed.data as ScoreRow[])
        setEditedScores({})
      } else {
        throw new Error(refreshed.message || 'Failed to refresh scores')
      }
      showNotification('Grades successfully saved', 'success')
    } catch (err) {
      console.error(err)
      setError('Error saving scores')
    } finally {
      setSaving(false)
    }
  }

  const handleParentAssessmentClick = (parentAssessment: AssessmentPayload) => {
    setSelectedParentAssessment(parentAssessment)
    setIsChildAssessmentsModalOpen(true)
  }

  const handleScoreUpdateFromModal = async () => {
    try {
      const refreshed = await getScoresByClass(classId)
      if (refreshed.status === 'success') {
        setScoresMatrix(refreshed.data as ScoreRow[])
      }
    } catch (error) {
      console.error('Error refreshing scores:', error)
    }
  }

  const handleArrowNav = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const maxRow = students.length - 1
    const maxCol = displayedAssessments.length - 1

    let nextRow = rowIndex
    let nextCol = colIndex

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        nextRow = Math.max(0, rowIndex - 1)
        break
      case 'ArrowDown':
        e.preventDefault()
        nextRow = Math.min(maxRow, rowIndex + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        nextCol = Math.max(0, colIndex - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        nextCol = Math.min(maxCol, colIndex + 1)
        break
      default:
        return
    }

    if (nextRow === rowIndex && nextCol === colIndex) return

    const nextInput = document.getElementById(
      `grade-${nextRow}-${nextCol}`
    ) as HTMLInputElement | null

    if (nextInput) {
      nextInput.focus()
      nextInput.select()
    }
  }

  // Calculate class statistics
  const classAverage = students.length > 0
    ? students.reduce((sum, stu) => sum + computeTotalForStudent(stu.studentId), 0) / students.length
    : 0

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50 pb-28">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?')
                        if (confirmLeave) {
                          router.push('/gradebook')
                        }
                      } else {
                        router.push('/gradebook')
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                    {classData.subject}
                  </h1>
                  <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg text-sm font-medium">
                    Grade {classData.grade}
                  </span>
                </div>
                <p className="text-slate-500">
                  {classData.termName && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDaysIcon className="h-4 w-4" />
                      {classData.termName}
                      {termData && (
                        <span className="text-slate-400">
                          ({new Date(termData.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })} - {new Date(termData.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })})
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium cursor-pointer shadow-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={saving || Object.keys(editedScores).length === 0}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm cursor-pointer ${
                    saving || Object.keys(editedScores).length === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{students.length}</p>
                    <p className="text-xs text-slate-500">Students</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{displayedAssessments.length}</p>
                    <p className="text-xs text-slate-500">Assessments</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <AcademicCapIcon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{classAverage.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">Class Average</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    hasUnsavedChanges ? 'bg-amber-50' : 'bg-slate-50'
                  }`}>
                    <CheckCircleIcon className={`w-5 h-5 ${
                      hasUnsavedChanges ? 'text-amber-500' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{Object.keys(editedScores).length}</p>
                    <p className="text-xs text-slate-500">Unsaved Changes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card - Gradebook Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[200px]">
                      Student Name
                    </th>
                    {displayedAssessments.map((a: AssessmentPayload) => (
                      <th
                        key={a.assessmentId}
                        className={`px-3 py-3 text-center text-sm font-semibold text-slate-700 min-w-[100px] ${
                          a.isParent ? 'cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors' : ''
                        }`}
                        onClick={a.isParent ? () => handleParentAssessmentClick(a) : undefined}
                        title={a.isParent ? 'Click to edit individual assessments' : undefined}
                      >
                        <div className="truncate max-w-[120px] mx-auto">
                          {a.name}
                        </div>
                        {a.isParent && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded">
                            Multiple
                          </span>
                        )}
                        <div className="text-xs font-normal text-slate-400 mt-0.5">
                          {a.weightPoints || a.weightPercent || 0} pts
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 min-w-[80px] bg-emerald-50">
                      Total
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700 min-w-[90px]">
                      Feedback
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700 min-w-[90px]">
                      Progress
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3 + displayedAssessments.length}
                        className="px-4 py-12 text-center"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Students Enrolled</h3>
                        <p className="text-sm text-slate-500">No students are currently enrolled in this class.</p>
                      </td>
                    </tr>
                  ) : (
                    students
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((stu, rowIndex) => {
                      const total = computeTotalForStudent(stu.studentId)
                      return (
                        <tr
                          key={stu.studentId}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-100">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedStudent({ studentId: stu.studentId, name: stu.name })
                                  setIsStudentAssessmentsModalOpen(true)
                                }}
                                className="font-medium text-slate-900 hover:text-cyan-600 transition-colors cursor-pointer"
                                title="Click to view/edit all assessments for this student"
                              >
                                {stu.name}
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedExclusionStudent({ studentId: stu.studentId, name: stu.name })
                                  setIsExclusionsModalOpen(true)
                                }}
                                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                title={`Manage exclusions (${exclusionsData[stu.studentId] || 0} excluded)`}
                              >
                                <MinusCircleIcon className="h-4 w-4" />
                                {(exclusionsData[stu.studentId] || 0) > 0 && (
                                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                                    {exclusionsData[stu.studentId]}
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>

                          {displayedAssessments.map((a: AssessmentPayload, colIndex) => {
                            const key = `${stu.studentId}|${a.assessmentId}`
                            const isExcluded = exclusionMap[key] || false

                            if (a.isParent) {
                              const childAssessments = assessments.filter(child => child.parentAssessmentId === a.assessmentId)

                              return (
                                <td
                                  key={a.assessmentId}
                                  className={`px-2 py-2 text-center cursor-pointer hover:bg-blue-100 relative group transition-colors ${
                                    isExcluded
                                      ? 'bg-slate-50 text-slate-400'
                                      : 'bg-blue-50/50'
                                  }`}
                                  title={isExcluded ? 'Assessment excluded from grade calculation' : 'Click to edit individual assessments'}
                                  onClick={() => handleParentAssessmentClick(a)}
                                >
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      try {
                                        if (isExcluded) {
                                          await deleteExclusion(stu.studentId, classId, a.assessmentId)
                                          showNotification('Assessment included', 'success')
                                        } else {
                                          await createExclusion({
                                            studentId: stu.studentId,
                                            classId: classId,
                                            assessmentId: a.assessmentId
                                          })
                                          showNotification('Assessment excluded', 'success')
                                        }
                                        await refreshExclusionsData()
                                      } catch (error) {
                                        console.error('Error toggling exclusion:', error)
                                        showNotification('Failed to update exclusion', 'error')
                                      }
                                    }}
                                    className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-all opacity-0 group-hover:opacity-100 cursor-pointer ${
                                      isExcluded
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                    }`}
                                    title={isExcluded ? 'Click to include assessment' : 'Click to exclude assessment'}
                                  >
                                    {isExcluded ? '✓' : '×'}
                                  </button>
                                  <div className={`inline-block px-2 py-1 rounded-lg text-sm font-medium ${
                                    isExcluded
                                      ? 'bg-slate-100 text-slate-400'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {isExcluded ? (
                                      'Excl.'
                                    ) : (
                                      (() => {
                                        let totalEarned = 0
                                        let totalActiveWeight = 0

                                        childAssessments.forEach(child => {
                                          const childKey = `${stu.studentId}|${child.assessmentId}`
                                          const isChildExcluded = exclusionMap[childKey] || false

                                          if (isChildExcluded) {
                                            return
                                          }

                                          const childRawValue = editedScores[childKey] !== undefined
                                            ? editedScores[childKey]
                                            : existingScoreMap[childKey] ?? null

                                          const rawScore = typeof childRawValue === 'number'
                                            ? childRawValue
                                            : childRawValue !== null && childRawValue !== undefined
                                            ? parseFloat(String(childRawValue)) || 0
                                            : 0

                                          const maxScore = Number(child.maxScore || 100)
                                          const childPoints = Number(child.weightPoints || child.weightPercent || 0)

                                          const percentage = maxScore > 0 ? Math.min(rawScore / maxScore, 1) : 0
                                          const earnedPoints = percentage * childPoints

                                          totalEarned += earnedPoints
                                          totalActiveWeight += childPoints
                                        })

                                        const parentTotalPoints = Number(a.weightPoints || a.weightPercent || 0)
                                        if (totalActiveWeight > 0 && totalActiveWeight < parentTotalPoints) {
                                          const scaleFactor = parentTotalPoints / totalActiveWeight
                                          totalEarned = totalEarned * scaleFactor
                                        }

                                        return `${totalEarned.toFixed(1)}/${parentTotalPoints}`
                                      })()
                                    )}
                                  </div>
                                </td>
                              )
                            } else {
                              const currentValue =
                                editedScores[key] !== undefined
                                  ? editedScores[key]
                                  : existingScoreMap[key] ?? ''

                              return (
                                <td
                                  key={a.assessmentId}
                                  className={`px-2 py-2 text-center relative group ${
                                    isExcluded ? 'bg-slate-50' : ''
                                  }`}
                                >
                                  <button
                                    onClick={async () => {
                                      try {
                                        if (isExcluded) {
                                          await deleteExclusion(stu.studentId, classId, a.assessmentId)
                                          showNotification('Assessment included', 'success')
                                        } else {
                                          await createExclusion({
                                            studentId: stu.studentId,
                                            classId: classId,
                                            assessmentId: a.assessmentId
                                          })
                                          showNotification('Assessment excluded', 'success')
                                        }
                                        await refreshExclusionsData()
                                      } catch (error) {
                                        console.error('Error toggling exclusion:', error)
                                        showNotification('Failed to update exclusion', 'error')
                                      }
                                    }}
                                    className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-all opacity-0 group-hover:opacity-100 cursor-pointer ${
                                      isExcluded
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                    }`}
                                    title={isExcluded ? 'Click to include assessment' : 'Click to exclude assessment'}
                                  >
                                    {isExcluded ? '✓' : '×'}
                                  </button>

                                  {isExcluded ? (
                                    <div className="inline-block px-2 py-1 rounded-lg text-xs bg-slate-100 text-slate-400">
                                      Excluded
                                    </div>
                                  ) : (
                                    <input
                                      id={`grade-${rowIndex}-${colIndex}`}
                                      type="number"
                                      min="0"
                                      max={(() => {
                                        const childPoints = Number(a.weightPoints || a.weightPercent || 0)
                                        const storedMaxScore = Number(a.maxScore || 100)
                                        return (storedMaxScore === 100 && childPoints < 100) ? childPoints : storedMaxScore
                                      })()}
                                      step="1"
                                      className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-center text-sm text-black focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                                      value={currentValue}
                                      placeholder={`/${(() => {
                                        const childPoints = Number(a.weightPoints || a.weightPercent || 0)
                                        const storedMaxScore = Number(a.maxScore || 100)
                                        return (storedMaxScore === 100 && childPoints < 100) ? childPoints : storedMaxScore
                                      })()}`}
                                      onChange={(e) =>
                                        handleScoreChange(
                                          stu.studentId,
                                          a.assessmentId,
                                          e
                                        )
                                      }
                                      onKeyDown={(e) => handleArrowNav(e, rowIndex, colIndex)}
                                      onKeyPress={(e) => {
                                        if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                                          e.preventDefault()
                                        }
                                      }}
                                    />
                                  )}
                                </td>
                              )
                            }
                          })}

                          <td className="px-4 py-2 text-center bg-emerald-50/50 font-semibold text-slate-900">
                            {total.toFixed(1)}%
                          </td>

                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => {
                                setSelectedStudentId(stu.studentId);
                                setSelectedStudentName(stu.name);
                                setIsFeedbackModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              Feedback
                            </button>
                          </td>

                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => {
                                setSelectedStudentId(stu.studentId);
                                setSelectedStudentName(stu.name);
                                setIsProgressReportModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              Progress
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Sticky Action Bar at Bottom */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-0 left-0 right-0 lg:left-72 z-20 p-4 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg">
            <div className="flex justify-center items-center gap-4 max-w-7xl mx-auto">
              <span className="text-sm text-amber-600 font-medium">
                You have {Object.keys(editedScores).length} unsaved changes
              </span>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium cursor-pointer shadow-lg"
              >
                <CheckCircleIcon className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}
      </main>

      {selectedStudentId && selectedStudentName && (
        <OpenFeedBackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          studentId={selectedStudentId}
          studentName={selectedStudentName}
          classId={classId}
        />
      )}

      {selectedStudentId && selectedStudentName && (
        <ProgressReportModal
          isOpen={isProgressReportModalOpen}
          onClose={() => setIsProgressReportModalOpen(false)}
          studentId={selectedStudentId}
          studentName={selectedStudentName}
          classId={classId}
        />
      )}

      {selectedParentAssessment && (
        <ChildAssessmentsModal
          isOpen={isChildAssessmentsModalOpen}
          onClose={() => {
            setSelectedParentAssessment(null)
            setIsChildAssessmentsModalOpen(false)
          }}
          parentAssessment={selectedParentAssessment}
          childAssessments={assessments.filter(a => a.parentAssessmentId === selectedParentAssessment.assessmentId)}
          students={students}
          scoresMatrix={scoresMatrix}
          editedScores={editedScores}
          onScoreChange={handleScoreChange}
          classId={classId}
          onRefreshExclusions={refreshExclusionsData}
        />
      )}

      <StudentAssessmentsModal
        isOpen={isStudentAssessmentsModalOpen}
        onClose={() => {
          setSelectedStudent(null)
          setIsStudentAssessmentsModalOpen(false)
        }}
        student={selectedStudent}
        classId={classId as string}
        assessments={assessments}
        existingScores={scoresMatrix.map(score => ({
          studentId: score.student_id,
          assessmentId: score.assessment_id,
          score: score.score,
          isExcluded: score.is_excluded
        }))}
        currentEditedScores={editedScores}
        onRefreshScores={handleScoreUpdateFromModal}
      />

      {selectedExclusionStudent && (
        <ExcludedAssessmentsModal
          isOpen={isExclusionsModalOpen}
          onClose={() => {
            setSelectedExclusionStudent(null)
            setIsExclusionsModalOpen(false)
          }}
          studentId={selectedExclusionStudent.studentId}
          studentName={selectedExclusionStudent.name}
          classId={classId}
          assessments={assessments}
          onUpdate={refreshExclusionsData}
        />
      )}
    </>
  )
}

export default GradebookClass
