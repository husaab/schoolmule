// File: src/components/assessments/add/AssessmentAddModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { createAssessment } from '@/services/assessmentService'
import { AssessmentPayload, CreateAssessmentRequest } from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'

interface AssessmentAddModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  onAdd: (newAssessment: AssessmentPayload) => void
}

const AssessmentAddModal: React.FC<AssessmentAddModalProps> = ({
  isOpen,
  onClose,
  classId,
  onAdd,
}) => {
  const [name, setName] = useState('')
  // Keep weight as a string so that when the user clears it, it doesn’t immediately default to zero
  // Points this assessment is worth toward final grade
  const [weightPoints, setWeightPoints] = useState<string>('')
  // Maximum possible score for this assessment (e.g., 40 for a test out of 40)
  const [maxScore, setMaxScore] = useState<string>('')
  const [isParent, setIsParent] = useState(false)
  const [childCount, setChildCount] = useState<number>(3)
  const [childrenData, setChildrenData] = useState<Array<{name: string, weightPoints: string, maxScore: string}>>([])
  const [childPointsError, setChildPointsError] = useState<string>('')

  const showNotification = useNotificationStore((state) => state.showNotification)

  // Reset form fields whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setWeightPoints('')
      setMaxScore('')
      setIsParent(false)
      setChildCount(3)
      setChildrenData([])
      setChildPointsError('')
    }
  }, [isOpen])

  // Initialize children data when isParent changes or childCount changes
  useEffect(() => {
    if (isParent && weightPoints) {
      const parentPoints = parseFloat(weightPoints) || 0
      const equalPoints = (parentPoints / childCount).toFixed(2)
      const newChildrenData = Array.from({ length: childCount }, (_, i) => ({
        name: `${name.trim() || 'Assessment'} ${i + 1}`,
        weightPoints: equalPoints,
        maxScore: '100' // Default max score
      }))
      setChildrenData(newChildrenData)
    }
  }, [isParent, childCount, name, weightPoints])

  // Validate child points
  useEffect(() => {
    if (isParent && childrenData.length > 0 && weightPoints) {
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
  }, [isParent, childrenData, weightPoints])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const parsedWeightPoints = Number(weightPoints)
    const parsedMaxScore = Number(maxScore)

    if (!trimmedName || weightPoints === '' || isNaN(parsedWeightPoints)) {
      showNotification('Name and points are required', 'error')
      return
    }

    if (!isParent && (maxScore === '' || isNaN(parsedMaxScore))) {
      showNotification('Maximum score is required for standalone assessments', 'error')
      return
    }

    // Ensure points is positive
    if (parsedWeightPoints <= 0) {
      showNotification('Points must be greater than 0', 'error')
      return
    }

    // Ensure max score is positive for standalone assessments
    if (!isParent && parsedMaxScore <= 0) {
      showNotification('Maximum score must be greater than 0', 'error')
      return
    }

    // Validate parent assessments
    if (isParent) {
      if (childrenData.length === 0) {
        showNotification('Parent assessments must have child assessments', 'error')
        return
      }

      // Check child names are not empty
      if (childrenData.some(child => !child.name.trim())) {
        showNotification('All child assessment names are required', 'error')
        return
      }

      // Check child max scores are valid
      if (childrenData.some(child => !child.maxScore.trim() || isNaN(Number(child.maxScore)) || Number(child.maxScore) <= 0)) {
        showNotification('All child assessments must have valid maximum scores', 'error')
        return
      }

      // Check child points validation
      if (childPointsError) {
        showNotification(childPointsError, 'error')
        return
      }
    }

    try {
      // Build payload for parent-child or regular assessment
      const payload: CreateAssessmentRequest = {
        classId,
        name: trimmedName,
        weightPercent: 0, // Keep for backwards compatibility, but use points primarily
        weightPoints: parsedWeightPoints,
        maxScore: isParent ? null : parsedMaxScore,
        isParent,
        ...(isParent && { 
          childCount: childrenData.length,
          childrenData: childrenData.map((child, index) => ({
            name: child.name.trim(),
            weightPercent: 0, // Keep for backwards compatibility
            weightPoints: parseFloat(child.weightPoints),
            maxScore: parseFloat(child.maxScore),
            sortOrder: index + 1
          }))
        }),
      }

      const res = await createAssessment(payload)

      if (res.status === 'success') {
        // Handle both regular and parent-child responses
        if (isParent && 'parent' in res.data) {
          // Parent assessment created with children
          const parentChildRes = res.data as { parent: AssessmentPayload; children: AssessmentPayload[] }
          onAdd(parentChildRes.parent)
          parentChildRes.children.forEach(child => onAdd(child))
          showNotification(`Parent assessment "${trimmedName}" created with ${childrenData.length} child assessments`, 'success')
        } else {
          // Regular assessment created
          onAdd(res.data as AssessmentPayload)
          showNotification('Assessment added successfully', 'success')
        }
        onClose()
      } else {
        showNotification(res.message || 'Failed to add assessment', 'error')
      }
    } catch (err) {
      console.error('Error creating assessment:', err)
      showNotification('Error creating assessment', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-2xl w-11/12 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl mb-4 text-black">Add Assessment</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {/* Name field */}
        <div>
          <label className="block text-sm">Name</label>
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
        {!isParent && (
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

        {/* Parent assessment checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isParent"
            checked={isParent}
            onChange={(e) => setIsParent(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isParent" className="text-sm font-medium text-gray-700">
            Make this a parent assessment
          </label>
        </div>

        {/* Child count dropdown - only show if parent is checked */}
        {isParent && (
          <div>
            <label className="block text-sm">Number of child assessments</label>
            <select
              value={childCount}
              onChange={(e) => setChildCount(Number(e.target.value))}
              className="w-full border rounded px-2 py-1"
              required
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num} assessments</option>
              ))}
            </select>
          </div>
        )}

        {/* Individual child assessment inputs */}
        {isParent && childrenData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Child Assessments</label>
              <button
                type="button"
                onClick={() => {
                  const parentPoints = parseFloat(weightPoints) || 0
                  const equalPoints = (parentPoints / childCount).toFixed(2)
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
                <div key={index} className="flex space-x-2 items-center bg-white p-2 rounded border">
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
            className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer hover:bg-red-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded-md cursor-pointer hover:bg-cyan-700"
          >
            Add Assessment
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AssessmentAddModal
