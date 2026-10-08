'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, LockClosedIcon, MegaphoneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, Field, FieldRow, ModalBody, ModalFooter, ModalHeader, inputClass, selectClass, textareaClass } from '@/components/shared/modalKit'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useMessagingStore } from '@/store/useMessagingStore'
import { createAnnouncement, getAnnouncementTargets, previewAudience, sendAnnouncementPreviewEmail, updateAnnouncement } from '@/services/announcementService'
import type { AnnouncementDetail, AnnouncementScope, AnnouncementTargets, AudiencePreview } from '@/services/types/announcement'
import { MAX_BODY, formatBytes } from '@/components/messaging/formatters'
import type { Tone } from '@/components/messaging/tones'
import { useAnnouncementFiles } from './useAnnouncementFiles'

const MAX_TITLE = 120

interface Props {
  isOpen: boolean
  onClose: () => void
  tone: Tone
  mode: 'create' | 'edit'
  /** Edit mode: the announcement being changed (scope is immutable). */
  existing?: AnnouncementDetail | null
  /** Create mode: preselect this class. */
  presetClassId?: string
  onSaved: (detail: AnnouncementDetail) => void
}

const SCOPE_CARDS: { value: AnnouncementScope; label: string; hint: string; locked: string }[] = [
  { value: 'class', label: 'A class', hint: 'Classes you lead or co-teach this year.', locked: 'No classes this year' },
  { value: 'grade', label: 'A grade', hint: 'Every student in the grade.', locked: 'Admins and homeroom teachers only' },
  { value: 'school', label: 'Whole school', hint: 'Every family in the school.', locked: 'Admins only' },
]

/**
 * New announcement / Edit announcement. Audience is chosen once (create) and
 * frozen afterwards; title, body, pin date and attachments stay editable.
 * The recipient summary comes from /preview so a teacher sees, before
 * posting, who will be emailed and who has no account.
 */
