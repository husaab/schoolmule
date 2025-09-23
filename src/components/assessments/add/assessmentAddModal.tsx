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
  const [weight, setWeight] = useState<string>('')
  const [isParent, setIsParent] = useState(false)
  const [childCount, setChildCount] = useState<number>(3)
  const [childrenData, setChildrenData] = useState<Array<{name: string, weight: string}>>([])
  const [childWeightError, setChildWeightError] = useState<string>('')

  const showNotification = useNotificationStore((state) => state.showNotification)

  // Reset form fields whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setWeight('')
      setIsParent(false)
      setChildCount(3)
      setChildrenData([])
      setChildWeightError('')
    }
  }, [isOpen])

  // Initialize children data when isParent changes or childCount changes
  useEffect(() => {
    if (isParent) {
      const equalWeight = (100 / childCount).toFixed(2)
      const newChildrenData = Array.from({ length: childCount }, (_, i) => ({
        name: `${name.trim() || 'Assessment'} ${i + 1}`,
        weight: equalWeight
      }))
      setChildrenData(newChildrenData)
    }
  }, [isParent, childCount, name])

  // Validate child weights
  useEffect(() => {
    if (isParent && childrenData.length > 0) {
      const totalChildWeight = childrenData.reduce((sum, child) => {
        const childWeight = parseFloat(child.weight) || 0
        return sum + childWeight
      }, 0)
      
      if (totalChildWeight > 100) {
        setChildWeightError(`Child weights total ${totalChildWeight.toFixed(1)}% (must not exceed 100%)`)
      } else if (totalChildWeight < 99.99) {
        setChildWeightError(`Child weights total ${totalChildWeight.toFixed(1)}% (should equal 100%)`)
      } else {
        setChildWeightError('')
      }
    } else {
      setChildWeightError('')
    }
  }, [isParent, childrenData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const parsedWeight = Number(weight)

    if (!trimmedName || weight === '' || isNaN(parsedWeight)) {
      showNotification('Name and weight% are required', 'error')
      return
    }

    // Ensure weight is between 0 and 100
    if (parsedWeight < 0 || parsedWeight > 100) {
      showNotification('Weight must be between 0 and 100', 'error')
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

      // Check child weight validation
      if (childWeightError) {
        showNotification(childWeightError, 'error')
        return
      }
    }

    try {
      // Build payload for parent-child or regular assessment
      const payload: CreateAssessmentRequest = {
        classId,
        name: trimmedName,
        weightPercent: parsedWeight,
        isParent,
        ...(isParent && { 
          childCount: childrenData.length,
          childrenData: childrenData.map((child, index) => ({
            name: child.name.trim(),
            weightPercent: parseFloat(child.weight),
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

        {/* Weight percentage field */}
        <div>
          <label className="block text-sm">Weight Percentage</label>
          <input
            type="number"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. 25"
            min={0}
            max={100}
            step={0.01}
          />
        </div>

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
                  const equalWeight = (100 / childCount).toFixed(2)
                  setChildrenData(prev => prev.map(child => ({ ...child, weight: equalWeight })))
                }}
                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Distribute equally
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-2 bg-gray-50">
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
                      value={child.weight}
                      onChange={(e) => {
                        const newChildren = [...childrenData]
                        newChildren[index].weight = e.target.value
                        setChildrenData(newChildren)
                      }}
                      className="w-full border rounded px-2 py-1 text-sm text-center"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="text-xs text-gray-500 w-6">%</div>
                </div>
              ))}
            </div>

            {/* Child weight validation message */}
            {childWeightError && (
              <p className={`text-xs mt-1 ${
                childWeightError.includes('must not exceed') ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {childWeightError}
              </p>
            )}
            
            <p className="text-xs text-gray-500">
              Child weights should total 100% and represent relative importance within this parent assessment.
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
