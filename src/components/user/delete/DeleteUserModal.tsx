import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '../../shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteUserAccount } from '@/services/userService'

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
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12 text-black">
      <h2 className="text-xl mb-4 text-black">Confirm Account Deletion</h2>
      <p className="text-black mb-4">
        To permanently delete your account, please type <span className="font-semibold">{user.username}</span> below:
      </p>
      <input
        type="text"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        placeholder="Enter your username"
        className="w-full border border-gray-300 p-3 rounded-lg mb-6 text-black"
      />
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onDeleteClick}
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition cursor-pointer"
        >
          {loading ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </Modal>
  )
}

export default DeleteUserModal
