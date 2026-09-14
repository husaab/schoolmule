'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/shared/modal'
import {
  Button,
  Field,
  FieldRow,
  FormSection,
  ModalBody,
  ModalFooter,
  ModalHeader,
  inputClass,
} from '@/components/shared/modalKit'
import { inviteSchoolUser, updateSchoolUser } from '@/services/adminUserService'
import { SchoolRole, SchoolUser } from '@/services/types/adminUser'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { PencilSquareIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { ROLE_OPTIONS } from './userDisplay'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Omit to invite a new user; pass a user to edit them. */
  user?: SchoolUser | null
  onSaved: (user: SchoolUser) => void
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, user, onSaved }) => {
  const isEdit = Boolean(user)
  const currentUserId = useUserStore((s) => s.user.id)
  const notify = useNotificationStore((s) => s.showNotification)
  const isSelf = isEdit && user?.userId === currentUserId

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<SchoolRole>('TEACHER')
  const [hasAccess, setHasAccess] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setFirstName(user?.firstName ?? '')
    setLastName(user?.lastName ?? '')
    setEmail(user?.email ?? '')
    setRole(user?.role ?? 'TEACHER')
    setHasAccess(user?.isVerifiedSchool ?? true)
  }, [isOpen, user])

  const canSubmit =
    firstName.trim() && lastName.trim() && (isEdit || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    try {
      if (isEdit && user) {
        const res = await updateSchoolUser(user.userId, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
          isVerifiedSchool: hasAccess,
        })
        notify('User updated', 'success')
        onSaved(res.data)
      } else {
        const res = await inviteSchoolUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          role,
        })
        notify(
          res.data.inviteSent
            ? `Invite sent to ${res.data.email}`
            : res.message || 'User created, but the invite email failed',
          res.data.inviteSent ? 'success' : 'error'
        )
        onSaved(res.data)
      }
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader
          title={isEdit ? 'Edit user' : 'Add user'}
          subtitle={
            isEdit
              ? user?.email
              : "They'll get an email with a link to set their password. No approval step needed."
          }
          icon={isEdit ? PencilSquareIcon : UserPlusIcon}
        />

        <ModalBody>
          <FormSection label="Details">
            <FieldRow>
              <Field label="First name" htmlFor="user-first-name" required>
                <input
                  id="user-first-name"
                  className={inputClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                  required
                />
              </Field>
              <Field label="Last name" htmlFor="user-last-name" required>
                <input
                  id="user-last-name"
                  className={inputClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Field>
            </FieldRow>
            {!isEdit && (
              <Field label="Email" htmlFor="user-email" required hint="The invite is sent here, and it's their login.">
                <input
                  id="user-email"
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </Field>
            )}
          </FormSection>

          <FormSection label="Role">
            <div className="grid gap-2" role="radiogroup" aria-label="Role">
              {ROLE_OPTIONS.map((option) => {
                const selected = role === option.value
                const locked = isSelf && option.value !== 'ADMIN'
                return (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                      selected
                        ? 'border-cyan-300 bg-cyan-50/60 ring-1 ring-cyan-300'
                        : 'border-slate-200 hover:bg-slate-50'
                    } ${locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={selected}
                      disabled={locked}
                      onChange={() => setRole(option.value)}
                      className="mt-0.5 accent-cyan-600"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                      <span className="block text-xs text-slate-500">{option.description}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {isSelf && (
              <p className="text-xs text-slate-400">You can&apos;t change your own role.</p>
            )}
          </FormSection>

          {isEdit && (
            <FormSection label="Access">
              <label
                className={`flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-3.5 py-3 ${
                  isSelf ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <span>
                  <span className="block text-sm font-medium text-slate-900">School access</span>
                  <span className="block text-xs text-slate-500">
                    {hasAccess
                      ? 'They can sign in and use School Mule.'
                      : 'They can sign in but are held at the approval screen.'}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={hasAccess}
                  disabled={isSelf}
                  onChange={(e) => setHasAccess(e.target.checked)}
                  className="h-5 w-5 flex-shrink-0 accent-cyan-600"
                />
              </label>
            </FormSection>
          )}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!canSubmit}>
            {isEdit ? 'Save changes' : 'Send invite'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default UserFormModal
