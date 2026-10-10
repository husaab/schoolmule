'use client'

// One standalone (non-category) assessment: every student's score in a single
// column, the class average, publish state, and an inline editor for the
// assessment's own details. Scores edit the page's draft and are saved from
// the main gradebook, exactly like the category modal.

import React, { ChangeEvent, useMemo, useState } from 'react'
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

interface StandaloneAssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  /** Never a category — those open ChildAssessmentsModal. */
  assessment: AssessmentPayload
  /** Full class list, which the edit form needs for validation. */
  allAssessments: AssessmentPayload[]
  students: StudentPayload[]
  scoresMatrix: ScoreRow[]
  editedScores: { [key: string]: number | '' }
  onScoreChange: (studentId: string, assessmentId: string, e: ChangeEvent<HTMLInputElement>) => void
  classId: string
  /** Re-reads the score matrix after a status change. */
  onRefresh: () => Promise<void>
  publications: Record<string, AssessmentPublicationState>
  /** Opens the publish / manage flow for this assessment. */
  onPublish: (assessments: AssessmentPayload[]) => void
  /** Edits to name, points, max score or date, to merge into the page's list. */
  onAssessmentMutated: (result: AssessmentMutation) => void
}

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
  editedScores,
  onScoreChange,
  classId,
  onRefresh,
  publications,
  onPublish,
  onAssessmentMutated,
}) => {
  // The page keys this modal by assessment id, so switching columns remounts
  // it and the editor starts closed.
  const [editing, setEditing] = useState(false)

  const { togglingKey, setStatus } = useCellStatus({ classId, onRefresh })
  const nav = useScoreGridNav('standalone-grade', students.length, 1)
  const lookups = useMemo(() => buildScoreLookups(scoresMatrix), [scoresMatrix])

  const maxScore = Number(assessment.maxScore || 100)
  const points = assessment.weightPoints || assessment.weightPercent || 0
  const summary = summarizePublication(assessment, allAssessments, publications)

  // Resolve each student's cell (draft first, then saved) and run it through
  // the engine. Blank cells are not yet graded and carry no weight anywhere
  // in SchoolMule; missing counts as 0; excused never counts.
  const engineAssessment = toEngineAssessment(assessment)
  const rows = students.map((student) => {
    const key = `${student.studentId}|${assessment.assessmentId}`
    const value = editedScores[key] !== undefined ? editedScores[key] : (lookups.existing[key] ?? '')
    const status = lookups.status[key] ?? 'graded'
    const row = { assessment_id: assessment.assessmentId, score: value === '' ? null : value, status }
    const result = computeAssessmentForStudent(engineAssessment, [engineAssessment], {
      [assessment.assessmentId]: { score: row.score, state: cellState(row) },
    })
    return { student, key, value, status, result }
  })
  const countBy = (state: CellState) => rows.filter((r) => r.result.state === state).length
  const counted = rows.filter((r) => r.result.isCounted)
  const average = counted.length
    ? counted.reduce((sum, r) => sum + (r.result.pct as number), 0) / counted.length
    : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-2xl">
      <ModalHeader
        title={assessment.name}
        subtitle={`${points} pts toward the final grade · out of ${maxScore}`}
        icon={ClipboardDocumentListIcon}
      />

      <ModalBody>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PublishStateBadge summary={summary} variant="chip" />
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
                  value: average == null ? '—' : `${((average / 100) * maxScore).toFixed(1)} / ${maxScore} · ${average.toFixed(1)}%`,
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
              <div className="overflow-x-auto rounded-xl border border-slate-200">
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
                            onChange={(e) => onScoreChange(row.student.studentId, assessment.assessmentId, e)}
                            onSetStatus={(status) => setStatus(row.student.studentId, assessment.assessmentId, status)}
                            onKeyDown={(e) => nav.onKeyDown(e, rowIndex, 0)}
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

            <ul className="space-y-1 text-xs text-slate-400">
              <li>Arrow keys move between students; Enter moves down.</li>
              <li>Blank cells are not yet graded and carry no weight anywhere in SchoolMule. A typed 0 is a real 0.</li>
              <li>Hover a score for its status menu: Mark missing (counts as 0), Excuse (never counts) or Clear. On a focused cell, M marks missing and X excuses.</li>
              <li>Save from the main gradebook when you are done — scores are not saved here.</li>
              <li>To delete this assessment, use the Assessments view.</li>
            </ul>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant={summary.state === 'all' ? 'secondary' : 'primary'}
          onClick={() => onPublish([assessment])}
          disabled={editing}
          title={
            summary.state === 'all'
              ? 'Resend, edit the note, or unpublish'
              : 'Send this assessment to parents'
          }
        >
          {summary.state === 'all' ? 'Manage publishing' : 'Publish to parents'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default StandaloneAssessmentModal
