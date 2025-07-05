'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { updateMessage } from '@/services/messageService'
import { MessagePayload } from '@/services/types/message'

interface EditMessageModalProps {
  isOpen: boolean
  onClose: () => void
  message: MessagePayload
  onUpdate: (updated: MessagePayload) => void
}

const EditMessageModal: React.FC<EditMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  onUpdate
}) => {
  const [subject, setSubject] = useState<string>('')
  const [body, setBody] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)

  useEffect(() => {
    if (isOpen) {
      setSubject(message.subject || '')
      setBody(message.body)
    }
  }, [isOpen, message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) {
      showNotification('Subject and body are required', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await updateMessage(message.message_id, {
        senderId: user.id!,
        subject: subject.trim(),
        body: body.trim()
      })
      if (res.status === 'success') {
        const raw = res.data as any
        const updated: MessagePayload = {
          ...message,
          subject: raw.subject,
          body: raw.body
        }
        onUpdate(updated)
        showNotification('Message updated successfully', 'success')
        onClose()
      } else {
        showNotification(res.message || 'Failed to update message', 'error')
      }
    } catch (err) {
      console.error(err)
      showNotification('Error updating message', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl font-semibold text-black mb-4">Edit Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-sm font-medium">Subject</label>
          <input
            required
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Message</label>
          <textarea
            required
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={6}
            className="w-full border rounded px-2 py-1 resize-y"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditMessageModal
