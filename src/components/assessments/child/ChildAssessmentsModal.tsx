'use client'

import React, { ChangeEvent, useMemo, useState } from 'react'
import Modal from '@/components/shared/modal'
import { AssessmentPayload } from '@/services/types/assessment'
import { StudentPayload } from '@/services/types/student'
import type { AssessmentPublicationState } from '@/services/types/assessmentPublication'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { CheckIcon, ExclamationTriangleIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import PublishStateBadge from '@/components/assessments/publish/PublishStateBadge'
import { summarizePublication } from '@/lib/publicationSummary'
import ScoreCell from '@/components/assessments/scores/ScoreCell'
import { buildScoreLookups, type ScoreRow } from '@/components/assessments/scores/types'
import { useExclusionToggle } from '@/components/assessments/scores/useExclusionToggle'
import { useScoreGridNav } from '@/components/assessments/scores/useScoreGridNav'


interface ChildAssessmentsModalProps {
  isOpen: boolean
  onClose: () => void
  parentAssessment: AssessmentPayload
  childAssessments: AssessmentPayload[]
  students: StudentPayload[]
  scoresMatrix: ScoreRow[]
  editedScores: { [key: string]: number | '' }
  onScoreChange: (studentId: string, assessmentId: string, e: ChangeEvent<HTMLInputElement>) => void
  classId: string
  onRefreshExclusions: () => Promise<void>
  /** Publish state keyed by assessmentId, for the per-child Publish controls. */
  publications: Record<string, AssessmentPublicationState>
  /** Opens the publish modal for the given assessments (children here). */
  onPublish: (assessments: AssessmentPayload[]) => void
}

const ChildAssessmentsModal: React.FC<ChildAssessmentsModalProps> = ({
  isOpen,
  onClose,
  parentAssessment,
  childAssessments,
  students,
  scoresMatrix,
  editedScores,
  onScoreChange,
  classId,
  onRefreshExclusions,
  publications,
  onPublish,
}) => {
  // Individual items are publishable on their own, so they get the same
  // select-then-publish affordance as the columns in the main gradebook.
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set())
  const { togglingKey, toggle } = useExclusionToggle({ classId, onRefreshExclusions })
  const nav = useScoreGridNav('child-grade', students.length, childAssessments.length)

  const toggleChildSelected = (assessmentId: string) => {
    setSelectedChildIds((prev) => {
      const next = new Set(prev)
      if (next.has(assessmentId)) next.delete(assessmentId)
      else next.add(assessmentId)
      return next
    })
  }

  const selectedChildren = childAssessments.filter((c) => selectedChildIds.has(c.assessmentId))
  const { existing: existingScoreMap, excluded: exclusionMap } = useMemo(
    () => buildScoreLookups(scoresMatrix),
    [scoresMatrix]
  )

  // Calculate parent score for a student based on child scores (excluding excluded children)
  const calculateParentScore = (studentId: string) => {
    let totalPoints = 0
    let maxPossiblePoints = 0
    let totalActiveWeight = 0

    childAssessments.forEach(child => {
      const key = `${studentId}|${child.assessmentId}`
      const isExcluded = exclusionMap[key] || false

      if (isExcluded) {
        // Skip excluded child assessments
        return
      }

      const rawValue = editedScores[key] !== undefined
        ? editedScores[key]
        : existingScoreMap[key] ?? null

      const rawScore = typeof rawValue === 'number' ? rawValue : (rawValue ? parseFloat(String(rawValue)) : 0)

      // Get weight points (how many points this assessment contributes to parent)
      const childPoints = Number(child.weightPoints || child.weightPercent || 0)
      // Use the actual maxScore, not the convoluted logic
      const maxScore = Number(child.maxScore || 100)

      // Convert raw score to percentage, then multiply by weight points
      const percentage = maxScore > 0 ? Math.min(rawScore / maxScore, 1) : 0
      const earnedPoints = percentage * childPoints

      totalPoints += earnedPoints
      maxPossiblePoints += childPoints
      totalActiveWeight += childPoints
    })

    // If some assessments are excluded, redistribute proportionally
    const parentTotalPoints = Number(parentAssessment.weightPoints || parentAssessment.weightPercent || 0)
    if (totalActiveWeight > 0 && totalActiveWeight < parentTotalPoints) {
      // Scale up proportionally to account for excluded assessments
      const scaleFactor = parentTotalPoints / totalActiveWeight
      totalPoints = totalPoints * scaleFactor
      maxPossiblePoints = parentTotalPoints
    }

    // Return earned/total format for display
    return { earned: totalPoints, total: maxPossiblePoints }
  }

  // Check if all child points add up to parent points
  const totalChildPoints = childAssessments.reduce((sum, child) => {
    const points = Number(child.weightPoints || child.weightPercent || 0)
    return sum + points
  }, 0)
  const parentPoints = Number(parentAssessment.weightPoints || parentAssessment.weightPercent || 0)
  const pointsWarning = Math.abs(totalChildPoints - parentPoints) > 0.01
  // Judged by the children: the category's own flag stays stale after a
  // partial publish, and parents see whichever items are live.
  const summary = summarizePublication(parentAssessment, childAssessments, publications)

  return (
    // Wider than the rest of the set on purpose: this one is a grade grid, and
    // every individual assessment needs its own column.
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-6xl">
      <ModalHeader
        title={parentAssessment.name}
        subtitle={`${parentPoints} points across ${childAssessments.length} individual assessment${childAssessments.length === 1 ? '' : 's'}`}
        icon={Squares2X2Icon}
      />

      <ModalBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <PublishStateBadge summary={summary} variant="chip" />
        </div>

        {pointsWarning && (
          <div className="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-amber-900">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p className="text-sm">
              Individual points total {Math.round(totalChildPoints * 100) / 100}, but the category is worth {parentPoints}.
              Edit the category to bring them back in line.
            </p>
          </div>
        )}

        {childAssessments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
            <p className="text-sm text-slate-500">
              This multiple assessment has no individual assessments yet.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Edit the assessment to add the items students are marked on.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full table-auto whitespace-nowrap">
              <thead className="bg-slate-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2 text-left text-sm font-semibold text-slate-600">
                    Student
                  </th>
                  {childAssessments.map((child) => {
                    const childPublished = publications[child.assessmentId]?.isPublished
                    return (
                      <th
                        key={child.assessmentId}
                        className="whitespace-nowrap px-4 py-2 text-center align-top"
                      >
                        <label className="flex cursor-pointer items-center justify-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={selectedChildIds.has(child.assessmentId)}
                            onChange={() => toggleChildSelected(child.assessmentId)}
                            className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            title="Select this assessment to publish on its own"
                          />
                          <span className="truncate text-sm font-semibold text-slate-700">
                            {child.name}
                          </span>
                        </label>
                        <div className="mt-0.5 text-xs font-normal text-slate-500">
                          {child.weightPoints || child.weightPercent || 0} pts · order{' '}
                          {child.sortOrder || '—'}
                        </div>
                        {/* Status, and a way straight into managing just this
                            one — an individual item can be published or pulled
                            back without touching the rest of the category. */}
                        <button
                          onClick={() => onPublish([child])}
                          className={`mt-1 inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors ${
                            childPublished
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-dashed border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                          title={
                            childPublished
                              ? 'Live to parents — click to manage or unpublish this item'
                              : 'Not visible to parents — click to publish just this item'
                          }
                        >
                          {childPublished ? (
                            <>
                              <CheckIcon className="h-3 w-3" />
                              Live · manage
                            </>
                          ) : (
                            'Publish'
                          )}
                        </button>
                      </th>
                    )
                  })}
                  <th className="bg-cyan-50/70 px-4 py-2 text-center text-sm font-semibold text-slate-600">
                    Category score
                  </th>
                </tr>
              </thead>

              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={childAssessments.length + 2}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No students are enrolled in this class yet — add them from the class roster.
                    </td>
                  </tr>
                ) : (
                  students.map((student, rowIndex) => {
                    const parentScore = calculateParentScore(student.studentId)
                    return (
                      <tr
                        key={student.studentId}
                        className="border-t border-slate-100 hover:bg-slate-50/70"
                      >
                        <td className="sticky left-0 z-10 bg-white px-4 py-2 text-sm font-medium text-slate-800">
                          {student.name}
                        </td>

                        {childAssessments.map((child, colIndex) => {
                          const key = `${student.studentId}|${child.assessmentId}`
                          const isExcluded = exclusionMap[key] || false
                          const currentValue = editedScores[key] !== undefined
                            ? editedScores[key]
                            : existingScoreMap[key] ?? ''

                          const maxScore = Number(child.maxScore || 100)

                          return (
                            <ScoreCell
                              key={child.assessmentId}
                              inputId={nav.inputId(rowIndex, colIndex)}
                              label={`${student.name} score for ${child.name}`}
                              value={currentValue}
                              maxScore={maxScore}
                              isExcluded={isExcluded}
                              isToggling={togglingKey === key}
                              toggleDisabled={togglingKey !== null}
                              onChange={(e) => onScoreChange(student.studentId, child.assessmentId, e)}
                              onToggleExclusion={() => toggle(student.studentId, child.assessmentId, isExcluded)}
                              onKeyDown={(e) => nav.onKeyDown(e, rowIndex, colIndex)}
                            />
                          )
                        })}

                        <td className="bg-cyan-50/70 px-4 py-2 text-center text-sm font-medium text-cyan-800">
                          {parentScore.earned.toFixed(1)}/{parentAssessment.weightPoints || parentAssessment.weightPercent || 0}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <ul className="space-y-1 text-xs text-slate-400">
          <li>Arrow keys move between score cells; Enter moves down.</li>
          <li>Each score is weighted by its points to make up the category score.</li>
          <li>Hover a cell to drop that assessment from one student’s grade.</li>
          <li>Save from the main gradebook when you are done — scores are not saved here.</li>
        </ul>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            // Live children ride along so the publish window can unpublish or
            // resend what parents already see, not just the category flag.
            onPublish([
              parentAssessment,
              ...childAssessments.filter((c) => publications[c.assessmentId]?.isPublished),
            ])
          }
          title={
            summary.state === 'none'
              ? 'Publish this category and every graded item inside it'
              : 'Resend, edit notes, or unpublish what is live'
          }
        >
          {summary.state === 'none' ? 'Publish category' : 'Manage category'}
        </Button>
        {selectedChildren.length > 0 && (
          <Button
            variant="primary"
            onClick={() => {
              onPublish(selectedChildren)
              setSelectedChildIds(new Set())
            }}
            title="Publish only the selected individual assessments"
          >
            Publish {selectedChildren.length} selected
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}

export default ChildAssessmentsModal
