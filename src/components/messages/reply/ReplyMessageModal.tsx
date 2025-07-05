'use client'

import React, { useState, useEffect } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import Modal from '@/components/shared/modal'
import { sendMessage } from '@/services/messageService'
import type { MessagePayload } from '@/services/types/message'

interface ReplyMessageModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Original message being replied to
   */
  original: MessagePayload
  /**
   * Called after a successful send to append the new reply to the list
   */
  onSent: (message: MessagePayload) => void
}

const ReplyMessageModal: React.FC<ReplyMessageModalProps> = ({ isOpen, onClose, original, onSent }) => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // initialize when opened
  useEffect(() => {
    if (isOpen) {
      const prefix = original.subject ? `Re: ${original.subject}` : 'Re:'
      setSubject(prefix)
      setBody('')
      setSubmitting(false)
    }
  }, [isOpen, original.subject])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) {
      showNotification('Subject and message body are required.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        senderId: user.id!,
        recipientId: original.sender_id,
        school: user.school!,
        subject: subject.trim(),
        body: body.trim(),
        senderName: user.username!,
        recipientName: original.sender_name || ''
      }
      const res = await sendMessage(payload)
      if (res.status === 'success') {
        onSent(res.data)
        showNotification('Reply sent successfully', 'success')
        onClose()
      } else {
        showNotification(res.message || 'Failed to send reply', 'error')
      }
    } catch (err) {
      console.error(err)
      showNotification('Error sending reply', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl font-semibold text-black mb-4">Reply to Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-sm font-medium">To</label>
          <input
            readOnly
            value={original.sender_name || original.sender_id}
            className="w-full border rounded px-2 py-1 bg-gray-100"
          />
        </div>
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
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ReplyMessageModal
