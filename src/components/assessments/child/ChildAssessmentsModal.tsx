'use client'

import React, { ChangeEvent } from 'react'
import Modal from '../../shared/modal'
import { AssessmentPayload } from '@/services/types/assessment'
import { StudentPayload } from '@/services/types/student'
import { createExclusion, deleteExclusion } from '@/services/excludedAssessmentService'
import { useNotificationStore } from '@/store/useNotificationStore'

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

interface ChildAssessmentsModalProps {
  isOpen: boolean
  onClose: () => void
  parentAssessment: AssessmentPayload
  childAssessments: AssessmentPayload[]
  students: StudentPayload[]
  scoresMatrix: ScoreRow[]
  editedScores: { [key: string]: number | '' }
  onScoreChange: (studentId: string, assessmentId: string, e: ChangeEvent<HTMLInputElement>) => void
  classId: string
  onRefreshExclusions: () => Promise<void>
}

const ChildAssessmentsModal: React.FC<ChildAssessmentsModalProps> = ({
  isOpen,
  onClose,
  parentAssessment,
  childAssessments,
  students,
  scoresMatrix,
  editedScores,
  onScoreChange,
  classId,
  onRefreshExclusions,
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  // Build lookups for existing scores and exclusions
  const existingScoreMap: Record<string, number | null> = {}
  const exclusionMap: Record<string, boolean> = {}
  scoresMatrix.forEach((row) => {
    const key = `${row.student_id}|${row.assessment_id}`
    existingScoreMap[key] = row.score
    exclusionMap[key] = row.is_excluded
  })

  // Calculate parent score for a student based on child scores (excluding excluded children)
  const calculateParentScore = (studentId: string) => {
    let totalPoints = 0
    let maxPossiblePoints = 0
    let totalActiveWeight = 0
    
    childAssessments.forEach(child => {
      const key = `${studentId}|${child.assessmentId}`
      const isExcluded = exclusionMap[key] || false
      
      if (isExcluded) {
        // Skip excluded child assessments
        return
      }
      
      const rawValue = editedScores[key] !== undefined
        ? editedScores[key]
        : existingScoreMap[key] ?? null
      
      const rawScore = typeof rawValue === 'number' ? rawValue : (rawValue ? parseFloat(String(rawValue)) : 0)
      
      // Get weight points (how many points this assessment contributes to parent)
      const childPoints = Number(child.weightPoints || child.weightPercent || 0)
      // Use the actual maxScore, not the convoluted logic
      const maxScore = Number(child.maxScore || 100)
      
      // Convert raw score to percentage, then multiply by weight points
      const percentage = maxScore > 0 ? Math.min(rawScore / maxScore, 1) : 0
      const earnedPoints = percentage * childPoints
      
      totalPoints += earnedPoints
      maxPossiblePoints += childPoints
      totalActiveWeight += childPoints
    })
    
    // If some assessments are excluded, redistribute proportionally
    const parentTotalPoints = Number(parentAssessment.weightPoints || parentAssessment.weightPercent || 0)
    if (totalActiveWeight > 0 && totalActiveWeight < parentTotalPoints) {
      // Scale up proportionally to account for excluded assessments
      const scaleFactor = parentTotalPoints / totalActiveWeight
      totalPoints = totalPoints * scaleFactor
      maxPossiblePoints = parentTotalPoints
    }
    
    // Return earned/total format for display
    return { earned: totalPoints, total: maxPossiblePoints }
  }

  // Check if all child points add up to parent points
  const totalChildPoints = childAssessments.reduce((sum, child) => {
    const points = Number(child.weightPoints || child.weightPercent || 0)
    return sum + points
  }, 0)
  const parentPoints = Number(parentAssessment.weightPoints || parentAssessment.weightPercent || 0)
  const pointsWarning = Math.abs(totalChildPoints - parentPoints) > 0.01

  const handleArrowNav = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const maxRow = students.length - 1
    const maxCol = childAssessments.length - 1

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
      case 'Enter':
        e.preventDefault()
        nextRow = Math.min(maxRow, rowIndex + 1)
        break
      default:
        return // let other keys behave normally
    }

    // If nothing changed, don't do anything
    if (nextRow === rowIndex && nextCol === colIndex) return

    const nextInput = document.getElementById(
      `child-grade-${nextRow}-${nextCol}`
    ) as HTMLInputElement | null

    if (nextInput) {
      nextInput.focus()
      nextInput.select() // optional: highlight value
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-6xl w-11/12 max-h-[90vh] overflow-y-auto">
      <div className="text-black">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              {parentAssessment.name} - Individual Assessments
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Total worth: {parentAssessment.weightPoints || parentAssessment.weightPercent || 0} points | Individual assessments: {childAssessments.length}
            </p>
            {pointsWarning && (
              <p className="text-sm text-red-600 mt-1">
                ⚠️ Individual points total {totalChildPoints} (should equal multiple assessment {parentPoints})
              </p>
            )}
          </div>
        </div>

        {childAssessments.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            This multiple assessment has no individual assessments.
          </p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full table-auto whitespace-nowrap">
              <thead className="bg-gray-100">
                <tr>
                  <th className="sticky top-0 z-30 px-4 py-2 text-left text-gray-700 sticky left-0 bg-gray-100 z-10">
                    Student Name
                  </th>
                  {childAssessments.map((child) => (
                    <th
                      key={child.assessmentId}
                      className="px-4 py-2 text-center text-gray-700 whitespace-nowrap"
                    >
                      <div className="truncate">{child.name}</div>
                      <div className="text-xs text-gray-500">
                        ({child.weightPoints || child.weightPercent || 0} pts)
                      </div>
                      <div className="text-xs text-gray-400">
                        Order: {child.sortOrder || '-'}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-2 text-center text-gray-700 bg-blue-50">
                    Multiple Score
                  </th>
                </tr>
              </thead>

              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={childAssessments.length + 2}
                      className="px-4 py-6 text-center text-gray-600"
                    >
                      No students are currently enrolled in this class.
                    </td>
                  </tr>
                ) : (
                  students.map((student, rowIndex) => {
                    const parentScore = calculateParentScore(student.studentId)
                    return (
                      <tr
                        key={student.studentId}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="sticky top-0 z-30 px-4 py-2 text-gray-800 font-medium sticky left-0 bg-white z-10">
                          {student.name}
                        </td>

                        {childAssessments.map((child, colIndex) => {
                          const key = `${student.studentId}|${child.assessmentId}`
                          const isExcluded = exclusionMap[key] || false
                          const currentValue = editedScores[key] !== undefined
                            ? editedScores[key]
                            : existingScoreMap[key] ?? ''

                          const maxScore = Number(child.maxScore || 100)

                          return (
                            <td
                              key={child.assessmentId}
                              className={`px-1 py-1 text-center relative group ${
                                isExcluded ? 'text-gray-400' : 'text-gray-800'
                              }`}
                            >
                              {/* Hover-triggered exclusion toggle button */}
                              <button
                                onClick={async () => {
                                  try {
                                    if (isExcluded) {
                                      // Include the assessment
                                      await deleteExclusion(student.studentId, classId, child.assessmentId)
                                      showNotification('Assessment included', 'success')
                                    } else {
                                      // Exclude the assessment
                                      await createExclusion({
                                        studentId: student.studentId,
                                        classId: classId,
                                        assessmentId: child.assessmentId
                                      })
                                      showNotification('Assessment excluded', 'success')
                                    }
                                    // Refresh exclusions and scores
                                    await onRefreshExclusions()
                                  } catch (error) {
                                    console.error('Error toggling exclusion:', error)
                                    showNotification('Failed to update exclusion', 'error')
                                  }
                                }}
                                className={`absolute top-0 right-0 w-3 h-3 cursor-pointer rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110 z-10 opacity-0 group-hover:opacity-100 mt-1 mr-1 ${
                                  isExcluded 
                                    ? 'bg-green-500 text-white hover:bg-green-600' 
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                                title={isExcluded ? 'Click to include assessment' : 'Click to exclude assessment'}
                              >
                                {isExcluded ? '✓' : '×'}
                              </button>

                              {isExcluded ? (
                                <div className="flex items-center justify-center">
                                  <div className="min-w-16 px-2 border border-gray-300 rounded py-1 text-center bg-gray-100 text-gray-500 text-xs whitespace-nowrap">
                                    Excluded
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center space-x-1">
                                  <input
                                    id={`child-grade-${rowIndex}-${colIndex}`}
                                    type="number"
                                    min="0"
                                    max={maxScore}
                                    step="1"
                                    className="w-16 border border-gray-300 rounded p-1 text-center focus:outline-none focus:ring-2 focus:ring-cyan-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={currentValue}
                                    onChange={(e) => onScoreChange(student.studentId, child.assessmentId, e)}
                                    onKeyDown={(e) => handleArrowNav(e, rowIndex, colIndex)}
                                    onKeyPress={(e) => {
                                      // Only allow numbers, decimal point, and navigation keys
                                      if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                                        e.preventDefault()
                                      }
                                    }}
                                    placeholder="0"
                                  />
                                  <span className="text-sm text-gray-600">/{maxScore}</span>
                                </div>
                              )}
                            </td>
                          )
                        })}

                        <td className="px-4 py-2 text-center text-blue-800 font-medium bg-blue-50">
                          {parentScore.earned.toFixed(1)}/{parentAssessment.weightPoints || parentAssessment.weightPercent || 0}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>• Use arrow keys (↑↓←→) to navigate between grade cells, Enter to move down</p>
          <p>• Individual assessment scores are weighted by their point values to calculate the total score</p>
          <p>• Changes are automatically reflected in the main gradebook</p>
          <p>• Remember to save changes in the main gradebook when finished</p>
        </div>
      </div>
    </Modal>
  )
}

export default ChildAssessmentsModal