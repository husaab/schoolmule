import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '../../shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteUserAccount } from '@/services/userService'
import {
  Button,
  ConfirmBody,
  Field,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
  inputClass,
} from '../../shared/modalKit'
import { TrashIcon } from '@heroicons/react/24/outline'

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onDeleted: () => void
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isOpen, onClose, onDeleted }) => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const clearUser = useUserStore((state) => state.clearUser)
  const showNotification = useNotificationStore((state) => state.showNotification)

  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)

  const isMatch = confirmation === user.username

  const handleDelete = async () => {
    setLoading(true)
    try {
      if (!user.id) return
      await deleteUserAccount(user.id)
      showNotification('Account deleted successfully', 'success')
      clearUser()
      onDeleted()
      onClose()
      router.replace('/login')
    } catch (err) {
      console.error('Error deleting user:', err)
      showNotification('Failed to delete account', 'error')
    } finally {
      setLoading(false)
    }
  }

  const onDeleteClick = () => {
    if (!isMatch) {
      showNotification('Input does not match to username', 'error')
      return
    }
    handleDelete()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Delete your account"
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Deleting your account:',
            items: [
              'Signs you out right away and returns you to the login page',
              'Removes the account outright — this username and email can no longer sign in',
              'Deletes the saved student views you own',
              'Leaves timetable assignments and connected sheets tied to you unassigned',
            ],
          }}
        >
          Type{' '}
          <strong className="font-semibold text-slate-900">{user.username}</strong> below to confirm
          you want your School Mule account permanently removed.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Email', value: user.email || 'Not provided' },
            { label: 'Role', value: user.role || 'Not set' },
          ]}
        />

        <Field label="Confirm your username" htmlFor="delete-account-confirmation">
          <input
            id="delete-account-confirmation"
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Enter your username"
            className={inputClass}
          />
        </Field>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onDeleteClick} loading={loading}>
          {loading ? 'Deleting' : 'Delete account'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DeleteUserModal
