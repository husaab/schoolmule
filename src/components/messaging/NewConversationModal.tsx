'use client'

import React, { useEffect, useState } from 'react'
import { ChatBubbleLeftRightIcon, ClipboardDocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Field, ModalBody, ModalHeader, inputClass, selectClass } from '@/components/shared/modalKit'
import { useSelectedChildStore } from '@/store/useSelectedChildStore'
import { useUserStore } from '@/store/useUserStore'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createConversation, getParentTargets, getStaffTargets, getStaffTargetsForStudent } from '@/services/messagingService'
import type { ParentTargets, SenderRole, StaffTargetGuardian, StaffTargets, Thread } from '@/services/types/messaging'
import Composer from './Composer'
import { toneClasses, type Tone } from './tones'

type Mode = 'assessment' | 'general'

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  tone: Tone
  role: SenderRole
  /** Staff: the class the picker is scoped to (gradebook). */
  classId?: string
  /** Pre-select (grades row, gradebook modal, Students page). */
  preset?: {
    studentId?: string
    assessmentId?: string
    mode?: Mode
    /** "Ask about this": lock the recipient to the announcement's author and prefill the subject. */
    teacherId?: string
    title?: string
    announcementId?: string
    announcementScopeLabel?: string
    authorName?: string
    /** Children the announcement reached; the child picker is limited to these. */
    childIds?: string[]
  }
  onCreated: (thread: Thread) => void
}

const MAX_TITLE = 120

/**
 * The "New message" picker. First choice: about a specific assessment, or
 * General. Parents then pick child → class → assessment, or child → teacher
 * → subject; staff pick student → assessment, or student → subject (the
 * thread goes to the student's teacher, i.e. the caller). When a guardian
 * has an email but no account, staff see the invite note and send with
 * "Send and invite".
 */
