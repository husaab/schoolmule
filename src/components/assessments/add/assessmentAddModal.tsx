// File: src/components/assessments/add/AssessmentAddModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { createAssessment } from '@/services/assessmentService'
import { AssessmentPayload, CreateAssessmentRequest } from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  Button,
  Field,
  FieldRow,
  ModalBody,
  ModalFooter,
  ModalHeader,
  inputClass,
} from '../../shared/modalKit'
import {
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface AssessmentAddModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  onAdd: (newAssessment: AssessmentPayload) => void
  onBatchAdd?: (newAssessments: AssessmentPayload[]) => void
}

/** Quiet label for the compact fields inside an individual-assessment card. */
const MicroLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
  <label
    htmlFor={htmlFor}
    className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
  >
    {children}
  </label>
)

const AssessmentAddModal: React.FC<AssessmentAddModalProps> = ({
  isOpen,
  onClose,
  classId,
  onAdd,
  onBatchAdd,
}) => {
  const [name, setName] = useState('')
  // Keep weight as a string so that when the user clears it, it doesn’t immediately default to zero
  // Points this assessment is worth toward final grade
  const [weightPoints, setWeightPoints] = useState<string>('')
  // Maximum possible score for this assessment (e.g., 40 for a test out of 40)
  const [maxScore, setMaxScore] = useState<string>('')
  // Once the teacher edits max score directly, stop mirroring weight points into it
  const [maxScoreTouched, setMaxScoreTouched] = useState(false)
  const [date, setDate] = useState<string>('')
  const [isParent, setIsParent] = useState(false)
  const [childrenData, setChildrenData] = useState<Array<{name: string, weightPoints: string, maxScore: string, date: string}>>([])
  const [childPointsError, setChildPointsError] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const showNotification = useNotificationStore((state) => state.showNotification)

  // Reset form fields whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setWeightPoints('')
      setMaxScore('')
      setMaxScoreTouched(false)
      setDate('')
      setIsParent(false)
      setChildrenData([])
      setChildPointsError('')
    }
  }, [isOpen])

  // Clear children data when switching away from multiple assessment
  useEffect(() => {
    if (!isParent) {
      setChildrenData([])
    }
  }, [isParent])

  // Validate child points
  useEffect(() => {
    if (isParent && childrenData.length > 0 && weightPoints) {
      const parentPoints = parseFloat(weightPoints) || 0
      const totalChildPoints = childrenData.reduce((sum, child) => {
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

    // Validate multiple assessments
    if (isParent) {
      if (childrenData.length === 0) {
        showNotification('Multiple assessments must have individual assessments', 'error')
        return
      }

      // Check individual assessment names are not empty
      if (childrenData.some(child => !child.name.trim())) {
        showNotification('All individual assessment names are required', 'error')
        return
      }

      // Check individual assessment max scores are valid
      if (childrenData.some(child => !child.maxScore.trim() || isNaN(Number(child.maxScore)) || Number(child.maxScore) <= 0)) {
        showNotification('All individual assessments must have valid maximum scores', 'error')
        return
      }

      // Check individual points validation
      if (childPointsError) {
        showNotification(childPointsError, 'error')
        return
      }
    }

    setSubmitting(true)
    try {
      // Build payload for parent-child or regular assessment
      const payload: CreateAssessmentRequest = {
        classId,
        name: trimmedName,
        weightPercent: 0, // Keep for backwards compatibility, but use points primarily
        weightPoints: parsedWeightPoints,
        maxScore: isParent ? null : parsedMaxScore,
        date: date || null,
        isParent,
        ...(isParent && {
          childCount: childrenData.length,
          childrenData: childrenData.map((child, index) => ({
            name: child.name.trim(),
            weightPercent: 0, // Keep for backwards compatibility
            weightPoints: parseFloat(child.weightPoints),
            maxScore: parseFloat(child.maxScore),
            sortOrder: index + 1,
            date: child.date || null
          }))
        }),
      }

      const res = await createAssessment(payload)

      if (res.status === 'success') {
        // Handle both regular and parent-child responses
        if (isParent && 'parent' in res.data) {
          // Parent assessment created with children
          const parentChildRes = res.data as { parent: AssessmentPayload; children: AssessmentPayload[] }

          // Use batch add if available for better performance and state management
          if (onBatchAdd) {
            const allAssessments = [parentChildRes.parent, ...parentChildRes.children]
            onBatchAdd(allAssessments)
          } else {
            // Fallback to individual adds
            onAdd(parentChildRes.parent)
            parentChildRes.children.forEach(child => onAdd(child))
          }

          showNotification(`Multiple assessment "${trimmedName}" created with ${childrenData.length} individual assessments`, 'success')
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
    } finally {
      setSubmitting(false)
    }
  }

  const pointsReady = Boolean(weightPoints) && parseFloat(weightPoints) > 0

  const pointsField = (
    <Field
      label="Points toward final grade"
      htmlFor="assessment-points"
      hint="What this assessment contributes to the final grade."
      required
    >
      <input
        id="assessment-points"
        type="number"
        required
        value={weightPoints}
        onChange={(e) => {
          setWeightPoints(e.target.value)
          // Default scoring scale to the weight (out-of-weight-points convention)
          // until the teacher sets a different maximum score themselves
          if (!maxScoreTouched) setMaxScore(e.target.value)
        }}
        className={inputClass}
        placeholder="e.g. 15"
        min={0}
        step={0.01}
      />
    </Field>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Add an assessment"
        subtitle="Scores go in from the gradebook once it exists."
        icon={ClipboardDocumentListIcon}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Field label="Name" htmlFor="assessment-name" required>
            <input
              id="assessment-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Midterm Exam"
            />
          </Field>

          {/* Maximum score only applies to standalone assessments — a multiple
              assessment is scored through its individual items. */}
          {isParent ? (
            pointsField
          ) : (
            <FieldRow>
              {pointsField}
              <Field
                label="Maximum score"
                htmlFor="assessment-max-score"
                hint="Total points possible, e.g. 40 for a test out of 40."
                required
              >
                <input
                  id="assessment-max-score"
                  type="number"
                  required
                  value={maxScore}
                  onChange={(e) => {
                    setMaxScore(e.target.value)
                    setMaxScoreTouched(true)
                  }}
                  className={inputClass}
                  placeholder="e.g. 40"
                  min={0}
                  step={0.01}
                />
              </Field>
            </FieldRow>
          )}

          <Field
            label="Assessment date"
            htmlFor="assessment-date"
            hint="Optional — when the assessment was written."
          >
            <input
              id="assessment-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          {/* Multiple assessment — the one choice here that changes the shape of
              the form, so it gets its own surface rather than a bare checkbox. */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3.5 transition-colors hover:bg-cyan-50">
            <input
              type="checkbox"
              id="isParent"
              checked={isParent}
              onChange={(e) => setIsParent(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm">
              <span className="font-medium text-slate-800">Make this a multiple assessment</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Split the points across individual assessments graded on their own.
              </span>
            </span>
          </label>

          {/* Points drive how the individual assessments split, so they come first */}
          {isParent && !pointsReady && (
            <div className="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-amber-900">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                Enter the points toward the final grade above, then add the individual assessments
                that share them.
              </p>
            </div>
          )}

          {/* Individual assessment management - only show if multiple is checked and points are filled */}
          {isParent && pointsReady && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Individual assessments
                </h3>
                <div className="flex items-center gap-2">
                  {childrenData.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const parentPoints = parseFloat(weightPoints) || 0
                        const equalPoints = childrenData.length > 0 ? (parentPoints / childrenData.length).toFixed(2) : '0'
                        setChildrenData(prev => prev.map(child => ({
                          ...child,
                          weightPoints: equalPoints
                        })))
                      }}
                    >
                      Split points evenly
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const newChild = {
                        name: `${name.trim() || 'Assessment'} ${childrenData.length + 1}`,
                        weightPoints: '0',
                        maxScore: '100',
                        date: date // Use parent's date as default
                      }
                      setChildrenData(prev => [...prev, newChild])
                    }}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add one
                  </Button>
                </div>
              </div>

              {childrenData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">No individual assessments yet.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Add one for each item students are marked on — a quiz, a lab, a recitation.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {childrenData.map((child, index) => (
                    <div
                      key={index}
                      className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => {
                            const newChildren = [...childrenData]
                            newChildren[index].name = e.target.value
                            setChildrenData(newChildren)
                          }}
                          className={inputClass}
                          placeholder={`Assessment ${index + 1}`}
                          aria-label={`Individual assessment ${index + 1} name`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setChildrenData(prev => prev.filter((_, i) => i !== index))
                          }}
                          className="flex-shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          title="Remove this individual assessment"
                          aria-label={`Remove individual assessment ${index + 1}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pl-8">
                        <div className="min-w-0">
                          <MicroLabel htmlFor={`child-points-${index}`}>Points</MicroLabel>
                          <input
                            id={`child-points-${index}`}
                            type="number"
                            value={child.weightPoints}
                            onChange={(e) => {
                              const newChildren = [...childrenData]
                              newChildren[index].weightPoints = e.target.value
                              setChildrenData(newChildren)
                            }}
                            className={inputClass}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="min-w-0">
                          <MicroLabel htmlFor={`child-max-${index}`}>Out of</MicroLabel>
                          <input
                            id={`child-max-${index}`}
                            type="number"
                            value={child.maxScore}
                            onChange={(e) => {
                              const newChildren = [...childrenData]
                              newChildren[index].maxScore = e.target.value
                              setChildrenData(newChildren)
                            }}
                            className={inputClass}
                            placeholder="100"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="min-w-0">
                          <MicroLabel htmlFor={`child-date-${index}`}>Date</MicroLabel>
                          <input
                            id={`child-date-${index}`}
                            type="date"
                            value={child.date}
                            onChange={(e) => {
                              const newChildren = [...childrenData]
                              newChildren[index].date = e.target.value
                              setChildrenData(newChildren)
                            }}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Individual points validation message */}
              {childPointsError && (
                <p
                  className={`text-xs ${
                    childPointsError.includes('must not exceed') ? 'text-rose-600' : 'text-amber-600'
                  }`}
                >
                  {childPointsError}
                </p>
              )}

              <p className="text-xs text-slate-400">
                Individual points should add up to the multiple assessment’s points. Each one also
                needs a maximum score — what it is marked out of.
              </p>
            </section>
          )}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitting ? 'Adding' : 'Add assessment'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default AssessmentAddModal
