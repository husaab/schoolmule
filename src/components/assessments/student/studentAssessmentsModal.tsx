'use client'

import { useState } from 'react'
import Modal from '../../shared/modal'
import { useNotificationStore } from '../../../store/useNotificationStore'
import { upsertScoresByClass, type ScoreUpsertItem } from '../../../services/classService'
import type { ThreadStub } from '@/services/types/messaging'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import {
  buildScoreLookup,
  computeAssessmentForStudent,
  type EngineAssessment,
  type EngineScoreRow,
  type ScoreStatus,
} from '@/lib/gradeEngine'
import { useCellStatus } from '@/components/assessments/scores/useCellStatus'
import StatusControl from '@/components/assessments/scores/StatusControl'
import { pillClass } from '@/components/assessments/scores/ScoreCell'
import { rowNote, type RowNoteTone } from './rowNotes'

interface Assessment {
  assessmentId: string
  name: string
  weightPercent?: number | null
  weightPoints?: number | null
  maxScore?: number | null
  isParent: boolean
  parentAssessmentId?: string | null
  date?: string | null
}

interface StudentScore {
  studentId: string
  assessmentId: string
  score: number | null
  /** graded (blank when score is null) | missing (counts as 0) | excused (never counts) */
  status?: ScoreStatus
}

interface StudentAssessmentsModalProps {
  isOpen: boolean
  onClose: () => void
  student: {
    studentId: string
    name: string
  } | null
  classId: string
  assessments: Assessment[]
  existingScores: StudentScore[]
  currentEditedScores: { [key: string]: number | '' }
  onRefreshScores: () => void
  /** Parent conversations keyed "studentId|assessmentId" (gradebook page loads them). */
  threadStubs?: Record<string, ThreadStub>
  onOpenConversation?: (conversationId: string) => void
  /** Start a thread with this student's guardians about an assessment (undefined = let the teacher pick). */
  onMessageGuardians?: (assessmentId?: string) => void
  /**
   * Classwork drafts (spec D3), keyed "studentId|assessmentId": a turn-in
   * column's grade waiting on the student's submission. Shown in the field
   * (grey, italic, "Draft") so it is neither hidden nor cleared by mistake;
   * never counted, as in the grid.
   */
  drafts?: Record<string, { score: number | null; status: ScoreStatus }>
  /** A turn-in column not published yet: what is typed into it is a draft and doesn't count yet. */
  keepsDrafts?: (assessmentId: string) => boolean
}

const noDrafts = () => false

const NOTE_TONE: Record<RowNoteTone, string> = { rose: 'text-rose-600', gray: 'text-gray-500', slate: 'text-slate-500' }

