'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/shared/modalKit'
import type { CustomFormState } from '@/lib/studentCustomFields'
import type { CustomFieldDefinition, NewCustomField } from '@/services/types/studentCustomField'
import AddFieldComposer from './AddFieldComposer'
import CustomFieldInput from './CustomFieldInput'
import StudentNotesEditor from './StudentNotesEditor'

export interface CustomFieldsSectionProps {
  /** The school's fields; null while they load or after a load that failed. */
  fields: CustomFieldDefinition[] | null
  loading: boolean
  /** Set when the fields couldn't be loaded. */
  failed: boolean
  onRetry: () => void
  state: CustomFormState
  /** What the form opened with, to tell a value the person changed from one they left. */
  initial: CustomFormState
  onChange: (state: CustomFormState) => void
  onAddField: (field: NewCustomField) => Promise<CustomFieldDefinition>
  /** Renaming, reordering and deleting live in School settings (school setup). */
  canManage: boolean
  idPrefix: string
}

// Short answers sit two to a row; text and long text take the whole width.
const isWide = (field: CustomFieldDefinition) => field.type === 'text' || field.type === 'textarea'

/**
 * The student form's last section: the school's own fields, a way to add one,
 * and this student's one-off notes.
 */
const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
  fields,
  loading,
  failed,
  onRetry,
  state,
  initial,
  onChange,
  onAddField,
  canManage,
  idPrefix,
}) => {
  const inputs = useRef(new Map<string, HTMLElement>())
  // The field just added here: once its input is on screen, the cursor goes to it.
  const awaitingFocus = useRef<string | null>(null)

  const focusAdded = useCallback(() => {
    const input = awaitingFocus.current ? inputs.current.get(awaitingFocus.current) : null
    if (!input) return
    awaitingFocus.current = null
    // A group of buttons takes the cursor on the one that is chosen.
    ;(input.querySelector<HTMLElement>('[role="radio"][tabindex="0"]') ?? input).focus()
    input.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  // The new input appears with the next list of fields; whichever comes
  // first, that render or the request's answer, the other finishes the job.
  useEffect(focusAdded, [fields, focusAdded])

  const setValue = (fieldId: string, value: string) => onChange({ ...state, values: { ...state.values, [fieldId]: value } })

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Custom fields</h3>
        {canManage && fields && fields.length > 0 && (
          <Link
            href="/admin-panel/school-settings#student-custom-fields"
            target="_blank"
            className="text-xs font-medium text-cyan-600 hover:text-cyan-700"
          >
            Manage fields
          </Link>
        )}
      </div>

      {fields === null && loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i}>
              <div className="mb-1.5 h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-[42px] animate-pulse rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {fields === null && failed && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1 text-sm text-amber-900">
            <p className="font-medium">The school&apos;s custom fields didn&apos;t load.</p>
            <p className="mt-0.5">You can still save the rest of this student. Their custom fields stay as they are.</p>
          </div>
          <Button type="button" variant="secondary" onClick={onRetry} className="flex-shrink-0">
            Try again
          </Button>
        </div>
      )}

      {fields !== null && (
        <>
          {fields.length === 0 ? (
            <p className="text-sm text-slate-500">
              Add a field for anything your school records about its students that isn&apos;t above, like a bus route or photo consent.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((field) => {
                const id = `${idPrefix}-custom-${field.fieldId}`
                const value = state.values[field.fieldId] ?? ''
                return (
                  <div key={field.fieldId} className={isWide(field) ? 'sm:col-span-2' : ''}>
                    {/* A yes/no field is a group of buttons, which a label can't point at: it is named by id instead. */}
                    <label
                      id={`${id}-label`}
                      htmlFor={field.type === 'boolean' ? undefined : id}
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      {field.label}
                    </label>
                    <CustomFieldInput
                      field={field}
                      id={id}
                      labelledBy={`${id}-label`}
                      value={value}
                      onChange={(next) => setValue(field.fieldId, next)}
                      showError={value.trim() !== (initial.values[field.fieldId] ?? '').trim()}
                      inputRef={(element: HTMLElement | null) => {
                        if (element) inputs.current.set(field.fieldId, element)
                        else inputs.current.delete(field.fieldId)
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}

          <AddFieldComposer
            existingLabels={fields.map((f) => f.label)}
            onAdd={onAddField}
            onAdded={(field) => {
              awaitingFocus.current = field.fieldId
              requestAnimationFrame(focusAdded)
            }}
            idPrefix={idPrefix}
          />
        </>
      )}

      {/* Notes belong to the student, not to the school's list, so they are editable even when that list didn't load. */}
      <div className="pt-2">
        <StudentNotesEditor notes={state.notes} onChange={(notes) => onChange({ ...state, notes })} idPrefix={idPrefix} />
      </div>
    </section>
  )
}

export default CustomFieldsSection
