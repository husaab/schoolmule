// src/components/classes/grading/QuizAnswersReview.tsx
// One student's quiz in the grading view (Teacher-Grading board, quiz): each
// question with the student's answer beside the key (the right choices, or
// the accepted answers), the automatic points, and the teacher's points and
// note. Totals "{earned} / {possible}", and "Needs your review" while a
// written answer has no points.
//
// Points and notes autosave (PATCH /quiz-answers/:id, 600 ms; an empty box
// gives the automatic points back), through a session saver keyed
// "quiz-review:{user}:{item}", so nothing typed is lost by switching student
// or leaving. Each saved edit names its student, so a save that lands after a
// switch updates the right student's row. On a published column a change goes
// live as it saves (D17, no email): "Published: changes go live when they save."
//
// The column's score: a score the teacher typed (the score box or the grid)
// wins over the quiz's points (T23 fix round 1; the grading row's
// scoreSetByTeacher). It reads "Score set by teacher" with "Use auto-score"
// (POST …/quiz-score), which puts the quiz's points back.
'use client'

import { useRef, useState } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import SaveStatusPill from '@/components/classroom/SaveStatusPill'
import { useDebouncedSave } from '@/hooks/useDebouncedSave'
import { PartialDebouncedSaveError } from '@/lib/debouncedSaver'
import { QUESTION_KIND_LABELS } from '@/lib/quizBuilder'
import {
  choiceMarks,
  hasOverride,
  keyText,
  overrideHint,
  parseOverride,
  quizScoreSource,
  reviewAnswerText,
  reviewTotals,
  totalsLine,
} from '@/lib/quizReview'
import { overrideQuizAnswer } from '@/services/quizService'
import type { GradeStatus, SubmissionDetail } from '@/services/types/grading'
import type { Question, QuizTotals, SubmissionQuiz, TeacherQuizAnswer } from '@/services/types/quiz'

/** One answer's points and note as typed, kept until the server has them. Names its student (see the header). */
export interface OverrideEdit {
  studentId: string
  teacherPoints: number | null
  teacherNote: string | null
}

export type OverrideEdits = Record<string, OverrideEdit>

interface QuizAnswersReviewProps {
  itemId: string
  itemTitle: string
  studentId: string
  first: string
  userId: string
  detail: SubmissionDetail | null
  loading: boolean
  error: string | null
  onReload: () => void
  /** The quiz's questions with their choices (the answers carry only the choice ids). */
  questions: Map<string, Question> | null
  canEdit: boolean
  /** The item fills a gradebook column (a score to tell apart). */
  linked: boolean
  /** The column is published: a point change or a typed score goes live as it saves (D17), with no email. */
  columnPublished?: boolean
  /** The student's score in the column now, as the panel shows it, and the row's "typed by the teacher" flag. */
  current: { score: number | null; status: GradeStatus | null; setByTeacher?: boolean }
  /** Points saved for these students: read their rows again. */
  onSaved: (studentIds: string[]) => void
  /** "Use auto-score": the quiz's points go back in the column. */
  onUseAutoScore: () => void
  /** "Use auto-score" is on its way. */
  restoring?: boolean
}

interface Typed {
  points: string
  note: string
  error: string | null
}

const fmt = (n: number) => String(Math.round(n * 100) / 100)
const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)
const mergeEdits = (older: OverrideEdits, newer: OverrideEdits): OverrideEdits => ({ ...older, ...newer })

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-[repeating-linear-gradient(45deg,#f8fafc_0_14px,#f1f5f9_14px_28px)] p-6 text-center text-sm text-slate-600">
      {children}
    </div>
  )
}

/** Loading, failed, not started: said in the work's frame. Otherwise the review, seeded once the answers are here. */
export default function QuizAnswersReview(props: QuizAnswersReviewProps) {
  const { detail, loading, error, onReload, first } = props
  const quiz = detail?.quiz ?? null
  if (!quiz) {
    if (loading && !detail) return <Frame>Loading the answers…</Frame>
    if (error && !detail) {
      return (
        <Frame>
          <p>{error || "The answers couldn't be loaded."}</p>
          <button type="button" onClick={onReload} className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            Try again
          </button>
        </Frame>
      )
    }
    return <Frame>{first} hasn&apos;t started the quiz yet.</Frame>
  }
  return <ReviewBody key={quiz.attemptId} {...props} quiz={quiz} />
}

function ReviewBody({
  itemId,
  itemTitle,
  studentId,
  first,
  userId,
  quiz,
  questions,
  canEdit,
  linked,
  columnPublished = false,
  current,
  onSaved,
  onUseAutoScore,
  restoring = false,
}: QuizAnswersReviewProps & { quiz: SubmissionQuiz }) {
  // The student this panel shows, for saves that land after a switch.
  const shownStudent = useRef(studentId)
  const [savedTotals, setSavedTotals] = useState<QuizTotals | null>(null)

  const saver = useDebouncedSave<OverrideEdits>({
    key: `quiz-review:${userId}:${itemId}`,
    merge: mergeEdits,
    failedAway: (failed) => {
      const n = Object.keys(failed ?? {}).length
      return `${n} quiz point change${n === 1 ? '' : 's'} on "${itemTitle}" didn't save. Open its grading view to retry.`
    },
    save: async (edits, opts) => {
      const entries = Object.entries(edits)
      const results = await Promise.allSettled(
        entries.map(([answerId, e]) => overrideQuizAnswer(answerId, { teacherPoints: e.teacherPoints, teacherNote: e.teacherNote }, opts)),
      )
      const failed: OverrideEdits = {}
      const savedFor = new Set<string>()
      let message = ''
      let mine: QuizTotals | null = null
      results.forEach((r, i) => {
        const [answerId, e] = entries[i]
        if (r.status === 'fulfilled') {
          savedFor.add(e.studentId)
          if (e.studentId === shownStudent.current) mine = r.value.data.totals
          return
        }
        failed[answerId] = e
        message = messageOf(r.reason, "The points didn't save.")
      })
      // A browser refusing a keepalive request: the saver sends it all again as a plain request.
      const refused = results.find((r) => r.status === 'rejected' && r.reason instanceof TypeError)
      if (opts.keepalive && refused?.status === 'rejected') throw refused.reason
      if (savedFor.size > 0) onSaved([...savedFor])
      if (mine) setSavedTotals(mine)
      if (Object.keys(failed).length > 0) throw new PartialDebouncedSaveError(failed, message)
    },
  })

  // What each box holds: the saved points and note, or what was typed and has not reached the server.
  const [typed, setTyped] = useState<Record<string, Typed>>(() => {
    const unsaved = saver.peek() ?? {}
    const out: Record<string, Typed> = {}
    for (const a of quiz.answers) {
      if (!a.answerId) continue
      const edit = unsaved[a.answerId]
      const points = edit ? edit.teacherPoints : a.teacherPoints
      out[a.answerId] = { points: points === null ? '' : fmt(points), note: (edit ? edit.teacherNote : a.teacherNote) ?? '', error: null }
    }
    return out
  })

  const submitted = Boolean(quiz.submittedAt)
  const editable = canEdit && submitted
  // The points as the boxes hold them (only valid ones count), so the totals move as the teacher types.
  const typedPoints: Record<string, number | null> = {}
  for (const [answerId, t] of Object.entries(typed)) {
    const answer = quiz.answers.find((a) => a.answerId === answerId)
    if (!answer) continue
    const parsed = parseOverride(t.points, answer.points)
    if ('value' in parsed) typedPoints[answerId] = parsed.value
  }
  const totals = reviewTotals(quiz.answers, typedPoints)
  const settled = savedTotals ?? quiz
  const source = linked && submitted ? quizScoreSource({ row: current.setByTeacher, quiz }, current) : 'none'

  const change = (a: TeacherQuizAnswer, patch: Partial<Typed>) => {
    if (!a.answerId) return
    const answerId = a.answerId
    const next: Typed = { ...(typed[answerId] ?? { points: '', note: '', error: null }), ...patch }
    const parsed = parseOverride(next.points, a.points)
    next.error = 'error' in parsed ? parsed.error : null
    setTyped((all) => ({ ...all, [answerId]: next }))
    if ('value' in parsed) {
      saver.schedule({ [answerId]: { studentId, teacherPoints: parsed.value, teacherNote: next.note.trim() ? next.note : null } })
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-3" aria-label={`${first}'s quiz answers`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm font-medium text-slate-700">Quiz answers</span>
          <span className="font-display text-xl font-semibold tabular-nums text-slate-900">{totalsLine(totals)}</span>
          {totals.needsReview && (
            <span className="rounded-full bg-amber-100 px-2 py-[3px] text-xs font-medium text-amber-900">Needs your review</span>
          )}
        </div>
        {editable && <SaveStatusPill status={saver.status} onRetry={() => void saver.retry()} />}
      </div>

      {editable && linked && columnPublished && (
        <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2.5 text-[13px] text-cyan-900">
          Published: changes go live when they save.
        </p>
      )}

      {!submitted && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
          Not turned in yet. These are {first}&apos;s answers so far; you can give points once the quiz is turned in.
        </p>
      )}
      {source === 'teacher' && current.score !== null && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
          <span className="flex-1">
            <span className="font-medium">Score set by teacher: {fmt(current.score)}.</span> It counts instead of the quiz&apos;s points (
            {totalsLine(settled)}).
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={onUseAutoScore}
              disabled={restoring || totals.needsReview}
              title={totals.needsReview ? 'Grade the written answers first, then use the auto-score.' : undefined}
              className="cursor-pointer rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[13px] font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {restoring ? 'Using the auto-score…' : 'Use auto-score'}
            </button>
          )}
        </div>
      )}
      {saver.status === 'error' && saver.error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-800">
          Some points didn&apos;t save: {saver.error}
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {quiz.answers.map((a, i) => {
          const q = questions?.get(a.questionId)
          const t = a.answerId ? typed[a.answerId] : undefined
          const marks = a.kind === 'one' || a.kind === 'many' ? choiceMarks(a, q) : []
          const answerWords = reviewAnswerText(a, q)
          const key = keyText(a, q)
          const typedValue = a.answerId && a.answerId in typedPoints ? typedPoints[a.answerId] : undefined
          const changed = hasOverride(a, typedValue)
          return (
            <li key={a.questionId} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-slate-600">
                  Question {i + 1} · {QUESTION_KIND_LABELS[a.kind]}
                </span>
                <span className="text-xs text-slate-500">
                  {a.kind === 'long' ? 'You grade this one' : a.autoPoints === null ? 'No automatic points' : `Auto ${fmt(a.autoPoints)} / ${fmt(a.points)}`}
                </span>
              </div>
              <p className="text-[15px] font-medium leading-snug text-slate-900">{a.prompt}</p>

              {marks.length > 0 ? (
                <ul className="flex flex-col gap-1.5" aria-label={`${first}'s choices`}>
                  {marks.map((m) => (
                    <li
                      key={m.id}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${
                        m.picked && m.right
                          ? 'border-emerald-200 bg-emerald-50'
                          : m.picked
                            ? 'border-rose-200 bg-rose-50'
                            : m.right
                              ? 'border-emerald-200 bg-white'
                              : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span className="w-5 shrink-0 text-xs font-semibold text-slate-500">{m.letter}</span>
                      <span className="min-w-0 flex-1 break-words text-slate-800">{m.text}</span>
                      {m.picked && (
                        <span className={`text-xs font-medium ${m.right ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {m.right ? (
                            <CheckIcon className="mr-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                          ) : (
                            <XMarkIcon className="mr-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                          )}
                          {first}&apos;s answer
                        </span>
                      )}
                      {m.right && !m.picked && <span className="text-xs font-medium text-emerald-700">Right answer</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-[15px] leading-relaxed text-slate-800">
                    <span className="block text-xs text-slate-500">{first}&apos;s answer</span>
                    {answerWords ? <span className="whitespace-pre-wrap break-words">{answerWords}</span> : <span className="italic text-slate-500">No answer</span>}
                  </div>
                  {key && (
                    <p className="text-[13px] text-emerald-800">
                      <span className="text-emerald-700">{a.kind === 'short' ? 'Accepted: ' : 'Right answer: '}</span>
                      {key}
                    </p>
                  )}
                </div>
              )}

              {a.answerId && (
                <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`quiz-points-${a.answerId}`} className="text-[13px] font-medium text-slate-600">
                      Points
                    </label>
                    <div className="flex items-baseline gap-2">
                      <input
                        id={`quiz-points-${a.answerId}`}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={t?.points ?? ''}
                        placeholder={a.autoPoints === null ? '' : fmt(a.autoPoints)}
                        disabled={!editable}
                        aria-invalid={t?.error ? true : undefined}
                        aria-label={`Points for question ${i + 1}, out of ${fmt(a.points)}`}
                        onChange={(e) => change(a, { points: e.target.value })}
                        onBlur={() => void saver.flush()}
                        className={`w-20 rounded-xl border-2 bg-white px-2.5 py-2 text-center text-lg font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 ${
                          t?.error ? 'border-rose-400' : 'border-cyan-300 focus:border-cyan-500'
                        }`}
                      />
                      <span className="text-sm text-slate-500">/ {fmt(a.points)}</span>
                    </div>
                    <span className={`text-xs ${t?.error ? 'text-rose-700' : 'text-slate-500'}`}>{t?.error ?? overrideHint(a, changed)}</span>
                    {editable && changed && a.kind !== 'long' && a.autoPoints !== null && (
                      <button
                        type="button"
                        onClick={() => change(a, { points: '' })}
                        className="cursor-pointer self-start text-xs font-medium text-cyan-700 hover:text-cyan-800"
                      >
                        Use the automatic {fmt(a.autoPoints)}
                      </button>
                    )}
                  </div>
                  <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                    <label htmlFor={`quiz-note-${a.answerId}`} className="text-[13px] font-medium text-slate-600">
                      Note for {first} <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <textarea
                      id={`quiz-note-${a.answerId}`}
                      rows={2}
                      maxLength={2000}
                      value={t?.note ?? ''}
                      disabled={!editable}
                      onChange={(e) => change(a, { note: e.target.value })}
                      onBlur={() => void saver.flush()}
                      className="resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <span className="text-xs text-slate-500">{first} sees it with the results once they are published.</span>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
