'use client'

import React, { useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useMessagingStore } from '@/store/useMessagingStore'
import { deleteAnnouncement } from '@/services/announcementService'
import type { AnnouncementItem } from '@/services/types/announcement'

interface Props {
  isOpen: boolean
  onClose: () => void
  item: AnnouncementItem | null
  onDeleted: (announcementId: string) => void
}

/** Soft-delete confirmation: what disappears, what cannot be recalled. */
const DeleteAnnouncementModal: React.FC<Props> = ({ isOpen, onClose, item, onDeleted }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const bump = useMessagingStore((s) => s.bump)
  const [working, setWorking] = useState(false)

  const confirm = async () => {
    if (!item || working) return
    setWorking(true)
    try {
      await deleteAnnouncement(item.announcementId)
      showNotification('Announcement removed', 'success')
      void bump()
      onDeleted(item.announcementId)
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not remove announcement', 'error')
    } finally {
      setWorking(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader title="Remove announcement" subtitle="This cannot be undone." icon={TrashIcon} tone="danger" />
      <ModalBody>
        {item && <RecordFacts facts={[{ label: 'Title', value: item.title }, { label: 'Audience', value: item.scopeLabel }]} />}
        <ConfirmBody
          consequences={{
            title: 'What happens',
            items: [
              'It disappears from every feed and dashboard.',
              'Emails not yet sent are cancelled; emails already sent cannot be recalled.',
              'Attachments are deleted from storage.',
              'Anyone opening an old email link sees “This announcement was removed”.',
            ],
          }}
        >
          Remove this announcement for everyone?
        </ConfirmBody>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Keep it
        </Button>
        <Button type="button" variant="danger" onClick={confirm} loading={working}>
          Remove
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DeleteAnnouncementModal
