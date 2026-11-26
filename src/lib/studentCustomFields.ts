// src/lib/studentCustomFields.ts
// The school's custom student fields, as pure functions: turning what the API
// stores into what a form edits and back, and saying what is wrong with a
// value before it is sent. The server checks everything again
// (services/customFields/values.js in the backend); these exist so the form
// can answer at once and send only what changed.
import type {
  CustomFieldDefinition,
  CustomFieldType,
  CustomFieldValue,
  NewCustomField,
  StudentCustomFields,
  StudentCustomFieldsPatch,
  StudentNote,
} from '@/services/types/studentCustomField'

export const CUSTOM_FIELD_LIMITS = {
  label: 80,
  options: 50,
  option: 100,
  text: 500,
  textarea: 5000,
  notes: 20,
  noteLabel: 80,
  noteValue: 1000,
} as const

/** The kinds of field, in the order they are offered, named as a person would. */
export const CUSTOM_FIELD_TYPES: { type: CustomFieldType; label: string; example: string }[] = [
  { type: 'text', label: 'Short text', example: 'Locker number' },
  { type: 'textarea', label: 'Long text', example: 'Pickup notes' },
  { type: 'number', label: 'Number', example: 'Siblings' },
  { type: 'date', label: 'Date', example: 'First day' },
  { type: 'select', label: 'Dropdown', example: 'Bus route' },
  { type: 'boolean', label: 'Yes / No', example: 'Photo consent' },
]

export const customFieldTypeLabel = (type: CustomFieldType): string =>
  CUSTOM_FIELD_TYPES.find((t) => t.type === type)?.label ?? type

// ─── Form state ───────────────────────────────────────────────────────

/** One note row in a form. `key` only tells rows apart while editing. */
export interface NoteDraft {
  key: string
  label: string
  value: string
}

/**
 * A student's custom data while it is being edited. Every field's value is a
 * string, the way an input holds it: '' is "not set", a yes/no field is
 * 'yes' | 'no' | ''.
 */
export interface CustomFormState {
  values: Record<string, string>
  notes: NoteDraft[]
}

export const emptyCustomForm: CustomFormState = { values: {}, notes: [] }

let noteKeys = 0
export const newNoteKey = (): string => `note-${Date.now().toString(36)}-${(noteKeys++).toString(36)}`

/** A stored value as an input holds it. */
export const toFormValue = (value: CustomFieldValue | null | undefined): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return String(value)
}

/** What the API returned for a student, as form state. Values of deleted fields are left out. */
export const toCustomForm = (
  data: StudentCustomFields | null | undefined,
  fields: CustomFieldDefinition[],
): CustomFormState => {
  const values: Record<string, string> = {}
  for (const field of fields) {
    const text = toFormValue(data?.values?.[field.fieldId])
    if (text !== '') values[field.fieldId] = text
  }
  return {
    values,
    notes: (data?.notes ?? []).map((note) => ({ key: newNoteKey(), label: note.label, value: note.value })),
  }
}

// ─── A form's custom state over its lifetime ──────────────────────────

/** The custom part of one opening of the student form. */
export interface CustomFormSession {
  /** What the form opened with, to tell what the person changed. */
  initial: CustomFormState
  state: CustomFormState
  /** The fields this opening has been given values for; null before the school's list first arrives. */
  seeded: readonly string[] | null
  /** Whether the student's notes are on screen yet. */
  notesSeeded: boolean
}

export const closedCustomFormSession: CustomFormSession = {
  initial: emptyCustomForm,
  state: emptyCustomForm,
  seeded: null,
  notesSeeded: false,
}

/**
 * The session after what has happened around the form: it opened or closed,
 * the school's fields loaded (or failed to), or a field turned up later
 * (added from this form, or by someone else meanwhile). Returns the same
 * session when there is nothing to do, and never changes what the person has
 * already typed.
 */
