'use client'

import { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { useNotificationStore } from '../../../store/useNotificationStore'
import { upsertScoresByClass } from '../../../services/classService'

interface Assessment {
  assessmentId: string
  name: string
  weightPercent?: number | null
  weightPoints?: number | null
  maxScore?: number | null
  isParent: boolean
  parentAssessmentId?: string | null
  date?: string | null
}

interface StudentScore {
  studentId: string
  assessmentId: string
  score: number | null
}

interface StudentAssessmentsModalProps {
  isOpen: boolean
  onClose: () => void
  student: {
    studentId: string
    name: string
  } | null
  classId: string
  assessments: Assessment[]
  existingScores: StudentScore[]
  currentEditedScores: { [key: string]: number | '' }
  onRefreshScores: () => void
}

export default function StudentAssessmentsModal({
  isOpen,
  onClose,
  student,
  classId,
  assessments,
  existingScores,
  currentEditedScores,
  onRefreshScores
}: StudentAssessmentsModalProps) {
  const [editedScores, setEditedScores] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const showNotification = useNotificationStore((state) => state.showNotification)

  // Initialize edited scores when modal opens
  useEffect(() => {
    if (isOpen && student) {
      const scoreMap: Record<string, string> = {}
      
      // First, load from saved scores in database
      existingScores.forEach(score => {
        if (score.studentId === student.studentId) {
          const key = `${score.studentId}|${score.assessmentId}`
          scoreMap[key] = score.score?.toString() || ''
        }
      })
      
      // Then, override with any current edited scores from gradebook
      Object.entries(currentEditedScores).forEach(([key, value]) => {
        const [stuId] = key.split('|')
        if (stuId === student.studentId) {
          scoreMap[key] = typeof value === 'number' ? value.toString() : value || ''
        }
      })
      
      setEditedScores(scoreMap)
      setHasChanges(false)
    }
  }, [isOpen, student, existingScores, currentEditedScores])

  const handleScoreChange = (assessmentId: string, value: string) => {
    if (!student) return
    
    const key = `${student.studentId}|${assessmentId}`
    
    // Validate and clamp the score like in the gradebook
    let processedValue = value
    if (value !== '') {
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        // Find the assessment to get its max score
        const assessment = assessments.find(a => a.assessmentId === assessmentId)
        if (assessment) {
          const maxScore = Number(assessment.maxScore || 100)
          // Clamp between 0 and max score
          const clampedValue = Math.min(Math.max(parsed, 0), maxScore)
          processedValue = clampedValue.toString()
        }
      }
    }
    
    setEditedScores(prev => ({
      ...prev,
      [key]: processedValue
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!student || saving) return

    setSaving(true)
    const toUpsert: Array<{ studentId: string; assessmentId: string; score: number }> = []
    
    Object.entries(editedScores).forEach(([key, value]) => {
      const [studentId, assessmentId] = key.split('|')
      if (studentId === student.studentId) {
        const numValue = value.trim() === '' ? null : parseFloat(value)
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          toUpsert.push({ studentId, assessmentId, score: numValue })
        }
        // Note: We don't handle null values in batch updates for now
      }
    })

    if (toUpsert.length === 0) {
      showNotification('No scores to save', 'error')
      setSaving(false)
      return
    }

    try {
      await upsertScoresByClass(classId, toUpsert)
      showNotification(`Successfully saved ${toUpsert.length} scores for ${student.name}`, 'success')
      setHasChanges(false)
      // Refresh the gradebook data
      await onRefreshScores()
      onClose()
    } catch (error) {
      console.error('Error saving scores:', error)
      showNotification('Error saving scores. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const getScoreDisplay = (assessmentId: string) => {
    if (!student) return ''
    const key = `${student.studentId}|${assessmentId}`
    return editedScores[key] || ''
  }

  const calculatePercentage = (score: number | null, maxScore: number | null | undefined) => {
    if (score === null || !maxScore || maxScore === 0) return null
    return ((score / maxScore) * 100).toFixed(1)
  }

  const getLetterGrade = (percentage: number | null) => {
    if (percentage === null) return '-'
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  // Group assessments by parent/child relationship
  const groupedAssessments = assessments.reduce((groups, assessment) => {
    if (assessment.isParent) {
      groups.push({
        parent: assessment,
        children: assessments.filter(a => a.parentAssessmentId === assessment.assessmentId)
      })
    } else if (!assessment.parentAssessmentId) {
      // Standalone assessment
      groups.push({
        parent: null,
        children: [assessment]
      })
    }
    return groups
  }, [] as Array<{ parent: Assessment | null; children: Assessment[] }>)

  if (!student) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      style="w-[1200px] max-w-[90vw]"
    >
      <div className="space-y-8 p-15">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="text-lg font-semibold text-black">{student.name}</h3>

          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`px-4 py-2 cursor-pointer rounded text-white ${
                hasChanges && !saving
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Assessments List */}
        <div className="max-h-96 overflow-y-auto space-y-4">
          {groupedAssessments.map((group, groupIndex) => (
            <div key={groupIndex} className="border rounded-lg p-4 bg-gray-50">
              {group.parent ? (
                // Multiple assessment with individual parts
                <>
                  <div className="mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-blue-900">{group.parent.name}</h4>
                        <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded">Multiple Assessment</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-800">
                          Worth: {group.parent.weightPoints || group.parent.weightPercent} points
                        </div>
                        {group.parent.date && (
                          <div className="text-xs text-blue-600">
                            Date: {new Date(group.parent.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual assessments */}
                  <div className="space-y-2 ml-4">
                    {group.children.map((assessment) => {
                      const scoreValue = getScoreDisplay(assessment.assessmentId)
                      const numScore = scoreValue ? parseFloat(scoreValue) : null
                      const percentage = calculatePercentage(numScore, assessment.maxScore)
                      
                      return (
                        <div key={assessment.assessmentId} className="flex items-center justify-between p-3 text-black bg-white rounded border">
                          <div className="flex-1">
                            <div className="font-medium">{assessment.name}</div>
                            <div className="text-sm text-gray-600">
                              Worth: {assessment.weightPoints || assessment.weightPercent} pts | Out of: {assessment.maxScore}
                            </div>
                            {assessment.date && (
                              <div className="text-xs text-gray-500">
                                Date: {new Date(assessment.date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-5">
                            <div className="text-right">
                              <input
                                type="number"
                                value={scoreValue}
                                onChange={(e) => handleScoreChange(assessment.assessmentId, e.target.value)}
                                className="w-20 px-2 py-1 border rounded text-center"
                                placeholder="0"
                                min="0"
                                max={assessment.maxScore || 100}
                                step="0.1"
                              />
                              <div className="text-xs text-gray-500">/ {assessment.maxScore || 100}</div>
                            </div>
                            
                            <div className="text-right min-w-16">
                              {percentage !== null && (
                                <>
                                  <div className="text-sm font-medium">{percentage}%</div>
                                  <div className="text-xs text-gray-600">{getLetterGrade(parseFloat(percentage))}</div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                // Standalone assessment
                group.children.map((assessment) => {
                  const scoreValue = getScoreDisplay(assessment.assessmentId)
                  const numScore = scoreValue ? parseFloat(scoreValue) : null
                  const percentage = calculatePercentage(numScore, assessment.maxScore)
                  
                  return (
                    <div key={assessment.assessmentId} className="flex text-black items-center justify-between p-3 bg-white rounded border">
                      <div className="flex-1">
                        <div className="font-medium">{assessment.name}</div>
                        <div className="text-sm text-gray-600">
                          Worth: {assessment.weightPoints || assessment.weightPercent} pts | Out of: {assessment.maxScore}
                        </div>
                        {assessment.date && (
                          <div className="text-xs text-gray-500">
                            Date: {new Date(assessment.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <div className="text-right">
                          <input
                            type="number"
                            value={scoreValue}
                            onChange={(e) => handleScoreChange(assessment.assessmentId, e.target.value)}
                            className="w-20 px-3 py-1 border rounded text-center"
                            placeholder="0"
                            min="0"
                            max={assessment.maxScore || undefined}
                            step="0.1"
                          />
                          <div className="text-xs text-gray-500">/ {assessment.maxScore || 100}</div>
                        </div>
                        
                        <div className="text-right min-w-16">
                          {percentage !== null && (
                            <>
                              <div className="text-sm font-medium">{percentage}%</div>
                              <div className="text-xs text-gray-600">{getLetterGrade(parseFloat(percentage))}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t pt-4">
          <div className="text-sm text-gray-600">
            <p>&bull; Enter scores for each assessment</p>
            <p>&bull; Changes are automatically calculated and shown as percentages</p>
            <p>&bull; Click &quot;Save Changes&quot; to update the gradebook</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}