// src/components/classes/classwork/DeleteTopicModal.tsx
// Deleting a topic: its items stay in Classwork, without a topic.
'use client'

import { useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { deleteTopicMessage } from '@/lib/classworkRows'
import { deleteTopic } from '@/services/classworkService'
import type { Topic } from '@/services/types/classwork'
import { useNotificationStore } from '@/store/useNotificationStore'

interface DeleteTopicModalProps {
  topic: Topic | null
  onClose: () => void
  onDeleted: (topicId: string) => void
}

export default function DeleteTopicModal({ topic, onClose, onDeleted }: DeleteTopicModalProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [working, setWorking] = useState(false)

  const confirm = async () => {
    if (!topic || working) return
    setWorking(true)
    try {
      await deleteTopic(topic.topicId)
      showNotification(`${topic.name} deleted`, 'success')
      onDeleted(topic.topicId)
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "The topic couldn't be deleted.", 'error')
    } finally {
      setWorking(false)
    }
  }

  return (
    <Modal isOpen={topic !== null} onClose={onClose} size="md">
      <ModalHeader title="Delete topic" subtitle={topic?.name} icon={TrashIcon} tone="danger" />
      <ModalBody>{topic && <ConfirmBody>{deleteTopicMessage(topic)}</ConfirmBody>}</ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Keep it
        </Button>
        <Button type="button" variant="danger" onClick={confirm} loading={working}>
          Delete topic
        </Button>
      </ModalFooter>
    </Modal>
  )
}
