// src/components/classes/grading/GradingView.tsx
// Grade an assignment or quiz with the student's work (the Teacher-Grading
// board, spec D3/D17): the students on the left (filters ?filter=, the open
// student ?student=), their work in the middle, the grade, feedback and
// private messages on the right.
//
// Grades and feedback autosave as drafts on the student's submission (600 ms
// after the last keystroke, at once on blur and on a student switch, and on
// every way out of the page); only the teacher sees a draft. Publish is the
// one release word: "Publish to N students" (every draft, after a confirm) or
// "Publish {first}'s grade". Once the column is published, a grade edit goes
// live as it saves. Mark missing and Excuse are published at once.
//
// A quiz also loads its questions (the choices' words for the review) and
// links to them ("Questions"); points saved on an answer read that student's
// row again, so the list, the counts and the grade box follow the server.
'use client'

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClipboardDocumentListIcon, ExclamationTriangleIcon, MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { useDebouncedSave } from '@/hooks/useDebouncedSave'
import { useFilterParams } from '@/hooks/useFilterParams'
import { useLoad } from '@/hooks/useLoad'
import { classHref, classItemHref } from '@/lib/classroomRoutes'
import { PartialDebouncedSaveError } from '@/lib/debouncedSaver'
import {
  editedGrade,
  filterGradingRows,
  firstName,
  gradedEarlier,
  gradingCounts,
  gradingSubline,
  mergeGradeEdits,
  splitGradeEdits,
  neighbours,
  OUTSIDE_AUDIENCE_CODE,
  outsideAudienceMessage,
  parseGradingFilter,
  publishAllPrompt,
  publishOutcome,
  studentShortcutFree,
  type GradeEdits,
  type GradingFilter,
} from '@/lib/gradingView'
import { isApiError } from '@/services/apiClient'
import { getClassPage } from '@/services/classroomService'
import { getQuestions, restoreQuizScore } from '@/services/quizService'
import {
  excuseStudents,
  getGradingList,
  getSubmission,
  markMissing,
  publishGrades,
  updateSubmission,
} from '@/services/gradingService'
import type { ClassPageData } from '@/services/types/classroom'
import type { GradePatch, GradeStatus, GradingList, GradingRow, PublishGradesResult, SubmissionDetail } from '@/services/types/grading'
import type { Question } from '@/services/types/quiz'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import GradingHeader from './GradingHeader'
import GradingStudentList from './GradingStudentList'
import GradingStudentPanel from './GradingStudentPanel'

interface GradingViewProps {
  classId: string
  itemId: string
  /** Came from Grades (a column name): Back returns there. */
  from?: 'grades' | null
}

interface Loaded {
  page: ClassPageData
  list: GradingList
}

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

function Notice({ classId, children }: { classId: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <ClipboardDocumentListIcon className="h-7 w-7 text-slate-400" aria-hidden="true" />
        </div>
        <div className="mb-6 text-slate-600">{children}</div>
        <Link
          href={classHref(classId, 'classwork')}
          className="inline-flex rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 font-medium text-white hover:from-cyan-600 hover:to-teal-600"
        >
          Back to Classwork
        </Link>
      </div>
    </div>
  )
}

