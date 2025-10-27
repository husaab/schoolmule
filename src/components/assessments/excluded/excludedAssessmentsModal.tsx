// File: src/components/assessments/excluded/excludedAssessmentsModal.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Modal from '../../shared/modal'
import { createExclusion, deleteExclusion, getExclusionsByStudentAndClass } from '@/services/excludedAssessmentService'
import { AssessmentPayload } from '@/services/types/assessment'
import { ExcludedAssessmentPayload } from '@/services/excludedAssessmentService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { TrashIcon } from '@heroicons/react/24/outline'

interface ExcludedAssessmentsModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
  classId: string
  assessments: AssessmentPayload[]
  onUpdate?: () => void
}

const ExcludedAssessmentsModal: React.FC<ExcludedAssessmentsModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  classId,
  assessments,
  onUpdate,
}) => {
  const [exclusions, setExclusions] = useState<ExcludedAssessmentPayload[]>([])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  const showNotification = useNotificationStore((s) => s.showNotification)

  const loadExclusions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getExclusionsByStudentAndClass(studentId, classId)
      if (res.status === 'success') {
        setExclusions(res.data)
      } else {
        showNotification(res.message || 'Failed to load exclusions', 'error')
      }
    } catch (error) {
      console.error('Error loading exclusions:', error)
      showNotification('Error loading exclusions', 'error')
    } finally {
      setLoading(false)
    }
  }, [studentId, classId, showNotification])

  // Load exclusions when modal opens
  useEffect(() => {
    if (isOpen) {
      loadExclusions()
      setSelectedAssessmentId('')
    }
  }, [isOpen, loadExclusions])

  const handleAddExclusion = async () => {
    if (!selectedAssessmentId) {
      showNotification('Please select an assessment to exclude', 'error')
      return
    }

    // Check if already excluded
    const alreadyExcluded = exclusions.some(ex => ex.assessmentId === selectedAssessmentId)
    if (alreadyExcluded) {
      showNotification('This assessment is already excluded', 'error')
      return
    }

    setAdding(true)
    try {
      const res = await createExclusion({
        studentId,
        classId,
        assessmentId: selectedAssessmentId
      })

      if (res.status === 'success') {
        showNotification('Assessment excluded successfully', 'success')
        await loadExclusions() // Refresh the list
        setSelectedAssessmentId('')
        if (onUpdate) onUpdate()
      } else {
        showNotification(res.message || 'Failed to exclude assessment', 'error')
      }
    } catch (error) {
      console.error('Error excluding assessment:', error)
      showNotification('Error excluding assessment', 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteExclusion = async (assessmentId: string) => {
    try {
      const res = await deleteExclusion(studentId, classId, assessmentId)
      
      if (res.status === 'success') {
        showNotification('Exclusion removed successfully', 'success')
        await loadExclusions() // Refresh the list
        if (onUpdate) onUpdate()
      } else {
        showNotification(res.message || 'Failed to remove exclusion', 'error')
      }
    } catch (error) {
      console.error('Error removing exclusion:', error)
      showNotification('Error removing exclusion', 'error')
    }
  }

  // Get available assessments (not already excluded)
  const availableAssessments = assessments.filter(assessment => 
    !exclusions.some(exclusion => exclusion.assessmentId === assessment.assessmentId)
  )

  // Get assessment details for excluded items
  const getAssessmentDetails = (assessmentId: string) => {
    return assessments.find(a => a.assessmentId === assessmentId)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-2xl w-11/12 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl mb-4 text-black">
        Excluded Assessments for {studentName}
      </h2>

      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading exclusions...</p>
        </div>
      ) : (
        <div className="space-y-6 text-black">
          {/* Add Exclusion Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-medium mb-3">Add Exclusion</h3>
            
            <div className="flex space-x-3">
              <div className="flex-1">
                <select
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={adding}
                >
                  <option value="">Select an assessment to exclude...</option>
                  {availableAssessments.map((assessment) => (
                    <option key={assessment.assessmentId} value={assessment.assessmentId}>
                      {assessment.name} ({assessment.weightPoints || assessment.weightPercent || 0} pts)
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleAddExclusion}
                disabled={!selectedAssessmentId || adding}
                className={`px-4 py-2 rounded text-white cursor-pointer ${
                  !selectedAssessmentId || adding
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>

            {availableAssessments.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                All assessments are already excluded for this student.
              </p>
            )}
          </div>

          {/* Current Exclusions Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Current Exclusions</h3>
            
            {exclusions.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border rounded-lg">
                <p>No assessments are currently excluded for this student.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exclusions.map((exclusion) => {
                  const assessment = getAssessmentDetails(exclusion.assessmentId)
                  return (
                    <div
                      key={exclusion.assessmentId}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {assessment?.name || 'Unknown Assessment'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assessment?.weightPoints || assessment?.weightPercent || 0} points
                          {assessment?.isParent && ' (Multiple Assessment)'}
                          {assessment?.date && ` • ${new Date(assessment.date).toLocaleDateString()}`}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteExclusion(exclusion.assessmentId)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                        title="Remove exclusion"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info Message */}
          {exclusions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Excluded assessments will not count toward this student&apos;s final grade. 
                The remaining assessments will be weighted proportionally to calculate their grade.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Close Button */}
      <div className="flex justify-end pt-4 mt-6 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

export default ExcludedAssessmentsModal