// src/components/classes/stream/StreamComposer.tsx
// The Stream's composer (the Teacher-Stream board): a collapsed "Announce
// something to your class" bar that opens into a "New announcement" card.
// Audience is this class: every student, or hand-picked students of the
// class. A post can carry files (previewable before posting, removable), an
// "Email students and parents" switch that follows the class option, and a
// "Got it" request. Editing and deleting a posted announcement live on the
// post card, through the existing modals.
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EyeIcon, MegaphoneIcon, PaperClipIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import StudentPicker from '@/components/announcements/StudentPicker'
import { useAnnouncementFiles } from '@/components/announcements/useAnnouncementFiles'
import { MAX_BODY } from '@/components/messaging/formatters'
import { Button, inputClass, selectClass, textareaClass } from '@/components/shared/modalKit'
import { classTitle } from '@/lib/classesHome'
import { emailCheckboxText } from '@/lib/classStream'
import { uploadSizeLabel } from '@/lib/uploadPrep'
import { createAnnouncement, getPickableStudents, previewAudience } from '@/services/announcementService'
import type { AnnouncementDetail, AudiencePreview, PickableStudent } from '@/services/types/announcement'
import type { StreamAudience } from '@/services/types/classroom'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

const MAX_TITLE = 120
const COUNTER_FROM = 4500

type Audience = 'all' | 'choose'

interface StreamComposerProps {
  classId: string
  grade: string | number
  subject: string
  /** Who a post to every student reaches by email. */
  audience: StreamAudience
  /** The class option "email new posts": the checkbox starts here. */
  emailDefault: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  /** After a successful post (to every student or to chosen ones; both show in this Stream). */
  onPosted: (detail: AnnouncementDetail) => void
}

const audienceOfPreview = (preview: AudiencePreview): StreamAudience => ({
  students: preview.studentsWithAccount ?? 0,
  guardians: (preview.guardiansWithAccount ?? 0) + (preview.guardiansInvitePending ?? 0) + (preview.guardiansEmailOnly ?? 0),
})

