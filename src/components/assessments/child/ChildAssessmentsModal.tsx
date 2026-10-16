'use client'

import React, { useMemo, useState } from 'react'
import Modal from '@/components/shared/modal'
import { AssessmentPayload } from '@/services/types/assessment'
import { StudentPayload } from '@/services/types/student'
import type { AssessmentPublicationState } from '@/services/types/assessmentPublication'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { CheckIcon, ExclamationTriangleIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import PublishStateBadge from '@/components/assessments/publish/PublishStateBadge'
import { summarizePublication } from '@/lib/publicationSummary'
import ScoreCell from '@/components/assessments/scores/ScoreCell'
import CategoryCell from '@/components/assessments/scores/CategoryCell'
import { buildScoreLookups, type ScoreRow } from '@/components/assessments/scores/types'
import { useCellStatus } from '@/components/assessments/scores/useCellStatus'
import { useScoreGridNav } from '@/components/assessments/scores/useScoreGridNav'
import { buildScoreLookup, computeAssessmentForStudent, type CellState } from '@/lib/gradeEngine'
import { groupRowsByStudent, liveRowsForStudent, toEngineAssessments } from '@/components/assessments/scores/liveGrade'
import SavedPill from '@/components/gradebook/SavedPill'
import type { ScoreAutosave } from '@/hooks/useScoreAutosave'


interface ChildAssessmentsModalProps {
  isOpen: boolean
  onClose: () => void
  parentAssessment: AssessmentPayload
  childAssessments: AssessmentPayload[]
  students: StudentPayload[]
  scoresMatrix: ScoreRow[]
  /** The class's grades autosave: the scores typed here save by themselves. */
  autosave: ScoreAutosave
  classId: string
  /** Re-reads the score matrix after a status change. */
  onRefresh: () => Promise<void>
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
  autosave,
  classId,
  onRefresh,
  publications,
  onPublish,
}) => {
  // Individual items are publishable on their own, so they get the same
  // select-then-publish affordance as the columns in the main gradebook.
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set())
  const { togglingKey, setStatus } = useCellStatus({ classId, onRefresh, autosave })
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
  const { existing: existingScoreMap, status: statusMap } = useMemo(
    () => buildScoreLookups(scoresMatrix),
    [scoresMatrix]
  )
  const rowsByStudent = useMemo(() => groupRowsByStudent(scoresMatrix), [scoresMatrix])
  const { pendingMap } = autosave

  // The category roll-up comes from the engine: counted items weighted by
  // their points, blanks carry nothing, missing counts as 0, excused never counts.
  const engineAssessments = useMemo(
    () => toEngineAssessments([parentAssessment, ...childAssessments]),
    [parentAssessment, childAssessments]
  )
  // One lookup per student per render, shared by the category roll-up and the
  // per-item states, instead of rebuilding it twice for every row.
  const liveByStudent = useMemo(() => {
    const engineParent = engineAssessments[0]
    const engineChildren = engineAssessments.slice(1)
    return new Map(
      students.map((student) => {
        const lookup = buildScoreLookup(
          liveRowsForStudent(student.studentId, rowsByStudent[student.studentId], pendingMap())
        )
        return [
          student.studentId,
          {
            result: computeAssessmentForStudent(engineParent, engineAssessments, lookup),
            childStates: engineChildren.map((c): CellState => lookup[c.assessment_id]?.state ?? 'blank'),
          },
        ] as const
      })
    )
  }, [students, rowsByStudent, pendingMap, engineAssessments])

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
        actions={
          <SavedPill
            status={autosave.status}
            failedCount={autosave.failedKeys.size}
            onRetry={() => void autosave.retry()}
          />
        }
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
                  {/* Pinned at the far right, like the main grid's Term total. */}
                  <th className="sticky right-0 z-10 bg-cyan-50 px-4 py-2 text-center text-sm font-semibold text-slate-600 shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.18)]">
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
                    const categoryKey = `${student.studentId}|${parentAssessment.assessmentId}`
                    const live = liveByStudent.get(student.studentId) ?? {
                      result: computeAssessmentForStudent(engineAssessments[0], engineAssessments, {}),
                      childStates: [],
                    }
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
                          const saved = existingScoreMap[key] ?? null
                          const status = statusMap[key] ?? 'graded'
                          const maxScore = Number(child.maxScore || 100)

                          return (
                            <ScoreCell
                              key={child.assessmentId}
                              inputId={nav.inputId(rowIndex, colIndex)}
                              label={`${student.name} score for ${child.name}`}
                              value={autosave.displayValue(key, saved)}
                              maxScore={maxScore}
                              status={status}
                              isToggling={togglingKey === key}
                              toggleDisabled={togglingKey !== null}
                              failed={autosave.failedKeys.has(key)}
                              onValue={(v) => {
                                // A flagged cell shows a pill, not an input; never let a stray value clear its flag.
                                if (status === 'graded') autosave.queue(student.studentId, child.assessmentId, v, saved)
                              }}
                              onCommit={() => void autosave.flush()}
                              onSetStatus={(status) => setStatus(student.studentId, child.assessmentId, status)}
                              onKeyDown={(e) => nav.onKeyDown(e, rowIndex, colIndex)}
                            />
                          )
                        })}

                        <CategoryCell
                          label={`${student.name} score for ${parentAssessment.name}`}
                          result={live.result}
                          childStates={live.childStates}
                          isToggling={togglingKey === categoryKey}
                          toggleDisabled={togglingKey !== null}
                          onSetStatus={(status) => setStatus(student.studentId, parentAssessment.assessmentId, status)}
                          className="sticky right-0 z-[5] bg-cyan-50 px-4 shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.18)]"
                        />
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
          <li>Each score is weighted by its points to make up the category score. Blank cells are not yet graded and carry no weight.</li>
          <li>Hover a cell for its status menu: Mark missing (counts as 0), Excuse (never counts) or Clear. On a focused cell, M marks missing and X excuses.</li>
          <li>Scores save by themselves as you type; there is no Save button.</li>
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
