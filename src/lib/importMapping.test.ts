import { describe, expect, it } from 'vitest'
import {
  NOT_IMPORTED,
  applyKeepPlan,
  assignmentFromValue,
  assignmentValue,
  assignmentsFromMappings,
  deriveCustomField,
  fieldNameFromQuestion,
  guessEnumValue,
  keepPlanValueMaps,
  newFieldProblems,
  newFieldsIn,
  planKeepEverythingElse,
  seedValueMap,
  toMappingsToSave,
  unmappedQuestions,
  valueChoicesFor,
  type Assignments,
} from './importMapping'
import type { CustomFieldDefinition } from '@/services/types/studentCustomField'
import type { MappableFormField, TargetFieldDef } from '@/services/types/registrationImport'

const question = (fieldId: string, label: string, fieldType = 'text', options: string[] | null = null): MappableFormField =>
  ({ fieldId, label, fieldType, options, sortOrder: 0 })

const custom = (fieldId: string, label: string, type: CustomFieldDefinition['type'], options: string[] | null = null): CustomFieldDefinition =>
  ({ fieldId, label, type, options, sortOrder: 0 })

const targets: TargetFieldDef[] = [
  { targetField: 'name', label: 'Student name', dataType: 'text', group: 'Student', required: true, enumValues: null },
  { targetField: 'grade', label: 'Grade', dataType: 'enum', group: 'Student', required: true, enumValues: ['JK', 'SK', '1', '2', '3'] },
  { targetField: 'gender', label: 'Gender', dataType: 'enum', group: 'Student', required: false, enumValues: ['female', 'male'] },
]

const qName = question('q-name', "Student's full name")
const qGrade = question('q-grade', 'Grade', 'select', ['Grade 1', 'Grade 2'])
const qGender = question('q-gender', 'Gender', 'radio', ['Boy', 'Girl'])
const qBus = question('q-bus', 'Bus route:', 'select', ['Route 4', 'Walks'])
const qConsent = question('q-consent', 'May we use photos of your child? *', 'radio', ['Yes', 'No'])
const qHeard = question('q-heard', 'How did you hear about us?', 'textarea')
const qStart = question('q-start', 'Preferred start date', 'date')
const questions = [qName, qGrade, qGender, qBus, qConsent, qHeard, qStart]

describe('deriveCustomField', () => {
  it('names the field after the question, tidied', () => {
    expect(fieldNameFromQuestion('  Bus   route: ')).toBe('Bus route')
    expect(fieldNameFromQuestion('May we use photos of your child? *')).toBe('May we use photos of your child?')
    expect(fieldNameFromQuestion('x'.repeat(120))).toHaveLength(80)
  })

  it('takes the kind of answer from the kind of question', () => {
    expect(deriveCustomField(qHeard)).toEqual({ label: 'How did you hear about us?', type: 'textarea', options: [] })
    expect(deriveCustomField(qStart)).toEqual({ label: 'Preferred start date', type: 'date', options: [] })
    expect(deriveCustomField(question('q', 'Parent email', 'email')).type).toBe('text')
    expect(deriveCustomField(question('q', 'Phone', 'phone')).type).toBe('text')
    expect(deriveCustomField(question('q', 'Anything', 'something-new')).type).toBe('text')
  })

  it("keeps a choice question's choices, cleaned", () => {
    expect(deriveCustomField(qBus)).toEqual({ label: 'Bus route', type: 'select', options: ['Route 4', 'Walks'] })
    expect(deriveCustomField(question('q', 'Pick', 'radio', [' A ', 'a', '', 'B'])).options).toEqual(['A', 'B'])
  })

  it('falls back to short text when a choice question has no usable choices', () => {
    expect(deriveCustomField(question('q', 'Pick', 'select', []))).toEqual({ label: 'Pick', type: 'text', options: [] })
    expect(deriveCustomField(question('q', 'Pick', 'select', null)).type).toBe('text')
    const many = Array.from({ length: 51 }, (_, i) => `Choice ${i}`)
    expect(deriveCustomField(question('q', 'Pick', 'select', many)).type).toBe('text')
  })
})

