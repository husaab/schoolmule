// src/components/studentAccounts/EditStudentEmailModal.tsx
// Add, change or remove a student's own address. With a login, the address
// is also what the student signs in with, so a change kills any invite or
// password link already sent (the server deletes them).
'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, Field, ModalBody, ModalFooter, ModalHeader, inputClass } from '@/components/shared/modalKit'
import { updateStudentEmail } from '@/services/studentAccountService'
import type { StudentAccountRow } from '@/services/types/studentAccount'
import { useNotificationStore } from '@/store/useNotificationStore'
import { EnvelopeIcon, TrashIcon } from '@heroicons/react/24/outline'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Props {
  isOpen: boolean
  onClose: () => void
  row: StudentAccountRow
  onSaved: (row: StudentAccountRow) => void
}

export default function EditStudentEmailModal({ isOpen, onClose, row, onSaved }: Props) {
  const notify = useNotificationStore((s) => s.showNotification)
  const current = row.studentEmail ?? row.account?.email ?? ''
  const [value, setValue] = useState(current)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setValue(current)
    setError(null)
    setConfirmRemove(false)
  }, [isOpen, current])

  const save = async (next: string | null) => {
    setSaving(true)
    setError(null)
    try {
      const res = await updateStudentEmail(row.studentId, next)
      notify(next ? `Email saved for ${row.name}` : `Email removed for ${row.name}`, 'success')
      onSaved(res.data)
      onClose()
    } catch (err) {
      setConfirmRemove(false)
      setError(err instanceof Error ? err.message : "The email couldn't be saved")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) {
      if (row.account) {
        setError('A student with an account needs an email address. Delete the account to remove it.')
        return
      }
      if (!current) {
        onClose()
        return
      }
      setConfirmRemove(true)
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    if (trimmed === current.toLowerCase()) {
      onClose()
      return
    }
    void save(trimmed)
  }

  const canRemove = !row.account && Boolean(row.studentEmail)

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} style="w-full max-w-md">
      <ModalHeader
        title={confirmRemove ? 'Remove email' : current ? 'Edit email' : 'Add email'}
        subtitle={row.name}
        icon={confirmRemove ? TrashIcon : EnvelopeIcon}
        tone={confirmRemove ? 'danger' : 'brand'}
      />

      {confirmRemove ? (
        <>
          <ModalBody>
            <ConfirmBody tone="danger">
              Remove <strong className="font-semibold text-slate-900">{row.studentEmail}</strong> from {row.name}&apos;s
              record? {row.name} can&apos;t be invited until an address is added again.
            </ConfirmBody>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setConfirmRemove(false)} disabled={saving}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => void save(null)} loading={saving}>
              Remove email
            </Button>
          </ModalFooter>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <ModalBody>
            <Field
              label="Student's own email"
              htmlFor="student-account-email"
              hint="The address the student signs in with. Never a parent's address."
            >
              <input
                id="student-account-email"
                type="email"
                autoComplete="off"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError(null)
                }}
                placeholder="student@school.example.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'student-account-email-error' : undefined}
                className={inputClass}
                autoFocus
              />
            </Field>
            {error ? (
              <p id="student-account-email-error" className="-mt-2 text-sm text-rose-600">
                {error}
              </p>
            ) : (
              row.conflict &&
              value.trim().toLowerCase() === (row.studentEmail ?? '').toLowerCase() && (
                <p className="-mt-2 text-sm text-rose-600">{row.conflict.message}</p>
              )
            )}

            {row.account && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                This also changes the address {row.name} signs in with. An invite or password link already sent to{' '}
                <strong className="font-semibold">{row.account.email}</strong> stops working; send a new one with Resend
                invite or Reset password.
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            {canRemove && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmRemove(true)}
                disabled={saving}
                className="mr-auto"
              >
                <TrashIcon className="h-4 w-4" />
                Remove email
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  )
}
