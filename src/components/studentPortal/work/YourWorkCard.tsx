// src/components/studentPortal/work/YourWorkCard.tsx
// "Your work" on the assignment page (Student-Assignment board, every state):
// the status pill, the grade once it is published, the files (a photo from the
// camera, a file from the device), the typed answer, and the Turn in bar. The
// same card, read-only and titled "{name}'s work", is what a parent sees.
//
//  - Files: every image is shrunk before it goes up (downscaleImage). A file
//    that does not go up stays in the list with Retry, so a photo is never
//    lost. Remove (✕) works while the work can change.
//  - Typed answer: autosaves through useDebouncedSave (D17). The saver lives
//    for the session under "answer:{user}:{item}", so an answer still saving
//    or failed when the student leaves is not lost (it is shown again, failed,
//    on return). Turn in saves first.
//  - Turn in / Unsubmit are explicit buttons; the server decides who may.
//  - Read-only is structural: the card changes nothing unless it is handed
//    `actions`. A parent's page, and an admin's preview, pass none.
'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useDebouncedSave } from '@/hooks/useDebouncedSave'
import { downscaleImage } from '@/lib/imageDownscale'
import { closedNote, itemStatusOf, lateNote, turnedInNote, turnInHint, turnInLabel, workHeading, type Owner } from '@/lib/itemPageText'
import { openSignedUrl } from '@/lib/openSignedUrl'
import { batchesOf, checkSubmissionFiles, UPLOAD_BATCH, withMimeType } from '@/lib/submissionFiles'
import { displayStatus, workStatusLabel } from '@/lib/workStatusLabels'
import { isApiError } from '@/services/apiClient'
import type { StudentItem, SubmissionFile, SubmissionMode } from '@/services/types/studentPortal'
import { useNotificationStore } from '@/store/useNotificationStore'
import FileRow from './FileRow'
import FileUploadButtons from './FileUploadButtons'
import GradeBlock from './GradeBlock'
import TurnInBar, { type TurnInBarView } from './TurnInBar'
import TypedAnswerBox from './TypedAnswerBox'
import WorkStatusPill from './WorkStatusPill'

/** What the student can do to their own work. The page builds these from the student's routes. */
export interface WorkActions {
  /** Autosave of the typed answer. */
  saveAnswer: (text: string, opts: { keepalive?: boolean }) => Promise<void>
  /** Uploads up to five files; answers with every file of the work. */
  uploadFiles: (files: File[]) => Promise<SubmissionFile[]>
  deleteFile: (fileId: string) => Promise<void>
  turnIn: () => Promise<StudentItem>
  unsubmit: () => Promise<StudentItem>
}

interface YourWorkCardProps {
  item: StudentItem
  /** "Your work" for the student; the child's name for a parent. */
  owner: Owner
  /** The signed-in student (their id keys the answer's autosave); null when read-only. */
  userId: string | null
  /** What the student can do. Null: nothing can change (a parent looking, or an admin's preview). */
  actions: WorkActions | null
  /** Said under the heading when read-only ("Only Amal can turn work in."). */
  readOnlyNote?: string | null
  /** How the work is handed in; undefined while it is being found out. */
  mode: SubmissionMode | null | undefined
  /** Opens one of the files: asks for its link (the student's route, or the parent's). */
  resolveFileUrl: (file: SubmissionFile) => Promise<string>
  /** The item as the server now has it (the answer to Turn in and Unsubmit). */
  onItem: (next: StudentItem) => void
  /** The files as the server now has them. */
  onFiles: (files: SubmissionFile[]) => void
  /** Read the item again (the server says it changed under us). */
  onReload: () => void
  /** The To-do's counts moved (Turn in, Unsubmit). */
  onCountsChanged?: () => void
  now?: Date
}

interface PendingUpload {
  key: number
  file: File
  status: 'uploading' | 'failed'
  message: string
}

const messageOf = (err: unknown, fallback: string): string => (err instanceof Error && err.message ? err.message : fallback)

export default function YourWorkCard({
  item,
  owner,
  userId,
  actions,
  readOnlyNote = null,
  mode,
  resolveFileUrl,
  onItem,
  onFiles,
  onReload,
  onCountsChanged,
  now = new Date(),
}: YourWorkCardProps) {
  const notify = useNotificationStore((s) => s.showNotification)
  const sub = item.submission
  const readOnly = actions === null
  const teacherName = item.teacher?.name ?? null
  const kindWord = item.kind === 'quiz' ? 'quiz' : 'assignment'

  // The typed answer. The key is set for a student only and never changes for this component's life.
  const answer = useDebouncedSave<string>({
    key: userId && actions ? `answer:${userId}:${item.itemId}` : undefined,
    save: async (value, opts) => {
      if (!actions) throw new Error('This can’t be changed here.')
      await actions.saveAnswer(value, opts)
    },
    failedAway: () => `Your answer on "${item.title}" didn't save. Open it again to retry.`,
  })
  // Whatever the saver still holds (an answer that failed before the student left) wins over the server's copy.
  const [text, setText] = useState(() => answer.peek() ?? sub?.textAnswer ?? '')

  const [pending, setPending] = useState<PendingUpload[]>([])
  const [preparing, setPreparing] = useState(0)
  const [busy, setBusy] = useState<'turnIn' | 'unsubmit' | null>(null)
  const nextKey = useRef(1)

  const files = sub?.files ?? []
  const canChange = !!actions && !!sub?.canEdit
  const uploading = pending.some((p) => p.status === 'uploading') || preparing > 0
  const hasFailedUpload = pending.some((p) => p.status === 'failed')

  const hasWork =
    mode === 'file' ? files.length > 0 : mode === 'text' ? text.trim().length > 0 : mode === 'done' ? true : false

  // ── Files ───────────────────────────────────────────────────────────────

  const uploadRows = async (rows: PendingUpload[]) => {
    if (!actions) return
    for (const batch of batchesOf(rows, UPLOAD_BATCH)) {
      const keys = new Set(batch.map((r) => r.key))
      setPending((list) => list.map((p) => (keys.has(p.key) ? { ...p, status: 'uploading', message: '' } : p)))
      try {
        onFiles(await actions.uploadFiles(batch.map((r) => r.file)))
        setPending((list) => list.filter((p) => !keys.has(p.key)))
      } catch (err) {
        const message = messageOf(err, "This file didn't upload.")
        setPending((list) => list.map((p) => (keys.has(p.key) ? { ...p, status: 'failed', message } : p)))
        if (isApiError(err) && (err.code === 'ITEM_CLOSED' || err.code === 'ALREADY_SUBMITTED')) onReload()
      }
    }
  }

  const addFiles = async (picked: File[]) => {
    if (!actions || !canChange) return
    setPreparing((n) => n + picked.length)
    let prepared: File[]
    try {
      prepared = await Promise.all(picked.map((f) => downscaleImage(withMimeType(f))))
    } finally {
      setPreparing((n) => n - picked.length)
    }
    const { ok, problems } = checkSubmissionFiles(prepared, files.length + pending.length)
    if (problems.length > 0) notify(problems.join(' '), 'error', 6000)
    if (ok.length === 0) return
    const rows: PendingUpload[] = ok.map((file) => ({ key: nextKey.current++, file, status: 'uploading', message: '' }))
    setPending((list) => [...list, ...rows])
    await uploadRows(rows)
  }

  const removeFile = async (file: SubmissionFile) => {
    if (!actions) return
    try {
      await actions.deleteFile(file.fileId)
      onFiles(files.filter((f) => f.fileId !== file.fileId))
    } catch (err) {
      notify(messageOf(err, "This file couldn't be removed."), 'error')
      if (isApiError(err) && (err.code === 'ITEM_CLOSED' || err.code === 'ALREADY_SUBMITTED')) onReload()
    }
  }

  const openFile = async (file: SubmissionFile) => {
    try {
      await openSignedUrl(() => resolveFileUrl(file))
    } catch (err) {
      notify(messageOf(err, "This file couldn't be opened."), 'error')
    }
  }

  // ── Turn in / Unsubmit ──────────────────────────────────────────────────

  const turnIn = async () => {
    if (!actions) return
    setBusy('turnIn')
    try {
      if (mode === 'text') {
        await answer.flush()
        if (answer.hasFailures()) {
          notify("Your answer didn't save yet. Try Turn in again in a moment.", 'error')
          return
        }
      }
      onItem(await actions.turnIn())
      notify(mode === 'done' ? 'Marked as done.' : `Turned in. ${teacherName ?? 'Your teacher'} can see it now.`, 'success')
      onCountsChanged?.()
    } catch (err) {
      notify(messageOf(err, "Your work didn't turn in. Try again."), 'error')
      if (isApiError(err) && (err.code === 'ITEM_CLOSED' || err.code === 'ALREADY_SUBMITTED')) onReload()
    } finally {
      setBusy(null)
    }
  }

  const unsubmit = async () => {
    if (!actions) return
    setBusy('unsubmit')
    try {
      onItem(await actions.unsubmit())
      notify('Unsubmitted. You can make changes now.', 'info')
      onCountsChanged?.()
    } catch (err) {
      notify(messageOf(err, "This couldn't be unsubmitted."), 'error')
      if (isApiError(err)) onReload()
    } finally {
      setBusy(null)
    }
  }

  // ── What to show ────────────────────────────────────────────────────────

  const status = itemStatusOf(item)
  const pill = workStatusLabel(displayStatus(status, canChange && hasWork), sub?.isLate ?? false)
  const graded = item.grade !== null
  // Work handed in after the teacher marked it missing still reads Missing (the server's rule), but it is in.
  const turnedIn = !!sub?.turnedInAt && status !== 'graded' && status !== 'excused'

  let bar: TurnInBarView | null = null
  if (actions && sub && item.kind !== 'quiz') {
    if (turnedIn) {
      bar = { kind: 'turnedIn', note: turnedInNote({ teacher: teacherName, canUnsubmit: sub.canUnsubmit, closed: sub.closed }), canUnsubmit: sub.canUnsubmit, busy: busy === 'unsubmit', onUnsubmit: unsubmit }
    } else if (sub.canEdit) {
      const blocked = uploading || hasFailedUpload
      const canTurnIn = hasWork && !blocked
      bar = {
        kind: 'open',
        label: turnInLabel(mode),
        disabled: !canTurnIn,
        hint: uploading
          ? 'Your files are still uploading.'
          : hasFailedUpload
            ? 'Retry or remove the file that did not upload.'
            : turnInHint({ mode, canTurnIn, teacher: teacherName }),
        busy: busy === 'turnIn',
        note: status === 'missing' ? lateNote(item, teacherName, now) : null,
        onTurnIn: turnIn,
      }
    } else if (sub.closed && status !== 'graded' && status !== 'excused') {
      bar = { kind: 'closed', note: closedNote(kindWord) }
    }
  }

  const answerLocked = !canChange

  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white p-[22px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between gap-2.5">
        <h2 className="font-display text-xl font-semibold text-slate-900">{workHeading(owner)}</h2>
        <WorkStatusPill label={pill} size="md" />
      </div>

      {readOnlyNote && <p className="text-sm leading-relaxed text-slate-600">{readOnlyNote}</p>}

      {item.grade && <GradeBlock grade={item.grade} teacherName={teacherName} owner={owner} now={now} />}

      {!sub ? (
        // Nothing to turn in online: a plain assessment, or work done in class.
        !graded && (
          <p className="text-sm leading-relaxed text-slate-600">
            {item.kind === 'assessment'
              ? `There's nothing to turn in for this one. The grade appears here when ${teacherName ?? 'your teacher'} publishes it.`
              : "There's nothing to turn in online for this one. It's done in class."}
          </p>
        )
      ) : item.kind === 'quiz' ? (
        <QuizEntry itemId={item.itemId} status={status} readOnly={readOnly} />
      ) : mode === undefined ? (
        <div className="h-24 animate-pulse rounded-[14px] bg-slate-100" aria-label="Loading" />
      ) : mode === 'file' ? (
        <div className="flex flex-col gap-3">
          {(files.length > 0 || pending.length > 0 || preparing > 0) && (
            <ul className="flex flex-col gap-2.5">
              {files.map((file) => (
                <FileRow
                  key={file.fileId}
                  file={file}
                  onOpen={() => void openFile(file)}
                  onRemove={canChange ? () => void removeFile(file) : undefined}
                />
              ))}
              {pending.map((p) => (
                <FileRow
                  key={`pending-${p.key}`}
                  file={{ fileName: p.file.name, mimeType: p.file.type, sizeBytes: p.file.size }}
                  upload={p.status === 'uploading' ? { status: 'uploading' } : { status: 'failed', message: p.message, onRetry: () => void uploadRows([p]) }}
                  onRemove={p.status === 'failed' ? () => setPending((list) => list.filter((x) => x.key !== p.key)) : undefined}
                />
              ))}
              {preparing > 0 && (
                <li className="h-[70px] animate-pulse rounded-[14px] border border-slate-200 bg-slate-50" aria-label="Getting your photo ready" />
              )}
            </ul>
          )}
          {files.length === 0 && pending.length === 0 && preparing === 0 && !canChange && (
            <p className="text-sm text-slate-500">No files were added.</p>
          )}
          {canChange && <FileUploadButtons onPick={(picked) => void addFiles(picked)} compact={files.length + pending.length > 0} />}
        </div>
      ) : mode === 'text' ? (
        <TypedAnswerBox
          value={text}
          onChange={(value) => {
            setText(value)
            answer.schedule(value)
          }}
          onBlur={() => void answer.flush()}
          status={answer.status}
          onRetry={() => void answer.retry()}
          readOnly={answerLocked}
          emptyText="No answer was written."
        />
      ) : mode === 'done' ? (
        <p className="text-sm leading-relaxed text-slate-600">
          {turnedIn || graded
            ? 'Marked as done.'
            : canChange
              ? "There's nothing to add. Press Mark as done when you've finished."
              : 'This one is marked as done when the work is finished.'}
        </p>
      ) : null}

      {bar && <TurnInBar view={bar} />}
    </section>
  )
}

/** Quizzes are answered on their own page (Task 24). */
function QuizEntry({ itemId, status, readOnly }: { itemId: string; status: ReturnType<typeof itemStatusOf>; readOnly: boolean }) {
  if (readOnly) return null
  const done = status === 'turned_in' || status === 'graded'
  return (
    <Link
      href={`/student/items/${encodeURIComponent(itemId)}/quiz`}
      className="flex min-h-[52px] items-center justify-center rounded-[14px] bg-indigo-600 px-4 py-3.5 text-[17px] font-semibold text-white transition-colors hover:bg-indigo-700"
    >
      {done ? 'See your answers' : 'Start the quiz'}
    </Link>
  )
}
