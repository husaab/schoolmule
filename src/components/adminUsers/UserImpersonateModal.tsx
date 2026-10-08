'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { impersonateSchoolUser } from '@/services/adminUserService'
import { startImpersonation } from '@/services/impersonation'
import { getToken } from '@/services/authService'
import { SchoolUser } from '@/services/types/adminUser'
import { useNotificationStore } from '@/store/useNotificationStore'
import { EyeIcon } from '@heroicons/react/24/outline'
import { roleLabel, statusOf } from './userDisplay'

interface UserImpersonateModalProps {
  isOpen: boolean
  onClose: () => void
  user: SchoolUser
}

const UserImpersonateModal: React.FC<UserImpersonateModalProps> = ({ isOpen, onClose, user }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [starting, setStarting] = useState(false)

  const firstName = user.firstName || user.fullName
  const portal = user.role === 'PARENT' ? 'the parent portal' : 'the teacher portal'

  const handleStart = async () => {
    const adminToken = getToken()
    if (!adminToken) {
      notify('Your session has ended. Please sign in again.', 'error')
      return
    }
    setStarting(true)
    try {
      const res = await impersonateSchoolUser(user.userId)
      // Full page load follows; keep the spinner on until it happens.
      startImpersonation(adminToken, res.data)
    } catch (err) {
      setStarting(false)
      notify(err instanceof Error ? err.message : 'Failed to start preview', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title={`View as ${firstName}`}
        subtitle={`See ${portal} exactly the way they do.`}
        icon={EyeIcon}
        tone="violet"
      />

      <ModalBody>
        <ConfirmBody
          tone="violet"
          consequences={{
            title: 'While previewing:',
            items: [
              'You see their pages, menus and data — nothing is hidden or changed',
              'Everything is read-only: saving, submitting and deleting are turned off',
              'A bar at the bottom of the screen shows who you are viewing as',
              'Click Exit preview on that bar to come back here, or the preview ends on its own after 2 hours',
            ],
          }}
        >
          You&apos;ll be switched to{' '}
          <strong className="font-semibold text-slate-900">{user.fullName}</strong>&apos;s view of School
          Mule. Nothing they have done is affected and they won&apos;t be notified.
        </ConfirmBody>

        {statusOf(user) === 'invited' && (
          <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-900">
            They haven&apos;t set a password yet, so this is a preview of what they&apos;ll see once they
            accept their invite.
          </div>
        )}

        <RecordFacts
          facts={[
            { label: 'Email', value: user.email },
            { label: 'Role', value: roleLabel(user.role) },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={starting}>
          Cancel
        </Button>
        <Button variant="violet" onClick={handleStart} loading={starting}>
          <EyeIcon className="h-4 w-4" />
          {starting ? 'Switching' : 'Start preview'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default UserImpersonateModal
