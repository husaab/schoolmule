'use client'

import React, { ChangeEvent } from 'react'
import Modal from '../../shared/modal'
import { AssessmentPayload } from '@/services/types/assessment'
import { StudentPayload } from '@/services/types/student'

interface ScoreRow {
  student_id: string
  student_name: string
  assessment_id: string
  assessment_name: string
  weight_percent: number
  score: number | null
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
}) => {
  // Build lookup for existing scores
  const existingScoreMap: Record<string, number | null> = {}
  scoresMatrix.forEach((row) => {
    const key = `${row.student_id}|${row.assessment_id}`
    existingScoreMap[key] = row.score
  })

  // Calculate parent score for a student based on child scores
  const calculateParentScore = (studentId: string) => {
    let totalPoints = 0
    let maxPossiblePoints = 0
    
    childAssessments.forEach(child => {
      const key = `${studentId}|${child.assessmentId}`
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
    })
    
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
                  <th className="px-4 py-2 text-left text-gray-700 sticky left-0 bg-gray-100 z-10">
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
                  students.map((student) => {
                    const parentScore = calculateParentScore(student.studentId)
                    return (
                      <tr
                        key={student.studentId}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 text-gray-800 font-medium sticky left-0 bg-white z-10">
                          {student.name}
                        </td>

                        {childAssessments.map((child) => {
                          const key = `${student.studentId}|${child.assessmentId}`
                          const currentValue = editedScores[key] !== undefined
                            ? editedScores[key]
                            : existingScoreMap[key] ?? ''

                          const maxScore = Number(child.maxScore || 100)

                          return (
                            <td
                              key={child.assessmentId}
                              className="px-1 py-1 text-center text-gray-800"
                            >
                              <div className="flex items-center justify-center space-x-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={maxScore}
                                  step="1"
                                  className="w-12 border border-gray-300 rounded p-1 text-center focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                  value={currentValue}
                                  onChange={(e) => onScoreChange(student.studentId, child.assessmentId, e)}
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-600">/{maxScore}</span>
                              </div>
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
          <p>• Individual assessment scores are weighted by their point values to calculate the total score</p>
          <p>• Changes are automatically reflected in the main gradebook</p>
          <p>• Remember to save changes in the main gradebook when finished</p>
        </div>
      </div>
    </Modal>
  )
}

export default ChildAssessmentsModal