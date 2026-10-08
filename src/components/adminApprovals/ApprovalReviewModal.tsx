'use client'

// Review a signup and let them in. One click fixes the role they picked, links
// a parent to their children and grants access — then emails them.

import React, { useEffect, useRef, useState } from 'react'
import Modal from '@/components/shared/modal'
import {
  Button,
  Field,
  FormSection,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '@/components/shared/modalKit'
import { approveSignup, getChildCandidates } from '@/services/adminApprovalService'
import {
  ApprovalUser,
  ApproveSignupResult,
  ChildCandidate,
  SignupRole,
  SuggestedChild,
} from '@/services/types/adminApproval'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { ROLE_OPTIONS, formatDate } from '@/components/adminUsers/userDisplay'
import ChildLinker, { SelectedChild } from './ChildLinker'

const nameInputClass =
  'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20'

const SIGNUP_ROLE_OPTIONS = ROLE_OPTIONS.filter((o): o is typeof o & { value: SignupRole } => o.value !== 'ADMIN')

interface ApprovalReviewModalProps {
  isOpen: boolean
  onClose: () => void
  user: ApprovalUser
  onApproved: (result: ApproveSignupResult) => void
}

// Only signups reach this modal, so the role is TEACHER or PARENT; anything else falls back to TEACHER.
const asSignupRole = (role: string): SignupRole => (role === 'PARENT' ? 'PARENT' : 'TEACHER')

const ApprovalReviewModal: React.FC<ApprovalReviewModalProps> = ({
  isOpen,
  onClose,
  user,
  onApproved,
}) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [role, setRole] = useState<SignupRole>(asSignupRole(user.role))
  const [firstName, setFirstName] = useState(user.firstName ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const [sendEmail, setSendEmail] = useState(true)
  const [students, setStudents] = useState<ChildCandidate[]>([])
  const [suggested, setSuggested] = useState<SuggestedChild[]>([])
  const [selected, setSelected] = useState<SelectedChild[]>([])
  const [loadingChildren, setLoadingChildren] = useState(false)
  const [approving, setApproving] = useState(false)

  // Which signup the student list was fetched for. A ref, not state, so the
  // effect below doesn't re-run (and cancel itself) when loading flips.
  const loadedForUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setRole(asSignupRole(user.role))
    setFirstName(user.firstName ?? '')
    setLastName(user.lastName ?? '')
    setSendEmail(true)
    setSelected([])
    setStudents([])
    setSuggested([])
    loadedForUserId.current = null
  }, [isOpen, user])

  // Students only matter for parents; fetch once per open and pre-tick the matches.
  useEffect(() => {
    if (!isOpen || role !== 'PARENT' || loadedForUserId.current === user.userId) return
    loadedForUserId.current = user.userId
    let cancelled = false
    setLoadingChildren(true)
    getChildCandidates(user.userId)
      .then((res) => {
        if (cancelled) return
        setStudents(res.data.students)
        setSuggested(res.data.suggested)
        setSelected(res.data.suggested.map((s) => ({ ...s, suggested: true })))
      })
      .catch((err) => {
        if (cancelled) return
        loadedForUserId.current = null
        notify(err instanceof Error ? err.message : 'Failed to load students', 'error')
      })
      .finally(() => !cancelled && setLoadingChildren(false))
    return () => {
      cancelled = true
    }
  }, [isOpen, role, user.userId, notify])

  const roleChanged = role !== user.role
  const isParent = role === 'PARENT'
  const childCount = isParent ? selected.length : 0
  const first = firstName.trim()
  const last = lastName.trim()
  const nameChanged = first !== (user.firstName ?? '') || last !== (user.lastName ?? '')
  const nameValid = first.length > 0

  const handleApprove = async () => {
    if (!nameValid) return
    setApproving(true)
    try {
      const res = await approveSignup(user.userId, {
        role,
        ...(nameChanged ? { firstName: first, lastName: last } : {}),
        children: isParent ? selected.map((c) => ({ studentId: c.studentId, relation: c.relation })) : [],
        sendEmail,
      })
      const ok = res.data.emailSent || !sendEmail
      notify(res.message ?? (ok ? 'Approved' : 'Approved, but the email could not be sent'), ok ? 'success' : 'error')
      onApproved(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to approve', 'error')
    } finally {
      setApproving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Review signup"
        subtitle={user.email}
        icon={ShieldCheckIcon}
        tone="success"
      />

      <ModalBody>
        {/* Editable: parents sometimes sign up under their child's name, and
            this is what every email and page will greet them with. */}
        <FormSection label="Name">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" htmlFor="review-first-name" required>
              <input
                id="review-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={60}
                className={nameInputClass}
              />
            </Field>
            <Field label="Last name" htmlFor="review-last-name" hint="Leave blank if they go by one name.">
              <input
                id="review-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={60}
                className={nameInputClass}
              />
            </Field>
          </div>
          {nameChanged && (
            <p className="text-xs text-slate-500">
              They signed up as <span className="font-medium text-slate-700">{user.fullName}</span>. The new name is saved when you approve.
            </p>
          )}
        </FormSection>

        <RecordFacts facts={[{ label: 'Signed up', value: formatDate(user.createdAt) }]} />

        <FormSection label="Approve as">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Role">
            {SIGNUP_ROLE_OPTIONS.map((option) => {
              const active = role === option.value
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3.5 py-2.5 transition-colors ${
                    active ? 'border-cyan-300 bg-cyan-50/60 ring-1 ring-cyan-300' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="approve-role"
                      value={option.value}
                      checked={active}
                      onChange={() => setRole(option.value)}
                      className="accent-cyan-600"
                    />
                    <span className="text-sm font-medium text-slate-900">{option.label}</span>
                  </span>
                  <span className="pl-5 text-xs text-slate-500">{option.description}</span>
                </label>
              )
            })}
          </div>
          {roleChanged && (
            <p className="text-xs text-amber-700">
              They signed up as a {user.role.toLowerCase()} and will be approved as a {role.toLowerCase()}
              {sendEmail ? '; the email says so.' : '.'}
            </p>
          )}
        </FormSection>

        {isParent && (
          <FormSection label="Their children">
            <ChildLinker
              students={students}
              suggested={suggested}
              selected={selected}
              onChange={setSelected}
              loading={loadingChildren}
            />
            {!loadingChildren && selected.length === 0 && (
              <p className="rounded-xl border border-amber-100 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900">
                No children linked yet. They can still sign in, but their portal will be empty until you link them
                here or on Parent Relations.
              </p>
            )}
          </FormSection>
        )}

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 px-3.5 py-3">
          <span>
            <span className="block text-sm font-medium text-slate-900">Email them</span>
            <span className="block text-xs text-slate-500">
              &ldquo;Your account is approved&rdquo; with a sign-in link.
            </span>
          </span>
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="h-5 w-5 flex-shrink-0 accent-cyan-600"
          />
        </label>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={approving}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleApprove} loading={approving} disabled={loadingChildren}>
          {approving
            ? 'Approving'
            : `Approve as ${isParent ? 'parent' : 'teacher'}${
                childCount > 0 ? ` · ${childCount} ${childCount === 1 ? 'child' : 'children'}` : ''
              }`}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ApprovalReviewModal
