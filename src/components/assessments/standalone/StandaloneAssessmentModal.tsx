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
import { useExclusionToggle } from '@/components/assessments/scores/useExclusionToggle'
import { useScoreGridNav } from '@/components/assessments/scores/useScoreGridNav'

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
  onRefreshExclusions: () => Promise<void>
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
  onRefreshExclusions,
  publications,
  onPublish,
  onAssessmentMutated,
}) => {
  // The page keys this modal by assessment id, so switching columns remounts
  // it and the editor starts closed.
  const [editing, setEditing] = useState(false)

  const { togglingKey, toggle } = useExclusionToggle({ classId, onRefreshExclusions })
  const nav = useScoreGridNav('standalone-grade', students.length, 1)
  const lookups = useMemo(() => buildScoreLookups(scoresMatrix), [scoresMatrix])

  const maxScore = Number(assessment.maxScore || 100)
  const points = assessment.weightPoints || assessment.weightPercent || 0
  const summary = summarizePublication(assessment, allAssessments, publications)

  // Resolve each student's current value (draft first, then saved) and roll
  // up the class figures. Blanks are skipped, not counted as zero, matching
  // how the parent portal and report cards treat ungraded work.
  const rows = students.map((student) => {
    const key = `${student.studentId}|${assessment.assessmentId}`
    const value = editedScores[key] !== undefined ? editedScores[key] : (lookups.existing[key] ?? '')
    const isExcluded = lookups.excluded[key] || false
    const numeric = typeof value === 'number' ? value : value === '' ? null : parseFloat(String(value))
    return { student, key, value, isExcluded, numeric: Number.isFinite(numeric as number) ? numeric : null }
  })
  const graded = rows.filter((r) => !r.isExcluded && r.numeric != null)
  const excludedCount = rows.filter((r) => r.isExcluded).length
  const pctFor = (n: number | null) =>
    n == null || maxScore <= 0 ? null : Math.round((n / maxScore) * 1000) / 10
  const average = graded.length ? graded.reduce((sum, r) => sum + (r.numeric as number), 0) / graded.length : null
  const averagePct = pctFor(average)

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
                  value: average == null ? '—' : `${average.toFixed(1)} / ${maxScore} · ${averagePct}%`,
                },
                { label: 'Graded', value: `${graded.length} of ${students.length - excludedCount}` },
                { label: 'Excluded', value: String(excludedCount) },
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
                      const pct = row.isExcluded ? null : pctFor(row.numeric)
                      return (
                        <tr key={row.student.studentId} className="border-t border-slate-100 hover:bg-slate-50/70">
                          <td className="px-4 py-2 text-sm font-medium text-slate-800">{row.student.name}</td>
                          <ScoreCell
                            inputId={nav.inputId(rowIndex, 0)}
                            label={`${row.student.name} score`}
                            value={row.value}
                            maxScore={maxScore}
                            isExcluded={row.isExcluded}
                            isToggling={togglingKey === row.key}
                            toggleDisabled={togglingKey !== null}
                            onChange={(e) => onScoreChange(row.student.studentId, assessment.assessmentId, e)}
                            onToggleExclusion={() => toggle(row.student.studentId, assessment.assessmentId, row.isExcluded)}
                            onKeyDown={(e) => nav.onKeyDown(e, rowIndex, 0)}
                          />
                          <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-500">
                            {pct == null ? '—' : `${pct}%`}
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
              <li>Hover a score to drop this assessment from one student’s grade.</li>
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
