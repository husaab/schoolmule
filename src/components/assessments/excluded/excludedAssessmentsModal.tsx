// File: src/components/assessments/excluded/excludedAssessmentsModal.tsx
'use client'

// Every assessment excused for one student, read from the class score
// matrix (status === 'excused'). Excusing and un-excusing go through the
// same status PATCH the grid uses, so the two never disagree.

import React, { useState } from 'react'
import Modal from '../../shared/modal'
import { AssessmentPayload } from '@/services/types/assessment'
import type { ScoreRow } from '@/components/assessments/scores/types'
import { useCellStatus } from '@/components/assessments/scores/useCellStatus'
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
  scoresMatrix: ScoreRow[]
  /** Re-reads the score matrix so the grid and this list stay in step. */
  onUpdate: () => Promise<void> | void
}

const ExcludedAssessmentsModal: React.FC<ExcludedAssessmentsModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  classId,
  assessments,
  scoresMatrix,
  onUpdate,
}) => {
  // The gradebook mounts this modal per student, so the picker starts empty.
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('')
  const { togglingKey, setStatus } = useCellStatus({ classId, onRefresh: onUpdate })

  // Items (never categories) excused for this student. A category shows as
  // excused through its children, so listing children keeps the count honest.
  const excusedIds = new Set(
    scoresMatrix
      .filter((row) => row.student_id === studentId && !row.is_parent && row.status === 'excused')
      .map((row) => row.assessment_id),
  )
  const excused = assessments.filter((a) => excusedIds.has(a.assessmentId))
  const parentName = (a: AssessmentPayload) =>
    a.parentAssessmentId ? assessments.find((p) => p.assessmentId === a.parentAssessmentId)?.name : null

  // Anything not yet fully excused can still be excused: standalone items,
  // category items, and whole categories (which excuse every item inside).
  const available = assessments.filter((a) => {
    if (a.isParent) {
      const children = assessments.filter((c) => c.parentAssessmentId === a.assessmentId)
      return children.length > 0 && children.some((c) => !excusedIds.has(c.assessmentId))
    }
    return !excusedIds.has(a.assessmentId)
  })

  const busy = togglingKey !== null
  const adding = togglingKey === `${studentId}|${selectedAssessmentId}`

  const handleExcuse = async () => {
    if (!selectedAssessmentId) return
    await setStatus(studentId, selectedAssessmentId, 'excused')
    setSelectedAssessmentId('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader title="Excused assessments" subtitle={studentName} icon={NoSymbolIcon} tone="warning" />

      <ModalBody className="space-y-6">
        <FormSection label="Excuse an assessment">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className={selectClass}
                disabled={busy}
                aria-label="Assessment to excuse"
              >
                <option value="">Select an assessment</option>
                {available.map((assessment) => (
                  <option key={assessment.assessmentId} value={assessment.assessmentId}>
                    {assessment.name} ({assessment.weightPoints || assessment.weightPercent || 0} pts)
                    {assessment.isParent ? ' · whole category' : ''}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleExcuse}
              disabled={!selectedAssessmentId || busy}
              loading={adding}
            >
              {adding ? 'Excusing' : 'Excuse'}
            </Button>
          </div>

          {available.length === 0 && (
            <p className="text-xs text-slate-400">
              Every assessment in this class is already excused for {studentName}.
            </p>
          )}
        </FormSection>

        <FormSection label="Currently excused">
          {excused.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
              <p className="text-sm text-slate-500">Nothing is excused yet.</p>
              <p className="mt-1 text-xs text-slate-400">
                Pick an assessment above, or hover a cell in the grid and choose Excuse.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {excused.map((assessment) => {
                const removing = togglingKey === `${studentId}|${assessment.assessmentId}`
                const category = parentName(assessment)
                return (
                  <div
                    key={assessment.assessmentId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{assessment.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {assessment.weightPoints || assessment.weightPercent || 0} points
                        {category && ` · in ${category}`}
                        {assessment.date && ` · ${new Date(assessment.date).toLocaleDateString()}`}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setStatus(studentId, assessment.assessmentId, 'graded')}
                      loading={removing}
                      disabled={busy}
                      title="Count this assessment again"
                    >
                      {!removing && <TrashIcon className="h-4 w-4" />}
                      {removing ? 'Clearing' : 'Clear'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </FormSection>

        {excused.length > 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Excused assessments never count toward the grade.</p>
            <p className="mt-1 opacity-90">
              This student’s grade is calculated out of the assessments that have evidence, so the rest
              are weighted proportionally. Any saved score stays on file in case the excuse is cleared.
            </p>
          </div>
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
