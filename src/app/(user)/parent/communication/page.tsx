// src/app/parent/communication/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import {
  InboxIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  PencilSquareIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { useUserStore } from '@/store/useUserStore'
import {
  getInboxMessages,
  getSentMessages,
  deleteMessage as apiDeleteMessage
} from '@/services/messageService'
import ViewMessageModal from '@/components/messages/view/ViewMessageModal'
import DeleteMessageModal from '@/components/messages/delete/DeleteMessageModal'
import EditMessageModal from '@/components/messages/edit/EditMessageModal'
import ReplyMessageModal from '@/components/messages/reply/ReplyMessageModal'
import { MessagePayload } from '@/services/types/message'

const ParentCommunicationPage: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')
  const [loading, setLoading] = useState(false)

  const [inboxMessages, setInboxMessages] = useState<MessagePayload[]>([])
  const [sentMessages, setSentMessages] = useState<MessagePayload[]>([])

  const [viewTarget, setViewTarget] = useState<MessagePayload | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MessagePayload | null>(null)
  const [editTarget, setEditTarget] = useState<MessagePayload | null>(null)
  const [replyTarget, setReplyTarget] = useState<MessagePayload | null>(null)

  // load on mount / tab change
  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    const loader =
      activeTab === 'inbox'
        ? getInboxMessages(user.id).then((res) => res.status === 'success' && setInboxMessages(res.data))
        : getSentMessages(user.id).then((res) => res.status === 'success' && setSentMessages(res.data))

    loader.catch(console.error).finally(() => setLoading(false))
  }, [user?.id, activeTab])

  // delete handler
  const handleDelete = async (id: string) => {
    if (!user?.id) return
    try {
      await apiDeleteMessage(id, { senderId: user.id })
      setSentMessages((prev) => prev.filter((m) => m.message_id !== id))
    } catch (err) {
      console.error(err)
    }
    setDeleteTarget(null)
  }

  const messages = activeTab === 'inbox' ? inboxMessages : sentMessages

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="flex justify-between items-center mb-6 ml-6">
          <h1 className="text-2xl font-semibold text-gray-800">Parent Communication</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-4 ml-6">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 -mb-px border-b-2 font-medium cursor-pointer ${
              activeTab === 'inbox' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
            }`}
          >
            <InboxIcon className="inline h-5 w-5 mr-1" />
            Inbox
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`ml-6 px-4 py-2 -mb-px border-b-2 font-medium cursor-pointer ${
              activeTab === 'sent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
            }`}
          >
            <ArrowUpTrayIcon className="inline h-5 w-5 mr-1" />
            Sent
          </button>
        </div>

        {/* Message List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No {activeTab} messages yet.</div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[60vh] overflow-x-hidden pr-4 p-5 pt-1">
            {messages.map((msg) => (
              <div
                key={msg.message_id}
                onClick={() => setViewTarget(msg)}
                className="bg-white p-4 rounded-2xl shadow flex justify-between items-start cursor-pointer transform transition duration-200 hover:scale-102"
              >
                <div>
                  <p className="font-semibold text-gray-800">{msg.subject || <em>No subject</em>}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {activeTab === 'inbox'
                      ? `From: ${msg.sender_name || msg.sender_id}`
                      : `To: ${msg.recipient_name || msg.recipient_id}`}{' '}
                    • {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* only inbox gets Reply */}
                  {activeTab === 'inbox' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setReplyTarget(msg)
                      }}
                      title="Reply"
                      className="text-cyan-600 hover:text-cyan-700 cursor-pointer transform transition duration-200 hover:scale-130"
                    >
                      <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
                    </button>
                  )}

                  {/* sent gets Edit/Delete */}
                  {activeTab === 'sent' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditTarget(msg)
                        }}
                        title="Edit"
                        className="text-gray-500 hover:text-gray-600 cursor-pointer transform transition duration-200 hover:scale-130"
                      >
                        <PencilSquareIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(msg)
                        }}
                        title="Delete"
                        className="text-red-600 hover:text-red-800 cursor-pointer transform transition duration-200 hover:scale-130"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View */}
        {viewTarget && (
          <ViewMessageModal
            isOpen={!!viewTarget}
            onClose={() => setViewTarget(null)}
            message={viewTarget}
          />
        )}

        {/* Reply */}
        {replyTarget && (
          <ReplyMessageModal
            isOpen={!!replyTarget}
            onClose={() => setReplyTarget(null)}
            original={replyTarget}
            onSent={(newMsg) => {
              setSentMessages((prev) => [newMsg, ...prev])
              setReplyTarget(null)
            }}
          />
        )}

        {/* Edit */}
        {editTarget && (
          <EditMessageModal
            isOpen={!!editTarget}
            onClose={() => setEditTarget(null)}
            message={editTarget}
            onUpdate={(updated) => {
              setSentMessages((prev) =>
                prev.map((m) => (m.message_id === updated.message_id ? updated : m))
              )
              setEditTarget(null)
            }}
          />
        )}

        {/* Delete */}
        {deleteTarget && (
          <DeleteMessageModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            message={deleteTarget}
            onDeleted={(id) => {
              setSentMessages((prev) => prev.filter((m) => m.message_id !== id))
              setDeleteTarget(null)
            }}
          />
        )}
      </main>
    </>
  )
}

export default ParentCommunicationPage
