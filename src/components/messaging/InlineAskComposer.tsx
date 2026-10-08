'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createConversation } from '@/services/messagingService'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import Composer from './Composer'

interface InlineAskComposerProps {
  studentId: string
  studentFirstName: string
  classId: string
  assessmentId: string
  assessmentName: string
  scoreLabel: string | null
  teacherName: string | null
  onClose: () => void
}

/**
 * The amber card that opens under an assessment row on the parent grades
 * page. The first message creates the thread (or joins the existing one)
 * and then takes the parent straight into it.
 */
const InlineAskComposer: React.FC<InlineAskComposerProps> = ({
  studentId,
  studentFirstName,
  classId,
  assessmentId,
  assessmentName,
  scoreLabel,
  teacherName,
  onClose,
}) => {
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const bump = useMessagingStore((s) => s.bump)

  const send = async ({ body, files }: { body: string; files: File[] }) => {
    const res = await createConversation({ studentId, classId, assessmentId, body, files })
    if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not send message')
    void bump()
    showNotification('Message sent', 'success')
    router.push(`/parent/messages?thread=${encodeURIComponent(res.data.conversation.conversationId)}`)
  }

  return (
    <div className="mt-2 mb-1 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm text-amber-900">
          New message to <span className="font-medium">{teacherName ?? 'the teacher'}</span> about{' '}
          <span className="font-medium">
            {assessmentName}
            {scoreLabel ? ` · ${scoreLabel}` : ''}
          </span>{' '}
          for {studentFirstName}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 text-amber-700 hover:bg-amber-100 cursor-pointer"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      <Composer
        tone="parent"
        placeholder="What would you like to ask or share?"
        recipientsLabel={teacherName ? `${teacherName} will be emailed` : undefined}
        onSend={send}
        compact
        autoFocus
        submitLabel="Send message"
      />
    </div>
  )
}

export default InlineAskComposer