const AnnouncementComposerModal: React.FC<Props> = ({ isOpen, onClose, tone, mode, existing, presetClassId, onSaved }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const bump = useMessagingStore((s) => s.bump)
  const [targets, setTargets] = useState<AnnouncementTargets | null>(null)
  const [scope, setScope] = useState<AnnouncementScope>('class')
  const [classId, setClassId] = useState('')
  const [grade, setGrade] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinnedUntil, setPinnedUntil] = useState('')
  const [keepAttachments, setKeepAttachments] = useState<string[]>([])
  const [preview, setPreview] = useState<AudiencePreview | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const files = useAnnouncementFiles(keepAttachments.length)
  const resetFiles = files.reset

  // Reset on open, honouring the record being edited or the preset class.
  useEffect(() => {
    if (!isOpen) return
    if (mode === 'edit' && existing) {
      setScope(existing.scope)
      setClassId(existing.classId ?? '')
      setGrade(existing.grade ?? '')
      setTitle(existing.title)
      setBody(existing.body)
      setPinnedUntil(existing.pinnedUntil ?? '')
      setKeepAttachments(existing.attachments.map((a) => a.attachmentId))
    } else {
      setScope('class')
      setClassId(presetClassId ?? '')
      setGrade('')
      setTitle('')
      setBody('')
      setPinnedUntil('')
      setKeepAttachments([])
    }
    resetFiles()
    setPreview(null)
  }, [isOpen, mode, existing, presetClassId, resetFiles])

  // Create: what may I post to?
  useEffect(() => {
    if (!isOpen || mode !== 'create') return
    let cancelled = false
    getAnnouncementTargets()
      .then((res) => {
        if (cancelled) return
        const t = res.data ?? { classes: [], grades: [], canSchool: false }
        setTargets(t)
        setClassId((cur) => (t.classes.some((c) => c.classId === cur) ? cur : t.classes[0]?.classId ?? ''))
        setGrade((cur) => (t.grades.some((g) => g.grade === cur) ? cur : t.grades[0]?.grade ?? ''))
        setScope((cur) => (cur === 'class' && t.classes.length === 0 ? (t.grades.length ? 'grade' : t.canSchool ? 'school' : 'class') : cur))
      })
      .catch(() => showNotification('Could not load your classes', 'error'))
    return () => {
      cancelled = true
    }
  }, [isOpen, mode, showNotification])

  // Create: recipient summary for the chosen audience.
  useEffect(() => {
    if (!isOpen || mode !== 'create') return
    if (scope === 'class' && !classId) return
    if (scope === 'grade' && !grade) return
    let cancelled = false
    previewAudience({ scope, classId: scope === 'class' ? classId : undefined, grade: scope === 'grade' ? grade : undefined })
      .then((res) => !cancelled && setPreview(res.data ?? null))
      .catch(() => !cancelled && setPreview(null))
    return () => {
      cancelled = true
    }
  }, [isOpen, mode, scope, classId, grade])

  const unlocked = useMemo(
    () => ({
      class: (targets?.classes.length ?? 0) > 0,
      grade: (targets?.grades.length ?? 0) > 0,
      school: Boolean(targets?.canSchool),
    }),
    [targets],
  )

  const ready =
    title.trim().length > 0 &&
    title.length <= MAX_TITLE &&
    body.trim().length > 0 &&
    body.length <= MAX_BODY &&
    (mode === 'edit' || scope === 'school' || (scope === 'class' ? Boolean(classId) : Boolean(grade)))

  // The email a guardian will get, sent to the author first.
  const emailPreview = async () => {
    if (!ready || previewing) return
    setPreviewing(true)
    try {
      const audience = mode === 'edit' && existing ? existing : { scope, classId, grade }
      const res = await sendAnnouncementPreviewEmail({
        scope: audience.scope,
        classId: audience.scope === 'class' ? audience.classId ?? undefined : undefined,
        grade: audience.scope === 'grade' ? audience.grade ?? undefined : undefined,
        title: title.trim(),
        body: body.trim(),
        attachmentCount: files.files.length + keepAttachments.length,
      })
      if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not send the preview')
      showNotification(`Preview sent to ${res.data.sentTo}`, 'success')
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not send the preview', 'error')
    } finally {
      setPreviewing(false)
    }
  }

  const save = async () => {
    if (!ready || saving) return
    setSaving(true)
    try {
      const pin = pinnedUntil || null
      const res =
        mode === 'edit' && existing
          ? await updateAnnouncement(existing.announcementId, {
              title: title.trim(),
              body: body.trim(),
              pinnedUntil: pin,
              removeAttachmentIds: existing.attachments.map((a) => a.attachmentId).filter((id) => !keepAttachments.includes(id)),
              files: files.files,
            })
          : await createAnnouncement({
              scope,
              classId: scope === 'class' ? classId : undefined,
              grade: scope === 'grade' ? grade : undefined,
              title: title.trim(),
              body: body.trim(),
              pinnedUntil: pin,
              files: files.files,
            })
      if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not save')
      showNotification(mode === 'edit' ? 'Announcement updated' : 'Announcement posted. Emails go out in 2 minutes.', 'success')
      void bump()
      onSaved(res.data)
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not save announcement', 'error')
    } finally {
      setSaving(false)
    }
  }

  const existingKept = (existing?.attachments ?? []).filter((a) => keepAttachments.includes(a.attachmentId))
  const noEmail = preview?.studentsWithoutEmail ?? []

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalHeader
        title={mode === 'edit' ? 'Edit announcement' : 'New announcement'}
        subtitle={mode === 'edit' ? 'Everyone sees the change; nobody is emailed again.' : 'One post, every guardian of every student in the audience.'}
        icon={MegaphoneIcon}
        tone={tone === 'parent' ? 'warning' : 'brand'}
      />
      <ModalBody>
        {mode === 'create' ? (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Audience</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {SCOPE_CARDS.map((c) => {
                const locked = !unlocked[c.value]
                const active = scope === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    disabled={locked}
                    onClick={() => setScope(c.value)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      locked
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70'
                        : active
                          ? 'cursor-pointer border-cyan-400 bg-cyan-50 ring-2 ring-cyan-100'
                          : 'cursor-pointer border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                      {c.label}
                      {locked && <LockClosedIcon className="h-3.5 w-3.5 text-slate-400" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">{locked ? c.locked : c.hint}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          existing && (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Audience: <strong className="font-medium">{existing.scopeLabel}</strong> (cannot be changed).
            </p>
          )
        )}

        <FieldRow>
          {mode === 'create' && scope === 'class' && (
            <Field label="Class" htmlFor="an-class" required>
              <select id="an-class" value={classId} onChange={(e) => setClassId(e.target.value)} className={selectClass}>
                {(targets?.classes ?? []).map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.grade ? `Gr ${c.grade} ` : ''}
                    {c.subject} · {c.studentCount} students
                  </option>
                ))}
              </select>
            </Field>
          )}
          {mode === 'create' && scope === 'grade' && (
            <Field label="Grade" htmlFor="an-grade" required>
              <select id="an-grade" value={grade} onChange={(e) => setGrade(e.target.value)} className={selectClass}>
                {(targets?.grades ?? []).map((g) => (
                  <option key={g.grade} value={g.grade}>
                    Grade {g.grade} · {g.studentCount} students
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Pin to top until" htmlFor="an-pin" hint="Optional. Stays first in every feed until this date.">
            <input id="an-pin" type="date" value={pinnedUntil} onChange={(e) => setPinnedUntil(e.target.value)} className={inputClass} />
          </Field>
        </FieldRow>

        <Field label="Title" htmlFor="an-title" required hint={`Also the email subject. ${title.length} / ${MAX_TITLE}`}>
          <input
            id="an-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_TITLE}
            className={inputClass}
            placeholder="e.g. Field trip permission forms due Friday"
          />
        </Field>

        <Field label="Message" htmlFor="an-body" required>
          <textarea
            id="an-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            maxLength={MAX_BODY + 1}
            className={textareaClass}
            placeholder="What should every family know?"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input ref={files.fileInput} type="file" multiple accept={files.accept} className="hidden" onChange={(e) => files.addFiles(e.target.files)} />
            <Button type="button" variant="secondary" onClick={() => files.fileInput.current?.click()} disabled={files.full} className="!px-3 !py-1.5 !text-xs">
              <PaperClipIcon className="h-4 w-4" /> Attach
            </Button>
            {existingKept.map((a) => (
              <span key={a.attachmentId} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2 pr-1 text-xs text-slate-700">
                <span className="max-w-[160px] truncate">{a.fileName}</span>
                <span className="text-slate-400">{formatBytes(a.sizeBytes)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${a.fileName}`}
                  onClick={() => setKeepAttachments((k) => k.filter((id) => id !== a.attachmentId))}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-200 cursor-pointer"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {files.files.map((f) => (
              <span key={`${f.name}-${f.size}`} className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 py-1 pl-2 pr-1 text-xs text-slate-700">
                <span className="max-w-[160px] truncate">{f.name}</span>
                <span className="text-slate-400">{formatBytes(f.size)}</span>
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => files.removeFile(f)} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 cursor-pointer">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <span className="text-[11px] text-slate-400">Up to 5 files · 10 MB each</span>
          </div>
        </Field>

        {mode === 'create' && preview && (
          <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-700">
            <p className="flex items-start gap-2">
              <CheckCircleIcon className="mt-px h-4 w-4 flex-shrink-0 text-emerald-500" />
              <span>
                <strong className="font-medium">{preview.guardiansWithAccount} guardians</strong> of {preview.students} students will see this in SchoolMule and get an email.
              </span>
            </p>
            {preview.guardiansEmailOnly + preview.guardiansInvitePending > 0 && (
              <p className="flex items-start gap-2 text-amber-900">
                <ExclamationTriangleIcon className="mt-px h-4 w-4 flex-shrink-0 text-amber-500" />
                <span>
                  <strong className="font-medium">{preview.guardiansEmailOnly + preview.guardiansInvitePending} guardians</strong> have an email on file but no account yet: they get the same
                  email with a sign-up link.
                </span>
              </p>
            )}
            <p className="pl-6 text-slate-500">
              {noEmail.length > 0 &&
                `${noEmail.length} student${noEmail.length === 1 ? ' has' : 's have'} no guardian email on file (${noEmail.map((s) => s.name).join(', ')}). `}
              Emails go out 2 minutes after posting; edit or delete before then and the email follows.
            </p>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={emailPreview} disabled={!ready || saving} loading={previewing} className="mr-auto" title="Send yourself the email guardians will get">
          Email me a preview
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={save} disabled={!ready} loading={saving}>
          {mode === 'edit' ? 'Save changes' : 'Post announcement'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default AnnouncementComposerModal
