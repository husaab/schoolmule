// src/lib/importMapping.ts
// The forms import's field mapping, as pure functions: what each form
// question feeds (a built-in student field, one of the school's custom
// fields, a new custom field, or nothing), and the "keep everything else"
// plan that turns the unmapped questions into custom fields.
import { CUSTOM_FIELD_LIMITS, addOption, fieldDraftError, toNewField, type FieldDraft } from './studentCustomFields'
import type { CustomFieldDefinition, CustomFieldType } from '@/services/types/studentCustomField'
import type {
  BuiltInTargetField,
  FieldMapping,
  MappableFormField,
  MappingToSave,
  TargetFieldDef,
} from '@/services/types/registrationImport'

/** What one form question feeds. */
export type Assignment =
  | { kind: 'none' }
  | { kind: 'builtin'; target: BuiltInTargetField }
  /** One of the school's existing custom fields. */
  | { kind: 'custom'; fieldId: string }
  /** A custom field that will be created when the mapping is saved. */
  | { kind: 'new'; draft: FieldDraft }

export type Assignments = Record<string, Assignment>

export const NOT_IMPORTED: Assignment = { kind: 'none' }

const CUSTOM_PREFIX = 'custom:'
export const NEW_FIELD_VALUE = 'new'

/** An assignment as the value of the mapping dropdown. */
export const assignmentValue = (a: Assignment | undefined): string => {
  if (!a || a.kind === 'none') return ''
  if (a.kind === 'builtin') return a.target
  if (a.kind === 'custom') return `${CUSTOM_PREFIX}${a.fieldId}`
  return NEW_FIELD_VALUE
}

// ─── A custom field from a form question ──────────────────────────────

const QUESTION_TYPES: Record<string, CustomFieldType> = {
  text: 'text',
  email: 'text',
  phone: 'text',
  textarea: 'textarea',
  date: 'date',
  select: 'select',
  radio: 'select',
}

/** A question's label as a field name: one line, no trailing colon or asterisk, within the limit. */
export const fieldNameFromQuestion = (label: string): string =>
  label
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s:*]+$/, '')
    .slice(0, CUSTOM_FIELD_LIMITS.label)
    .trim()

/**
 * The custom field a form question would become: its label as the name, and
 * the kind of answer the question collects. A dropdown or radio question
 * keeps its choices; one with no usable choices becomes short text.
 */
export const deriveCustomField = (question: Pick<MappableFormField, 'label' | 'fieldType' | 'options'>): FieldDraft => {
  const label = fieldNameFromQuestion(question.label)
  const type = QUESTION_TYPES[question.fieldType] ?? 'text'
  if (type !== 'select') return { label, type, options: [] }

  const options = (question.options ?? []).reduce(addOption, [] as string[])
  if (options.length === 0 || options.length > CUSTOM_FIELD_LIMITS.options) return { label, type: 'text', options: [] }
  return { label, type: 'select', options }
}

/** The dropdown's value turned back into an assignment for this question. */
export const assignmentFromValue = (value: string, question: MappableFormField): Assignment => {
  if (value === '') return NOT_IMPORTED
  if (value === NEW_FIELD_VALUE) return { kind: 'new', draft: deriveCustomField(question) }
  if (value.startsWith(CUSTOM_PREFIX)) return { kind: 'custom', fieldId: value.slice(CUSTOM_PREFIX.length) }
  return { kind: 'builtin', target: value as BuiltInTargetField }
}

/** The saved (or suggested) mapping as assignments, one per mapped question. */
export const assignmentsFromMappings = (mappings: FieldMapping[]): Assignments => {
  const out: Assignments = {}
  for (const m of mappings) {
    if (m.targetField === 'custom') {
      if (m.customFieldId) out[m.fieldId] = { kind: 'custom', fieldId: m.customFieldId }
    } else {
      out[m.fieldId] = { kind: 'builtin', target: m.targetField }
    }
  }
  return out
}

/** The questions nothing is done with yet, in the form's order. */
export const unmappedQuestions = (questions: MappableFormField[], assignments: Assignments): MappableFormField[] =>
  questions.filter((q) => (assignments[q.fieldId]?.kind ?? 'none') === 'none')

// ─── Answer → value translation ───────────────────────────────────────

