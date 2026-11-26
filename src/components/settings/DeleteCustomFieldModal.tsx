'use client'

import React, { useEffect, useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { deleteCustomField, getCustomFieldUsage } from '@/services/studentCustomFieldService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { CustomFieldDefinition, CustomFieldUsage } from '@/services/types/studentCustomField'

interface DeleteCustomFieldModalProps {
  field: CustomFieldDefinition | null
  onClose: () => void
  onDeleted: (field: CustomFieldDefinition) => void
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * Deleting a field hides it; it doesn't erase anything. The dialog says how
 * many students and forms use it, and where to get it back.
 */
const DeleteCustomFieldModal: React.FC<DeleteCustomFieldModalProps> = ({ field, onClose, onDeleted }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [usage, setUsage] = useState<CustomFieldUsage | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    setUsage(null)
    if (!field) return
    let cancelled = false
    getCustomFieldUsage(field.fieldId).then(
      (res) => {
        if (!cancelled) setUsage(res.data)
      },
      // The counts are a courtesy: without them the dialog still says what deleting does.
      () => {},
    )
    return () => {
      cancelled = true
    }
  }, [field])

  const confirm = async () => {
    if (!field || working) return
    setWorking(true)
    try {
      await deleteCustomField(field.fieldId)
      onDeleted(field)
      showNotification(`"${field.label}" deleted. Restore it from Deleted fields.`, 'success')
      onClose()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "The field couldn't be deleted", 'error')
    } finally {
      setWorking(false)
    }
  }

  const items: string[] = []
  if (usage) {
    items.push(
      usage.studentCount > 0
        ? `${plural(usage.studentCount, 'student has', 'students have')} an answer for it this year. Those answers are kept, hidden.`
        : 'No student has an answer for it this year.',
    )
    if (usage.formCount > 0) {
      items.push(`${plural(usage.formCount, 'form saves', 'forms save')} a question into it. Imports skip that question until the field is restored.`)
    }
  }
  items.push('Restore it any time from Deleted fields, and every answer comes back.')

  return (
    <Modal isOpen={Boolean(field)} onClose={onClose} style="w-full max-w-md">
      <ModalHeader title="Delete this field?" subtitle={field?.label} icon={TrashIcon} tone="danger" />
      <ModalBody>
        <ConfirmBody consequences={{ title: 'What happens', items }} tone="warning">
          &ldquo;{field?.label}&rdquo; disappears from every student, the student profile and the forms import.
        </ConfirmBody>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose} disabled={working}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={confirm} loading={working}>
          {working ? 'Deleting' : 'Delete field'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DeleteCustomFieldModal
