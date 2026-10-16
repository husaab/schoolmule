// src/components/classes/classwork/DeleteItemModal.tsx
// Deleting a classwork item. Graded work takes its gradebook column and the
// scores in it along (the category refills, so the class keeps its 100
// points); ungraded work just leaves Classwork. The score count is read
// fresh when the window opens.
'use client'

import { useEffect, useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { deleteItemMessage, KIND_LABELS } from '@/lib/classworkRows'
import { deleteItem, getItem } from '@/services/classworkService'
import type { DeleteItemResult, ItemSummary } from '@/services/types/classwork'
import { useNotificationStore } from '@/store/useNotificationStore'

interface DeleteItemModalProps {
  item: ItemSummary | null
  onClose: () => void
  onDeleted: (itemId: string, result: DeleteItemResult) => void
  /** "Discard draft" instead of "Delete". */
  draft?: boolean
}

export default function DeleteItemModal({ item, onClose, onDeleted, draft = false }: DeleteItemModalProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [working, setWorking] = useState(false)
  const [fresh, setFresh] = useState<ItemSummary | null>(null)

  // The latest score count (Grades may have changed since the list loaded).
  const itemId = item?.itemId ?? null
  useEffect(() => {
    if (!itemId) return
    let cancelled = false
    getItem(itemId).then(
      (res) => !cancelled && setFresh(res.data),
      () => undefined,
    )
    return () => {
      cancelled = true
    }
  }, [itemId])

  const shown = fresh?.itemId === itemId ? fresh : item

  const confirm = async () => {
    if (!item || working) return
    setWorking(true)
    try {
      const res = await deleteItem(item.itemId)
      showNotification(
        res.data.removedColumn ? `${item.title} and its Grades column deleted` : draft ? 'Draft discarded' : `${item.title} deleted`,
        'success',
      )
      onDeleted(item.itemId, res.data)
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "It couldn't be deleted.", 'error')
    } finally {
      setWorking(false)
    }
  }

  return (
    <Modal isOpen={item !== null} onClose={onClose} size="md">
      <ModalHeader
        title={draft ? 'Discard draft' : `Delete ${item ? KIND_LABELS[item.kind].toLowerCase() : 'item'}`}
        subtitle={shown?.title}
        icon={TrashIcon}
        tone="danger"
      />
      <ModalBody>{shown && <ConfirmBody>{deleteItemMessage(shown)}</ConfirmBody>}</ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Keep it
        </Button>
        <Button type="button" variant="danger" onClick={confirm} loading={working}>
          {draft ? 'Discard draft' : 'Delete'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
