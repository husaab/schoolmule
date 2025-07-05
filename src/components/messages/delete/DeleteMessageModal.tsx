'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { MessagePayload } from '@/services/types/message'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteMessage as apiDeleteMessage } from '@/services/messageService'

interface DeleteMessageModalProps {
  isOpen: boolean
  onClose: () => void
  message: MessagePayload
  onDeleted: (id: string) => void
}

const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  onDeleted
}) => {
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      await apiDeleteMessage(message.message_id, { senderId: user.id })
      showNotification('Message deleted', 'success')
      onDeleted(message.message_id)
      onClose()
    } catch (err) {
      console.error(err)
      showNotification('Error deleting message', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-xl font-semibold mb-4 text-black">Delete Message</h2>
      <p className="text-black mb-6">
        Are you sure you want to delete the message to&nbsp;
        <strong>{message.recipient_name || message.recipient_id}</strong>
        &nbsp;with subject&nbsp;
        <strong>{message.subject || 'No subject'}</strong>?
      </p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
        >
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}

export default DeleteMessageModal
