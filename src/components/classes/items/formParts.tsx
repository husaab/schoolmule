// src/components/classes/items/formParts.tsx
// The item form's small shared pieces (the Teacher-NewAssessment and
// Teacher-Assign boards): white cards, labelled fields with their error line,
// the input styles, and the Topic picker with "New topic…".
'use client'

import type { ReactNode } from 'react'
import type { ItemFormErrors, ItemFormValues } from '@/lib/itemForm'
import type { CategoryOption, ColumnOption, Topic } from '@/services/types/classwork'
import type { AttachmentsState } from './AttachmentsEditor'

export const FIELD_INPUT =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-rose-300'

export const FIELD_SELECT = `${FIELD_INPUT} cursor-pointer`

export const fieldId = (name: string) => `item-field-${name}`

export function FormCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 ${className}`}>{children}</div>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-[17px] font-semibold text-slate-900">{children}</h2>
}

interface LabeledFieldProps {
  label: ReactNode
  /** The control's name: its id is fieldId(name), so an error can focus it. */
  name: string
  optional?: boolean
  error?: string
  hint?: ReactNode
  children: ReactNode
}

export function LabeledField({ label, name, optional = false, error, hint, children }: LabeledFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId(name)} className="text-[13px] font-medium text-slate-600">
        {label}
        {optional && <span className="font-normal text-slate-500"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${fieldId(name)}-error`} className="text-xs text-rose-700">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}

export const NEW_TOPIC = '__new__'

interface TopicFieldProps {
  topics: Topic[]
  value: string
  onChange: (topicId: string) => void
  onNewTopic: () => void
  error?: string
  disabled?: boolean
}

/** Topic: "No topic", the class's topics, then "New topic…" (opens the topic window). */
export function TopicField({ topics, value, onChange, onNewTopic, error, disabled }: TopicFieldProps) {
  return (
    <LabeledField label="Topic" name="topicId" error={error}>
      <select
        id={fieldId('topicId')}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        onChange={(e) => (e.target.value === NEW_TOPIC ? onNewTopic() : onChange(e.target.value))}
        className={FIELD_SELECT}
      >
        <option value="">No topic</option>
        {topics.map((t) => (
          <option key={t.topicId} value={t.topicId}>
            {t.name}
          </option>
        ))}
        <option value={NEW_TOPIC}>New topic…</option>
      </select>
    </LabeledField>
  )
}

interface CheckboxRowProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  disabled?: boolean
}

export function CheckboxRow({ checked, onChange, children, disabled }: CheckboxRowProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-800">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-px h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-slate-300 accent-cyan-600"
      />
      <span>{children}</span>
    </label>
  )
}

/** What every kind's field layout receives from the form. */
export interface ItemFieldsProps {
  classId: string
  subject: string
  studentCount: number
  /** Students of the class an item email reaches (they sign in, and are in the school's student-email grades); null while unknown. */
  emailableStudents: number | null
  values: ItemFormValues
  set: (patch: Partial<ItemFormValues>) => void
  errors: ItemFormErrors
  topics: Topic[]
  categories: CategoryOption[]
  /** The columns an assignment or quiz may fill (on an edit, its own too). */
  columns: ColumnOption[]
  /** The item fills a column that counts on its own (no category). */
  standalone: boolean
  /** That column's "Out of", shown read-only. */
  standaloneMax: number | null
  /** The category the item's column is under now (an edit), else null. */
  currentCategoryId: string | null
  /** JK and SK: graded on skills, so nothing here is graded. */
  kindergarten: boolean
  attachments: AttachmentsState
  onNewTopic: () => void
}
