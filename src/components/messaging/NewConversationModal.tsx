'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ChatBubbleLeftRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Field, ModalBody, ModalHeader, selectClass } from '@/components/shared/modalKit'
import { useSelectedChildStore } from '@/store/useSelectedChildStore'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createConversation, getParentTargets, getStaffTargets } from '@/services/messagingService'
import type { ParentTargetClass, SenderRole, StaffTargets, Thread } from '@/services/types/messaging'
import Composer from './Composer'
import { toneClasses, type Tone } from './tones'

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  tone: Tone
  role: SenderRole
  /** Staff: the class the picker is scoped to. */
  classId?: string
  /** Pre-select (from a grades row or the gradebook modal). */
  preset?: { studentId?: string; assessmentId?: string }
  onCreated: (thread: Thread) => void
}

/**
 * The "New message" picker. A parent picks child → class → assessment; staff
 * pick student → assessment within one class. Either way the thread is
 * anchored, and an existing thread for that assessment is reused rather
 * than duplicated (the server enforces this too).
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

  const [studentId, setStudentId] = useState('')
  const [pickedClassId, setPickedClassId] = useState(classId ?? '')
  const [assessmentId, setAssessmentId] = useState('')
  const [parentTargets, setParentTargets] = useState<ParentTargetClass[]>([])
  const [staffTargets, setStaffTargets] = useState<StaffTargets | null>(null)
  const [loading, setLoading] = useState(false)

  // Reset on open, honouring presets.
  useEffect(() => {
    if (!isOpen) return
    const defaultChild = preset?.studentId ?? (children.find((c) => c.studentId === selectedChildId)?.studentId ?? children[0]?.studentId ?? '')
    setStudentId(isParent ? defaultChild : preset?.studentId ?? '')
    setPickedClassId(classId ?? '')
    setAssessmentId(preset?.assessmentId ?? '')
  }, [isOpen, preset?.studentId, preset?.assessmentId, classId, isParent, children, selectedChildId])

  // Parent: classes + assessments for the chosen child.
  useEffect(() => {
    if (!isOpen || !isParent || !studentId) return
    let cancelled = false
    setLoading(true)
    getParentTargets(studentId)
      .then((res) => {
        if (cancelled) return
        const classes = res.data ?? []
        setParentTargets(classes)
        if (!classes.some((c) => c.classId === pickedClassId)) {
          const withAssessment = classes.find((c) => c.assessments.some((a) => a.assessmentId === assessmentId))
          setPickedClassId(withAssessment?.classId ?? classes[0]?.classId ?? '')
        }
      })
      .catch(() => showNotification('Could not load classes', 'error'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // pickedClassId / assessmentId are read for a one-time reconciliation only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isParent, studentId, showNotification])

  // Staff: students + assessments of the class.
  useEffect(() => {
    if (!isOpen || isParent || !classId) return
    let cancelled = false
    setLoading(true)
    getStaffTargets(classId)
      .then((res) => {
        if (!cancelled) setStaffTargets(res.data ?? null)
      })
      .catch(() => showNotification('Could not load students', 'error'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [isOpen, isParent, classId, showNotification])

  const parentClass = parentTargets.find((c) => c.classId === pickedClassId) ?? null
  const assessments = isParent ? parentClass?.assessments ?? [] : staffTargets?.assessments ?? []
  const student = isParent ? children.find((c) => c.studentId === studentId) : staffTargets?.students.find((s) => s.studentId === studentId)
  const existingId = isParent ? parentClass?.assessments.find((a) => a.assessmentId === assessmentId)?.conversationId ?? null : null
  const guardiansWithoutAccount = useMemo(
    () => (!isParent && staffTargets ? (staffTargets.students.find((s) => s.studentId === studentId)?.guardians ?? []).filter((g) => !g.hasAccount) : []),
    [isParent, staffTargets, studentId],
  )
  const guardianCount = !isParent && staffTargets ? (staffTargets.students.find((s) => s.studentId === studentId)?.guardians ?? []).filter((g) => g.hasAccount).length : 0
  const ready = Boolean(studentId && (isParent ? pickedClassId : classId) && assessmentId)
  const recipients = isParent
    ? parentClass?.teacherName
      ? `${parentClass.teacherName} will be emailed`
      : undefined
    : guardianCount > 0
      ? `${guardianCount} guardian${guardianCount === 1 ? '' : 's'} will be emailed`
      : undefined

  const send = async ({ body, files }: { body: string; files: File[] }) => {
    const res = await createConversation({
      studentId,
      classId: isParent ? pickedClassId : (classId as string),
      assessmentId,
      body,
      files,
    })
    if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not send message')
    void bump()
    showNotification(existingId ? 'Added to the existing conversation' : 'Message sent', 'success')
    onCreated(res.data)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title="New message"
        subtitle={isParent ? 'Ask a teacher about one of your child’s assessments' : 'Message a student’s guardians about an assessment'}
        icon={ChatBubbleLeftRightIcon}
        tone={isParent ? 'warning' : 'brand'}
      />
      <ModalBody>
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
            >
              <option value="">Select…</option>
              {(isParent ? children.map((c) => ({ id: c.studentId, name: c.name })) : (staffTargets?.students ?? []).map((s) => ({ id: s.studentId, name: s.name }))).map(
                (s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ),
              )}
            </select>
          </Field>

          {isParent ? (
            <Field label="Class" htmlFor="nc-class" required>
              <select
                id="nc-class"
                value={pickedClassId}
                onChange={(e) => {
                  setPickedClassId(e.target.value)
                  setAssessmentId('')
                }}
                className={selectClass}
                disabled={loading || parentTargets.length === 0}
              >
                <option value="">Select…</option>
                {parentTargets.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.subject}
                    {c.teacherName ? ` · ${c.teacherName}` : ''}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Guardians" htmlFor="nc-guardians">
              <div id="nc-guardians" className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-600">
                {student && 'guardians' in student && student.guardians.length > 0 ? (
                  <ul className="space-y-0.5">
                    {student.guardians.map((g, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${g.hasAccount ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {g.name ?? 'Guardian'}
                        {g.relation ? ` (${g.relation})` : ''}
                        {!g.hasAccount && <span className="text-amber-700"> · no account yet</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-400">{studentId ? 'No guardians linked' : 'Pick a student'}</span>
                )}
              </div>
            </Field>
          )}

          <div className="sm:col-span-2">
            <Field label="Assessment" htmlFor="nc-assessment" required hint={isParent ? 'Only assessments that have been shared with you' : undefined}>
              <select
                id="nc-assessment"
                value={assessmentId}
                onChange={(e) => setAssessmentId(e.target.value)}
                className={selectClass}
                disabled={loading || assessments.length === 0}
              >
                <option value="">Select…</option>
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
        </div>

        {existingId && (
          <p className={`rounded-xl px-3 py-2 text-xs ${t.context}`}>
            There is already a conversation about this assessment. Your message will be added to it.
          </p>
        )}
        {guardiansWithoutAccount.length > 0 && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              {guardiansWithoutAccount.map((g) => g.name ?? 'A guardian').join(' and ')}{' '}
              {guardiansWithoutAccount.length === 1 ? 'does' : 'do'} not have a SchoolMule account yet and will not see this message. Ask the office to invite them.
            </span>
          </p>
        )}

        <div className={ready ? '' : 'pointer-events-none opacity-50'}>
          <Composer
            tone={tone}
            placeholder={isParent ? 'What would you like to ask or share?' : 'What would you like the guardians to know?'}
            recipientsLabel={recipients}
            onSend={send}
            disabled={!ready}
            submitLabel="Send message"
          />
        </div>
      </ModalBody>
    </Modal>
  )
}

export default NewConversationModal
