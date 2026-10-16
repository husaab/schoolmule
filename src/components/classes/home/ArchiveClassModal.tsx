// src/components/classes/home/ArchiveClassModal.tsx
// Confirms archiving a class. An archived class leaves the class cards and
// students' and parents' class lists; its grades, report cards and messages
// stay, and it can be unarchived from the List view or its own page.
'use client'

import { useState } from 'react'
import { ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { archiveClass } from '@/services/classroomService'

interface ArchiveClassModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  /** "Grade 5 Science" */
  label: string
  /** The archive time the server recorded. */
  onArchived: (archivedAt: string | null) => void
}

export default function ArchiveClassModal({ isOpen, onClose, classId, label, onArchived }: ArchiveClassModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (saving) return
    setError(null)
    onClose()
  }

  const confirm = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await archiveClass(classId)
      setSaving(false)
      onArchived(res.data.archivedAt)
      onClose()
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error && err.message ? err.message : "The class couldn't be archived. Try again.")
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} style="w-full max-w-md">
      <ModalHeader title={`Archive ${label}?`} icon={ArchiveBoxArrowDownIcon} tone="warning" />
      <ModalBody>
        <ConfirmBody tone="warning">
          It disappears from class cards and from students&apos; and parents&apos; class lists. Grades, report cards
          and messages stay. You can unarchive it from the List view.
        </ConfirmBody>
        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={close} disabled={saving}>
          Cancel
        </Button>
        <Button variant="warning" onClick={confirm} loading={saving}>
          Archive class
        </Button>
      </ModalFooter>
    </Modal>
  )
}