export default function StreamComposer({
  classId,
  grade,
  subject,
  audience,
  emailDefault,
  open,
  onOpenChange,
  onPosted,
}: StreamComposerProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const bump = useMessagingStore((s) => s.bump)
  const user = useUserStore((s) => s.user)
  const files = useAnnouncementFiles(0)
  const resetFiles = files.reset

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mode, setMode] = useState<Audience>('all')
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [roster, setRoster] = useState<PickableStudent[] | null>(null)
  // The /preview answer, with the pick it answered for (a different pick has no answer yet).
  const [preview, setPreview] = useState<{ key: string; audience: AudiencePreview | null } | null>(null)
  // null follows the class option until the teacher decides for this post.
  const [emailChoice, setEmailChoice] = useState<boolean | null>(null)
  const [ackRequested, setAckRequested] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLFormElement>(null)

  const sendEmail = emailChoice ?? emailDefault
  const label = classTitle(grade, subject)

  // Opening the composer (from the bar or ?compose=1) brings it into view and focuses the title.
  useEffect(() => {
    if (!open) return
    cardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    titleRef.current?.focus({ preventScroll: true })
  }, [open])

  // The class's students for the picker, loaded the first time "Choose students…" is picked.
  useEffect(() => {
    if (!open || mode !== 'choose' || roster !== null) return
    let cancelled = false
    getPickableStudents().then(
      (res) => {
        if (cancelled) return
        setRoster((res.data ?? []).filter((s) => s.classes.some((c) => c.classId === classId)))
      },
      () => {
        if (cancelled) return
        setRoster([])
        showNotification('Could not load students', 'error')
      },
    )
    return () => {
      cancelled = true
    }
  }, [open, mode, roster, classId, showNotification])

  // Who the picked students reach, debounced so ticking boxes does not spam /preview.
  const pickedKey = studentIds.join(',')
  useEffect(() => {
    if (!open || mode !== 'choose' || studentIds.length === 0) return
    let cancelled = false
    const timer = setTimeout(() => {
      previewAudience({ scope: 'custom', studentIds }).then(
        (res) => !cancelled && setPreview({ key: pickedKey, audience: res.data ?? null }),
        () => !cancelled && setPreview({ key: pickedKey, audience: null }),
      )
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // studentIds is compared by value through pickedKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, pickedKey])

  // No counts for a pick that is empty, still loading, or whose count could not be read: the checkbox stays neutral.
  const chosenAudience = useMemo(
    () => (studentIds.length > 0 && preview?.key === pickedKey && preview.audience ? audienceOfPreview(preview.audience) : null),
    [preview, pickedKey, studentIds.length],
  )
  const reach = mode === 'all' ? audience : chosenAudience

  const ready =
    files.preparing === 0 &&
    title.trim().length > 0 &&
    title.length <= MAX_TITLE &&
    body.trim().length > 0 &&
    body.length <= MAX_BODY &&
    (mode === 'all' || studentIds.length > 0)

  const reset = () => {
    setTitle('')
    setBody('')
    setMode('all')
    setStudentIds([])
    setPreview(null)
    setEmailChoice(null)
    setAckRequested(false)
    setError(null)
    resetFiles()
  }

  const cancel = () => {
    if (posting) return
    reset()
    onOpenChange(false)
  }

  const post = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!ready || posting) return
    setPosting(true)
    setError(null)
    const custom = mode === 'choose'
    try {
      const res = await createAnnouncement(
        custom
          ? { scope: 'custom', classId, studentIds, title: title.trim(), body: body.trim(), ackRequested, sendEmail, files: files.files }
          : { scope: 'class', classId, title: title.trim(), body: body.trim(), ackRequested, sendEmail, files: files.files },
      )
      if (res.status !== 'success' || !res.data) throw new Error(res.message || "The announcement couldn't be posted.")
      showNotification(sendEmail ? 'Announcement posted. Emails go out in 2 minutes.' : 'Announcement posted.', 'success')
      void bump()
      const posted = res.data
      reset()
      onOpenChange(false)
      onPosted(posted)
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "The announcement couldn't be posted."
      setError(message)
      showNotification(message, 'error')
    } finally {
      setPosting(false)
    }
  }

  const previewFile = (file: File) => {
    const url = URL.createObjectURL(file)
    window.open(url, '_blank', 'noopener')
    // The new tab has its own reference once it has loaded.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const name = user.fullName || user.username || 'You'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-cyan-200 hover:bg-cyan-50/30"
      >
        <Avatar name={name} avatar={user.avatar ?? null} photoUrl={user.photoUrl ?? null} size={36} />
        <span className="flex-1 text-[15px] text-slate-500">Announce something to your class</span>
        <MegaphoneIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </button>
    )
  }

  return (
    <form
      ref={cardRef}
      onSubmit={post}
      aria-label="New announcement"
      className="flex flex-col gap-3.5 rounded-2xl border border-cyan-200 bg-white p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="flex items-center gap-2.5">
          <Avatar name={name} avatar={user.avatar ?? null} photoUrl={user.photoUrl ?? null} size={36} />
          <span className="text-[15px] font-semibold text-slate-900">New announcement</span>
        </span>
        <span className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-slate-500">For</span>
          <span className="rounded-[10px] border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-900">{label}</span>
          <select
            aria-label="Which students"
            value={mode}
            onChange={(e) => setMode(e.target.value as Audience)}
            className={`${selectClass} !w-auto !rounded-[10px] !py-1.5 !text-[13px]`}
          >
            <option value="all">All students</option>
            <option value="choose">Choose students…</option>
          </select>
        </span>
      </div>

      {mode === 'choose' && (
        <StudentPicker students={roster ?? []} value={studentIds} onChange={setStudentIds} loading={roster === null} />
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-600">Title</span>
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE}
          placeholder="e.g. Science Centre trip: permission forms"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between text-xs font-medium text-slate-600">
          Message
          {body.length >= COUNTER_FROM && (
            <span className={`font-normal ${body.length >= MAX_BODY ? 'text-rose-600' : 'text-slate-400'}`}>
              {body.length.toLocaleString()} / {MAX_BODY.toLocaleString()}
            </span>
          )}
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={MAX_BODY}
          placeholder="What should your class and their parents know?"
          className={textareaClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {files.files.map((file) => (
          <span
            key={`${file.name}-${file.size}`}
            className="flex items-center gap-1.5 rounded-[10px] bg-slate-100 py-1 pl-2.5 pr-1 text-[13px] text-slate-700"
          >
            <DocumentIcon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span className="max-w-[200px] truncate">{file.name}</span>
            <span className="text-xs text-slate-400">{uploadSizeLabel(file)}</span>
            <button
              type="button"
              aria-label={`Preview ${file.name}`}
              title="Preview"
              onClick={() => previewFile(file)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              title="Remove"
              onClick={() => files.removeFile(file)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </span>
        ))}
        <input ref={files.fileInput} type="file" multiple accept={files.accept} className="hidden" onChange={(e) => void files.addFiles(e.target.files)} />
        <button
          type="button"
          onClick={() => files.fileInput.current?.click()}
          disabled={files.full}
          className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
          Attach file
        </button>
        {files.preparing > 0 ? (
          <span role="status" className="text-[11px] text-slate-500">
            Resizing {files.preparing === 1 ? 'a picture' : `${files.preparing} pictures`}…
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Up to 5 files · 10 MB each (photos are resized). Put links in the message.</span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl bg-slate-50 p-3.5">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setEmailChoice(e.target.checked)}
            className="h-[18px] w-[18px] cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <span>{emailCheckboxText(reach)}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={ackRequested}
            onChange={(e) => setAckRequested(e.target.checked)}
            className="h-[18px] w-[18px] cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <span>Ask parents to tap &ldquo;Got it&rdquo;</span>
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50/70 px-3.5 py-2.5 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2.5">
        <Button type="button" variant="secondary" onClick={cancel} disabled={posting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!ready} loading={posting}>
          Post
        </Button>
      </div>
    </form>
  )
}
