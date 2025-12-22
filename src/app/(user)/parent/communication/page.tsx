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
  getSentMessages
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

  const messages = activeTab === 'inbox' ? inboxMessages : sentMessages

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Parent Communication</h1>
                <p className="text-slate-500 mt-1">View and manage messages from the school</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-100">
                <InboxIcon className="w-5 h-5 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-700">Messages</span>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Tabs */}
            <div className="border-b border-slate-100 px-6">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === 'inbox'
                      ? 'border-cyan-500 text-cyan-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <InboxIcon className="h-5 w-5" />
                  Inbox
                  {inboxMessages.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-cyan-50 text-cyan-600 rounded-full">
                      {inboxMessages.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === 'sent'
                      ? 'border-cyan-500 text-cyan-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  Sent
                  {sentMessages.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                      {sentMessages.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Message List */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    {activeTab === 'inbox' ? (
                      <InboxIcon className="h-8 w-8 text-slate-400" />
                    ) : (
                      <ArrowUpTrayIcon className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Messages Yet</h3>
                  <p className="text-sm text-slate-500">
                    {activeTab === 'inbox' ? 'Your inbox is empty.' : 'You haven\'t sent any messages yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.message_id}
                      onClick={() => setViewTarget(msg)}
                      className="group p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors truncate">
                            {msg.subject || <em className="text-slate-400">No subject</em>}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500">
                              {activeTab === 'inbox'
                                ? `From: ${msg.sender_name || msg.sender_id}`
                                : `To: ${msg.recipient_name || msg.recipient_id}`}
                            </span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs text-slate-500">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* only inbox gets Reply */}
                          {activeTab === 'inbox' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setReplyTarget(msg)
                              }}
                              title="Reply"
                              className="p-2 rounded-lg text-cyan-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                            >
                              <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
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
                                className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              >
                                <PencilSquareIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteTarget(msg)
                                }}
                                title="Delete"
                                className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

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
