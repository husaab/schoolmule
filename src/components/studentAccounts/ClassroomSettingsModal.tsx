// src/components/studentAccounts/ClassroomSettingsModal.tsx
// The school's classroom settings in a window on Student accounts. The same
// form sits on Admin Panel → School Settings (ClassroomSettingsForm).
'use client'

import React from 'react'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import type { ClassroomSettings } from '@/services/types/studentAccount'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { ClassroomSettingsFields, useClassroomSettingsForm } from './ClassroomSettingsForm'

interface Props {
  isOpen: boolean
  onClose: () => void
  settings: ClassroomSettings
  onSaved: (settings: ClassroomSettings) => void
}

export default function ClassroomSettingsModal({ isOpen, onClose, settings, onSaved }: Props) {
  // Reopening starts again from the saved settings.
  const formState = useClassroomSettingsForm(settings, onSaved, isOpen)
  const { saving, save } = formState

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await save()) onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} style="w-full max-w-lg">
      <ModalHeader title="Classroom settings" subtitle="Student sign-in, class emails and the parents' weekly summary" icon={Cog6ToothIcon} />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ClassroomSettingsFields {...formState} />
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
