// File: src/components/assessments/edit/AssessmentEditModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { updateAssessment, batchUpdateAssessments } from '@/services/assessmentService'
import { AssessmentPayload } from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'

interface AssessmentEditModalProps {
  isOpen: boolean
  onClose: () => void
  assessment: AssessmentPayload
  allAssessments: AssessmentPayload[] // To get children for parent assessments
  onUpdate: (updated: AssessmentPayload) => void
}

const AssessmentEditModal: React.FC<AssessmentEditModalProps> = ({
  isOpen,
  onClose,
  assessment,
  allAssessments,
  onUpdate,
}) => {
  const [name, setName] = useState('')
  const [weightPoints, setWeightPoints] = useState<string>('')
  const [maxScore, setMaxScore] = useState<string>('')
  const [childrenData, setChildrenData] = useState<Array<{
    assessmentId: string
    name: string
    weightPoints: string
    maxScore: string
    sortOrder: number
  }>>([])
  const [childPointsError, setChildPointsError] = useState<string>('')

  const showNotification = useNotificationStore((s) => s.showNotification)

  // Prefill fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(assessment.name)
      setWeightPoints(String(assessment.weightPoints || assessment.weightPercent || 0))
      setMaxScore(String(assessment.maxScore || ''))
      
      // Initialize children data for parent assessments
      if (assessment.isParent) {
        const childAssessments = allAssessments.filter(a => a.parentAssessmentId === assessment.assessmentId)
        if (childAssessments.length > 0) {
          const childData = childAssessments
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map(child => ({
              assessmentId: child.assessmentId,
              name: child.name,
              weightPoints: String(child.weightPoints || child.weightPercent || 0),
              maxScore: String(child.maxScore || 100),
              sortOrder: child.sortOrder || 0
            }))
          setChildrenData(childData)
        } else {
          setChildrenData([])
        }
      } else {
        setChildrenData([])
      }
      setChildPointsError('')
    }
  }, [isOpen, assessment, allAssessments])

  // Validate child points when they change
  useEffect(() => {
    if (assessment.isParent && childrenData.length > 0 && weightPoints) {
      const parentPoints = parseFloat(weightPoints) || 0
      const totalChildPoints = childrenData.reduce((sum, child) => {
        const childPoints = parseFloat(child.weightPoints) || 0
        return sum + childPoints
      }, 0)
      
      if (totalChildPoints > parentPoints) {
        setChildPointsError(`Child points total ${totalChildPoints.toFixed(1)} (must not exceed parent ${parentPoints})`)
      } else if (Math.abs(totalChildPoints - parentPoints) > 0.01) {
        setChildPointsError(`Child points total ${totalChildPoints.toFixed(1)} (should equal parent ${parentPoints})`)
      } else {
        setChildPointsError('')
      }
    } else {
      setChildPointsError('')
    }
  }, [assessment.isParent, childrenData, weightPoints])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const parsedWeightPoints = Number(weightPoints)
    const parsedMaxScore = Number(maxScore)

    if (!trimmedName || weightPoints === '' || isNaN(parsedWeightPoints)) {
      showNotification('Name and points are required', 'error')
      return
    }

    if (!assessment.isParent && (maxScore === '' || isNaN(parsedMaxScore))) {
      showNotification('Maximum score is required for standalone assessments', 'error')
      return
    }

    if (parsedWeightPoints <= 0) {
      showNotification('Points must be greater than 0', 'error')
      return
    }

    if (!assessment.isParent && parsedMaxScore <= 0) {
      showNotification('Maximum score must be greater than 0', 'error')
      return
    }

    // Validate parent assessments
    if (assessment.isParent) {
      if (childrenData.some(child => !child.name.trim())) {
        showNotification('All child assessment names are required', 'error')
        return
      }

      if (childrenData.some(child => !child.maxScore.trim() || isNaN(Number(child.maxScore)) || Number(child.maxScore) <= 0)) {
        showNotification('All child assessments must have valid maximum scores', 'error')
        return
      }

      if (childPointsError) {
        showNotification(childPointsError, 'error')
        return
      }
    }

    try {
      if (assessment.isParent && childrenData.length > 0) {
        // Batch update parent and all child assessments
        const updates = [
          // Parent assessment update
          {
            assessmentId: assessment.assessmentId,
            name: trimmedName,
            weightPercent: 0, // Keep for backwards compatibility
            weightPoints: parsedWeightPoints,
            maxScore: undefined, // Parent assessments don't have max score
          },
          // Child assessments updates
          ...childrenData.map(child => ({
            assessmentId: child.assessmentId,
            name: child.name.trim(),
            weightPercent: 0, // Keep for backwards compatibility
            weightPoints: parseFloat(child.weightPoints),
            maxScore: parseFloat(child.maxScore),
            sortOrder: child.sortOrder,
          }))
        ]

        const res = await batchUpdateAssessments({ updates })

        if (res.status === 'success') {
          // Update all assessments in the parent component
          res.data.forEach(updatedAssessment => {
            onUpdate(updatedAssessment)
          })
          showNotification(`Parent assessment and ${childrenData.length} child assessments updated successfully`, 'success')
          onClose()
        } else {
          showNotification(res.message || 'Failed to update assessments', 'error')
        }
      } else {
        // Single assessment update (standalone)
        const payload = {
          name: trimmedName,
          weightPercent: 0, // Keep for backwards compatibility
          weightPoints: parsedWeightPoints,
          maxScore: parsedMaxScore,
        }

        const res = await updateAssessment(assessment.assessmentId, payload)

        if (res.status === 'success') {
          onUpdate(res.data as AssessmentPayload)
          showNotification('Assessment updated successfully', 'success')
          onClose()
        } else {
          showNotification(res.message || 'Failed to update assessment', 'error')
        }
      }
    } catch (err) {
      console.error('Error updating assessment:', err)
      showNotification('Error updating assessment', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-2xl w-11/12 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl mb-4 text-black">
        Edit {assessment.isParent ? 'Parent ' : ''}Assessment
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {/* Name field */}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. Midterm Exam"
          />
        </div>

        {/* Points toward final grade */}
        <div>
          <label className="block text-sm font-medium">Points toward final grade</label>
          <input
            type="number"
            required
            value={weightPoints}
            onChange={(e) => setWeightPoints(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. 15"
            min={0}
            step={0.01}
          />
          <p className="text-xs text-gray-500 mt-1">How many points this assessment contributes to the final grade</p>
        </div>

        {/* Maximum score field - only for standalone assessments */}
        {!assessment.isParent && (
          <div>
            <label className="block text-sm font-medium">Maximum score</label>
            <input
              type="number"
              required
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="w-full border rounded px-2 py-1"
              placeholder="e.g. 40"
              min={0}
              step={0.01}
            />
            <p className="text-xs text-gray-500 mt-1">Total points possible (e.g., 40 for a test out of 40)</p>
          </div>
        )}

        {/* Child assessments editing - only for parent assessments */}
        {assessment.isParent && childrenData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Child Assessments</label>
              <button
                type="button"
                onClick={() => {
                  const parentPoints = parseFloat(weightPoints) || 0
                  const equalPoints = (parentPoints / childrenData.length).toFixed(2)
                  setChildrenData(prev => prev.map(child => ({ 
                    ...child, 
                    weightPoints: equalPoints 
                  })))
                }}
                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Distribute points equally
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-2 bg-gray-50">
              {/* Header row */}
              <div className="flex space-x-2 items-center text-xs text-gray-600 font-medium border-b pb-1">
                <div className="w-8 text-center">#</div>
                <div className="flex-1">Assessment Name</div>
                <div className="w-20 text-center">Points</div>
                <div className="w-12"></div>
                <div className="w-20 text-center">Out of</div>
                <div className="w-12"></div>
              </div>
              
              {childrenData.map((child, index) => (
                <div key={child.assessmentId} className="flex space-x-2 items-center bg-white p-2 rounded border">
                  <div className="w-8 text-center text-sm text-gray-500 font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={child.name}
                      onChange={(e) => {
                        const newChildren = [...childrenData]
                        newChildren[index].name = e.target.value
                        setChildrenData(newChildren)
                      }}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder={`Assessment ${index + 1}`}
                      required
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      value={child.weightPoints}
                      onChange={(e) => {
                        const newChildren = [...childrenData]
                        newChildren[index].weightPoints = e.target.value
                        setChildrenData(newChildren)
                      }}
                      className="w-full border rounded px-2 py-1 text-sm text-center"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="text-xs text-gray-500 w-12">pts</div>
                  <div className="w-20">
                    <input
                      type="number"
                      value={child.maxScore}
                      onChange={(e) => {
                        const newChildren = [...childrenData]
                        newChildren[index].maxScore = e.target.value
                        setChildrenData(newChildren)
                      }}
                      className="w-full border rounded px-2 py-1 text-sm text-center"
                      placeholder="100"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="text-xs text-gray-500 w-12">max</div>
                </div>
              ))}
            </div>

            {/* Child points validation message */}
            {childPointsError && (
              <p className={`text-xs mt-1 ${
                childPointsError.includes('must not exceed') ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {childPointsError}
              </p>
            )}
            
            <p className="text-xs text-gray-500">
              Child points should total the parent points. Each child also needs a maximum score (how many points the assessment is out of).
            </p>
            
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
          >
            Update Assessment
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AssessmentEditModal