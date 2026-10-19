// src/components/classes/grading/GradingStudentPanel.tsx
// One student in the grading view (Teacher-Grading board). In the middle:
// their name, when the work came in (on time or late), previous / next, and
// the work itself (WorkViewer), with "Note from {first}" when a file
// submission carries a typed note. On the right: the grade box with Mark
// missing and Excuse, the feedback box with quick comments, the private
// messages about this work, and "Publish {first}'s grade".
//
// The grade and feedback save by themselves (GradingView's useDebouncedSave:
// 600 ms, and at once on blur and on a student switch). The page keys this
// panel by student, so it opens on that student's saved values (with any
// edit not saved yet over them).
//
// A quiz shows the student's answers in the middle (QuizAnswersReview), with
// points and a note per answer. The grade box still takes a typed score, which
// wins over the quiz's points ("Score set by teacher", with "Use auto-score").
// When points on an answer save, the grade box shows the score the server now
// holds.
//
// A student who turned in new work after the teacher's draft (Fable I1) gets
// a note above the grade box, "Graded earlier — check the new work", with
// "Keep this grade" (the draft saved again as it is). Until the score or
// feedback is saved again, that draft can't be published.
'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import {
  firstName,
  gradedEarlier,
  gradedEarlierLines,
  gradeHint,
  keepDraftPatch,
  publishOneHint,
  publishOneLabel,
  TURNED_IN_INK,
  turnedInLine,
} from '@/lib/gradingView'
import type { CellValue } from '@/lib/scoreAutosaveQueue'
import type { GradePatch, GradeStatus, GradingItem, GradingRow, SubmissionDetail } from '@/services/types/grading'
import type { Question } from '@/services/types/quiz'
import FeedbackBox from './FeedbackBox'
import GradeInput from './GradeInput'
import QuickCommentChips from './QuickCommentChips'
import QuizAnswersReview from './QuizAnswersReview'
import { appendQuickComment } from './quickComments'
import WorkThreadPanel from './WorkThreadPanel'
import WorkViewer from './WorkViewer'

interface GradingStudentPanelProps {
  itemId: string
  item: GradingItem
  row: GradingRow
  /** The grade and feedback the panel opens on. */
  initial: { score: number | null; status: GradeStatus | null; feedback: string }
  detail: SubmissionDetail | null
  detailLoading: boolean
  detailError: string | null
  onReloadDetail: () => void
  /** The item fills a gradebook column (otherwise it carries feedback only). */
  linked: boolean
  /** The column is published: grade edits go live as they save. */
  columnPublished: boolean
  canEdit: boolean
  /** Mark missing, Excuse or Publish is on its way. */
  busy: boolean
  /** This student's last grade or feedback change didn't save (kept for Retry). */
  failed: boolean
  /**
   * The teacher switched to this student (or the panel reopened after Mark
   * missing / Excuse): focus moves to the grade box (the feedback box when
   * there is none), so the keyboard flow carries on.
   */
  focusOnOpen: boolean
  /** Guardians read work threads (the school's setting). */
  includesParents: boolean
  prevName: string | null
  nextName: string | null
  onPrev: () => void
  onNext: () => void
  onEdit: (patch: GradePatch) => void
  onCommit: () => void
  onMarkMissing: () => void
  onClearMissing: () => void
  onExcuse: (excused: boolean) => void
  onPublish: () => void
  /** A quiz: its questions (the choices' words), the signed-in teacher, and what follows a saved point change. */
  quiz?: {
    questions: Map<string, Question> | null
    userId: string
    /** Points saved for these students: their rows are read again; this student's grade comes back (or null). */
    onSaved: (studentIds: string[]) => Promise<{ score: number | null; status: GradeStatus | null } | null>
    /** "Use auto-score" (POST …/quiz-score): this student's grade as the server now has it, or null when refused. */
    onUseAutoScore: () => Promise<{ score: number | null; status: GradeStatus | null } | null>
  } | null
}

const arrowClass =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

