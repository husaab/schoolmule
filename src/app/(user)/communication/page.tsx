'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { PaperAirplaneIcon, InboxIcon, ArrowUpTrayIcon, XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { useUserStore } from '@/store/useUserStore'
import { getInboxMessages, getSentMessages, deleteMessage as apiDeleteMessage } from '@/services/messageService'
import SendMessageModal from '@/components/messages/send/SendMessageModal'
import ViewMessageModal from '@/components/messages/view/ViewMessageModal'
import { MessagePayload } from '@/services/types/message'
import DeleteMessageModal from '@/components/messages/delete/DeleteMessageModal'
import EditMessageModal from '@/components/messages/edit/EditMessageModal'

const CommunicationPage: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')
  const [modalOpen, setModalOpen] = useState(false)

  const [inboxMessages, setInboxMessages] = useState<MessagePayload[]>([])
  const [sentMessages, setSentMessages] = useState<MessagePayload[]>([])
  const [loading, setLoading] = useState(false)

   const [selectedMessage, setSelectedMessage] = useState<MessagePayload | null>(null)
   const [deleteTarget, setDeleteTarget] = useState<MessagePayload | null>(null)
   const [editTarget, setEditTarget]         = useState<MessagePayload | null>(null)

  // Load messages when tab or user changes
  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    if (activeTab === 'inbox') {
      getInboxMessages(user.id)
        .then(res => {
          if (res.status === 'success') setInboxMessages(res.data)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      getSentMessages(user.id)
        .then(res => {
          if (res.status === 'success') setSentMessages(res.data)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [user?.id, activeTab])

  // Remove a message locally after delete
  const handleDelete = async (id: string) => {
    if (!user?.id) return
    try {
      await apiDeleteMessage(id, { senderId: user.id })
      setSentMessages(prev => prev.filter(m => m.message_id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const messages = activeTab === 'inbox' ? inboxMessages : sentMessages

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 ml-6">
          <h1 className="text-2xl font-semibold text-gray-800">Communication</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition cursor-pointer"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            New Message
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-4 ml-6">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 -mb-px border-b-2 font-medium cursor-pointer ${
              activeTab === 'inbox' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
            }`}
          >
            <InboxIcon className="inline h-5 w-5 mr-1 ml-3" />
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
            {messages.map(msg => (
              <div key={msg.message_id} onClick={() => setSelectedMessage(msg)} className="bg-white p-4 rounded-2xl shadow flex justify-between items-start cursor-pointer transform transition duration-200 hover:scale-102">
                <div>
                  <p className="font-semibold text-gray-800">{msg.subject || <em>No subject</em>}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.body}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {activeTab === 'inbox'
                      ? `From: ${msg.sender_name || msg.sender_id}`
                      : `To: ${msg.recipient_name || msg.recipient_id}`
                    } • {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                 <div className="flex space-x-1">
                  {activeTab === 'sent' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditTarget(msg)
                        }}
                         className="text-gray-500 hover:text-gray-600 cursor-pointer transform transition duration-200 hover:scale-130"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(msg)
                        }}
                        className="text-red-600 hover:text-red-800 ml-4 cursor-pointer transform transition duration-200 hover:scale-130"
                        title="Delete"
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

        {/* Send Message Modal */}
        <SendMessageModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSent={newMsg => setSentMessages(prev => [newMsg, ...prev])}
        />

         {selectedMessage && (<ViewMessageModal
          isOpen={!!selectedMessage}
          onClose={() => setSelectedMessage(null)}
          message={selectedMessage!}
        />)}

        {deleteTarget && (
         <DeleteMessageModal
           isOpen
           onClose={() => setDeleteTarget(null)}
           message={deleteTarget}
           onDeleted={(id) => {
             setSentMessages((prev) => prev.filter((m) => m.message_id !== id))
             setDeleteTarget(null)
           }}
         />
       )}

       {editTarget && (
         <EditMessageModal
           isOpen
           onClose={() => setEditTarget(null)}
           message={editTarget}
           onUpdate={(updated) => {
             setSentMessages((prev) =>
               prev.map((m) =>
                 m.message_id === updated.message_id ? updated : m
               )
             )
             setEditTarget(null)
           }}
         />
       )}
      </main>
    </>
  )
}

export default CommunicationPage