export const nextCustomFormSession = (
  session: CustomFormSession,
  now: {
    isOpen: boolean
    /** The school's fields, or null while they load or after a load that failed. */
    fields: CustomFieldDefinition[] | null
    failed: boolean
    /** The student being edited; nothing for a new student. */
    stored: StudentCustomFields | null | undefined
  },
): CustomFormSession => {
  const { isOpen, fields, failed, stored } = now
  if (!isOpen) return session === closedCustomFormSession ? session : closedCustomFormSession

  if (fields && session.seeded === null) {
    const opened = toCustomForm(stored, fields)
    // If the list failed first and loaded on a retry, the notes are already
    // on screen (and may have been edited): keep them.
    const withNotes = (form: CustomFormState): CustomFormState =>
      session.notesSeeded ? { values: opened.values, notes: form.notes } : opened
    return {
      initial: withNotes(session.initial),
      state: withNotes(session.state),
      seeded: fields.map((f) => f.fieldId),
      notesSeeded: true,
    }
  }

  if (fields && session.seeded) {
    const known = new Set(session.seeded)
    const arrived = fields.filter((f) => !known.has(f.fieldId))
    if (arrived.length === 0) return session
    const values: Record<string, string> = {}
    for (const field of arrived) {
      const text = toFormValue(stored?.values?.[field.fieldId])
      if (text !== '') values[field.fieldId] = text
    }
    return {
      ...session,
      initial: { ...session.initial, values: { ...session.initial.values, ...values } },
      // What the person typed wins over what was stored for a field that only just appeared.
      state: { ...session.state, values: { ...values, ...session.state.values } },
      seeded: [...session.seeded, ...arrived.map((f) => f.fieldId)],
    }
  }

  // The list failed to load: the notes don't depend on it, so they are still editable.
  if (!fields && failed && !session.notesSeeded) {
    const notesOnly = toCustomForm(stored, [])
    return { ...session, initial: notesOnly, state: notesOnly, notesSeeded: true }
  }

  return session
}

// ─── Reading a value ──────────────────────────────────────────────────

const NUMBER_RE = /^-?\d+(\.\d+)?$/
const MAX_NUMBER = 1e12
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