const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  tone,
  role,
  classId,
  preset,
  onCreated,
}) => {
  const t = toneClasses(tone)
  const isParent = role === 'PARENT'
  const children = useSelectedChildStore((s) => s.children)
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const bump = useMessagingStore((s) => s.bump)
  const me = useUserStore((s) => s.user)

  const [mode, setMode] = useState<Mode>('assessment')
  const [studentId, setStudentId] = useState('')
  const [pickedClassId, setPickedClassId] = useState(classId ?? '')
  const [assessmentId, setAssessmentId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [title, setTitle] = useState('')
  // Staff: the class (subject) in play. Required for an assessment, optional for General.
  const [staffClassId, setStaffClassId] = useState(classId ?? '')
  const [invite, setInvite] = useState(true)
  const [includePreview, setIncludePreview] = useState(true)
  const [parentTargets, setParentTargets] = useState<ParentTargets | null>(null)
  const [staffTargets, setStaffTargets] = useState<StaffTargets | null>(null)
  const [loading, setLoading] = useState(false)

  // Reset on open, honouring presets.
  useEffect(() => {
    if (!isOpen) return
    const childIds = preset?.childIds
    const allowed = childIds?.length ? children.filter((c) => childIds.includes(c.studentId)) : children
    const defaultChild =
      preset?.studentId ?? (allowed.find((c) => c.studentId === selectedChildId)?.studentId ?? allowed[0]?.studentId ?? '')
    setStudentId(isParent ? defaultChild : preset?.studentId ?? '')
    setPickedClassId(classId ?? '')
    setStaffClassId(classId ?? '')
    setAssessmentId(preset?.assessmentId ?? '')
    setMode(preset?.announcementId ? 'general' : preset?.mode ?? (preset?.assessmentId ? 'assessment' : classId ? 'assessment' : 'general'))
    setTeacherId(preset?.teacherId ?? '')
    setTitle(preset?.title ?? '')
    setInvite(true)
    setIncludePreview(true)
    // childIds is compared by value (joined key) so a caller passing a fresh array each render cannot reset the form mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preset?.studentId, preset?.assessmentId, preset?.mode, preset?.teacherId, preset?.title, preset?.announcementId, preset?.childIds?.join(','), classId, isParent, children, selectedChildId])

  // Parent: classes, assessments and teachers for the chosen child.
  useEffect(() => {
    if (!isOpen || !isParent || !studentId) return
    let cancelled = false
    setLoading(true)
    getParentTargets(studentId)
      .then((res) => {
        if (cancelled) return
        const data = res.data ?? { currentTerm: null, classes: [], teachers: [] }
        setParentTargets(data)
        setPickedClassId((cur) => {
          if (data.classes.some((c) => c.classId === cur)) return cur
          const withAssessment = data.classes.find((c) => c.assessments.some((a) => a.assessmentId === assessmentId))
          return withAssessment?.classId ?? data.classes[0]?.classId ?? ''
        })
        setTeacherId((cur) => (data.teachers.some((x) => x.userId === cur) || (cur && cur === preset?.teacherId) ? cur : data.teachers[0]?.userId ?? ''))
      })
      .catch(() => showNotification('Could not load teachers', 'error'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // assessmentId / preset.teacherId are read for a one-time reconciliation only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isParent, studentId, showNotification])

  // Staff: students (+ guardians) and assessments of the class, or one student.
  useEffect(() => {
    if (!isOpen || isParent) return
    if (!classId && !preset?.studentId) return
    let cancelled = false
    setLoading(true)
    const req = classId ? getStaffTargets(classId) : getStaffTargetsForStudent(preset?.studentId as string)
    req
      .then((res) => {
        if (!cancelled) setStaffTargets(res.data ?? null)
      })
      .catch(() => showNotification('Could not load students', 'error'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [isOpen, isParent, classId, preset?.studentId, showNotification])

  const parentClass = parentTargets?.classes.find((c) => c.classId === pickedClassId) ?? null
  // Staff classes: the one the picker was opened for, or the student's classes the caller teaches.
  const staffClasses = classId
    ? [{ classId, subject: 'This class', assessments: staffTargets?.assessments ?? [] }]
    : staffTargets?.classes ?? []
  const staffClass = staffClasses.find((c) => c.classId === staffClassId) ?? null
  const assessments = isParent ? parentClass?.assessments ?? [] : staffClass?.assessments ?? []
  const staffStudent = !isParent ? staffTargets?.students.find((s) => s.studentId === studentId) : undefined
  const guardians: StaffTargetGuardian[] = staffStudent?.guardians ?? []
  const unlinked = guardians.filter((g) => !g.hasAccount && !g.invitePending && g.email)
  const pending = guardians.filter((g) => g.invitePending)
  const withAccount = guardians.filter((g) => g.hasAccount)
  const existingId = isParent && mode === 'assessment' ? parentClass?.assessments.find((a) => a.assessmentId === assessmentId)?.conversationId ?? null : null
  const fromAnnouncement = Boolean(preset?.announcementId)
  const teacher =
    parentTargets?.teachers.find((x) => x.userId === teacherId) ??
    (fromAnnouncement && teacherId ? { userId: teacherId, name: preset?.authorName ?? 'the author', via: 'Announcement' } : null)

  // Threads may only be started about current-term classes. The backend
  // enforces this; here it shapes the hints and, for a teacher opening the
  // picker from a past-term gradebook, blocks sending up front.
  const currentTerm = (isParent ? parentTargets?.currentTerm : staffTargets?.currentTerm) ?? null
  const pastTermClass = !isParent && Boolean(classId) && staffTargets?.inCurrentTerm === false
  const blockedByTerm = pastTermClass && role === 'TEACHER'

  const ready =
    !blockedByTerm &&
    Boolean(studentId) &&
    (mode === 'assessment'
      ? Boolean(assessmentId) && (isParent ? Boolean(pickedClassId) : Boolean(staffClassId))
      : Boolean(title.trim()) && title.trim().length <= MAX_TITLE && (isParent ? Boolean(teacherId) : true))

  const willInvite = !isParent && invite && unlinked.length > 0
  const recipients = isParent
    ? mode === 'assessment'
      ? parentClass?.teacherName
        ? `${parentClass.teacherName} will be emailed`
        : undefined
      : teacher
        ? `${teacher.name} will be emailed`
        : undefined
    : withAccount.length > 0
      ? `${withAccount.length} guardian${withAccount.length === 1 ? '' : 's'} will be emailed${willInvite ? `, ${unlinked.length} invited` : ''}`
      : willInvite
        ? `${unlinked.length} guardian${unlinked.length === 1 ? '' : 's'} will be invited by email`
        : undefined

  const send = async ({ body, files }: { body: string; files: File[] }) => {
    const flags = isParent ? {} : { invite, includePreview }
    const res =
      mode === 'assessment'
        ? await createConversation({ studentId, classId: isParent ? pickedClassId : staffClassId, assessmentId, body, files, ...flags })
        : await createConversation({
            studentId,
            // Staff general threads go to the caller; parents choose the teacher.
            teacherId: isParent ? teacherId : (me?.id as string),
            title: title.trim(),
            ...(!isParent && staffClassId ? { classId: staffClassId } : {}),
            ...(isParent && preset?.announcementId ? { announcementId: preset.announcementId } : {}),
            body,
            files,
            ...flags,
          })
    if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not send message')
    void bump()
    const invited = (res.data.invites ?? []).filter((i) => i.status === 'invited').length
    showNotification(
      existingId ? 'Added to the existing conversation' : invited > 0 ? `Message sent · ${invited} guardian${invited === 1 ? '' : 's'} invited` : 'Message sent',
      'success',
    )
    onCreated(res.data)
  }

  const choice = (value: Mode, label: string, hint: string, Icon: React.ComponentType<{ className?: string }>) => {
    const active = mode === value
    return (
      <button
        type="button"
        onClick={() => setMode(value)}
        className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${active ? t.chipActive : 'border-slate-200 bg-white hover:bg-slate-50'}`}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" /> {label}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
      </button>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title="New message"
        subtitle={isParent ? 'Ask about a mark, or anything else about your child' : 'Write to a student’s guardians'}
        icon={ChatBubbleLeftRightIcon}
        tone={isParent ? 'warning' : 'brand'}
      />
      <ModalBody>
        {fromAnnouncement ? (
          <p className={`rounded-xl px-3 py-2 text-xs ${t.context}`}>
            About the announcement <strong className="font-medium">{(preset?.title ?? '').replace(/^Re: /, '')}</strong>
            {preset?.announcementScopeLabel ? ` · ${preset.announcementScopeLabel}` : ''}. This starts a private conversation with{' '}
            {preset?.authorName ?? 'the author'}.
          </p>
        ) : (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">What is this about?</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {choice('assessment', 'A specific assessment', 'The score sits beside the chat.', ClipboardDocumentCheckIcon)}
              {choice('general', 'General', 'Attendance, homework, a concern, a thank-you.', ChatBubbleLeftRightIcon)}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={isParent ? 'Child' : 'Student'} htmlFor="nc-student" required>
            <select
              id="nc-student"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value)
                setAssessmentId('')
              }}
              className={selectClass}
              disabled={!isParent && Boolean(preset?.studentId)}
            >
              <option value="">Select…</option>
              {(isParent
                ? children.filter((c) => !preset?.childIds?.length || preset.childIds.includes(c.studentId)).map((c) => ({ id: c.studentId, name: c.name }))
                : (staffTargets?.students ?? []).map((s) => ({ id: s.studentId, name: s.name }))
              ).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          {isParent && mode === 'assessment' && (
            <Field
              label="Class"
              htmlFor="nc-class"
              required
              hint={
                parentTargets && parentTargets.classes.length === 0
                  ? currentTerm
                    ? `No ${currentTerm.name} classes yet`
                    : 'No classes this year yet'
                  : currentTerm
                    ? `${currentTerm.name} classes`
                    : undefined
              }
            >
              <select
                id="nc-class"
                value={pickedClassId}
                onChange={(e) => {
                  setPickedClassId(e.target.value)
                  setAssessmentId('')
                }}
                className={selectClass}
                disabled={loading || !parentTargets?.classes.length}
              >
                <option value="">Select…</option>
                {(parentTargets?.classes ?? []).map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.subject}
                    {c.teacherName ? ` · ${c.teacherName}` : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {isParent && mode === 'general' && (
            <Field
              label="To"
              htmlFor="nc-teacher"
              required
              hint={currentTerm && !fromAnnouncement ? `Teachers of ${currentTerm.name} classes, the homeroom teacher and the school office` : undefined}
            >
              <select
                id="nc-teacher"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className={selectClass}
                disabled={fromAnnouncement || loading || !parentTargets?.teachers.length}
              >
                <option value="">Select…</option>
                {fromAnnouncement && teacherId && !parentTargets?.teachers.some((x) => x.userId === teacherId) && (
                  <option value={teacherId}>{preset?.authorName ?? 'Announcement author'} · Announcement</option>
                )}
                {(() => {
                  const all = parentTargets?.teachers ?? []
                  const teachers = all.filter((x) => x.role !== 'ADMIN')
                  const office = all.filter((x) => x.role === 'ADMIN')
                  const opt = (x: (typeof all)[number]) => (
                    <option key={x.userId} value={x.userId}>
                      {x.name} · {x.via}
                    </option>
                  )
                  // Group only once there is a second group to tell apart.
                  if (!office.length) return teachers.map(opt)
                  return (
                    <>
                      <optgroup label="Teachers">{teachers.map(opt)}</optgroup>
                      <optgroup label="School office">{office.map(opt)}</optgroup>
                    </>
                  )
                })()}
              </select>
            </Field>
          )}

          {!isParent && (
            <Field label="Guardians" htmlFor="nc-guardians">
              <div id="nc-guardians" className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-600">
                {guardians.length > 0 ? (
                  <ul className="space-y-0.5">
                    {guardians.map((g) => (
                      <li key={g.linkId} className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${g.hasAccount ? 'bg-emerald-500' : g.invitePending ? 'bg-sky-500' : 'bg-amber-500'}`} />
                        {g.name ?? 'Guardian'}
                        {g.relation ? ` (${g.relation})` : ''}
                        {g.invitePending && <span className="text-sky-700"> · invited, not signed up yet</span>}
                        {!g.hasAccount && !g.invitePending && <span className="text-amber-700"> · no account yet</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-400">{studentId ? 'No guardians on file' : 'Pick a student'}</span>
                )}
              </div>
            </Field>
          )}

          {!isParent && (
            <div className="sm:col-span-2">
              <Field
                label="Class"
                htmlFor="nc-staff-class"
                required={mode === 'assessment'}
                hint={mode === 'general' ? 'Optional: the subject this is about. Leave blank for a homeroom-style note.' : undefined}
              >
                <select
                  id="nc-staff-class"
                  value={staffClassId}
                  onChange={(e) => {
                    setStaffClassId(e.target.value)
                    setAssessmentId('')
                  }}
                  className={selectClass}
                  disabled={Boolean(classId) || loading || !studentId || staffClasses.length === 0}
                >
                  <option value="">{mode === 'general' ? 'No specific class' : 'Select…'}</option>
                  {staffClasses.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.subject}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {mode === 'assessment' ? (
            <div className="sm:col-span-2">
              <Field label="Assessment" htmlFor="nc-assessment" required hint={isParent ? 'Only assessments that have been shared with you' : undefined}>
                <select id="nc-assessment" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} className={selectClass} disabled={loading || assessments.length === 0}>
                  <option value="">{!isParent && !staffClassId ? 'Pick a class first' : 'Select…'}</option>
                  {assessments.map((a) => (
                    <option key={a.assessmentId} value={a.assessmentId}>
                      {a.name}
                      {'isPublished' in a && !a.isPublished ? ' (not shared yet)' : ''}
                      {'conversationId' in a && a.conversationId ? ' · conversation exists' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <Field label="Subject" htmlFor="nc-title" required hint="Shown as the conversation title in both inboxes.">
                <input id="nc-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={MAX_TITLE} className={inputClass} placeholder={isParent ? 'e.g. Away Thursday and Friday' : 'e.g. Missing homework this week'} />
              </Field>
            </div>
          )}
        </div>

        {existingId && (
          <p className={`rounded-xl px-3 py-2 text-xs ${t.context}`}>There is already a conversation about this assessment. Your message will be added to it.</p>
        )}

        {pastTermClass && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              This class is from a past term{currentTerm ? ` (the current term is ${currentTerm.name})` : ''}.{' '}
              {blockedByTerm
                ? 'New conversations can only be started about current-term classes. Existing conversations stay open for replies in your inbox.'
                : 'Teachers cannot start new conversations about it; as an admin you can.'}
            </p>
          </div>
        )}

        {!isParent && unlinked.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1.5">
              <p>
                <strong className="font-medium">{unlinked.map((g) => g.name ?? 'A guardian').join(' and ')}</strong>{' '}
                {unlinked.length === 1 ? 'has' : 'have'} no SchoolMule account yet. We can email{' '}
                {unlinked.map((g) => g.email).join(', ')} a short note with a link to sign up; this conversation will be waiting for them.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} /> Invite guardians without an account
              </label>
              <label className={`flex items-center gap-2 cursor-pointer ${invite ? '' : 'opacity-50'}`}>
                <input type="checkbox" checked={includePreview} disabled={!invite} onChange={(e) => setIncludePreview(e.target.checked)} /> Include my message in the email
              </label>
            </div>
          </div>
        )}
        {!isParent && pending.length > 0 && unlinked.length === 0 && (
          <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
            {pending.map((g) => g.name ?? 'A guardian').join(' and ')} {pending.length === 1 ? 'was' : 'were'} invited and will see this once they sign up.
          </p>
        )}

        <div className={ready ? '' : 'pointer-events-none opacity-50'}>
          <Composer
            tone={tone}
            placeholder={isParent ? 'What would you like to ask or share?' : 'What would you like the guardians to know?'}
            recipientsLabel={recipients}
            onSend={send}
            disabled={!ready}
            submitLabel={willInvite ? 'Send and invite' : 'Send message'}
          />
        </div>
      </ModalBody>
    </Modal>
  )
}

export default NewConversationModal
