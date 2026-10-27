'use client'

// One standalone (non-category) assessment: every student's score in a single
// column, the class average, publish state, and an inline editor for the
// assessment's own details. Scores autosave as the teacher types (D17),
// through the class's grades autosave, exactly like the grid. A column filled
// by an assignment or quiz shows the classwork layer like the grid (drafts,
// "In", past due), links to its grading view and offers "Publish N" while it
// holds drafts; drafts never count in the average.

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/shared/modal'
import {
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '@/components/shared/modalKit'
import { ClipboardDocumentListIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import type { AssessmentPayload } from '@/services/types/assessment'
import type { StudentPayload } from '@/services/types/student'
import type { AssessmentPublicationState } from '@/services/types/assessmentPublication'
import AssessmentInlineForm from '@/components/assessments/section/AssessmentInlineForm'
import type { AssessmentMutation } from '@/components/assessments/section/useAssessmentForm'
import PublishStateBadge from '@/components/assessments/publish/PublishStateBadge'
import { summarizePublication } from '@/lib/publicationSummary'
import ScoreCell from '@/components/assessments/scores/ScoreCell'
import { buildScoreLookups, type ScoreRow } from '@/components/assessments/scores/types'
import { useCellStatus } from '@/components/assessments/scores/useCellStatus'
import { useScoreGridNav } from '@/components/assessments/scores/useScoreGridNav'
import { cellState, computeAssessmentForStudent, type CellState } from '@/lib/gradeEngine'
import { toEngineAssessment } from '@/components/assessments/scores/liveGrade'
import SavedPill from '@/components/gradebook/SavedPill'
import GridLegend from '@/components/gradebook/GridLegend'
import type { ScoreAutosave } from '@/hooks/useScoreAutosave'
import { classItemHref } from '@/lib/classroomRoutes'
import { draftCount, EMPTY_OVERLAY, overlayCell, type OverlayIndex } from '@/lib/gridOverlay'
import { inPool, type LeftOut } from '@/lib/classStats'

interface StandaloneAssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  /** Never a category — those open ChildAssessmentsModal. */
  assessment: AssessmentPayload
  /** Full class list, which the edit form needs for validation. */
  allAssessments: AssessmentPayload[]
  students: StudentPayload[]
  scoresMatrix: ScoreRow[]
  /** The class's grades autosave: the scores typed here save by themselves. */
  autosave: ScoreAutosave
  classId: string
  /** Re-reads the score matrix after a status change. */
  onRefresh: () => Promise<void>
  publications: Record<string, AssessmentPublicationState>
  /** Opens the publish / manage flow for this assessment. */
  onPublish: (assessments: AssessmentPayload[]) => void
  /** Edits to name, points, max score or date, to merge into the page's list. */
  onAssessmentMutated: (result: AssessmentMutation) => void
  /** The classwork layer (turn-in columns and their draft / In / past-due cells). */
  overlay?: OverlayIndex
  /** A turn-in column not published yet: what is typed into it is a draft. */
  keepsDrafts?: (assessmentId: string) => boolean
  /** "Publish N" on a turn-in column holding drafts. */
  onPublishDrafts?: (assessment: AssessmentPayload) => void
  /** Students left out of the class's statistics (lib/classStats): not in this column's class average. */
  leftOut?: Map<string, LeftOut>
}

const noDrafts = () => false
const NOBODY_LEFT_OUT = new Map<string, LeftOut>()

// Dates arrive as ISO strings; split off the day so a UTC midnight doesn't
// roll back to the previous evening in Toronto.
const formatDate = (iso: string | null | undefined) => {
  if (!iso) return null
  const [y, m, d] = iso.split('T')[0].split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

const StandaloneAssessmentModal: React.FC<StandaloneAssessmentModalProps> = ({
  isOpen,
  onClose,
  assessment,
  allAssessments,
  students,
  scoresMatrix,
  autosave,
  classId,
  onRefresh,
  publications,
  onPublish,
  onAssessmentMutated,
  overlay = EMPTY_OVERLAY,
  keepsDrafts = noDrafts,
  onPublishDrafts,
  leftOut = NOBODY_LEFT_OUT,
}) => {
  // The page keys this modal by assessment id, so switching columns remounts
  // it and the editor starts closed.
  const [editing, setEditing] = useState(false)

  const { togglingKey, setStatus } = useCellStatus({ classId, onRefresh, autosave })
  const nav = useScoreGridNav('standalone-grade', students.length, 1)
  const lookups = useMemo(() => buildScoreLookups(scoresMatrix), [scoresMatrix])

  const maxScore = Number(assessment.maxScore || 100)
  const points = assessment.weightPoints || assessment.weightPercent || 0
  const summary = summarizePublication(assessment, allAssessments, publications)
  const column = overlay.columns[assessment.assessmentId]
  const drafts = draftCount(overlay, assessment.assessmentId)
  const holdsDrafts = keepsDrafts(assessment.assessmentId)

  // Resolve each student's cell (local value first, then saved) and run it through
  // the engine. Blank cells are not yet graded and carry no weight anywhere
  // in SchoolMule; missing counts as 0; excused never counts.
  const engineAssessment = toEngineAssessment(assessment)
  // Drafts are not grades: the average reads the gradebook's own value for them.
  const rows = students.map((student) => {
    const key = `${student.studentId}|${assessment.assessmentId}`
    const matrix = { saved: lookups.existing[key] ?? null, status: lookups.status[key] ?? 'graded' }
    const cell = overlayCell(overlay, student.studentId, assessment.assessmentId, matrix, !holdsDrafts)
    const saved = cell.saved
    const value = autosave.displayValue(key, saved)
    const status = cell.status
    const draft = cell.draft || (holdsDrafts && value != null)
    const counted = draft || holdsDrafts ? { score: matrix.saved, status: matrix.status } : { score: value, status }
    const row = { assessment_id: assessment.assessmentId, ...counted }
    const result = computeAssessmentForStudent(engineAssessment, [engineAssessment], {
      [assessment.assessmentId]: { score: row.score, state: cellState(row) },
    })
    const mark = column
      ? { draft, turnedIn: cell.turnedIn, late: cell.isLate, derivedMissing: cell.derivedMissing }
      : undefined
    return { student, key, saved, value, status, result, mark }
  })
  const countBy = (state: CellState) => rows.filter((r) => r.result.state === state).length
  const counted = rows.filter((r) => r.result.isCounted)
  const meanOf = (list: typeof rows) =>
    list.length ? list.reduce((sum, r) => sum + (r.result.pct as number), 0) / list.length : null
  // The class average leaves out students left out of the class's statistics
  // (or of this column); staff see the figure with everyone beside it.
  const pooled = counted.filter((r) => inPool(leftOut.get(r.student.studentId), 'counted', assessment.assessmentId))
  const average = meanOf(pooled)
  const everyoneAverage = pooled.length < counted.length ? meanOf(counted) : null
  const asScore = (pct: number) => `${((pct / 100) * maxScore).toFixed(1)} / ${maxScore} · ${pct.toFixed(1)}%`

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-2xl">
      <ModalHeader
        title={assessment.name}
        subtitle={`${points} pts toward the final grade · out of ${maxScore}`}
        icon={ClipboardDocumentListIcon}
        actions={
          <SavedPill
            status={autosave.status}
            failedCount={autosave.failedKeys.size}
            onRetry={() => void autosave.retry()}
            onDiscard={() => autosave.discard()}
          />
        }
      />

      <ModalBody>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-2">
            <PublishStateBadge summary={summary} variant="chip" />
            {column && (
              <Link
                href={classItemHref(classId, column.itemId, undefined, { from: 'grades' })}
                onClick={() => void autosave.flush()}
                className="text-sm font-medium text-cyan-700 hover:text-cyan-800"
              >
                Grade with the student&apos;s work
              </Link>
            )}
          </span>
          {!editing && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <PencilSquareIcon className="h-4 w-4" />
              Edit details
            </Button>
          )}
        </div>

        {editing ? (
          <AssessmentInlineForm
            mode="edit"
            classId={classId}
            assessment={assessment}
            allAssessments={allAssessments}
            onSuccess={(result) => {
              onAssessmentMutated(result)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <RecordFacts
              facts={[
                {
                  label: 'Class average',
                  value: (
                    <>
                      {average == null ? '—' : asScore(average)}
                      {everyoneAverage != null && (
                        <span className="block text-xs font-normal text-slate-500">
                          {counted.length - pooled.length} left out · {everyoneAverage.toFixed(1)}% with everyone
                        </span>
                      )}
                    </>
                  ),
                },
                { label: 'Assessed', value: `${counted.length} of ${students.length}` },
                { label: 'Missing', value: String(countBy('missing')) },
                { label: 'Excused', value: String(countBy('excused')) },
                { label: 'Date', value: formatDate(assessment.date) ?? 'Not set' },
              ]}
            />

            {students.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                No students are enrolled in this class yet — add them from the class roster.
              </div>
            ) : (
              <div className="isolate overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full table-auto whitespace-nowrap">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600">Student</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-slate-600">Score</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">Percent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => {
                      const pct = row.result.isCounted ? row.result.pct : null
                      return (
                        <tr key={row.student.studentId} className="border-t border-slate-100 hover:bg-slate-50/70">
                          <td className="px-4 py-2 text-sm font-medium text-slate-800">{row.student.name}</td>
                          <ScoreCell
                            inputId={nav.inputId(rowIndex, 0)}
                            label={`${row.student.name} score`}
                            value={row.value}
                            maxScore={maxScore}
                            status={row.status}
                            isToggling={togglingKey === row.key}
                            toggleDisabled={togglingKey !== null}
                            failed={autosave.failedKeys.has(row.key)}
                            onValue={(v) => {
                              // A flagged cell shows a pill, not an input, and a cell mid-flag
                              // takes nothing: a stray value must not clear a flag.
                              if (row.status !== 'graded' || togglingKey === row.key) return
                              autosave.queue(row.student.studentId, assessment.assessmentId, v, row.saved)
                            }}
                            onCommit={() => void autosave.flush()}
                            onSetStatus={(status) => setStatus(row.student.studentId, assessment.assessmentId, status)}
                            onKeyDown={(e) => nav.onKeyDown(e, rowIndex, 0)}
                            mark={row.mark}
                          />
                          <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-500">
                            {pct == null ? '—' : `${(Math.round(pct * 10) / 10).toFixed(1)}%`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {column && <GridLegend variant="category" classwork />}
            <ul className="space-y-1 text-xs text-slate-400">
              <li>Arrow keys move between students; Enter moves down.</li>
              <li>Blank cells are not yet graded and carry no weight anywhere in SchoolMule. A typed 0 is a real 0.</li>
              <li>Hover a score (on a phone or tablet, tap its …) for its status menu: Mark missing (counts as 0), Excuse (never counts) or Clear. Click an M or Excused to change or clear it. On a focused cell, M marks missing and X excuses.</li>
              <li>Scores save by themselves as you type; there is no Save button.</li>
              <li>To delete this assessment, use Assessments &amp; categories.</li>
            </ul>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {column && drafts > 0 && onPublishDrafts && (
          <Button onClick={() => onPublishDrafts(assessment)} disabled={editing} title="Publish the drafts in this column">
            Publish {drafts}
          </Button>
        )}
        <Button
          variant={summary.state === 'all' || (column && drafts > 0) ? 'secondary' : 'primary'}
          onClick={() => onPublish([assessment])}
          disabled={editing}
          title={
            summary.state === 'all'
              ? 'Resend, edit the note, or unpublish'
              : 'Publishing shows these grades to students and parents.'
          }
        >
          {summary.state === 'all' ? 'Manage publishing' : 'Publish'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default StandaloneAssessmentModal