describe('assignments and the dropdown value', () => {
  it('round-trips each kind', () => {
    expect(assignmentValue(undefined)).toBe('')
    expect(assignmentValue(NOT_IMPORTED)).toBe('')
    expect(assignmentFromValue('', qBus)).toEqual(NOT_IMPORTED)
    expect(assignmentValue({ kind: 'builtin', target: 'grade' })).toBe('grade')
    expect(assignmentFromValue('grade', qGrade)).toEqual({ kind: 'builtin', target: 'grade' })
    expect(assignmentValue({ kind: 'custom', fieldId: 'f1' })).toBe('custom:f1')
    expect(assignmentFromValue('custom:f1', qBus)).toEqual({ kind: 'custom', fieldId: 'f1' })
  })

  it('starts a new field from the question it was chosen on', () => {
    const a = assignmentFromValue('new', qBus)
    expect(a).toEqual({ kind: 'new', draft: { label: 'Bus route', type: 'select', options: ['Route 4', 'Walks'] } })
    expect(assignmentValue(a)).toBe('new')
  })

  it('reads a saved mapping', () => {
    expect(assignmentsFromMappings([
      { mappingId: '1', fieldId: 'q-name', targetField: 'name', customFieldId: null, valueMap: null },
      { mappingId: '2', fieldId: 'q-bus', targetField: 'custom', customFieldId: 'f1', valueMap: null },
      { mappingId: '3', fieldId: 'q-odd', targetField: 'custom', customFieldId: null, valueMap: null },
    ])).toEqual({ 'q-name': { kind: 'builtin', target: 'name' }, 'q-bus': { kind: 'custom', fieldId: 'f1' } })
  })

  it('lists what is not imported yet, in the form order', () => {
    const assignments: Assignments = { 'q-name': { kind: 'builtin', target: 'name' }, 'q-bus': NOT_IMPORTED }
    expect(unmappedQuestions(questions, assignments).map((q) => q.fieldId))
      .toEqual(['q-grade', 'q-gender', 'q-bus', 'q-consent', 'q-heard', 'q-start'])
  })
})

describe('guessEnumValue', () => {
  const grades = ['JK', 'SK', '1', '2', '3']
  const genders = ['female', 'male']

  it('reads grades', () => {
    expect(guessEnumValue('grade', 'Junior Kindergarten (born in 2022)', grades)).toBe('JK')
    expect(guessEnumValue('grade', 'SK', grades)).toBe('SK')
    expect(guessEnumValue('grade', 'Grade 3', grades)).toBe('3')
    expect(guessEnumValue('grade', 'Grade 9', grades)).toBeNull()
  })

  it('reads gender, and never female as male', () => {
    expect(guessEnumValue('gender', 'Female', genders)).toBe('female')
    expect(guessEnumValue('gender', 'Girl', genders)).toBe('female')
    expect(guessEnumValue('gender', 'F', genders)).toBe('female')
    expect(guessEnumValue('gender', 'Male', genders)).toBe('male')
    expect(guessEnumValue('gender', ' boy ', genders)).toBe('male')
    expect(guessEnumValue('gender', 'Prefer not to say', genders)).toBeNull()
    expect(guessEnumValue('gender', 'Grade 1', genders)).toBeNull()
  })
})

