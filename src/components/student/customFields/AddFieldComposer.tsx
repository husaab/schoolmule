'use client'

import React, { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/shared/modalKit'
import { emptyFieldDraft, fieldDraftError, toNewField, type FieldDraft } from '@/lib/studentCustomFields'
import type { CustomFieldDefinition, NewCustomField } from '@/services/types/studentCustomField'
import FieldDefinitionForm from './FieldDefinitionForm'

interface AddFieldComposerProps {
  /** Names already in use, so a repeat is caught before the server is asked. */
  existingLabels: string[]
  onAdd: (field: NewCustomField) => Promise<CustomFieldDefinition>
  /** After the field exists: the form puts the cursor in its new input. */
  onAdded: (field: CustomFieldDefinition) => void
  idPrefix: string
}

/**
 * "Add a field", in place. A teacher who needs somewhere to write a bus route
 * makes the field here, without leaving the student they are editing; it
 * then shows on every student.
 *
 * It sits inside the student form, so nothing in it is a submit button and
 * Enter adds the field rather than saving the student.
 */
const AddFieldComposer: React.FC<AddFieldComposerProps> = ({ existingLabels, onAdd, onAdded, idPrefix }) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<FieldDraft>(emptyFieldDraft)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const close = () => {
    setOpen(false)
    setDraft(emptyFieldDraft)
    setError(null)
  }

  const submit = async () => {
    if (saving) return
    const problem = fieldDraftError(draft, existingLabels)
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const field = await onAdd(toNewField(draft))
      close()
      onAdded(field)
    } catch (err) {
      setError(err instanceof Error ? err.message : "The field couldn't be added. Try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:border-cyan-400 hover:bg-cyan-50/50 hover:text-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      >
        <PlusIcon className="h-4 w-4 flex-shrink-0" />
        Add a field
        <span className="ml-auto text-xs font-normal text-slate-400">Shows on every student</span>
      </button>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">New field</p>
        <p className="mt-0.5 text-xs text-slate-500">
          It shows on every student in the school, so use it for something you&apos;d record for most of them.
        </p>
      </div>

      <FieldDefinitionForm
        draft={draft}
        onChange={(next) => {
          setDraft(next)
          setError(null)
        }}
        idPrefix={`${idPrefix}-new-field`}
        autoFocus
        onEnter={submit}
        onTint
      />

      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={close} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} loading={saving}>
          {saving ? 'Adding' : 'Add field'}
        </Button>
      </div>
    </div>
  )
}

export default AddFieldComposer
