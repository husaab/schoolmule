// File: src/components/assessments/edit/AssessmentEditModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import { updateAssessment, batchUpdateAssessments, deleteAssessment, createAssessment } from '@/services/assessmentService'
import { AssessmentPayload } from '@/services/types/assessment'
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
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface AssessmentEditModalProps {
  isOpen: boolean
  onClose: () => void
  assessment: AssessmentPayload
  allAssessments: AssessmentPayload[] // To get children for parent assessments
  onUpdate: (updated: AssessmentPayload) => void
  onBatchUpdate?: (updated: AssessmentPayload[], deleted: string[]) => void
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
  const [submitting, setSubmitting] = useState(false)

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

    setSubmitting(true)
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
    } finally {
      setSubmitting(false)
    }
  }

  const visibleChildren = childrenData.filter(child => !child.toDelete)

  /** Writes fields of a child row, matched by id rather than by filtered index. */
  const updateChild = (
    assessmentId: string,
    patch: { name?: string; weightPoints?: string; maxScore?: string; date?: string }
  ) => {
    setChildrenData(prev =>
      prev.map(child => (child.assessmentId === assessmentId ? { ...child, ...patch } : child))
    )
  }

  const pointsField = (
    <Field
      label="Points toward final grade"
      htmlFor="assessment-edit-points"
      hint="What this assessment contributes to the final grade."
      required
    >
      <input
        id="assessment-edit-points"
        type="number"
        required
        value={weightPoints}
        onChange={(e) => setWeightPoints(e.target.value)}
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
        title={assessment.isParent ? 'Edit multiple assessment' : 'Edit assessment'}
        subtitle={assessment.name}
        icon={PencilSquareIcon}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Field label="Name" htmlFor="assessment-edit-name" required>
            <input
              id="assessment-edit-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Midterm Exam"
            />
          </Field>

          {/* Maximum score only applies to standalone assessments — a multiple
              assessment is scored through its individual items. */}
          {assessment.isParent ? (
            pointsField
          ) : (
            <FieldRow>
              {pointsField}
              <Field
                label="Maximum score"
                htmlFor="assessment-edit-max-score"
                hint="Total points possible, e.g. 40 for a test out of 40."
                required
              >
                <input
                  id="assessment-edit-max-score"
                  type="number"
                  required
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
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
            htmlFor="assessment-edit-date"
            hint="Optional — when the assessment was written."
          >
            <input
              id="assessment-edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          {/* Individual assessments editing - only for multiple assessments */}
          {assessment.isParent && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Individual assessments
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const activeChildren = childrenData.filter(child => !child.toDelete)
                      const parentPoints = parseFloat(weightPoints) || 0
                      const equalPoints = activeChildren.length > 0 ? (parentPoints / activeChildren.length).toFixed(2) : '0'
                      setChildrenData(prev => prev.map(child => child.toDelete ? child : ({
                        ...child,
                        weightPoints: equalPoints
                      })))
                    }}
                  >
                    Split points evenly
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
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
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add one
                  </Button>
                </div>
              </div>

              {visibleChildren.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">No individual assessments yet.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Add one for each item students are marked on — a quiz, a lab, a recitation.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {visibleChildren.map((child, index) => (
                    <div
                      key={child.assessmentId}
                      className={`space-y-2.5 rounded-xl border p-3 ${
                        child.isNew
                          ? 'border-emerald-200 bg-emerald-50/60'
                          : 'border-slate-200 bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => updateChild(child.assessmentId, { name: e.target.value })}
                          className={inputClass}
                          placeholder={`Assessment ${index + 1}`}
                          aria-label={`Individual assessment ${index + 1} name`}
                          required
                        />
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
                          className="flex-shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          title="Delete this individual assessment"
                          aria-label={`Delete individual assessment ${index + 1}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pl-8">
                        <div className="min-w-0">
                          <MicroLabel htmlFor={`edit-child-points-${child.assessmentId}`}>
                            Points
                          </MicroLabel>
                          <input
                            id={`edit-child-points-${child.assessmentId}`}
                            type="number"
                            value={child.weightPoints}
                            onChange={(e) => updateChild(child.assessmentId, { weightPoints: e.target.value })}
                            className={inputClass}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="min-w-0">
                          <MicroLabel htmlFor={`edit-child-max-${child.assessmentId}`}>
                            Out of
                          </MicroLabel>
                          <input
                            id={`edit-child-max-${child.assessmentId}`}
                            type="number"
                            value={child.maxScore}
                            onChange={(e) => updateChild(child.assessmentId, { maxScore: e.target.value })}
                            className={inputClass}
                            placeholder="100"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="min-w-0">
                          <MicroLabel htmlFor={`edit-child-date-${child.assessmentId}`}>
                            Date
                          </MicroLabel>
                          <input
                            id={`edit-child-date-${child.assessmentId}`}
                            type="date"
                            value={child.date}
                            onChange={(e) => updateChild(child.assessmentId, { date: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Child points validation message */}
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
            {submitting ? 'Saving' : 'Save changes'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default AssessmentEditModal