describe('valueChoicesFor', () => {
  const fields = [custom('f-bus', 'Bus', 'select', ['Route 4', 'Walks']), custom('f-locker', 'Locker', 'text')]

  it('asks for a translation when a choice question feeds grade or gender', () => {
    const grade = valueChoicesFor({ kind: 'builtin', target: 'grade' }, qGrade, targets, fields)
    expect(grade).toMatchObject({ label: 'Grade', values: ['JK', 'SK', '1', '2', '3'] })
    expect(seedValueMap(qGrade.options!, grade!)).toEqual({ 'Grade 1': '1', 'Grade 2': '2' })

    const gender = valueChoicesFor({ kind: 'builtin', target: 'gender' }, qGender, targets, fields)
    expect(seedValueMap(qGender.options!, gender!)).toEqual({ Boy: 'male', Girl: 'female' })
    // Stored in lower case, shown as a word; grades are shown as they are.
    expect(gender!.values.map(gender!.display)).toEqual(['Female', 'Male'])
    expect(grade!.display('JK')).toBe('JK')
  })

  it("asks for one when a choice question feeds an existing dropdown, matching by the field's own choices", () => {
    const choices = valueChoicesFor({ kind: 'custom', fieldId: 'f-bus' }, question('q', 'Travel', 'radio', ['route 4', 'Car']), targets, fields)
    expect(choices).toMatchObject({ label: 'Bus', values: ['Route 4', 'Walks'] })
    expect(seedValueMap(['route 4', 'Car'], choices!)).toEqual({ 'route 4': 'Route 4' })
  })

  it('asks for none otherwise', () => {
    expect(valueChoicesFor({ kind: 'builtin', target: 'name' }, qGrade, targets, fields)).toBeNull()
    expect(valueChoicesFor({ kind: 'builtin', target: 'grade' }, qName, targets, fields)).toBeNull() // no options to translate
    expect(valueChoicesFor({ kind: 'custom', fieldId: 'f-locker' }, qBus, targets, fields)).toBeNull()
    expect(valueChoicesFor({ kind: 'new', draft: deriveCustomField(qBus) }, qBus, targets, fields)).toBeNull()
    expect(valueChoicesFor(NOT_IMPORTED, qBus, targets, fields)).toBeNull()
    expect(valueChoicesFor(undefined, qBus, targets, fields)).toBeNull()
  })
})

describe('planKeepEverythingElse', () => {
  const mapped: Assignments = {
    'q-name': { kind: 'builtin', target: 'name' },
    'q-grade': { kind: 'builtin', target: 'grade' },
    'q-gender': { kind: 'builtin', target: 'gender' },
  }

  it('turns every remaining question into a new field', () => {
    const plan = planKeepEverythingElse(questions, mapped, [])
    expect(plan.map((row) => [row.question.fieldId, row.existing, row.draft.label, row.draft.type])).toEqual([
      ['q-bus', null, 'Bus route', 'select'],
      ['q-consent', null, 'May we use photos of your child?', 'select'],
      ['q-heard', null, 'How did you hear about us?', 'textarea'],
      ['q-start', null, 'Preferred start date', 'date'],
    ])
  })

  it('reuses a field of the same name and kind', () => {
    const fields = [custom('f-bus', 'bus route', 'select', ['Route 4', 'Walks'])]
    const plan = planKeepEverythingElse(questions, mapped, fields)
    expect(plan[0].existing).toBe(fields[0])
  })

  it('makes a new, renamed field when the same name is another kind, or already taken by a question', () => {
    const otherKind = planKeepEverythingElse(questions, mapped, [custom('f-bus', 'Bus route', 'text')])
    expect(otherKind[0]).toMatchObject({ existing: null, draft: { label: 'Bus route (2)' } })

    const taken = planKeepEverythingElse(questions, { ...mapped, 'q-other': { kind: 'custom', fieldId: 'f-bus' } }, [
      custom('f-bus', 'Bus route', 'select', ['Route 4', 'Walks']),
    ])
    expect(taken[0]).toMatchObject({ existing: null, draft: { label: 'Bus route (2)' } })
  })

  it('keeps two questions with the same label apart', () => {
    const twins = [question('a', 'Notes'), question('b', 'Notes'), question('c', 'notes')]
    expect(planKeepEverythingElse(twins, {}, []).map((row) => row.draft.label)).toEqual(['Notes', 'Notes (2)', 'notes (3)'])
  })

  it('leaves alone what is already mapped, and skips a question with no label', () => {
    const plan = planKeepEverythingElse([qName, question('blank', '   ')], mapped, [])
    expect(plan).toEqual([])
  })

  it('translates the answers of a question that goes into an existing dropdown', () => {
    const fields = [custom('f-bus', 'Bus route', 'select', ['Route 4', 'Walks', 'Driven'])]
    const travel = question('q-bus', 'Bus route', 'radio', ['route 4', 'Walks', 'By car'])
    const plan = planKeepEverythingElse([travel, qHeard], {}, fields)
    expect(plan[0].existing).toBe(fields[0])
    // The answers the field already has a choice for are filled in; "By car" is left for the admin.
    expect(keepPlanValueMaps(plan, targets, fields)).toEqual({ 'q-bus': { 'route 4': 'Route 4', Walks: 'Walks' } })
  })

  it('becomes assignments, without touching the rest', () => {
    const fields = [custom('f-bus', 'Bus route', 'select', ['Route 4', 'Walks'])]
    const plan = planKeepEverythingElse([qName, qBus, qHeard], mapped, fields)
    const next = applyKeepPlan(mapped, plan)
    expect(next['q-name']).toEqual({ kind: 'builtin', target: 'name' })
    expect(next['q-bus']).toEqual({ kind: 'custom', fieldId: 'f-bus' })
    expect(next['q-heard']).toEqual({ kind: 'new', draft: { label: 'How did you hear about us?', type: 'textarea', options: [] } })
    expect(mapped['q-bus']).toBeUndefined()
  })
})