export default function GradingStudentPanel({
  itemId,
  item,
  row,
  initial,
  detail,
  detailLoading,
  detailError,
  onReloadDetail,
  linked,
  columnPublished,
  canEdit,
  busy,
  failed,
  focusOnOpen,
  includesParents,
  prevName,
  nextName,
  onPrev,
  onNext,
  onEdit,
  onCommit,
  onMarkMissing,
  onClearMissing,
  onExcuse,
  onPublish,
  quiz = null,
}: GradingStudentPanelProps) {
  const first = firstName(row.name)
  const [status, setStatus] = useState<GradeStatus | null>(initial.status)
  // The score in the box; a quiz's point change (or "Use auto-score") puts the server's score back in it.
  const [score, setScore] = useState<number | null>(initial.score)
  const [scoreKey, setScoreKey] = useState(0)
  const [restoring, setRestoring] = useState(false)
  const [feedback, setFeedback] = useState(initial.feedback)
  // Something typed in this panel: Publish is offered before the save comes back.
  const [touched, setTouched] = useState(false)
  const line = turnedInLine(row)
  const note = item.submissionMode === 'file' ? (detail?.textAnswer ?? '').trim() : ''
  const kind = item.kind === 'quiz' ? 'quiz' : 'assignment'
  const hint = gradeHint(row, { linked, columnPublished, first })

  // Opening a student moves focus into their grade (the previous panel, and
  // the arrow that was pressed, are gone).
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (!focusOnOpen) return
    const frame = window.requestAnimationFrame(() => {
      const target = [document.getElementById('grading-score'), document.getElementById('grading-feedback')].find(
        (el): el is HTMLInputElement | HTMLTextAreaElement =>
          (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && !el.disabled,
      )
      if (target) target.focus()
      else headingRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusOnOpen])

  const changeScore = (value: CellValue) => {
    setTouched(true)
    setScore(value)
    if (value !== null && status !== 'excused') setStatus('graded')
    onEdit({ draftScore: value })
  }

  /** The grade box shows a score that came from the server (a quiz's points). */
  const showScore = (next: { score: number | null; status: GradeStatus | null }) => {
    setScore(next.score)
    setStatus(next.status)
    setScoreKey((k) => k + 1)
  }
  const changeFeedback = (value: string) => {
    setTouched(true)
    setFeedback(value)
    onEdit({ feedback: value })
  }
  const clearMissing = () => {
    setStatus(null)
    onClearMissing()
  }

  // Graded before the newest work came in: shown until the teacher saves the score or feedback again.
  const earlier = gradedEarlier(row) && !touched
  const earlierLines = gradedEarlierLines(first, linked, columnPublished, Boolean(row.turnedInAt))
  const keepPatch = keepDraftPatch({ score, status, feedback }, linked)
  const keep = () => {
    if (!keepPatch) return
    setTouched(true)
    onEdit(keepPatch)
    onCommit()
  }

  const canPublish = canEdit && !busy && (touched || (row.needsPublish && !gradedEarlier(row)))
  const publishTitle = canPublish
    ? undefined
    : earlier
      ? `${first}'s work changed after you graded it: save the ${linked ? 'grade' : 'feedback'} again to publish it.`
      : `Nothing new to publish for ${first}.`

  return (
    <div className="flex min-w-0 flex-[999_1_760px] flex-wrap items-stretch">
      <section className="flex min-w-0 flex-[999_1_420px] flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-3.5">
            <Avatar name={row.name} avatar={row.avatar} size={52} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 ref={headingRef} tabIndex={-1} className="font-display truncate text-2xl font-semibold text-slate-900 outline-none">
                {row.name}
              </h2>
              <span className={`text-[13px] ${TURNED_IN_INK[line.tone]}`}>{line.text}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={!prevName}
              aria-label={prevName ? `Previous student: ${prevName}` : 'Previous student'}
              aria-keyshortcuts="Alt+ArrowUp"
              title="Previous student (Alt+↑, except in the feedback box)"
              className={arrowClass}
            >
              <ChevronLeftIcon className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!nextName}
              aria-label={nextName ? `Next student: ${nextName}` : 'Next student'}
              aria-keyshortcuts="Alt+ArrowDown"
              title="Next student (Alt+↓, except in the feedback box)"
              className={arrowClass}
            >
              <ChevronRightIcon className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          </div>
        </div>

        {kind === 'quiz' && quiz ? (
          <QuizAnswersReview
            itemId={itemId}
            itemTitle={item.title}
            studentId={row.studentId}
            first={first}
            userId={quiz.userId}
            detail={detail}
            loading={detailLoading}
            error={detailError}
            onReload={onReloadDetail}
            questions={quiz.questions}
            canEdit={canEdit}
            linked={linked}
            columnPublished={columnPublished}
            current={{ score, status, setByTeacher: row.scoreSetByTeacher }}
            restoring={restoring}
            onSaved={(ids) => {
              void quiz.onSaved(ids).then((mine) => {
                if (mine) showScore(mine)
              })
            }}
            onUseAutoScore={() => {
              setRestoring(true)
              void quiz
                .onUseAutoScore()
                .then((mine) => {
                  if (mine) showScore(mine)
                })
                .finally(() => setRestoring(false))
            }}
          />
        ) : (
          <WorkViewer
            detail={detail}
            loading={detailLoading}
            error={detailError}
            onReload={onReloadDetail}
            mode={item.submissionMode}
            first={first}
          />
        )}

        {note && (
          <div className="rounded-[14px] border border-slate-200/70 bg-white px-4 py-3.5 text-sm leading-normal text-slate-700">
            <span className="text-xs text-slate-500">Note from {first}</span>
            <p className="whitespace-pre-wrap">{note}</p>
          </div>
        )}
      </section>

      <aside className="flex flex-[1_1_340px] flex-col gap-[18px] border-slate-200 bg-white p-4 sm:p-6 lg:border-l">
        {failed && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-800">
            {first}&apos;s last change didn&apos;t save. It is kept here: use Retry at the top.
          </p>
        )}
        {!canEdit && (
          <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-600">
            This class is from a past school year, so its grades are read-only.
          </p>
        )}
        {earlier && (
          <div role="status" className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900">
            <p className="font-medium">{earlierLines.title}</p>
            <p className="leading-normal">{earlierLines.body}</p>
            {canEdit && keepPatch && (
              <button
                type="button"
                onClick={keep}
                disabled={busy}
                className="cursor-pointer self-start rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {earlierLines.keep}
              </button>
            )}
          </div>
        )}

        {linked && (
          <GradeInput
            key={scoreKey}
            studentName={row.name}
            initialScore={score}
            status={status}
            maxScore={item.maxScore}
            hint={hint}
            disabled={!canEdit}
            busy={busy}
            onScore={changeScore}
            onCommit={onCommit}
            onMarkMissing={onMarkMissing}
            onClearMissing={clearMissing}
            onExcuse={onExcuse}
          />
        )}

        <div className="flex flex-col gap-2">
          <FeedbackBox
            first={first}
            value={feedback}
            disabled={!canEdit}
            onChange={changeFeedback}
            onCommit={onCommit}
            hint={linked ? null : hint}
          />
          <QuickCommentChips disabled={!canEdit} onAdd={(text) => changeFeedback(appendQuickComment(feedback, text))} />
        </div>

        <WorkThreadPanel
          itemId={itemId}
          studentId={row.studentId}
          first={first}
          includesParents={includesParents}
          itemLive={item.effectiveStatus === 'posted'}
          stub={detail?.thread ?? null}
          disabled={!canEdit}
        />

        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={onPublish}
            disabled={!canPublish}
            title={publishTitle}
            className="cursor-pointer rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-[11px] text-[15px] font-medium text-cyan-800 transition-colors hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishOneLabel(first, linked)}
          </button>
          <span className="text-center text-xs text-slate-500">{publishOneHint(first, linked, row.signsIn, row.getsEmail)}</span>
        </div>
      </aside>
    </div>
  )
}
