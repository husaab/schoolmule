// File: src/components/messages/view/ViewMessageModal.tsx
'use client'

import React from 'react'
import Modal from '@/components/shared/modal'
import { MessagePayload } from '@/services/types/message'

interface ViewMessageModalProps {
  isOpen: boolean
  onClose: () => void
  message: MessagePayload
}

const ViewMessageModal: React.FC<ViewMessageModalProps> = ({
  isOpen,
  onClose,
  message
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl font-semibold text-black mb-4">
        {message.subject || <em>No Subject</em>}
      </h2>
      <div className="space-y-2 text-black">
        <div>
          <strong>From:</strong>{' '}
          {message.sender_name || message.sender_id}
        </div>
        <div>
          <strong>To:</strong>{' '}
          {message.recipient_name || message.recipient_id}
        </div>
        <div>
          <strong>Sent:</strong>{' '}
          {new Date(message.created_at).toLocaleString()}
        </div>
        <hr className="my-4" />
        <div className="whitespace-pre-wrap">{message.body}</div>
      </div>
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

export default ViewMessageModal