describe('saving', () => {
  const fields = [custom('f-bus', 'Bus', 'select', ['Route 4', 'Walks']), custom('f-locker', 'Locker', 'text')]

  it('finds what is wrong with the new fields', () => {
    expect(newFieldProblems({
      a: { kind: 'new', draft: { label: ' ', type: 'text', options: [] } },
      b: { kind: 'new', draft: { label: 'locker', type: 'text', options: [] } },
      c: { kind: 'new', draft: { label: 'Heard from', type: 'text', options: [] } },
      d: { kind: 'new', draft: { label: 'heard from', type: 'text', options: [] } },
      e: { kind: 'new', draft: { label: 'Pick', type: 'select', options: [] } },
      f: { kind: 'builtin', target: 'name' },
    }, fields)).toEqual({
      a: 'Give the field a name',
      b: '"locker" already exists. Choose it from the list, or use another name.',
      d: 'Two new fields are both called "heard from"',
      e: 'Add at least one choice',
    })
    expect(newFieldProblems({ a: { kind: 'new', draft: { label: 'Fine', type: 'text', options: [] } } }, fields)).toEqual({})
  })

  it('lists the fields a save would create, in the form order', () => {
    const assignments: Assignments = {
      'q-heard': { kind: 'new', draft: deriveCustomField(qHeard) },
      'q-bus': { kind: 'new', draft: deriveCustomField(qBus) },
      'q-name': { kind: 'builtin', target: 'name' },
    }
    expect(newFieldsIn(questions, assignments).map((d) => d.label)).toEqual(['Bus route', 'How did you hear about us?'])
  })

  it('sends each question once, with a translation only where its target uses one', () => {
    const assignments: Assignments = {
      'q-name': { kind: 'builtin', target: 'name' },
      'q-grade': { kind: 'builtin', target: 'grade' },
      'q-gender': NOT_IMPORTED,
      'q-bus': { kind: 'custom', fieldId: 'f-bus' },
      'q-consent': { kind: 'custom', fieldId: 'f-locker' },
      'q-heard': { kind: 'new', draft: { label: ' Heard  from ', type: 'text', options: ['left over'] } },
    }
    const valueMaps = {
      'q-name': { stale: 'x' },
      'q-grade': { 'Grade 1': '1' },
      'q-bus': { 'Route 4': 'Route 4' },
      'q-heard': { stale: 'x' },
    }
    expect(toMappingsToSave(questions, assignments, valueMaps, targets, fields)).toEqual([
      { fieldId: 'q-name', targetField: 'name', valueMap: null },
      { fieldId: 'q-grade', targetField: 'grade', valueMap: { 'Grade 1': '1' } },
      { fieldId: 'q-bus', targetField: 'custom', customFieldId: 'f-bus', valueMap: { 'Route 4': 'Route 4' } },
      { fieldId: 'q-consent', targetField: 'custom', customFieldId: 'f-locker', valueMap: null },
      { fieldId: 'q-heard', targetField: 'custom', newField: { label: 'Heard from', type: 'text' }, valueMap: null },
    ])
  })
})
