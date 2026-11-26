// src/hooks/useStudentCustomFields.ts
// The school's custom student fields, for whatever shows them: the student
// form, the profile, School settings and the forms import mapping.
// `enabled: false` waits (a closed modal loads nothing).
'use client'

import { useCallback } from 'react'
import { useLoad } from './useLoad'
import { createCustomField, getCustomFields } from '@/services/studentCustomFieldService'
import type { CustomFieldDefinition, NewCustomField } from '@/services/types/studentCustomField'

export function useStudentCustomFields(enabled = true) {
  const { data, loading, error, reload, patch } = useLoad<CustomFieldDefinition[]>(
    enabled ? 'student-custom-fields' : null,
    async () => (await getCustomFields()).data,
  )

  /** A field the server just saved: replaces its row on screen, or joins the end of the list. */
  const upsertField = useCallback(
    (saved: CustomFieldDefinition) =>
      patch((fields) =>
        fields.some((f) => f.fieldId === saved.fieldId) ? fields.map((f) => (f.fieldId === saved.fieldId ? saved : f)) : [...fields, saved],
      ),
    [patch],
  )

  /** A field that is no longer in use (deleted). */
  const removeField = useCallback((fieldId: string) => patch((fields) => fields.filter((f) => f.fieldId !== fieldId)), [patch])

  /** Adds a field for every student and puts it at the end of the list on screen. */
  const addField = useCallback(
    async (field: NewCustomField): Promise<CustomFieldDefinition> => {
      const res = await createCustomField(field)
      upsertField(res.data)
      return res.data
    },
    [upsertField],
  )

  return {
    /** null until the first answer arrives (or after a first load that failed). */
    fields: data,
    loading,
    error,
    reload,
    addField,
    upsertField,
    removeField,
    /** Replace the whole list on screen (a new order). */
    setFields: patch,
  }
}