/**
 * Proposes a value for one answer option, so pointing a question at grade or
 * gender starts from something sensible.
 * "Junior Kindergarten (born in 2022)" → 'JK'; "Grade 3" → '3'; "Girl" → 'female'.
 *
 * Mirrors suggestEnumValue() in the backend's studentImportTarget.js, which
 * seeds the first suggestion; this one re-seeds at once when the admin
 * re-points a question mid-edit. Keep the two in step.
 */
export const guessEnumValue = (target: string, option: string, enumValues: string[]): string | null => {
  const l = option.trim().toLowerCase()
  if (target === 'gender') {
    // Female first: "female" contains "male".
    if ((/\b(female|girl|woman)\b/.test(l) || l === 'f') && enumValues.includes('female')) return 'female'
    if ((/\b(male|boy|man)\b/.test(l) || l === 'm') && enumValues.includes('male')) return 'male'
    return null
  }
  if (/junior\s*k|\bjk\b/.test(l) && enumValues.includes('JK')) return 'JK'
  if (/senior\s*k|\bsk\b/.test(l) && enumValues.includes('SK')) return 'SK'
  const m = l.match(/\b(\d{1,2})\b/)
  if (m && enumValues.includes(m[1])) return m[1]
  return null
}

/** What a question's answers have to be translated into, when its target only takes set values. */
export interface ValueChoices {
  /** The target's name, for "Answer → Grade". */
  label: string
  values: string[]
  /** A proposal for one answer, or null. */
  guess: (option: string) => string | null
  /** A value as it is shown in the list (the stored 'female' reads "Female"). */
  display: (value: string) => string
}

const asIs = (value: string): string => value
const capitalized = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)

/**
 * A choice question feeding grade, gender or a dropdown custom field needs
 * each answer translated to one of the target's values. Null when it doesn't:
 * a free-text target, a question with no options, or a new dropdown field
 * (it takes the question's own choices as they are).
 */
export const valueChoicesFor = (
  assignment: Assignment | undefined,
  question: MappableFormField,
  targets: TargetFieldDef[],
  customFields: CustomFieldDefinition[],
): ValueChoices | null => {
  if (!assignment || !question.options?.length) return null

  if (assignment.kind === 'builtin') {
    const def = targets.find((t) => t.targetField === assignment.target)
    if (!def || def.dataType !== 'enum') return null
    const values = def.enumValues ?? []
    return {
      label: def.label,
      values,
      guess: (option) => guessEnumValue(def.targetField, option, values),
      display: def.targetField === 'gender' ? capitalized : asIs,
    }
  }

  if (assignment.kind === 'custom') {
    const field = customFields.find((f) => f.fieldId === assignment.fieldId)
    if (!field || field.type !== 'select') return null
    const values = field.options ?? []
    return {
      label: field.label,
      values,
      guess: (option) => values.find((v) => v.toLowerCase() === option.trim().toLowerCase()) ?? null,
      display: asIs,
    }
  }

  return null
}

/** A starting translation for every answer the target has an obvious value for. */
export const seedValueMap = (options: string[], choices: ValueChoices): Record<string, string> => {
  const map: Record<string, string> = {}
  for (const option of options) {
    const value = choices.guess(option)
    if (value) map[option] = value
  }
  return map
}

// ─── Keep everything else ─────────────────────────────────────────────

export interface KeepPlanRow {
  question: MappableFormField
  /** The existing field this question would be saved into (same name), or null for a new one. */
  existing: CustomFieldDefinition | null
  /** The new field, when there is no existing one. */
  draft: FieldDraft
}

const withSuffix = (label: string, n: number): string => {
  const suffix = ` (${n})`
  return `${label.slice(0, CUSTOM_FIELD_LIMITS.label - suffix.length)}${suffix}`
}

/**
 * Every question that isn't imported yet, as the custom field it would be
 * saved into. A question named like one of the school's fields goes into that
 * field (when no other question already does, and the kinds agree); the rest
 * become new fields, renamed "(2)", "(3)" where two would share a name.
 */
