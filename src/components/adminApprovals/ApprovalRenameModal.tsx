'use client'

// Fix the name on a pending signup. Parents sometimes register under their
// child's name, and that name is what every email and page greets them with.

import React, { useEffect, useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, Field, FormSection, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { renameSignup } from '@/services/adminApprovalService'
import { ApprovalUser } from '@/services/types/adminApproval'
import { useNotificationStore } from '@/store/useNotificationStore'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { roleLabel } from '@/components/adminUsers/userDisplay'

interface ApprovalRenameModalProps {
  isOpen: boolean
  onClose: () => void
  user: ApprovalUser
  onRenamed: (user: ApprovalUser) => void
}

const inputClass =
  'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20'

const ApprovalRenameModal: React.FC<ApprovalRenameModalProps> = ({ isOpen, onClose, user, onRenamed }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [firstName, setFirstName] = useState(user.firstName ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
    }
  }, [isOpen, user.firstName, user.lastName])

  const first = firstName.trim()
  const last = lastName.trim()
  const unchanged = first === (user.firstName ?? '') && last === (user.lastName ?? '')
  const canSave = first.length > 0 && !unchanged && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const res = await renameSignup(user.userId, { firstName: first, lastName: last })
      notify(res.message ?? 'Name updated', 'success')
      onRenamed(res.data.user)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to rename', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Rename signup"
        subtitle="Use the adult's own name. Parents sometimes sign up under their child's."
        icon={PencilSquareIcon}
      />

      <ModalBody>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
        >
          <FormSection label="Name">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name" htmlFor="rename-first" required>
                <input
                  id="rename-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={60}
                  autoFocus
                  className={inputClass}
                />
              </Field>
              <Field label="Last name" htmlFor="rename-last" hint="Leave blank if they go by one name.">
                <input
                  id="rename-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={60}
                  className={inputClass}
                />
              </Field>
            </div>
          </FormSection>
        </form>

        <RecordFacts
          facts={[
            { label: 'Signed up as', value: user.fullName || user.username },
            { label: 'Email', value: user.email },
            { label: 'Role', value: roleLabel(user.role) },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!canSave} loading={saving}>
          {saving ? 'Saving' : 'Save name'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ApprovalRenameModal
