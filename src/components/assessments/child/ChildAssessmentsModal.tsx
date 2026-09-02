'use client'

import React, { ChangeEvent, useState } from 'react'
import Modal from '../../shared/modal'
import { AssessmentPayload } from '@/services/types/assessment'
import { StudentPayload } from '@/services/types/student'
import { createExclusion, deleteExclusion } from '@/services/excludedAssessmentService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { AssessmentPublicationState } from '@/services/types/assessmentPublication'
import {
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  inputClass,
} from '../../shared/modalKit'
import {
  ArrowPathIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface ScoreRow {
  student_id: string
  student_name: string
  assessment_id: string
  assessment_name: string
  weight_percent: number
  weight_points: number
  max_score: number
  is_parent: boolean
  parent_assessment_id: string | null
  score: number | null
  is_excluded: boolean
}

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
  const showNotification = useNotificationStore((s) => s.showNotification)

  // Individual items are publishable on their own, so they get the same
  // select-then-publish affordance as the columns in the main gradebook.
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set())
  // Which student|assessment cell is mid exclusion toggle, so the cell can show
  // progress instead of looking inert while the round trip runs.
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const toggleChildSelected = (assessmentId: string) => {
    setSelectedChildIds((prev) => {
      const next = new Set(prev)
      if (next.has(assessmentId)) next.delete(assessmentId)
      else next.add(assessmentId)
      return next
    })
  }

  const selectedChildren = childAssessments.filter((c) => selectedChildIds.has(c.assessmentId))
  // Build lookups for existing scores and exclusions
  const existingScoreMap: Record<string, number | null> = {}
  const exclusionMap: Record<string, boolean> = {}
  scoresMatrix.forEach((row) => {
    const key = `${row.student_id}|${row.assessment_id}`
    existingScoreMap[key] = row.score
    exclusionMap[key] = row.is_excluded
  })

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
  const parentPublished = publications[parentAssessment.assessmentId]?.isPublished

  const handleToggleExclusion = async (
    key: string,
    studentId: string,
    assessmentId: string,
    isExcluded: boolean
  ) => {
    setTogglingKey(key)
    try {
      if (isExcluded) {
        // Include the assessment
        await deleteExclusion(studentId, classId, assessmentId)
        showNotification('Assessment included', 'success')
      } else {
        // Exclude the assessment
        await createExclusion({
          studentId: studentId,
          classId: classId,
          assessmentId: assessmentId
        })
        showNotification('Assessment excluded', 'success')
      }
      // Refresh exclusions and scores
      await onRefreshExclusions()
    } catch (error) {
      console.error('Error toggling exclusion:', error)
      showNotification('Failed to update exclusion', 'error')
    } finally {
      setTogglingKey(null)
    }
  }

  const handleArrowNav = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const maxRow = students.length - 1
    const maxCol = childAssessments.length - 1

    let nextRow = rowIndex
    let nextCol = colIndex

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        nextRow = Math.max(0, rowIndex - 1)
        break
      case 'ArrowDown':
        e.preventDefault()
        nextRow = Math.min(maxRow, rowIndex + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        nextCol = Math.max(0, colIndex - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        nextCol = Math.min(maxCol, colIndex + 1)
        break
      case 'Enter':
        e.preventDefault()
        nextRow = Math.min(maxRow, rowIndex + 1)
        break
      default:
        return // let other keys behave normally
    }

    // If nothing changed, don't do anything
    if (nextRow === rowIndex && nextCol === colIndex) return

    const nextInput = document.getElementById(
      `child-grade-${nextRow}-${nextCol}`
    ) as HTMLInputElement | null

    if (nextInput) {
      nextInput.focus()
      nextInput.select() // optional: highlight value
    }
  }

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
          {parentPublished ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-sm font-medium text-emerald-700">
              <CheckIcon className="h-4 w-4" />
              Live to parents
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-sm text-slate-500 ring-1 ring-slate-200">
              Not published to parents yet
            </span>
          )}
        </div>

        {pointsWarning && (
          <div className="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-amber-900">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p className="text-sm">
              Individual points total {totalChildPoints}, but the category is worth {parentPoints}.
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
                          const isToggling = togglingKey === key
                          const currentValue = editedScores[key] !== undefined
                            ? editedScores[key]
                            : existingScoreMap[key] ?? ''

                          const maxScore = Number(child.maxScore || 100)

                          return (
                            <td
                              key={child.assessmentId}
                              className="group relative px-2 py-1.5 text-center"
                            >
                              {/* Hover-triggered exclusion toggle button */}
                              <button
                                onClick={() =>
                                  handleToggleExclusion(key, student.studentId, child.assessmentId, isExcluded)
                                }
                                disabled={togglingKey !== null}
                                className={`absolute right-1 top-1 z-10 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed ${
                                  isToggling ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                } ${
                                  isExcluded
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                }`}
                                title={
                                  isExcluded
                                    ? 'Count this assessment for this student again'
                                    : 'Drop this assessment from this student’s grade'
                                }
                              >
                                {isToggling ? (
                                  <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                ) : isExcluded ? (
                                  <CheckIcon className="h-3 w-3" />
                                ) : (
                                  <XMarkIcon className="h-3 w-3" />
                                )}
                              </button>

                              {isExcluded ? (
                                <div className="flex items-center justify-center">
                                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">
                                    Excluded
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <div className="w-20">
                                    <input
                                      id={`child-grade-${rowIndex}-${colIndex}`}
                                      type="number"
                                      min="0"
                                      max={maxScore}
                                      step="1"
                                      className={`${inputClass} text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                                      value={currentValue}
                                      onChange={(e) => onScoreChange(student.studentId, child.assessmentId, e)}
                                      onKeyDown={(e) => handleArrowNav(e, rowIndex, colIndex)}
                                      onKeyPress={(e) => {
                                        // Only allow numbers, decimal point, and navigation keys
                                        if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                                          e.preventDefault()
                                        }
                                      }}
                                      placeholder="0"
                                    />
                                  </div>
                                  <span className="text-sm text-slate-400">/{maxScore}</span>
                                </div>
                              )}
                            </td>
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
          onClick={() => onPublish([parentAssessment])}
          title="Publish this category and every graded item inside it"
        >
          {parentPublished ? 'Manage category' : 'Publish category'}
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