// Only YYYY-MM-DD, which is all a date input produces. (The server also reads
// day-first dates, for the answers parents type into forms.)
const isRealDate = (text: string): boolean => {
  const m = text.match(ISO_DATE_RE)
  if (!m) return false
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (year < 1900 || year > 2100) return false
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

/** What is wrong with a field's input, in words for under the input, or null. */
export const customFieldError = (field: CustomFieldDefinition, text: string): string | null => {
  const value = text.trim()
  if (value === '') return null
  switch (field.type) {
    case 'text':
      return value.length > CUSTOM_FIELD_LIMITS.text ? `At most ${CUSTOM_FIELD_LIMITS.text} characters` : null
    case 'textarea':
      return value.length > CUSTOM_FIELD_LIMITS.textarea ? `At most ${CUSTOM_FIELD_LIMITS.textarea} characters` : null
    case 'number':
      if (!NUMBER_RE.test(value)) return 'Enter a number, like 3 or 2.5'
      return Math.abs(Number(value)) < MAX_NUMBER ? null : 'That number is too large'
    case 'date':
      return isRealDate(value) ? null : 'Enter a real date'
    case 'select':
      return (field.options ?? []).includes(value) ? null : 'Choose one of the options'
    case 'boolean':
      return value === 'yes' || value === 'no' ? null : 'Choose Yes or No'
    default:
      return null
  }
}

/** An input's text as the value to send: null for "not set". Call after customFieldError passes. */
export const fromFormValue = (field: CustomFieldDefinition, text: string): CustomFieldValue | null => {
  const value = text.trim()
  if (value === '') return null
  if (field.type === 'number') return Number(value)
  if (field.type === 'boolean') return value === 'yes'
  return value
}

/** A stored value no longer among a dropdown's choices (the choice was removed after it was saved). */
export const isRetiredOption = (field: CustomFieldDefinition, text: string): boolean =>
  field.type === 'select' && text !== '' && !(field.options ?? []).includes(text)

// ─── Sending ──────────────────────────────────────────────────────────

const cleanNotes = (notes: NoteDraft[]): StudentNote[] =>
  notes
    .map((note) => ({ label: note.label.trim().replace(/\s+/g, ' '), value: note.value.trim() }))
    .filter((note) => note.label !== '' && note.value !== '')

const sameNotes = (a: StudentNote[], b: StudentNote[]): boolean =>
  a.length === b.length && a.every((note, i) => note.label === b[i].label && note.value === b[i].value)

/** The fields whose input differs from what the form opened with. */
const changedFields = (
  initial: CustomFormState,
  current: CustomFormState,
  fields: CustomFieldDefinition[],
): CustomFieldDefinition[] =>
  fields.filter((field) => (current.values[field.fieldId] ?? '').trim() !== (initial.values[field.fieldId] ?? '').trim())

/**
 * The first thing that stops the form being saved, or null. Only what the
 * person changed is checked, so a value saved under older rules (a dropdown
 * choice since removed) never blocks an unrelated edit.
 */
export const customFormError = (
  initial: CustomFormState,
  current: CustomFormState,
  fields: CustomFieldDefinition[],
): string | null => {
  for (const field of changedFields(initial, current, fields)) {
    const error = customFieldError(field, current.values[field.fieldId] ?? '')
    // Under the input the message stands alone ("Enter a real date"); in a
    // toast it follows the field's name, so it starts in lower case.
    if (error) return `${field.label}: ${error.charAt(0).toLowerCase()}${error.slice(1)}`
  }
  for (const note of current.notes) {
    const label = note.label.trim()
    const value = note.value.trim()
    if (value !== '' && label === '') return 'Give each note a label'
    if (label.length > CUSTOM_FIELD_LIMITS.noteLabel) return `A note label can be at most ${CUSTOM_FIELD_LIMITS.noteLabel} characters`
    if (value.length > CUSTOM_FIELD_LIMITS.noteValue) return `A note can be at most ${CUSTOM_FIELD_LIMITS.noteValue} characters`
  }
  if (cleanNotes(current.notes).length > CUSTOM_FIELD_LIMITS.notes) {
    return `A student can have at most ${CUSTOM_FIELD_LIMITS.notes} notes`
  }
  return null
}

/**
 * The custom part of an update: only the fields that changed (null where one
 * was cleared) and the notes only if they changed. Undefined when nothing
 * did, so the body carries no customFields at all.
 */
export const buildCustomPatch = (
  initial: CustomFormState,
  current: CustomFormState,
  fields: CustomFieldDefinition[],
): StudentCustomFieldsPatch | undefined => {
  const patch: StudentCustomFieldsPatch = {}

  const changed = changedFields(initial, current, fields)
  if (changed.length > 0) {
    patch.values = {}
    for (const field of changed) patch.values[field.fieldId] = fromFormValue(field, current.values[field.fieldId] ?? '')
  }

  const notes = cleanNotes(current.notes)
  if (!sameNotes(cleanNotes(initial.notes), notes)) patch.notes = notes

  return patch.values || patch.notes ? patch : undefined
}

// ─── Showing ──────────────────────────────────────────────────────────

/** A stored value as a person reads it. A date stays YYYY-MM-DD for the caller to format. */
export const formatCustomValue = (field: CustomFieldDefinition, value: CustomFieldValue | null | undefined): string => {
  if (value === null || value === undefined || value === '') return ''
  if (field.type === 'boolean') return value === true ? 'Yes' : 'No'
  return String(value)
}

/** The fields a student has a value for, in the school's order, for a read-only list. */
export const filledCustomFields = (
  data: StudentCustomFields | null | undefined,
  fields: CustomFieldDefinition[],
): { field: CustomFieldDefinition; value: CustomFieldValue }[] => {
  const out: { field: CustomFieldDefinition; value: CustomFieldValue }[] = []
  for (const field of fields) {
    const value = data?.values?.[field.fieldId]
    if (value === undefined || value === null || value === '') continue
    out.push({ field, value })
  }
  return out
}

// ─── Defining a field ─────────────────────────────────────────────────

/** A field being defined in a form: the choices are kept even while another type is selected. */
export interface FieldDraft {
  label: string
  type: CustomFieldType
  options: string[]
  /**
   * A choice typed into a dropdown's list but not yet entered. It counts:
   * someone who types the last choice and goes straight to Save meant it.
   */
  pendingOption?: string
}

/** A draft's dropdown choices, including one still being typed. */
export const draftOptions = (draft: FieldDraft): string[] => addOption(draft.options, draft.pendingOption ?? '')

export const emptyFieldDraft: FieldDraft = { label: '', type: 'text', options: [] }

/** Adds a choice typed into a dropdown's list: trimmed, and never a repeat of one already there. */
export const addOption = (options: string[], text: string): string[] => {
  const option = text.trim().replace(/\s+/g, ' ')
  if (!option) return options
  if (options.some((o) => o.toLowerCase() === option.toLowerCase())) return options
  return [...options, option.slice(0, CUSTOM_FIELD_LIMITS.option)]
}

/** What stops a field being added or saved, or null. `taken` is the names already in use. */
export const fieldDraftError = (draft: FieldDraft, taken: string[] = []): string | null => {
  const label = draft.label.trim()
  if (!label) return 'Give the field a name'
  if (label.length > CUSTOM_FIELD_LIMITS.label) return `A field name can be at most ${CUSTOM_FIELD_LIMITS.label} characters`
  if (taken.some((name) => name.trim().toLowerCase() === label.toLowerCase())) return `A field called "${label}" already exists`
  if (draft.type === 'select') {
    const options = draftOptions(draft)
    if (options.length === 0) return 'Add at least one choice'
    if (options.length > CUSTOM_FIELD_LIMITS.options) return `A dropdown can have at most ${CUSTOM_FIELD_LIMITS.options} choices`
  }
  return null
}

/** A draft as the API takes it. */
export const toNewField = (draft: FieldDraft): NewCustomField => ({
  label: draft.label.trim().replace(/\s+/g, ' '),
  type: draft.type,
  ...(draft.type === 'select' ? { options: draftOptions(draft) } : {}),
})
