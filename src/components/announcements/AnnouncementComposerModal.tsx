'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircleIcon, EnvelopeIcon, ExclamationTriangleIcon, LockClosedIcon, MegaphoneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, Field, FieldRow, ModalBody, ModalFooter, ModalHeader, inputClass, textareaClass } from '@/components/shared/modalKit'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useUserStore } from '@/store/useUserStore'
import { createAnnouncement, getAnnouncementTargets, getPickableStudents, previewAudience, sendAnnouncementPreviewEmail, updateAnnouncement } from '@/services/announcementService'
import type { AnnouncementDetail, AnnouncementScope, AnnouncementSender, AnnouncementTargets, AudiencePreview, PickableStudent } from '@/services/types/announcement'
import { MAX_BODY, formatBytes } from '@/components/messaging/formatters'
import type { Tone } from '@/components/messaging/tones'
import SearchableSelect from '@/components/ui/SearchableSelect'
import StudentPicker from './StudentPicker'
import { useAnnouncementFiles } from './useAnnouncementFiles'

const MAX_TITLE = 120
const MAX_PREVIEW_RECIPIENTS = 5

/** "a@x.com, b@y.com" → ['a@x.com', 'b@y.com'] (commas, semicolons or whitespace). */
const parseRecipients = (raw: string) => [...new Set(raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))]

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
  { value: 'custom', label: 'Custom', hint: 'Pick the families yourself.', locked: 'No students to pick' },
]

/** "Replies go to you, Majida, Fatima and info@…" */
const replyToLine = (sender: AnnouncementSender) => {
  const names = sender.replyTo.map((r) => r.name || r.email)
  const all = sender.includesAuthor ? ['you', ...names] : names
  if (all.length === 0) return 'Replies are not forwarded anywhere yet.'
  if (all.length === 1) return `Replies go to ${all[0]}.`
  return `Replies go to ${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}.`
}

