// File: src/components/assessments/excluded/excludedAssessmentsModal.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Modal from '../../shared/modal'
import { createExclusion, deleteExclusion, getExclusionsByStudentAndClass } from '@/services/excludedAssessmentService'
import { AssessmentPayload } from '@/services/types/assessment'
import { ExcludedAssessmentPayload } from '@/services/excludedAssessmentService'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  Button,
  FormSection,
  ModalBody,
  ModalFooter,
  ModalHeader,
  selectClass,
} from '../../shared/modalKit'
import { NoSymbolIcon, TrashIcon } from '@heroicons/react/24/outline'

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
  // Which exclusion is mid-removal, so its row can show progress and the rest stay put
  const [removingId, setRemovingId] = useState<string | null>(null)

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
    setRemovingId(assessmentId)
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
    } finally {
      setRemovingId(null)
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

  const busy = adding || removingId !== null

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Excluded assessments"
        subtitle={studentName}
        icon={NoSymbolIcon}
        tone="warning"
      />

      <ModalBody className="space-y-6">
        {loading ? (
          <div className="space-y-3" aria-label="Loading exclusions">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <>
            <FormSection label="Exclude an assessment">
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <select
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    className={selectClass}
                    disabled={adding}
                    aria-label="Assessment to exclude"
                  >
                    <option value="">Select an assessment</option>
                    {availableAssessments.map((assessment) => (
                      <option key={assessment.assessmentId} value={assessment.assessmentId}>
                        {assessment.name} ({assessment.weightPoints || assessment.weightPercent || 0} pts)
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddExclusion}
                  disabled={!selectedAssessmentId}
                  loading={adding}
                >
                  {adding ? 'Excluding' : 'Exclude'}
                </Button>
              </div>

              {availableAssessments.length === 0 && (
                <p className="text-xs text-slate-400">
                  Every assessment in this class is already excluded for {studentName}.
                </p>
              )}
            </FormSection>

            <FormSection label="Currently excluded">
              {exclusions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">Nothing is excluded yet.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Pick an assessment above to drop it from this student’s grade.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exclusions.map((exclusion) => {
                    const assessment = getAssessmentDetails(exclusion.assessmentId)
                    const removing = removingId === exclusion.assessmentId
                    return (
                      <div
                        key={exclusion.assessmentId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {assessment?.name || 'Unknown assessment'}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {assessment?.weightPoints || assessment?.weightPercent || 0} points
                            {assessment?.isParent && ' · Multiple assessment'}
                            {assessment?.date && ` · ${new Date(assessment.date).toLocaleDateString()}`}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleDeleteExclusion(exclusion.assessmentId)}
                          loading={removing}
                          disabled={busy}
                          title="Count this assessment again"
                        >
                          {!removing && <TrashIcon className="h-4 w-4" />}
                          {removing ? 'Removing' : 'Remove'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </FormSection>

            {exclusions.length > 0 && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">Excluded assessments do not count toward the grade.</p>
                <p className="mt-1 opacity-90">
                  The remaining assessments are reweighted proportionally, so this student’s grade is
                  calculated out of what is left.
                </p>
              </div>
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="primary" onClick={onClose} disabled={busy}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ExcludedAssessmentsModal
