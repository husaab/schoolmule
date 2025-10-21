// File: src/components/assessments/edit/AssessmentEditModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { updateAssessment, batchUpdateAssessments, deleteAssessment, createAssessment } from '@/services/assessmentService'
import { AssessmentPayload } from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'

interface AssessmentEditModalProps {
  isOpen: boolean
  onClose: () => void
  assessment: AssessmentPayload
  allAssessments: AssessmentPayload[] // To get children for parent assessments
  onUpdate: (updated: AssessmentPayload) => void
  onBatchUpdate?: (updated: AssessmentPayload[], deleted: string[]) => void
}

const AssessmentEditModal: React.FC<AssessmentEditModalProps> = ({
  isOpen,
  onClose,
  assessment,
  allAssessments,
  onUpdate,
  onBatchUpdate,
}) => {
  const [name, setName] = useState('')
  const [weightPoints, setWeightPoints] = useState<string>('')
  const [maxScore, setMaxScore] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [childrenData, setChildrenData] = useState<Array<{
    assessmentId: string
    name: string
    weightPoints: string
    maxScore: string
    sortOrder: number
    date: string
    isNew?: boolean
    toDelete?: boolean
  }>>([])
  const [childPointsError, setChildPointsError] = useState<string>('')

  const showNotification = useNotificationStore((s) => s.showNotification)

  // Prefill fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(assessment.name)
      setWeightPoints(String(assessment.weightPoints || assessment.weightPercent || 0))
      setMaxScore(String(assessment.maxScore || ''))
      setDate(assessment.date ? assessment.date.split('T')[0] : '')
      
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
              sortOrder: child.sortOrder || 0,
              date: child.date ? child.date.split('T')[0] : ''
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
      const totalChildPoints = childrenData
        .filter(child => !child.toDelete)
        .reduce((sum, child) => {
          const childPoints = parseFloat(child.weightPoints) || 0
          return sum + childPoints
        }, 0)
      
      if (totalChildPoints - parentPoints > 0.03) {
        setChildPointsError(`Child points total ${totalChildPoints.toFixed(1)} (must not exceed parent ${parentPoints})`)
      } else if (Math.abs(totalChildPoints - parentPoints) > 0.03) {
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
      const activeChildren = childrenData.filter(child => !child.toDelete)
      
      if (activeChildren.some(child => !child.name.trim())) {
        showNotification('All individual assessment names are required', 'error')
        return
      }

      if (activeChildren.some(child => !child.maxScore.trim() || isNaN(Number(child.maxScore)) || Number(child.maxScore) <= 0)) {
        showNotification('All individual assessments must have valid maximum scores', 'error')
        return
      }

      if (childPointsError) {
        showNotification(childPointsError, 'error')
        return
      }
    }

    try {
      if (assessment.isParent && childrenData.length > 0) {
        const activeChildren = childrenData.filter(child => !child.toDelete)
        const childrenToDelete = childrenData.filter(child => child.toDelete && !child.isNew)
        const newChildren = childrenData.filter(child => child.isNew && !child.toDelete)
        
        // Step 1: Delete marked children
        for (const child of childrenToDelete) {
          try {
            await deleteAssessment(child.assessmentId)
          } catch (err) {
            console.error('Error deleting child assessment:', err)
            showNotification(`Failed to delete assessment "${child.name}"`, 'error')
            return
          }
        }
        
        // Step 2: Create new children
        const createdChildren: AssessmentPayload[] = []
        for (const newChild of newChildren) {
          try {
            const createPayload = {
              classId: assessment.classId,
              name: newChild.name.trim(),
              weightPercent: 0, // Keep for backwards compatibility
              weightPoints: parseFloat(newChild.weightPoints),
              maxScore: parseFloat(newChild.maxScore),
              parentAssessmentId: assessment.assessmentId,
              sortOrder: newChild.sortOrder,
              isParent: false,
              date: newChild.date || null,
            }
            const createRes = await createAssessment(createPayload)
            if (createRes.status === 'success') {
              createdChildren.push(createRes.data as AssessmentPayload)
            } else {
              showNotification(`Failed to create assessment "${newChild.name}"`, 'error')
              return
            }
          } catch (err) {
            console.error('Error creating child assessment:', err)
            showNotification(`Failed to create assessment "${newChild.name}"`, 'error')
            return
          }
        }
        
        // Step 3: Batch update parent and remaining existing children
        const existingChildren = activeChildren.filter(child => !child.isNew)
        const updates = [
          // Parent assessment update
          {
            assessmentId: assessment.assessmentId,
            name: trimmedName,
            weightPercent: 0, // Keep for backwards compatibility
            weightPoints: parsedWeightPoints,
            maxScore: undefined, // Parent assessments don't have max score
            date: date || null,
          },
          // Existing child assessments updates
          ...existingChildren.map(child => ({
            assessmentId: child.assessmentId,
            name: child.name.trim(),
            weightPercent: 0, // Keep for backwards compatibility
            weightPoints: parseFloat(child.weightPoints),
            maxScore: parseFloat(child.maxScore),
            sortOrder: child.sortOrder,
            date: child.date || null,
          }))
        ]

        const res = await batchUpdateAssessments({ updates })

        if (res.status === 'success') {
          // Use batch update if available, otherwise fall back to individual updates
          if (onBatchUpdate) {
            const allUpdated = [...res.data, ...createdChildren]
            const deletedIds = childrenToDelete.map(child => child.assessmentId)
            onBatchUpdate(allUpdated, deletedIds)
          } else {
            // Fallback: Update assessments individually
            res.data.forEach(updatedAssessment => {
              onUpdate(updatedAssessment)
            })
            createdChildren.forEach(newAssessment => {
              onUpdate(newAssessment)
            })
          }
          
          const totalUpdated = res.data.length + createdChildren.length - childrenToDelete.length
          showNotification(`Assessment updated successfully (${totalUpdated} total assessments)`, 'success')
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
          date: date || null,
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
        Edit {assessment.isParent ? 'Multiple ' : ''}Assessment
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

        {/* Date field */}
        <div>
          <label className="block text-sm font-medium">Assessment Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
          <p className="text-xs text-gray-500 mt-1">When was this assessment conducted? (optional)</p>
        </div>

        {/* Individual assessments editing - only for multiple assessments */}
        {assessment.isParent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Individual Assessments</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const newChild = {
                      assessmentId: `temp-${Date.now()}`, // Temporary ID for new assessment
                      name: '',
                      weightPoints: '0',
                      maxScore: '100',
                      sortOrder: childrenData.length + 1,
                      date: date, // Use parent's date as default
                      isNew: true
                    }
                    setChildrenData(prev => [...prev, newChild])
                  }}
                  className="text-xs text-white hover:text-green-800 cursor-pointer px-2 py-1 border bg-green-500 rounded"
                >
                  + Add Individual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const activeChildren = childrenData.filter(child => !child.toDelete)
                    const parentPoints = parseFloat(weightPoints) || 0
                    const equalPoints = activeChildren.length > 0 ? (parentPoints / activeChildren.length).toFixed(2) : '0'
                    setChildrenData(prev => prev.map(child => child.toDelete ? child : ({ 
                      ...child, 
                      weightPoints: equalPoints 
                    })))
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Distribute points equally
                </button>
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-2 bg-gray-50">
              {/* Header row */}
              <div className="flex space-x-2 items-center text-xs text-gray-600 font-medium border-b pb-1">
                <div className="w-8 text-center">#</div>
                <div className="flex-1">Assessment Name</div>
                <div className="w-20 text-center">Points</div>
                <div className="w-12"></div>
                <div className="w-20 text-center">Out of</div>
                <div className="w-24 text-center">Date</div>
                <div className="w-16 text-center">Actions</div>
              </div>
              
              {childrenData.filter(child => !child.toDelete).length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No individual assessments yet.</p>
                  <p className="text-xs mt-1">Click &quot;+ Add Individual&quot; to create sub-assessments.</p>
                </div>
              ) : (
                childrenData.filter(child => !child.toDelete).map((child, index) => (
                <div key={child.assessmentId} className={`flex space-x-2 items-center p-2 rounded border ${
                  child.isNew ? 'bg-green-50 border-green-200' : 'bg-white'
                }`}>
                  <div className="w-8 text-center text-sm text-gray-500 font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={child.name}
                      onChange={(e) => {
                        const newChildren = [...childrenData]
                        const actualIndex = newChildren.findIndex(c => c.assessmentId === child.assessmentId)
                        newChildren[actualIndex].name = e.target.value
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
                        const actualIndex = newChildren.findIndex(c => c.assessmentId === child.assessmentId)
                        newChildren[actualIndex].weightPoints = e.target.value
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
                        const actualIndex = newChildren.findIndex(c => c.assessmentId === child.assessmentId)
                        newChildren[actualIndex].maxScore = e.target.value
                        setChildrenData(newChildren)
                      }}
                      className="w-full border rounded px-2 py-1 text-sm text-center"
                      placeholder="100"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="date"
                      value={child.date}
                      onChange={(e) => {
                        const newChildren = [...childrenData]
                        const actualIndex = newChildren.findIndex(c => c.assessmentId === child.assessmentId)
                        newChildren[actualIndex].date = e.target.value
                        setChildrenData(newChildren)
                      }}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="w-16 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (child.isNew) {
                          // Remove new assessment from array
                          setChildrenData(prev => prev.filter(c => c.assessmentId !== child.assessmentId))
                        } else {
                          // Mark existing assessment for deletion
                          const newChildren = [...childrenData]
                          const actualIndex = newChildren.findIndex(c => c.assessmentId === child.assessmentId)
                          newChildren[actualIndex].toDelete = true
                          setChildrenData(newChildren)
                        }
                      }}
                      className="text-red-600 hover:text-red-800 font-bold text-lg px-1 cursor-pointer"
                      title="Delete this individual assessment"
                    >
                      ×
                    </button>
                  </div>
                </div>
                ))
              )}
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
              Individual points should total the multiple assessment points. Each individual assessment also needs a maximum score (how many points the assessment is out of).
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