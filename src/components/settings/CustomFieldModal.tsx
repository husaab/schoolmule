'use client'

import React, { useEffect, useState } from 'react'
import { PencilSquareIcon, SquaresPlusIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import FieldDefinitionForm from '@/components/student/customFields/FieldDefinitionForm'
import { emptyFieldDraft, fieldDraftError, toNewField, type FieldDraft } from '@/lib/studentCustomFields'
import { createCustomField, updateCustomField } from '@/services/studentCustomFieldService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { CustomFieldDefinition } from '@/services/types/studentCustomField'

interface CustomFieldModalProps {
  isOpen: boolean
  onClose: () => void
  /** The field being edited; null adds a new one. */
  field: CustomFieldDefinition | null
  /** The names of the school's other fields. */
  otherLabels: string[]
  onSaved: (field: CustomFieldDefinition) => void
}

/** Add a custom student field, or rename one and change a dropdown's choices. */
const CustomFieldModal: React.FC<CustomFieldModalProps> = ({ isOpen, onClose, field, otherLabels, onSaved }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [draft, setDraft] = useState<FieldDraft>(emptyFieldDraft)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setDraft(field ? { label: field.label, type: field.type, options: field.options ?? [] } : emptyFieldDraft)
    setError(null)
  }, [isOpen, field])

  const save = async () => {
    if (saving) return
    const problem = fieldDraftError(draft, otherLabels)
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const body = toNewField(draft)
      const res = field
        ? await updateCustomField(field.fieldId, { label: body.label, ...(body.options ? { options: body.options } : {}) })
        : await createCustomField(body)
      onSaved(res.data)
      showNotification(field ? 'Field saved' : `"${res.data.label}" added`, 'success')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "The field couldn't be saved. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title={field ? 'Edit field' : 'Add a field'}
        subtitle={field ? field.label : 'It shows on every student in the school.'}
        icon={field ? PencilSquareIcon : SquaresPlusIcon}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <ModalBody>
          <FieldDefinitionForm
            draft={draft}
            onChange={(next) => {
              setDraft(next)
              setError(null)
            }}
            idPrefix="custom-field"
            lockType={Boolean(field)}
            autoFocus
            onEnter={() => void save()}
          />
          {field?.type === 'select' && (
            <p className="text-xs text-slate-500">
              Removing a choice doesn&apos;t change the students who already have it. Their answer stays until someone picks another.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving' : field ? 'Save changes' : 'Add field'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default CustomFieldModal
