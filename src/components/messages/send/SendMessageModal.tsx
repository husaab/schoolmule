// File: src/components/messages/send/SendMessageModal.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Modal from '@/components/shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  sendMessage,
  sendToAllParents,
  sendToParentsByGrade
} from '@/services/messageService'
import { getUsersBySchool } from '@/services/userService'
import { MessagePayload } from '@/services/types/message'
import { UserPayload } from '@/services/types/user'

interface SendMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSent: (message: MessagePayload) => void
}

const GRADES = Array.from({ length: 8 }, (_, i) => i + 1)

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen, onClose, onSent
}) => {
  const user = useUserStore(s => s.user)!
  const showNotification = useNotificationStore(s => s.showNotification)

  // recipient picker
  const [users, setUsers] = useState<UserPayload[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showParentsOnly, setShowParentsOnly] = useState(true)

  // form fields
  const [recipientId, setRecipientId] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // mass modes
  const [massAllParents, setMassAllParents] = useState(false)
  const [gradeSend, setGradeSend] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('')

  // reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setRecipientId('')
      setRecipientName('')
      setSubject('')
      setBody('')
      setSubmitting(false)
      setMassAllParents(false)
      setGradeSend(false)
      setSelectedGrade('')
    }
  }, [isOpen])

  // load school users for individual send
  useEffect(() => {
    if (!isOpen || !user.school) return
    setLoadingUsers(true)
    getUsersBySchool(user.school)
      .then(res => {
        if (res.status === 'success') setUsers(res.data)
        else showNotification('Failed to load users', 'error')
      })
      .catch(() => showNotification('Error fetching users', 'error'))
      .finally(() => setLoadingUsers(false))
  }, [isOpen, user.school, showNotification])

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => !showParentsOnly || u.role === 'PARENT')
      .filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
  }, [users, searchTerm, showParentsOnly])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1) Admin mass → all parents
    if (massAllParents) {
      setSubmitting(true)
      try {
        const res = await sendToAllParents({
          senderId: user.id!,
          school: user.school!,
          subject: subject.trim(),
          body: body.trim(),
          senderName: user.username!
        })
        if (res.status === 'success') {
          showNotification('Sent to all parents!', 'success')
          onClose()
        } else {
          showNotification(res.message || 'Failed mass send', 'error')
        }
      } catch {
        showNotification('Error during mass send', 'error')
      } finally {
        setSubmitting(false)
      }
      return
    }

    // 2) Teacher mass → parents by grade
    if (gradeSend) {
      if (selectedGrade === '') {
        showNotification('Please select a grade', 'error')
        return
      }
      setSubmitting(true)
      try {
        const res = await sendToParentsByGrade({
          senderId: user.id!,
          school: user.school!,
          grade: Number(selectedGrade),
          subject: subject.trim(),
          body: body.trim(),
          senderName: user.username!
        })
        if (res.status === 'success') {
          showNotification(`Sent to parents of grade ${selectedGrade}!`, 'success')
          onClose()
        } else {
          showNotification(res.message || 'Failed grade send', 'error')
        }
      } catch {
        showNotification('Error during grade send', 'error')
      } finally {
        setSubmitting(false)
      }
      return
    }

    // 3) Single recipient
    if (!recipientId || !recipientName.trim() || !subject.trim() || !body.trim()) {
      showNotification('Select a recipient and fill in all fields.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await sendMessage({
        senderId: user.id!,
        recipientId,
        school: user.school!,
        subject: subject.trim(),
        body: body.trim(),
        senderName: user.username!,
        recipientName: recipientName.trim()
      })
      if (res.status === 'success') {
        onSent(res.data)
        showNotification('Message sent!', 'success')
        onClose()
      } else {
        showNotification(res.message || 'Failed to send', 'error')
      }
    } catch {
      showNotification('Error sending message', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl font-semibold text-black mb-4">Send Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">

        <div>
          <label className="block text-sm font-medium mb-1">Recipient</label>

          {/* admin: all parents */}
          {user.role === 'ADMIN' && !gradeSend && (
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={massAllParents}
                onChange={() => {
                  setMassAllParents(v => !v)
                  setGradeSend(false)
                  setRecipientId('')
                }}
              />
              <span>Send to all parents</span>
            </label>
          )}

          {/* teacher: by grade */}
          {!massAllParents && (
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={gradeSend}
                onChange={() => {
                  setGradeSend(v => !v)
                  setMassAllParents(false)
                  setRecipientId('')
                }}
              />
              <span>Send to parents of specific grade</span>
            </label>
          )}

          {/* grade dropdown */}
          {gradeSend && (
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(Number(e.target.value))}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Select grade</option>
              {GRADES.map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          )}

          {(!massAllParents && !gradeSend) && (
            <div className="border-b border-gray-300 mb-4" />
          )}

          {/* single‐recipient search */}
          {!massAllParents && !gradeSend && (
            <>
              <input
                type="text"
                placeholder="Search users…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="parents-only"
                  checked={showParentsOnly}
                  onChange={() => setShowParentsOnly(p => !p)}
                  className="mr-2"
                />
                <label htmlFor="parents-only" className="text-sm">
                  Show Parents Only
                </label>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-white">
                {loadingUsers
                  ? <p className="text-gray-600">Loading…</p>
                  : filteredUsers.length === 0
                    ? <p className="text-gray-600">No users found.</p>
                    : filteredUsers.map(u => (
                        <div key={u.userId} className="flex items-center mb-1">
                          <input
                            type="radio"
                            name="recipient"
                            value={u.userId}
                            checked={recipientId === u.userId}
                            onChange={() => {
                              setRecipientId(u.userId)
                              setRecipientName(`${u.firstName} ${u.lastName}`)
                            }}
                            className="mr-2"
                          />
                          <label className="text-black">
                            {u.firstName} {u.lastName} ({u.email})
                          </label>
                        </div>
                      ))
                }
              </div>
            </>
          )}
        </div>

        {/* recipient name (single) */}
        {!massAllParents && !gradeSend && (
          <div>
            <label className="block text-sm font-medium">Recipient Name</label>
            <input
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              className="w-full border rounded px-2 py-1"
              placeholder="Full name of recipient"
            />
          </div>
        )}

        {/* subject & body */}
        <div>
          <label className="block text-sm font-medium">Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Message</label>
          <textarea
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
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
            disabled={submitting}
          >Cancel</button>
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

export default SendMessageModal