export default function GradingView({ classId, itemId, from = null }: GradingViewProps) {
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const userId = useUserStore((s) => s.user.id) ?? ''
  const { get, setParams } = useFilterParams({ remember: false })
  const filter = parseGradingFilter(get('filter'))
  const studentParam = get('student') || null

  const { data, error, loading, reload, patch } = useLoad<Loaded>(`${classId}:${itemId}`, async () => {
    const [page, list] = await Promise.all([getClassPage(classId), getGradingList(itemId)])
    return { page: page.data, list: list.data }
  })

  const linked = Boolean(data?.list.item.gradebook)
  const rows = useMemo(() => data?.list.students ?? [], [data])
  const counts = useMemo(() => gradingCounts(rows, linked), [rows, linked])
  // Graded before their newest work came in (Fable I1): back in To grade, and left out of Publish to N.
  const earlierIds = useMemo(() => new Set(rows.filter(gradedEarlier).map((r) => r.studentId)), [rows])
  const shown = useMemo(() => filterGradingRows(rows, filter, linked), [rows, filter, linked])
  const selectedId =
    studentParam && rows.some((r) => r.studentId === studentParam) ? studentParam : (shown[0]?.studentId ?? rows[0]?.studentId ?? null)
  const selectedRow = rows.find((r) => r.studentId === selectedId) ?? null
  const around = neighbours(shown, selectedId)
  const nameOf = useCallback((id: string) => firstName(rows.find((r) => r.studentId === id)?.name) || 'the student', [rows])

  // A saved draft's row (its label, score and "needs publish") replaces the old one at once.
  const applyRow = useCallback(
    (row: GradingRow) =>
      patch((d) => ({ ...d, list: { ...d.list, students: d.list.students.map((r) => (r.studentId === row.studentId ? row : r)) } })),
    [patch],
  )

  // One saver for this item and teacher, kept for the whole session (as the
  // gradebook's autosave is): edits are kept per student, so a switch never
  // loses or mixes up what is still saving, and leaving the view (any link,
  // browser Back) never loses a score or feedback. A save that fails after
  // the teacher left is announced, and shown again with Retry on return.
  const itemTitle = data?.list.item.title ?? 'this work'
  const saver = useDebouncedSave<GradeEdits>({
    key: `grading:${userId}:${itemId}`,
    failedAway: (failed) => {
      const n = Object.keys(failed ?? {}).length
      return `${n} grading change${n === 1 ? '' : 's'} on "${itemTitle}" didn't save. Open its grading view to retry.`
    },
    merge: mergeGradeEdits,
    // A failed edit waits for Retry instead of riding along with another student's change (M1).
    split: splitGradeEdits,
    save: async (edits, opts) => {
      // Students in parallel, so a page going away (keepalive) sends them all.
      const entries = Object.entries(edits)
      const results = await Promise.allSettled(entries.map(([studentId, change]) => updateSubmission(itemId, studentId, change, opts)))
      const failed: GradeEdits = {}
      let message = ''
      results.forEach((result, i) => {
        const [studentId, change] = entries[i]
        if (result.status === 'fulfilled') {
          applyRow(result.value.data.row)
          return
        }
        failed[studentId] = change
        message = messageOf(result.reason, "The grade didn't save.")
      })
      // A browser refusing a keepalive request: the saver resends it all as a plain request.
      const refused = results.find((r) => r.status === 'rejected' && r.reason instanceof TypeError)
      if (opts.keepalive && refused?.status === 'rejected') throw refused.reason
      if (Object.keys(failed).length > 0) throw new PartialDebouncedSaveError(failed, message)
    },
  })

  const detail = useLoad<SubmissionDetail>(selectedId ? `${itemId}:${selectedId}` : null, async () => {
    const res = await getSubmission(itemId, selectedId as string)
    return res.data
  })

  // A quiz: its questions once (the answers carry only the choice ids).
  const isQuiz = data?.list.item.kind === 'quiz'
  const quizQuestions = useLoad<Map<string, Question>>(isQuiz ? `${itemId}:questions` : null, async () => {
    const res = await getQuestions(itemId)
    return new Map(res.data.questions.map((q) => [q.questionId, q]))
  })

  /**
   * "Use auto-score": what is typed is saved first (a typed score still waiting would win again), then the quiz's
   * own score goes back in the column. Answers with the student's grade as the server now holds it.
   */
  const restoreAutoScore = async (studentId: string): Promise<{ score: number | null; status: GradeStatus | null } | null> => {
    await saver.flush()
    if (saver.hasFailures()) {
      showNotification("Your last changes didn't save. Retry them first.", 'error')
      return null
    }
    try {
      const res = await restoreQuizScore(itemId, studentId)
      applyRow(res.data.row)
      detail.patch((d) => (d.row.studentId === studentId ? { ...d, row: res.data.row, quiz: res.data.quiz ?? d.quiz } : d))
      showNotification(`${nameOf(studentId)}'s score is the quiz's own again.`, 'success')
      const g = editedGrade(res.data.row)
      return { score: g.score, status: g.status }
    } catch (err) {
      showNotification(messageOf(err, "The quiz's score couldn't be used. Try again."), 'error')
      return null
    }
  }

  /** Points saved on a quiz: read those students' rows again; the open student's grade comes back for the grade box. */
  const refreshQuizRows = async (studentIds: string[], openId: string): Promise<{ score: number | null; status: GradeStatus | null } | null> => {
    let mine: { score: number | null; status: GradeStatus | null } | null = null
    await Promise.all(
      studentIds.map(async (id) => {
        try {
          const res = await getSubmission(itemId, id)
          applyRow(res.data.row)
          if (id === openId) {
            const g = editedGrade(res.data.row, saver.peek()?.[id])
            mine = { score: g.score, status: g.status }
          }
        } catch {
          // The row stays as it was; the next save or reload brings it up to date.
        }
      }),
    )
    return mine
  }

  // Remounts the student panel after a server-side change (Mark missing, Excuse).
  const [resetKey, setResetKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)
  const [outside, setOutside] = useState(false)
  // After the first switch (or a reopen), each panel takes the keyboard focus.
  const [focusPanel, setFocusPanel] = useState(false)

  const select = (studentId: string | null) => {
    if (!studentId) return
    void saver.flush()
    setFocusPanel(true)
    setParams({ student: studentId })
  }

  // Alt+↓ / Alt+↑: next / previous student, from anywhere in the view except the feedback box
  // (where Option+↑/↓ moves the caret by paragraph).
  const prevId = around.prev
  const nextId = around.next
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return
      if (!studentShortcutFree(e.target as HTMLElement | null)) return
      const target = e.key === 'ArrowDown' ? nextId : prevId
      if (!target) return
      e.preventDefault()
      document.querySelector<HTMLButtonElement>(`button[aria-keyshortcuts="${e.key === 'ArrowDown' ? 'Alt+ArrowDown' : 'Alt+ArrowUp'}"]`)?.click()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prevId, nextId])
  const setFilter = (next: GradingFilter) => setParams({ filter: next === 'all' ? null : next })

  const edit = (studentId: string, change: GradePatch) => saver.schedule({ [studentId]: change })
  const commit = () => void saver.flush()

  /**
   * Mark missing, Excuse, Publish: what is typed is saved first; then the
   * action; then the list is read again (labels, counts, the column's
   * publish state). `remount` reopens the panel on the new grade.
   */
  const act = async (
    run: () => Promise<{ data: PublishGradesResult }>,
    done: (result: PublishGradesResult) => { tone: 'success' | 'info'; message: string },
    remount = false,
  ) => {
    if (busy) return
    setBusy(true)
    try {
      await saver.flush()
      if (saver.hasFailures()) {
        showNotification("Your last changes didn't save. Retry them first.", 'error')
        return
      }
      const res = await run()
      setOutside(false)
      const outcome = done(res.data)
      showNotification(outcome.message, outcome.tone === 'success' ? 'success' : 'info')
      try {
        const fresh = await getGradingList(itemId)
        patch((d) => ({ ...d, list: fresh.data }))
      } catch {
        reload()
      }
      if (remount) {
        setFocusPanel(true)
        setResetKey((k) => k + 1)
      }
    } catch (err) {
      if (isApiError(err) && err.code === OUTSIDE_AUDIENCE_CODE) setOutside(true)
      else showNotification(messageOf(err, "That didn't work. Try again."), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data) {
    const status = isApiError(error) ? error.status : null
    if (status === 404) return <Notice classId={classId}>This classwork doesn&apos;t exist, or it was deleted.</Notice>
    if (status === 403) return <Notice classId={classId}>You don&apos;t teach this class, so its work can&apos;t be graded from your account.</Notice>
    if (status === 400) return <Notice classId={classId}>{error?.message || 'Only assignments and quizzes are graded here.'}</Notice>
    return (
      <Notice classId={classId}>
        <p className="mb-4">{error?.message || "The work couldn't be loaded."}</p>
        <button
          type="button"
          onClick={reload}
          className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
        >
          Try again
        </button>
      </Notice>
    )
  }

  const { page, list } = data
  if (list.item.classId !== classId) return <Notice classId={classId}>This classwork belongs to another class.</Notice>

  const item = list.item
  const assessmentId = item.gradebook?.assessmentId ?? null
  const canEdit = page.permissions.canEdit
  const backHref = from === 'grades' ? classHref(classId, 'grades', { focus: assessmentId }) : classHref(classId, 'classwork')
  const failedCount = saver.status === 'error' ? Object.keys(saver.peek() ?? {}).length : 0
  const prompt = publishAllPrompt(rows, linked)

  const onBack = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    await saver.flush()
    if (saver.hasFailures()) {
      showNotification("Some changes didn't save. Retry them, or Discard them, before you leave.", 'error')
      return
    }
    router.push(backHref)
  }

  const selectedFirst = selectedRow ? firstName(selectedRow.name) : ''

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <GradingHeader
        title={item.title}
        subline={gradingSubline({
          grade: page.class.grade,
          subject: page.class.subject,
          dueAt: item.dueAt,
          maxScore: item.maxScore,
          categoryName: item.categoryName,
          linked,
        })}
        backHref={backHref}
        backLabel={from === 'grades' ? 'Back to Grades' : 'Back to Classwork'}
        onBack={(e) => void onBack(e)}
        counts={counts}
        saveStatus={saver.status}
        failedCount={failedCount}
        onRetry={() => void saver.retry()}
        onDiscard={() => {
          saver.discard()
          setFocusPanel(true)
          setResetKey((k) => k + 1)
        }}
        onPublishAll={async () => {
          // Saved first, so the confirm names everyone a blur-save just added.
          await saver.flush()
          setConfirmAll(true)
        }}
        publishing={busy && confirmAll}
        canEdit={canEdit}
        questionsHref={item.kind === 'quiz' && canEdit ? classItemHref(classId, itemId, 'quiz', { from: 'grading' }) : null}
        gradedEarlierCount={earlierIds.size}
      />

      {outside && (
        <div role="alert" className="mx-4 mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-8">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="flex-1">
            {outsideAudienceMessage(item.kind)}{' '}
            <Link href={classHref(classId, 'grades', { focus: assessmentId })} className="font-medium text-amber-900 underline underline-offset-2">
              Open Grades
            </Link>
          </p>
          <button type="button" aria-label="Dismiss" onClick={() => setOutside(false)} className="cursor-pointer text-amber-700 hover:text-amber-900">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className="flex flex-1 flex-wrap items-stretch">
        <GradingStudentList
          rows={shown}
          counts={counts}
          filter={filter}
          onFilter={setFilter}
          selectedId={selectedId}
          onSelect={select}
          linked={linked}
        />

        {selectedRow ? (
          <GradingStudentPanel
            key={`${selectedRow.studentId}:${resetKey}`}
            itemId={itemId}
            item={item}
            row={selectedRow}
            initial={editedGrade(selectedRow, saver.peek()?.[selectedRow.studentId])}
            detail={detail.data}
            detailLoading={detail.loading}
            detailError={detail.error?.message ?? null}
            onReloadDetail={detail.reload}
            linked={linked}
            columnPublished={list.isAssessmentPublished}
            canEdit={canEdit}
            busy={busy}
            focusOnOpen={focusPanel}
            failed={saver.status === 'error' && Boolean(saver.peek()?.[selectedRow.studentId])}
            includesParents={page.settings.parentsReadPrivateComments}
            prevName={around.prev ? nameOf(around.prev) : null}
            nextName={around.next ? nameOf(around.next) : null}
            onPrev={() => select(around.prev)}
            onNext={() => select(around.next)}
            onEdit={(change) => edit(selectedRow.studentId, change)}
            onCommit={commit}
            onMarkMissing={() =>
              void act(
                () => markMissing(itemId, [selectedRow.studentId]),
                () => ({ tone: 'success', message: `Marked missing. ${selectedFirst} and parents see it counts as 0.` }),
                true,
              )
            }
            onClearMissing={() => {
              edit(selectedRow.studentId, { draftStatus: null })
              commit()
            }}
            onExcuse={(excused) =>
              void act(
                () => excuseStudents(itemId, [selectedRow.studentId], excused),
                () =>
                  excused
                    ? { tone: 'success', message: `Excused. ${selectedFirst} and parents see it doesn't count.` }
                    : { tone: 'success', message: 'Excuse lifted.' },
                true,
              )
            }
            onPublish={() => void act(() => publishGrades(itemId, [selectedRow.studentId]), (r) => publishOutcome(r, nameOf, linked, item.kind, earlierIds))}
            quiz={
              item.kind === 'quiz'
                ? {
                    questions: quizQuestions.data,
                    userId,
                    onSaved: (ids) => refreshQuizRows(ids, selectedRow.studentId),
                    onUseAutoScore: () => restoreAutoScore(selectedRow.studentId),
                  }
                : null
            }
          />
        ) : (
          <div className="flex flex-[999_1_760px] items-center justify-center p-10 text-sm text-slate-500">
            No students to grade here yet.
          </div>
        )}
      </main>

      <Modal isOpen={confirmAll} onClose={() => !busy && setConfirmAll(false)} size="md">
        <ModalHeader title={prompt.title} icon={MegaphoneIcon} />
        <ModalBody>
          <ConfirmBody tone="brand">{prompt.body}</ConfirmBody>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => setConfirmAll(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            loading={busy}
            onClick={async () => {
              await act(() => publishGrades(itemId, 'graded'), (r) => publishOutcome(r, nameOf, linked, item.kind, earlierIds))
              setConfirmAll(false)
            }}
          >
            Publish
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