export const planKeepEverythingElse = (
  questions: MappableFormField[],
  assignments: Assignments,
  customFields: CustomFieldDefinition[],
): KeepPlanRow[] => {
  const usedFields = new Set<string>()
  const takenNames = new Set(customFields.map((f) => f.label.toLowerCase()))
  for (const a of Object.values(assignments)) {
    if (a.kind === 'custom') usedFields.add(a.fieldId)
    if (a.kind === 'new') takenNames.add(a.draft.label.trim().toLowerCase())
  }

  const plan: KeepPlanRow[] = []
  for (const question of unmappedQuestions(questions, assignments)) {
    const draft = deriveCustomField(question)
    if (!draft.label) continue // a question with no label has nothing to be called

    const existing = customFields.find(
      (f) => f.label.toLowerCase() === draft.label.toLowerCase() && f.type === draft.type && !usedFields.has(f.fieldId),
    )
    if (existing) {
      usedFields.add(existing.fieldId)
      plan.push({ question, existing, draft })
      continue
    }

    let label = draft.label
    for (let n = 2; takenNames.has(label.toLowerCase()); n++) label = withSuffix(draft.label, n)
    takenNames.add(label.toLowerCase())
    plan.push({ question, existing: null, draft: { ...draft, label } })
  }
  return plan
}

/** The plan's rows as assignments, added to what is already mapped. */
export const applyKeepPlan = (assignments: Assignments, plan: KeepPlanRow[]): Assignments => {
  const next = { ...assignments }
  for (const row of plan) {
    next[row.question.fieldId] = row.existing ? { kind: 'custom', fieldId: row.existing.fieldId } : { kind: 'new', draft: row.draft }
  }
  return next
}

/**
 * The answer translations that go with a plan: a choice question saved into
 * an existing dropdown field starts with every answer that matches one of the
 * field's choices already translated, as it would had the field been picked
 * by hand.
 */
export const keepPlanValueMaps = (
  plan: KeepPlanRow[],
  targets: TargetFieldDef[],
  customFields: CustomFieldDefinition[],
): Record<string, Record<string, string>> => {
  const maps: Record<string, Record<string, string>> = {}
  for (const row of plan) {
    if (!row.existing) continue
    const choices = valueChoicesFor({ kind: 'custom', fieldId: row.existing.fieldId }, row.question, targets, customFields)
    if (choices) maps[row.question.fieldId] = seedValueMap(row.question.options ?? [], choices)
  }
  return maps
}

// ─── Saving ───────────────────────────────────────────────────────────

/** A problem with one question's new field, keyed by the question, for showing beside it. */
export const newFieldProblems = (assignments: Assignments, customFields: CustomFieldDefinition[]): Record<string, string> => {
  const problems: Record<string, string> = {}
  const existing = customFields.map((f) => f.label)
  const seen = new Map<string, string>()

  for (const [questionId, a] of Object.entries(assignments)) {
    if (a.kind !== 'new') continue
    const problem = fieldDraftError(a.draft)
    if (problem) {
      problems[questionId] = problem
      continue
    }
    const name = a.draft.label.trim().toLowerCase()
    if (existing.some((label) => label.toLowerCase() === name)) {
      problems[questionId] = `"${a.draft.label.trim()}" already exists. Choose it from the list, or use another name.`
    } else if (seen.has(name)) {
      problems[questionId] = `Two new fields are both called "${a.draft.label.trim()}"`
    }
    seen.set(name, questionId)
  }
  return problems
}

/** The new fields the mapping would create, in the form's order. */
export const newFieldsIn = (questions: MappableFormField[], assignments: Assignments): FieldDraft[] =>
  questions.flatMap((q) => {
    const a = assignments[q.fieldId]
    return a?.kind === 'new' ? [a.draft] : []
  })

/**
 * The mapping as it is sent. `valueMaps` holds each question's answer
 * translations; only the ones its target uses are sent.
 */
export const toMappingsToSave = (
  questions: MappableFormField[],
  assignments: Assignments,
  valueMaps: Record<string, Record<string, string>>,
  targets: TargetFieldDef[],
  customFields: CustomFieldDefinition[],
): MappingToSave[] => {
  const out: MappingToSave[] = []
  for (const question of questions) {
    const a = assignments[question.fieldId]
    if (!a || a.kind === 'none') continue

    const translated = valueChoicesFor(a, question, targets, customFields)
    const valueMap = translated ? (valueMaps[question.fieldId] ?? {}) : null

    if (a.kind === 'builtin') out.push({ fieldId: question.fieldId, targetField: a.target, valueMap })
    else if (a.kind === 'custom') out.push({ fieldId: question.fieldId, targetField: 'custom', customFieldId: a.fieldId, valueMap })
    else out.push({ fieldId: question.fieldId, targetField: 'custom', newField: toNewField(a.draft), valueMap: null })
  }
  return out
}
