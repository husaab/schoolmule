// The custom-fields part of the student form, for the add and edit modals:
// the school's fields, this student's values as form state, and the piece of
// the request body they turn into.
'use client'

import { useCallback, useMemo, useState } from 'react'
import { useAccess } from '@/hooks/useAccess'
import { useStudentCustomFields } from '@/hooks/useStudentCustomFields'
import {
  buildCustomPatch,
  closedCustomFormSession,
  customFormError,
  nextCustomFormSession,
  type CustomFormSession,
  type CustomFormState,
} from '@/lib/studentCustomFields'
import type { StudentCustomFields, StudentCustomFieldsPatch } from '@/services/types/studentCustomField'
import type { CustomFieldsSectionProps } from './CustomFieldsSection'

interface Options {
  isOpen: boolean
  /** The student being edited; leave out for a new student. */
  stored?: StudentCustomFields | null
  idPrefix: string
}

export function useCustomFieldsForm({ isOpen, stored, idPrefix }: Options) {
  const access = useAccess()
  const { fields, loading, error, reload, addField } = useStudentCustomFields(isOpen)
  const [session, setSession] = useState<CustomFormSession>(closedCustomFormSession)

  // The form's state follows things that arrive at different times (the modal
  // opening, the fields loading, a field added later). nextCustomFormSession
  // folds each in once and answers with the same session when nothing changed,
  // so this settles in one extra render and never loops.
  const next = nextCustomFormSession(session, { isOpen, fields, failed: Boolean(error), stored })
  if (next !== session) setSession(next)

  const { initial, state } = session
  const known = useMemo(() => fields ?? [], [fields])
  const setState = useCallback((value: CustomFormState) => setSession((prev) => ({ ...prev, state: value })), [])

  /** What stops the form being saved, or null. */
  const validate = useCallback(() => customFormError(initial, state, known), [initial, state, known])

  /** The `customFields` of the request body; undefined when nothing changed (send no key at all). */
  const body = useCallback(
    (): StudentCustomFieldsPatch | undefined => buildCustomPatch(initial, state, known),
    [initial, state, known],
  )

  const section: CustomFieldsSectionProps = {
    fields,
    loading,
    failed: Boolean(error),
    onRetry: reload,
    state,
    initial,
    onChange: setState,
    onAddField: addField,
    canManage: access.can('school_setup'),
    idPrefix,
  }

  return { section, validate, body }
}
