'use client'

import React, { useEffect, useRef } from 'react'
import { filledCustomFields, formatCustomValue } from '@/lib/studentCustomFields'
import { formatDay } from '@/lib/studentProfile'
import { useStudentCustomFields } from '@/hooks/useStudentCustomFields'
import type { CustomFieldDefinition, CustomFieldValue, StudentCustomFields } from '@/services/types/studentCustomField'
import { SectionLabel } from './contact'

const YES_NO_PILL = {
  yes: 'bg-emerald-50 text-emerald-700',
  no: 'bg-slate-100 text-slate-600',
}

const Value = ({ field, value }: { field: CustomFieldDefinition; value: CustomFieldValue }) => {
  if (field.type === 'boolean') {
    const yes = value === true
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${yes ? YES_NO_PILL.yes : YES_NO_PILL.no}`}>
        {yes ? 'Yes' : 'No'}
      </span>
    )
  }
  if (field.type === 'date') {
    return <>{formatDay(String(value), { month: 'short', day: 'numeric', year: 'numeric' })}</>
  }
  return <span className="whitespace-pre-line break-words">{formatCustomValue(field, value)}</span>
}

/**
 * The school's custom fields this student has an answer for, and their
 * one-off notes, on the profile's Details card. Shows nothing at all for a
 * student with neither, and asks for the school's field list only when the
 * student holds a value that needs a name.
 */
const CustomFieldsBlock: React.FC<{ data: StudentCustomFields | undefined }> = ({ data }) => {
  const hasValues = Boolean(data && Object.keys(data.values).length > 0)
  const notes = data?.notes ?? []
  const { fields, reload } = useStudentCustomFields(hasValues)

  // A field added a moment ago (from the Edit form, say) isn't in the list
  // this card loaded earlier, and its value would stay hidden. So a value
  // under an id the list doesn't have fetches the list again — once per id,
  // because a deleted field's values are kept and its id never appears.
  const asked = useRef(new Set<string>())
  const unknown = fields ? Object.keys(data?.values ?? {}).filter((id) => !fields.some((f) => f.fieldId === id)) : []
  const unknownKey = unknown.join(',')
  useEffect(() => {
    const fresh = unknownKey ? unknownKey.split(',').filter((id) => !asked.current.has(id)) : []
    if (fresh.length === 0) return
    fresh.forEach((id) => asked.current.add(id))
    reload()
  }, [unknownKey, reload])

  const filled = filledCustomFields(data, fields ?? [])
  if (filled.length === 0 && notes.length === 0) return null

  return (
    <div className="mt-5 space-y-5 border-t border-slate-100 pt-4">
      {filled.length > 0 && (
        <section className="space-y-2">
          <SectionLabel>Custom fields</SectionLabel>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
            {filled.map(({ field, value }) => (
              <div key={field.fieldId} className={field.type === 'textarea' ? 'sm:col-span-2 xl:col-span-3' : ''}>
                <dt className="text-xs text-slate-500">{field.label}</dt>
                <dd className="mt-0.5 text-sm text-slate-700">
                  <Value field={field} value={value} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {notes.length > 0 && (
        <section className="space-y-2">
          <SectionLabel>Notes</SectionLabel>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
            {notes.map((note, index) => (
              <div key={`${note.label}-${index}`}>
                <dt className="text-xs text-slate-500">{note.label}</dt>
                <dd className="mt-0.5 whitespace-pre-line break-words text-sm text-slate-700">{note.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  )
}

export default CustomFieldsBlock
