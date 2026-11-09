'use client'

import React, { useState } from 'react'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { EditMessageInput, Message } from '@/services/types/messaging'
import KebabMenu, { type KebabItem } from '@/components/classes/shared/KebabMenu'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import AttachmentChip from './AttachmentChip'
import Avatar from '@/components/avatar/Avatar'
import MessageEditor from './MessageEditor'
import { bubbleKind, formatTime, senderLabelOf } from './formatters'
import { toneClasses, type Tone } from './tones'

interface MessageBubbleProps {
  conversationId: string
  message: Message
  mine: boolean
  tone: Tone
  canEdit: boolean
  canDelete: boolean
  /** This message is open in the editor (one at a time, held by the thread). */
  editing: boolean
  onEditingChange: (editing: boolean) => void
  onEdit: (input: EditMessageInput) => Promise<void>
  onDelete: () => Promise<void>
  /** A picture or PDF on this message was pressed. */
  onViewAttachment: (attachmentId: string) => void
}

/**
 * One message. The caller's own messages sit on the right in the tone's
 * accent; everyone else's on the left with an avatar. A student's message
 * reads "(Student)" and sits in indigo for the staff and parents who read it;
 * for a student, their parents' messages are amber. A removed message keeps
 * its place as a quiet "Message removed" line so the conversation still
 * reads in order.
 *
 * The ⋯ under your own message is always there, so nobody has to discover it
 * by hovering. Office staff who can remove anyone's message get it on other
 * people's only on hover (always on a touch screen), or every line of every
 * thread would carry one.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ conversationId, message, mine, tone, canEdit, canDelete, editing, onEditingChange, onEdit, onDelete, onViewAttachment }) => {
  const t = toneClasses(tone)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [removing, setRemoving] = useState(false)

  const removed = Boolean(message.deletedAt)
  const senderLabel = senderLabelOf(message)
  const theirs = { student: t.bubbleStudent, parent: t.bubbleParent, other: t.bubbleTheirs }[bubbleKind(message)]

  const remove = async () => {
    setRemoving(true)
    try {
      await onDelete()
      setConfirmingRemove(false)
    } finally {
      setRemoving(false)
    }
  }

  const menu: KebabItem[] = [
    ...(canEdit ? [{ key: 'edit', label: 'Edit', icon: PencilSquareIcon, onSelect: () => onEditingChange(true) }] : []),
    ...(canDelete
      ? [{ key: 'remove', label: 'Remove', icon: TrashIcon, tone: 'danger' as const, separatorBefore: canEdit, onSelect: () => setConfirmingRemove(true) }]
      : []),
  ]

  const bubble = removed ? (
    <div className="rounded-2xl border border-dashed border-slate-200 px-3.5 py-2 text-sm italic text-slate-400">
      Message removed
    </div>
  ) : editing ? (
    <MessageEditor
      conversationId={conversationId}
      message={message}
      tone={tone}
      bubbleClass={mine ? t.bubbleMine : theirs}
      onSave={onEdit}
      onClose={() => onEditingChange(false)}
    />
  ) : message.body ? (
    <div
      className={`whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed ${
        mine ? `${t.bubbleMine} rounded-2xl rounded-br-md` : `${theirs} rounded-2xl rounded-bl-md`
      }`}
    >
      {message.body}
    </div>
  ) : null

  return (
    <div className={`group flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
      {!mine && (
        <span title={senderLabel} className="flex flex-shrink-0">
          <Avatar student={message.senderRole === 'STUDENT'} name={message.senderName} avatar={message.senderAvatar} photoUrl={message.senderPhotoUrl} size={32} />
        </span>
      )}
      <div className={`flex max-w-[78%] flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
        {bubble}
        {!removed && !editing && message.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${mine ? 'justify-end' : ''}`}>
            {message.attachments.map((a) => (
              <AttachmentChip key={a.attachmentId} attachment={a} onView={() => onViewAttachment(a.attachmentId)} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-0.5">
          <p className="text-[11px] text-slate-500">
            {mine ? 'You' : senderLabel} · {formatTime(message.createdAt)}
            {message.editedAt && !removed && <span> · edited</span>}
          </p>
          {!removed && !editing && (
            <KebabMenu
              compact
              label="Message options"
              items={menu}
              className={mine ? '' : 'opacity-0 focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100'}
            />
          )}
        </div>
      </div>

      <Modal isOpen={confirmingRemove} onClose={() => setConfirmingRemove(false)} size="sm">
        <ModalHeader title="Remove this message?" icon={TrashIcon} tone="danger" />
        <ModalBody>
          <ConfirmBody>
            Everyone in this conversation will see &ldquo;Message removed&rdquo; in its place. An email that has already gone out can&rsquo;t be recalled.
          </ConfirmBody>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => setConfirmingRemove(false)}>
            Keep it
          </Button>
          <Button type="button" variant="danger" onClick={remove} loading={removing}>
            Remove
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default MessageBubble