export default function StudentAssessmentsModal({
  isOpen,
  onClose,
  student,
  classId,
  assessments,
  existingScores,
  currentEditedScores,
  onRefreshScores,
  threadStubs = {},
  onOpenConversation,
  onMessageGuardians,
  drafts = {},
  keepsDrafts = noDrafts,
}: StudentAssessmentsModalProps) {
  const [editedScores, setEditedScores] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const showNotification = useNotificationStore((state) => state.showNotification)

  // Missing / excused flags save straight away and the gradebook re-reads.
  const { togglingKey, setStatus: setCellStatus } = useCellStatus({ classId, onRefresh: onRefreshScores })
  // A status flag replaces whatever the teacher had typed into that cell.
  const setStatus = async (studentId: string, assessmentId: string, next: ScoreStatus) => {
    setEditedScores((prev) => {
      const copy = { ...prev }
      delete copy[`${studentId}|${assessmentId}`]
      return copy
    })
    await setCellStatus(studentId, assessmentId, next)
  }

  // This student's saved rows, by assessment: the gradebook's (what counts),
  // and the draft a turn-in column holds instead, if any (what the field shows).
  const savedByAssessment: Record<string, StudentScore> = {}
  existingScores.forEach((score) => {
    if (score.studentId === student?.studentId) savedByAssessment[score.assessmentId] = score
  })
  const draftFor = (assessmentId: string) => (student ? drafts[`${student.studentId}|${assessmentId}`] : undefined)
  const shownFor = (assessmentId: string) => draftFor(assessmentId) ?? savedByAssessment[assessmentId]
  const statusFor = (assessmentId: string): ScoreStatus => shownFor(assessmentId)?.status ?? 'graded'

  // Per-row parent conversation action: open the existing thread or start one.
  const messageAction = (assessmentId: string) => {
    if (!student || !onMessageGuardians) return null
    const stub = threadStubs[`${student.studentId}|${assessmentId}`]
    const base = 'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium cursor-pointer whitespace-nowrap'
    return stub ? (
      <button
        type="button"
        onClick={() => onOpenConversation?.(stub.conversationId)}
        className={`${base} ${stub.unreadCount > 0 ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}
        title="Open the parent conversation about this assessment"
      >
        <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
        {stub.unreadCount > 0 ? `${stub.unreadCount} unread` : 'Conversation'}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => onMessageGuardians(assessmentId)}
        className={`${base} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
        title="Message this student's guardians about this assessment"
      >
        <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
        Message guardians
      </button>
    )
  }

  // Seed the window's fields when it opens for a student, and only then: a
  // grade saving in the background (the gradebook autosaves) must not reset
  // what the teacher has already typed here.
  const openFor = isOpen && student ? student.studentId : null
  const [seededFor, setSeededFor] = useState<string | null>(null)
  if (openFor !== seededFor) {
    setSeededFor(openFor)
    if (openFor) {
      const scoreMap: Record<string, string> = {}

      // First, load from saved scores in database
      existingScores.forEach(score => {
        if (score.studentId === openFor) {
          const key = `${score.studentId}|${score.assessmentId}`
          scoreMap[key] = score.score?.toString() || ''
        }
      })

      // A classwork draft shows instead of the (empty) gradebook cell
      Object.entries(drafts).forEach(([key, draft]) => {
        if (key.split('|')[0] === openFor) scoreMap[key] = draft.score?.toString() || ''
      })

      // Then, override with any values from the gradebook not saved yet
      Object.entries(currentEditedScores).forEach(([key, value]) => {
        const [stuId] = key.split('|')
        if (stuId === openFor) {
          scoreMap[key] = typeof value === 'number' ? value.toString() : value || ''
        }
      })

      setEditedScores(scoreMap)
      setHasChanges(false)
    }
  }

  const handleScoreChange = (assessmentId: string, value: string) => {
    if (!student) return
    
    const key = `${student.studentId}|${assessmentId}`
    
    // Validate and clamp the score like in the gradebook
    let processedValue = value
    if (value !== '') {
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        // Find the assessment to get its max score
        const assessment = assessments.find(a => a.assessmentId === assessmentId)
        if (assessment) {
          const maxScore = Number(assessment.maxScore || 100)
          // Clamp between 0 and max score
          const clampedValue = Math.min(Math.max(parsed, 0), maxScore)
          processedValue = clampedValue.toString()
        }
      }
    }
    
    setEditedScores(prev => ({
      ...prev,
      [key]: processedValue
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!student || saving) return

    setSaving(true)
    const toUpsert: ScoreUpsertItem[] = []

    Object.entries(editedScores).forEach(([key, value]) => {
      const [studentId, assessmentId] = key.split('|')
      if (studentId !== student.studentId) return
      const saved = shownFor(assessmentId)?.score ?? null
      const numValue = value.trim() === '' ? null : parseFloat(value)
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        if (numValue !== saved) toUpsert.push({ studentId, assessmentId, score: numValue })
      } else if (numValue === null && saved !== null) {
        // Clearing a cell puts it back to "not yet graded".
        toUpsert.push({ studentId, assessmentId, score: null })
      }
    })

    if (toUpsert.length === 0) {
      showNotification('No changes to save', 'success')
      setHasChanges(false)
      setSaving(false)
      return
    }

    try {
      await upsertScoresByClass(classId, toUpsert)
      showNotification(`Successfully saved ${toUpsert.length} scores for ${student.name}`, 'success')
      setHasChanges(false)
      // Refresh the gradebook data
      await onRefreshScores()
      onClose()
    } catch (error) {
      console.error('Error saving scores:', error)
      showNotification('Error saving scores. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const getScoreDisplay = (assessmentId: string) => {
    if (!student) return ''
    const key = `${student.studentId}|${assessmentId}`
    return editedScores[key] || ''
  }

  // Per-assessment results come from the grade engine, with the modal's
  // unsaved edits merged over the saved rows. Drafts are not grades: a draft,
  // or a value typed into a column that keeps drafts, never counts (the
  // grid's rule), so the totals here match what is published.
  const engineAssessments: EngineAssessment[] = assessments.map((a) => ({
    assessment_id: a.assessmentId,
    weight_points: a.weightPoints || a.weightPercent || 0,
    max_score: a.maxScore,
    is_parent: a.isParent,
    parent_assessment_id: a.parentAssessmentId ?? null,
  }))
  const liveRows: EngineScoreRow[] = student
    ? assessments
        .filter((a) => !a.isParent)
        .map((a) => {
          const saved = savedByAssessment[a.assessmentId]
          const countsAsSaved = Boolean(draftFor(a.assessmentId)) || keepsDrafts(a.assessmentId)
          const raw = countsAsSaved ? undefined : editedScores[`${student.studentId}|${a.assessmentId}`]
          const parsed = raw === undefined ? saved?.score ?? null : raw.trim() === '' ? null : parseFloat(raw)
          return {
            assessment_id: a.assessmentId,
            score: typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null,
            status: saved?.status ?? 'graded',
          }
        })
    : []
  const lookup = buildScoreLookup(liveRows)
  const resultFor = (assessmentId: string) => {
    const a = engineAssessments.find((e) => e.assessment_id === assessmentId)
    return a ? computeAssessmentForStudent(a, engineAssessments, lookup) : null
  }

  // Group assessments by parent/child relationship
  const groupedAssessments = assessments.reduce((groups, assessment) => {
    if (assessment.isParent) {
      groups.push({
        parent: assessment,
        children: assessments.filter(a => a.parentAssessmentId === assessment.assessmentId)
      })
    } else if (!assessment.parentAssessmentId) {
      // Standalone assessment
      groups.push({
        parent: null,
        children: [assessment]
      })
    }
    return groups
  }, [] as Array<{ parent: Assessment | null; children: Assessment[] }>)

  if (!student) return null

  const renderRow = (assessment: Assessment, gap: string) => {
    const key = `${student.studentId}|${assessment.assessmentId}`
    const status = statusFor(assessment.assessmentId)
    const result = resultFor(assessment.assessmentId)
    const scoreValue = getScoreDisplay(assessment.assessmentId)
    const muted = status !== 'graded'
    const isDraft = Boolean(draftFor(assessment.assessmentId)) || (keepsDrafts(assessment.assessmentId) && (scoreValue !== '' || muted))
    const label = `${student.name} score for ${assessment.name}`
    const note = rowNote(status, isDraft)

    return (
      <div
        key={assessment.assessmentId}
        className={`group relative flex items-center justify-between p-3 bg-white rounded border ${muted ? 'text-gray-400' : 'text-black'}`}
      >
        <StatusControl
          label={label}
          status={status}
          busy={togglingKey === key}
          disabled={togglingKey !== null}
          onSetStatus={(next) => setStatus(student.studentId, assessment.assessmentId, next)}
        />
        <div className="flex-1">
          <div className="font-medium">{assessment.name}</div>
          <div className="text-sm text-gray-600">
            Worth: {assessment.weightPoints || assessment.weightPercent} pts | Out of: {assessment.maxScore}
          </div>
          {assessment.date && (
            <div className="text-xs text-gray-500">Date: {new Date(assessment.date).toLocaleDateString()}</div>
          )}
          {note && <div className={`text-xs ${NOTE_TONE[note.tone]} mt-1`}>{note.text}</div>}
        </div>

        <div className={`flex items-center ${gap}`}>
          <div className="text-right">
            {status !== 'graded' ? (
              <div className={`w-20 rounded-lg px-2 py-1 text-center text-xs font-semibold ring-1 ring-inset ${pillClass[status]} ${isDraft ? 'italic' : ''}`}>
                {status === 'missing' ? 'M' : 'Excused'}
              </div>
            ) : (
              <input
                type="number"
                aria-label={label}
                value={scoreValue}
                onChange={(e) => handleScoreChange(assessment.assessmentId, e.target.value)}
                className={`w-20 px-2 py-1 border rounded text-center ${scoreValue === '' ? 'border-dashed placeholder:text-slate-400' : ''} ${
                  isDraft && scoreValue !== '' ? 'bg-slate-100 italic text-slate-500' : ''
                }`}
                placeholder="—"
                title={scoreValue === '' ? 'Not yet graded — carries no weight' : undefined}
                min="0"
                max={assessment.maxScore || 100}
                step="0.1"
              />
            )}
            <div className="text-xs text-gray-500">/ {assessment.maxScore || 100}</div>
          </div>

          {messageAction(assessment.assessmentId)}
          <div className="text-right min-w-16 text-sm font-medium tabular-nums">
            {result?.isCounted && result.pct != null ? `${result.pct.toFixed(1)}%` : <span className="text-gray-400">—</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      style="w-[1200px] max-w-[90vw]"
    >
      <div className="space-y-8 p-15">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="text-lg font-semibold text-black">{student.name}</h3>

          </div>
          <div className="flex space-x-2">
            {onMessageGuardians && (
              <button
                onClick={() => onMessageGuardians(undefined)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-cyan-700 border border-cyan-200 bg-cyan-50 rounded hover:bg-cyan-100 cursor-pointer"
                title="Start a conversation with this student's guardians"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Message guardians
              </button>
            )}
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`px-4 py-2 cursor-pointer rounded text-white ${
                hasChanges && !saving
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Assessments List */}
        <div className="max-h-96 overflow-y-auto space-y-4">
          {groupedAssessments.map((group, groupIndex) => (
            <div key={groupIndex} className="border rounded-lg p-4 bg-gray-50">
              {group.parent ? (
                // Multiple assessment with individual parts
                <>
                  <div className="mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-blue-900">{group.parent.name}</h4>
                        <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded">Multiple Assessment</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-800">
                          Worth: {group.parent.weightPoints || group.parent.weightPercent} points
                        </div>
                        {group.parent.date && (
                          <div className="text-xs text-blue-600">
                            Date: {new Date(group.parent.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual assessments */}
                  <div className="space-y-2 ml-4">
                    {group.children.map((assessment) => renderRow(assessment, 'space-x-5'))}
                  </div>
                </>
              ) : (
                // Standalone assessment
                group.children.map((assessment) => renderRow(assessment, 'space-x-1'))
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t pt-4">
          <div className="text-sm text-gray-600">
            <p>&bull; Enter scores for each assessment. Blank cells are not yet graded and carry no weight; a typed 0 is a real 0.</p>
            <p>&bull; Hover a row for its status menu: Mark missing (counts as 0), Excuse (never counts) or Clear.</p>
            <p>&bull; Click &quot;Save Changes&quot; to update the gradebook</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}