/**
 * New announcement / Edit announcement. Audience is chosen once (create) and
 * frozen afterwards, except a custom post whose picked students may change;
 * title, body, pin date, acknowledgement flag and attachments stay editable.
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
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [roster, setRoster] = useState<PickableStudent[] | null>(null)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [ackRequested, setAckRequested] = useState(false)
  const [preview, setPreview] = useState<AudiencePreview | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const myEmail = useUserStore((s) => s.user.email) ?? ''
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTo, setPreviewTo] = useState('')
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
      setStudentIds((existing.students ?? []).map((s) => s.studentId))
      setAckRequested(existing.ackRequested)
    } else {
      setScope('class')
      setClassId(presetClassId ?? '')
      setGrade('')
      setTitle('')
      setBody('')
      setPinnedUntil('')
      setKeepAttachments([])
      setStudentIds([])
      setAckRequested(false)
    }
    resetFiles()
    setPreview(null)
    setPreviewOpen(false)
    setPreviewTo(myEmail)
  }, [isOpen, mode, existing, presetClassId, resetFiles, myEmail])

  // What may I post to, and where do replies land? (Both modes: the sender line shows on edit too.)
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    getAnnouncementTargets()
      .then((res) => {
        if (cancelled) return
        const t = res.data ?? { classes: [], grades: [], canSchool: false, canCustom: false, sender: null }
        setTargets(t)
        if (mode !== 'create') return
        setClassId((cur) => (t.classes.some((c) => c.classId === cur) ? cur : t.classes[0]?.classId ?? ''))
        setGrade((cur) => (t.grades.some((g) => g.grade === cur) ? cur : t.grades[0]?.grade ?? ''))
        setScope((cur) => (cur === 'class' && t.classes.length === 0 ? (t.grades.length ? 'grade' : t.canSchool ? 'school' : t.canCustom ? 'custom' : 'class') : cur))
      })
      .catch(() => showNotification('Could not load your classes', 'error'))
    return () => {
      cancelled = true
    }
  }, [isOpen, mode, showNotification])

  // Custom: the roster the picker draws from, loaded once per open.
  useEffect(() => {
    if (!isOpen) {
      setRoster(null)
      return
    }
    if (scope !== 'custom' || roster !== null) return
    let cancelled = false
    setRosterLoading(true)
    getPickableStudents()
      .then((res) => !cancelled && setRoster(res.data ?? []))
      .catch(() => {
        if (cancelled) return
        setRoster([])
        showNotification('Could not load students', 'error')
      })
      .finally(() => !cancelled && setRosterLoading(false))
    return () => {
      cancelled = true
    }
  }, [isOpen, scope, roster, showNotification])

  // Recipient summary for the chosen audience: on create, and on edit for a custom
  // post whose selection may change. Debounced so ticking boxes does not spam /preview.
  const customKey = studentIds.join(',')
  useEffect(() => {
    if (!isOpen) return
    if (mode === 'edit' && scope !== 'custom') return
    if (scope === 'class' && !classId) return
    if (scope === 'grade' && !grade) return
    if (scope === 'custom' && studentIds.length === 0) {
      setPreview(null)
      return
    }
    let cancelled = false
    const run = () =>
      previewAudience({ scope, classId: scope === 'class' ? classId : undefined, grade: scope === 'grade' ? grade : undefined, studentIds: scope === 'custom' ? studentIds : undefined })
        .then((res) => !cancelled && setPreview(res.data ?? null))
        .catch(() => !cancelled && setPreview(null))
    const timer = setTimeout(run, scope === 'custom' ? 300 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // studentIds is compared by value through customKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, scope, classId, grade, customKey])

  const unlocked = useMemo(
    () => ({
      class: (targets?.classes.length ?? 0) > 0,
      grade: (targets?.grades.length ?? 0) > 0,
      school: Boolean(targets?.canSchool),
      custom: Boolean(targets?.canCustom),
    }),
    [targets],
  )

  const ready =
    title.trim().length > 0 &&
    title.length <= MAX_TITLE &&
    body.trim().length > 0 &&
    body.length <= MAX_BODY &&
    (scope === 'custom' ? studentIds.length > 0 : mode === 'edit' || scope === 'school' || (scope === 'class' ? Boolean(classId) : Boolean(grade)))

  const previewRecipients = parseRecipients(previewTo)
  const previewTooMany = previewRecipients.length > MAX_PREVIEW_RECIPIENTS

  // The email a guardian will get, sent to the author or to colleagues they name.
  const emailPreview = async () => {
    if (!ready || previewing || previewTooMany) return
    setPreviewing(true)
    try {
      const audience = mode === 'edit' && existing ? existing : { scope, classId, grade }
      const res = await sendAnnouncementPreviewEmail({
        scope: audience.scope,
        classId: audience.scope === 'class' ? audience.classId ?? undefined : undefined,
        grade: audience.scope === 'grade' ? audience.grade ?? undefined : undefined,
        studentIds: audience.scope === 'custom' ? studentIds : undefined,
        title: title.trim(),
        body: body.trim(),
        attachmentCount: files.files.length + keepAttachments.length,
        to: previewRecipients,
      })
      if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not send the preview')
      showNotification(`Preview sent to ${res.data.sentTo.join(', ')}`, 'success')
      setPreviewOpen(false)
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
              ackRequested,
              studentIds: existing.scope === 'custom' ? studentIds : undefined,
              removeAttachmentIds: existing.attachments.map((a) => a.attachmentId).filter((id) => !keepAttachments.includes(id)),
              files: files.files,
            })
          : await createAnnouncement({
              scope,
              classId: scope === 'class' ? classId : undefined,
              grade: scope === 'grade' ? grade : undefined,
              studentIds: scope === 'custom' ? studentIds : undefined,
              ackRequested,
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
  const sender = targets?.sender ?? null
  const showPicker = scope === 'custom' && (mode === 'create' || existing?.scope === 'custom')

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
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
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
              Audience: <strong className="font-medium">{existing.scopeLabel}</strong>
              {existing.scope === 'custom'
                ? '. Adding families emails only them; removing families cancels their pending emails.'
                : ' (cannot be changed).'}
            </p>
          )
        )}

        {showPicker && <StudentPicker students={roster ?? []} value={studentIds} onChange={setStudentIds} loading={rosterLoading} />}

        <FieldRow>
          {mode === 'create' && scope === 'class' && (
            <Field label="Class" required>
              <SearchableSelect
                options={(targets?.classes ?? []).map((c) => ({
                  value: c.classId,
                  label: `${c.grade ? `Gr ${c.grade} ` : ''}${c.subject} · ${c.studentCount} students`,
                }))}
                value={classId}
                onChange={setClassId}
                ariaLabel="Class"
                searchPlaceholder="Find a class"
              />
            </Field>
          )}
          {mode === 'create' && scope === 'grade' && (
            <Field label="Grade" required>
              <SearchableSelect
                options={(targets?.grades ?? []).map((g) => ({ value: g.grade, label: `Grade ${g.grade} · ${g.studentCount} students` }))}
                value={grade}
                onChange={setGrade}
                ariaLabel="Grade"
                searchPlaceholder="Find a grade"
              />
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

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <input type="checkbox" checked={ackRequested} onChange={(e) => setAckRequested(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
          <span className="text-xs text-slate-700">
            Ask families to confirm they&apos;ve read this
            <span className="text-slate-400"> · adds a &ldquo;Got it&rdquo; button; you see who has acknowledged</span>
          </span>
        </label>

        {preview && (
          <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-700">
            <p className="flex items-start gap-2">
              <CheckCircleIcon className="mt-px h-4 w-4 flex-shrink-0 text-emerald-500" />
              <span>
                <strong className="font-medium">{preview.guardiansWithAccount} guardians</strong> of {preview.students} students{' '}
                {mode === 'edit' ? 'are in the audience and see this in SchoolMule.' : 'will see this in SchoolMule and get an email.'}
              </span>
            </p>
            {preview.guardiansEmailOnly + preview.guardiansInvitePending > 0 && (
              <p className="flex items-start gap-2 text-amber-900">
                <ExclamationTriangleIcon className="mt-px h-4 w-4 flex-shrink-0 text-amber-500" />
                <span>
                  <strong className="font-medium">{preview.guardiansEmailOnly + preview.guardiansInvitePending} guardians</strong> have an email on file but no account yet
                  {mode === 'edit' ? ' and are reached by email only.' : ': they get the same email with a sign-up link.'}
                </span>
              </p>
            )}
            <p className="pl-6 text-slate-500">
              {noEmail.length > 0 &&
                `${noEmail.length} student${noEmail.length === 1 ? ' has' : 's have'} no guardian email on file (${noEmail.map((s) => s.name).join(', ')}). `}
              {mode === 'edit'
                ? 'Only families added now are emailed; families removed lose their pending email.'
                : 'Emails go out 2 minutes after posting; edit or delete before then and the email follows.'}
            </p>
          </div>
        )}
        {sender && (
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <EnvelopeIcon className="mt-px h-4 w-4 flex-shrink-0 text-slate-400" />
            <span>
              Emails come from <strong className="font-medium text-slate-700">{sender.from}</strong>. {replyToLine(sender)}{' '}
              {sender.canEdit && (
                <Link href="/admin-panel/school-settings" className="font-medium text-cyan-700 hover:text-cyan-900">
                  Change the office inboxes
                </Link>
              )}
            </span>
          </p>
        )}
        {previewOpen && (
          <div className="space-y-2 rounded-xl border border-cyan-100 bg-cyan-50/50 px-3.5 py-3">
            <Field label="Send a preview to" htmlFor="an-preview-to" hint={`Exactly what a guardian will receive, marked [Preview]. Separate addresses with commas, up to ${MAX_PREVIEW_RECIPIENTS}.`}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="an-preview-to"
                  value={previewTo}
                  onChange={(e) => setPreviewTo(e.target.value)}
                  placeholder="you@school.ca, principal@school.ca"
                  className={inputClass}
                  autoFocus
                />
                <Button type="button" onClick={emailPreview} disabled={!ready || saving || previewRecipients.length === 0 || previewTooMany} loading={previewing} className="sm:flex-shrink-0">
                  <EnvelopeIcon className="h-4 w-4" /> Send preview
                </Button>
              </div>
            </Field>
            {previewTooMany && <p className="text-xs text-rose-600">At most {MAX_PREVIEW_RECIPIENTS} addresses per preview.</p>}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={() => setPreviewOpen((v) => !v)} disabled={!ready || saving} className="mr-auto" title="Email the message as guardians will get it, to yourself or a colleague">
          <EnvelopeIcon className="h-4 w-4" /> {previewOpen ? 'Hide preview' : 'Email a preview'}
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
