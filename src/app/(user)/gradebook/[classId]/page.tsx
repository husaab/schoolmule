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
import { getExclusionsByStudentAndClass } from '@/services/excludedAssessmentService';
import { MinusCircleIcon } from '@heroicons/react/24/outline';

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
  const [exclusionsData, setExclusionsData] = useState<{ [studentId: string]: number }>({}); // studentId -> count

  // Edited scores: keyed by "studentId|assessmentId" → number or '' (empty means “no entry yet”)
  const [editedScores, setEditedScores] = useState<{ [key: string]: number | '' }>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(editedScores).length > 0

  // Load exclusions data for all students
  const loadExclusionsData = useCallback(async (studentsData: StudentPayload[]) => {
    try {
      const exclusionCounts: { [studentId: string]: number } = {}
      
      // Load exclusions for each student
      await Promise.all(
        studentsData.map(async (student) => {
          try {
            const res = await getExclusionsByStudentAndClass(student.studentId, classId)
            if (res.status === 'success') {
              exclusionCounts[student.studentId] = res.data.length
            } else {
              exclusionCounts[student.studentId] = 0
            }
          } catch (error) {
            console.error(`Error loading exclusions for student ${student.studentId}:`, error)
            exclusionCounts[student.studentId] = 0
          }
        })
      )
      
      setExclusionsData(exclusionCounts)
    } catch (error) {
      console.error('Error loading exclusions data:', error)
    }
  }, [classId])

  // Refresh exclusions data AND scores matrix to update visual indicators
  const refreshExclusionsData = async () => {
    // Reload both exclusion counts and scores matrix to get updated is_excluded flags
    await Promise.all([
      loadExclusionsData(students),
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
        
        // Load exclusions data for all students
        loadExclusionsData(stuRes.data)
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
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href)
        }
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    // Push a state to handle back button
    if (hasUnsavedChanges) {
      window.history.pushState(null, '', window.location.href)
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasUnsavedChanges])

  if (error) {
    return (
      <div className="lg:ml-64 bg-white min-h-screen p-4 lg:p-10 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.push('/gradebook')}
          className="mt-4 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
        >
          Back to Gradebook
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="lg:ml-64 bg-white min-h-screen p-4 lg:p-10 text-center">
        <p className="text-gray-600">Loading gradebook data…</p>
      </div>
    )
  }

  if (!classData) return null

  // Filter assessments to show only parent and standalone (hide children)
  const displayedAssessments = assessments.filter(a => !a.parentAssessmentId)

  // 1) Build quick lookups: "studentId|assessmentId" → existing score (or null) and exclusion status
  const existingScoreMap: Record<string, number | null> = {}
  const exclusionMap: Record<string, boolean> = {}
  scoresMatrix.forEach((row) => {
    const key = `${row.student_id}|${row.assessment_id}`
    existingScoreMap[key] = row.score
    exclusionMap[key] = row.is_excluded
  })

  const handleExportExcel = async () => {
    try {
      // 1) Call our “downloadGradebookExcel” service which returns a Blob
      const blob = await downloadGradebookExcel(classId);

      // 2) Compose a filename of the form: gradebook_{grade}_{subject}.xlsx
      const safeSubject = String(classData.subject)
        .trim()
        .replace(/\s+/g, '_'); // e.g. "Science 101" → "Science_101"
      const fileName = `Gradebook_Grade_${classData.grade}_${safeSubject}.xlsx`;

      // 3) Create an object URL and force a download
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

  // 2) Whenever the teacher types into a cell, store it in editedScores
  const handleScoreChange = (
    studentId: string,
    assessmentId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value

    // If blank, keep it as '' so we don’t force a zero right away
    let val: number | '' = ''
    if (raw !== '') {
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        // Find the assessment to get its max score
        const assessment = assessments.find(a => a.assessmentId === assessmentId)
        if (assessment) {
          // Use the actual maxScore for validation, not smart logic
          const maxScore = Number(assessment.maxScore || 100)
          // Clamp between 0 and the actual max score
          val = Math.min(Math.max(parsed, 0), maxScore)
        } else {
          val = Math.min(Math.max(parsed, 0), 100)
        }
      } else {
        val = ''
      }
    }

    const compositeKey = `${studentId}|${assessmentId}`
    setEditedScores((prev) => ({
      ...prev,
      [compositeKey]: val,
    }))
  }

  // 3) Sum up each assessment’s contribution for a given student (score × weight/100)
  const computeTotalForStudent = (studentId: string) => {
    let total = 0
    let totalActiveWeight = 0
    
    displayedAssessments.forEach((a) => {
      // Check if this assessment is excluded for this student
      const key = `${studentId}|${a.assessmentId}`
      const isExcluded = exclusionMap[key] || false
      
      if (isExcluded) {
        // Skip excluded assessments entirely
        return
      }
      let scoreToUse = 0
      const assessmentWeight = Number(a.weightPoints || a.weightPercent || 0)
      totalActiveWeight += assessmentWeight

      if (a.isParent) {
        // For parent assessments, calculate weighted average of child scores (excluding excluded children)
        const childAssessments = assessments.filter(child => child.parentAssessmentId === a.assessmentId)
        if (childAssessments.length > 0) {
          let totalPoints = 0
          let maxPossiblePoints = 0
          
          childAssessments.forEach(child => {
            const childKey = `${studentId}|${child.assessmentId}`
            const isChildExcluded = exclusionMap[childKey] || false
            
            if (isChildExcluded) {
              // Skip excluded child assessments
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
            
            // Get max score for this child assessment (what the assessment is "out of")
            const maxScore = Number(child.maxScore || 100)
            // Get weight points (how many points this assessment contributes to parent)
            const childPoints = Number(child.weightPoints || child.weightPercent || 0)
            
            // Convert raw score to percentage, then multiply by weight points
            const percentage = maxScore > 0 ? Math.min(rawScore / maxScore, 1) : 0 // Cap at 100%
            const earnedPoints = percentage * childPoints
            
            totalPoints += earnedPoints
            maxPossiblePoints += childPoints
          })
          scoreToUse = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0
        }
      } else {
        // For standalone assessments, convert raw score to percentage
        const key = `${studentId}|${a.assessmentId}`
        const rawValue = editedScores[key] !== undefined
          ? editedScores[key]
          : existingScoreMap[key] ?? null

        const rawScore = typeof rawValue === 'number'
          ? rawValue
          : rawValue !== null && rawValue !== undefined
          ? parseFloat(String(rawValue)) || 0
          : 0

        // Convert raw score to percentage using maxScore
        const maxScore = Number(a.maxScore || 100)
        scoreToUse = maxScore > 0 ? (rawScore / maxScore) * 100 : 0
      }
      
      total += (scoreToUse * assessmentWeight) / 100
    })
    
    // Redistribute weights proportionally if some assessments are excluded
    if (totalActiveWeight > 0 && totalActiveWeight < 100) {
      total = (total / totalActiveWeight) * 100
    }
    
    return total
  }

  // 4) When “Save All Changes” is clicked, only upsert the cells that actually changed
  const handleSaveAll = async () => {
    setSaving(true)
    setError(null)

    const toUpsert: Array<{ studentId: string; assessmentId: string; score: number }> = []

    Object.entries(editedScores).forEach(([compositeKey, newScore]) => {
      const [stuId, assessId] = compositeKey.split('|')
      const existing = existingScoreMap[compositeKey] ?? null

      if (typeof newScore === 'number' && newScore !== existing) {
        toUpsert.push({
          studentId: stuId,
          assessmentId: assessId,
          score: newScore,
        })
      }
    })

    if (toUpsert.length === 0) {
      setSaving(false)
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

  // Handler for opening child assessments modal
  const handleParentAssessmentClick = (parentAssessment: AssessmentPayload) => {
    setSelectedParentAssessment(parentAssessment)
    setIsChildAssessmentsModalOpen(true)
  }

  // Handler for refreshing data after student modal saves
  const handleScoreUpdateFromModal = async () => {
    // Refresh the scores matrix to show updated values from database
    try {
      const refreshed = await getScoresByClass(classId)
      if (refreshed.status === 'success') {
        setScoresMatrix(refreshed.data as ScoreRow[])
        // Don't update editedScores - keep only unsaved gradebook changes
      }
    } catch (error) {
      console.error('Error refreshing scores:', error)
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="lg:ml-64 bg-white min-h-screen p-4 lg:p-10">
        <div className="pt-40 mb-8 text-black text-center">
          <h1 className="text-3xl font-semibold">
            Gradebook: {classData.subject} – Grade {classData.grade}
          </h1>
          <p className="text-gray-600 mt-1">
            {students.length} students &ndash; {displayedAssessments.length}{' '}
            {displayedAssessments.length === 1 ? 'assessment' : 'assessments'}
          </p>
          {classData.termName && (
            <p className="text-gray-600 mt-1">
              <strong>Term:</strong> {classData.termName}
              {termData && (
                <span className="ml-2">
                  ({new Date(termData.startDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })} - {new Date(termData.endDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })})
                </span>
              )}
            </p>
          )}
        </div>

        <div className="mx-auto w-[90%] overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="w-full table-auto whitespace-nowrap">
            <thead className="bg-gray-100">
              <tr>
                <th className="sticky left-0 top-0 z-40 bg-gray-100 px-4 py-2 text-left text-gray-700">
                  Student Name
                </th>
                {displayedAssessments.map((a: AssessmentPayload) => (
                  <th
                    key={a.assessmentId}
                    className={`px-4 py-2 text-center text-gray-700 whitespace-nowrap ${
                      a.isParent ? 'cursor-pointer bg-blue-50 hover:bg-blue-200' : ''
                    }`}
                    onClick={a.isParent ? () => handleParentAssessmentClick(a) : undefined}
                    title={a.isParent ? 'Click to edit individual assessments' : undefined}
                  >
                    <div className="truncate">
                      {a.name}
                    </div>
                    <div>
                        {a.isParent && (
                          <span className="ml-1 text-xs text-blue-600 font-medium">(Multiple)</span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({a.weightPoints || a.weightPercent || 0} pts)
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2 text-center text-gray-700">Total</th>
                <th className="px-4 py-2 text-center text-gray-700">Feedback</th>
                <th className="px-4 py-2 text-center text-gray-700 w-20">Progress</th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={3 + displayedAssessments.length}
                    className="px-4 py-6 text-center text-gray-600"
                  >
                    No students are currently enrolled in this class.
                  </td>
                </tr>
              ) : (
                students
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((stu) => {
                  const total = computeTotalForStudent(stu.studentId)
                  return (
                    <tr
                      key={stu.studentId}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="sticky left-0 z-30 bg-white px-4 py-2 text-gray-800">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedStudent({ studentId: stu.studentId, name: stu.name })
                              setIsStudentAssessmentsModalOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                            title="Click to view/edit all assessments for this student"
                          >
                            {stu.name}
                          </button>
                          
                          {/* Exclusions icon + count */}
                          <button
                            onClick={() => {
                              setSelectedExclusionStudent({ studentId: stu.studentId, name: stu.name })
                              setIsExclusionsModalOpen(true)
                            }}
                            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 cursor-pointer"
                            title={`Manage exclusions (${exclusionsData[stu.studentId] || 0} excluded)`}
                          >
                            <MinusCircleIcon className="h-4 w-4" />
                            {(exclusionsData[stu.studentId] || 0) > 0 && (
                              <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-medium">
                                {exclusionsData[stu.studentId]}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>

                      {displayedAssessments.map((a: AssessmentPayload) => {
                        const key = `${stu.studentId}|${a.assessmentId}`
                        const isExcluded = exclusionMap[key] || false
                        
                        if (a.isParent) {
                          // For parent assessments, show calculated score (read-only)
                          const childAssessments = assessments.filter(child => child.parentAssessmentId === a.assessmentId)

                          return (
                            <td
                              key={a.assessmentId}
                              className={`px-1 py-1 text-center cursor-pointer hover:bg-blue-100 ${
                                isExcluded 
                                  ? 'bg-gray-100 text-gray-400' 
                                  : 'text-gray-800 bg-blue-50'
                              }`}
                              title={isExcluded ? 'Assessment excluded from grade calculation' : 'Click to edit individual assessments'}
                              onClick={() => handleParentAssessmentClick(a)}
                            >
                              <div className={`w-16 mx-auto border rounded p-1 text-center font-medium ${
                                isExcluded 
                                  ? 'border-gray-300 bg-gray-100 text-gray-500' 
                                  : 'border-blue-200 bg-blue-50 text-blue-800'
                              }`}>
                                {isExcluded ? (
                                  'Excluded'
                                ) : (
                                  (() => {
                                    // Calculate earned points for display (excluding excluded children)
                                    let totalEarned = 0
                                    let totalActiveWeight = 0
                                    
                                    childAssessments.forEach(child => {
                                      const childKey = `${stu.studentId}|${child.assessmentId}`
                                      const isChildExcluded = exclusionMap[childKey] || false
                                      
                                      if (isChildExcluded) {
                                        // Skip excluded child assessments
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
                                    
                                    // If some children are excluded, scale up proportionally
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
                          // For standalone assessments, show editable input
                          const currentValue =
                            editedScores[key] !== undefined
                              ? editedScores[key]
                              : existingScoreMap[key] ?? ''

                          return (
                            <td
                              key={a.assessmentId}
                              className={`px-1 py-1 text-center ${
                                isExcluded ? 'text-gray-400' : 'text-gray-800'
                              }`}
                            >
                              {isExcluded ? (
                                <div className="w-16 mx-auto border border-gray-300 rounded p-1 text-center bg-gray-100 text-gray-500 text-sm">
                                  Excluded
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  max={(() => {
                                    const childPoints = Number(a.weightPoints || a.weightPercent || 0)
                                    const storedMaxScore = Number(a.maxScore || 100)
                                    return (storedMaxScore === 100 && childPoints < 100) ? childPoints : storedMaxScore
                                  })()}
                                  step="1"
                                  className="w-16 border border-gray-300 rounded p-1 text-center focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                                />
                              )}
                            </td>
                          )
                        }
                      })}

                      <td className="px-4 py-2 text-center text-gray-800">
                        {/* Show the weighted total with one decimal place: */}
                        {total.toFixed(1)}%
                      </td>

                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudentId(stu.studentId);
                            setIsFeedbackModalOpen(true);
                          }}
                          className="text-sm px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded cursor-pointer"
                        >
                          Feedback
                        </button>
                      </td>

                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudentId(stu.studentId);
                            setSelectedStudentName(stu.name);
                            setIsProgressReportModalOpen(true);
                          }}
                          className="text-sm px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
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

        <div className="mt-6 flex ml-20 space-x-4">
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
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving || Object.keys(editedScores).length === 0}
            className={`px-4 py-2 rounded text-white cursor-pointer ${
              saving || Object.keys(editedScores).length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
          >
            Export as CSV
          </button>
        </div>

        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      </main>

      {selectedStudentId && (
        <OpenFeedBackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          studentId={selectedStudentId}
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
        />
      )}

      {/* Student Assessments Modal */}
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

      {/* Exclusions Modal */}
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
