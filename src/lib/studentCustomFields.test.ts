import { describe, expect, it } from 'vitest'
import {
  addOption,
  buildCustomPatch,
  closedCustomFormSession,
  customFieldError,
  customFormError,
  emptyCustomForm,
  fieldDraftError,
  filledCustomFields,
  formatCustomValue,
  fromFormValue,
  isRetiredOption,
  nextCustomFormSession,
  toCustomForm,
  toFormValue,
  toNewField,
  type CustomFormState,
} from './studentCustomFields'
import type { CustomFieldDefinition } from '@/services/types/studentCustomField'

const field = (fieldId: string, label: string, type: CustomFieldDefinition['type'], options: string[] | null = null): CustomFieldDefinition =>
  ({ fieldId, label, type, options, sortOrder: 0 })

const bus = field('bus', 'Bus route', 'select', ['Route 4', 'Walks'])
const consent = field('consent', 'Photo consent', 'boolean')
const siblings = field('siblings', 'Siblings', 'number')
const started = field('started', 'First day', 'date')
const locker = field('locker', 'Locker', 'text')
const fields = [bus, consent, siblings, started, locker]

const form = (values: Record<string, string>, notes: [string, string][] = []): CustomFormState => ({
  values,
  notes: notes.map(([label, value], i) => ({ key: `k${i}`, label, value })),
})

describe('toFormValue / toCustomForm', () => {
  it('holds every value as an input would', () => {
    expect(toFormValue(true)).toBe('yes')
    expect(toFormValue(false)).toBe('no')
    expect(toFormValue(0)).toBe('0')
    expect(toFormValue('Walks')).toBe('Walks')
    expect(toFormValue(null)).toBe('')
    expect(toFormValue(undefined)).toBe('')
  })

  it('reads a student, leaving out fields the school no longer has', () => {
    const state = toCustomForm(
      { values: { bus: 'Walks', consent: false, siblings: 0, gone: 'x' }, notes: [{ label: 'Locker', value: 'B14' }] },
      fields,
    )
    expect(state.values).toEqual({ bus: 'Walks', consent: 'no', siblings: '0' })
    expect(state.notes.map(({ label, value }) => [label, value])).toEqual([['Locker', 'B14']])
    expect(new Set(state.notes.map((n) => n.key)).size).toBe(1)
  })

  it('starts empty for a student with nothing, or no data at all', () => {
    expect(toCustomForm(undefined, fields)).toEqual({ values: {}, notes: [] })
    expect(toCustomForm({ values: {}, notes: [] }, fields)).toEqual({ values: {}, notes: [] })
  })
})

describe('customFieldError', () => {
  it('lets an empty input through, whatever the field', () => {
    for (const f of fields) expect(customFieldError(f, '  ')).toBeNull()
  })

  it('checks each kind of field', () => {
    expect(customFieldError(siblings, '2.5')).toBeNull()
    expect(customFieldError(siblings, '-1')).toBeNull()
    expect(customFieldError(siblings, 'two')).toBe('Enter a number, like 3 or 2.5')
    expect(customFieldError(siblings, '1,200')).not.toBeNull()
    expect(customFieldError(siblings, '999999999999')).toBeNull()
    expect(customFieldError(siblings, '1000000000000')).toBe('That number is too large')

    expect(customFieldError(started, '2026-09-01')).toBeNull()
    expect(customFieldError(started, '2026-02-30')).toBe('Enter a real date')
    expect(customFieldError(started, '01/09/2026')).toBe('Enter a real date')

    expect(customFieldError(bus, 'Walks')).toBeNull()
    expect(customFieldError(bus, 'Helicopter')).toBe('Choose one of the options')

    expect(customFieldError(consent, 'yes')).toBeNull()
    expect(customFieldError(consent, 'maybe')).not.toBeNull()

    expect(customFieldError(locker, 'x'.repeat(500))).toBeNull()
    expect(customFieldError(locker, 'x'.repeat(501))).toBe('At most 500 characters')
  })
})

describe('fromFormValue', () => {
  it('sends each kind as the API stores it', () => {
    expect(fromFormValue(siblings, ' 2 ')).toBe(2)
    expect(fromFormValue(siblings, '0')).toBe(0)
    expect(fromFormValue(consent, 'yes')).toBe(true)
    expect(fromFormValue(consent, 'no')).toBe(false)
    expect(fromFormValue(bus, 'Walks')).toBe('Walks')
    expect(fromFormValue(started, '2026-09-01')).toBe('2026-09-01')
    expect(fromFormValue(locker, '  B14 ')).toBe('B14')
    expect(fromFormValue(locker, '   ')).toBeNull()
  })
})

describe('buildCustomPatch', () => {
  const initial = form({ bus: 'Walks', consent: 'yes', siblings: '2' }, [['Locker', 'B14']])

  it('is undefined when nothing changed, so the body carries no customFields', () => {
    expect(buildCustomPatch(initial, form({ bus: 'Walks', consent: 'yes', siblings: '2' }, [['Locker', 'B14']]), fields)).toBeUndefined()
    // Stray spaces are not a change.
    expect(buildCustomPatch(initial, form({ bus: 'Walks', consent: 'yes', siblings: ' 2 ' }, [[' Locker ', 'B14 ']]), fields)).toBeUndefined()
  })

  it('sends only the fields that changed, with null for one that was cleared', () => {
    const current = form({ bus: 'Route 4', consent: 'yes', siblings: '' }, [['Locker', 'B14']])
    expect(buildCustomPatch(initial, current, fields)).toEqual({ values: { bus: 'Route 4', siblings: null } })
  })

  it('sends a field filled in for the first time', () => {
    const current = form({ bus: 'Walks', consent: 'yes', siblings: '2', locker: 'B14' }, [['Locker', 'B14']])
    expect(buildCustomPatch(initial, current, fields)).toEqual({ values: { locker: 'B14' } })
  })

  it('sends the whole list of notes when any note changed, and an empty list when all were removed', () => {
    const edited = form({ bus: 'Walks', consent: 'yes', siblings: '2' }, [['Locker', 'B14'], ['Pickup', 'Aunt on Fridays']])
    expect(buildCustomPatch(initial, edited, fields)).toEqual({
      notes: [{ label: 'Locker', value: 'B14' }, { label: 'Pickup', value: 'Aunt on Fridays' }],
    })
    const removed = form({ bus: 'Walks', consent: 'yes', siblings: '2' })
    expect(buildCustomPatch(initial, removed, fields)).toEqual({ notes: [] })
  })

  it('drops note rows that were left unfinished', () => {
    const current = form({ bus: 'Walks', consent: 'yes', siblings: '2' }, [['Locker', 'B14'], ['', ''], ['Half done', '']])
    expect(buildCustomPatch(initial, current, fields)).toBeUndefined()
  })

  it('never sends a field the school has since deleted', () => {
    const current = form({ bus: 'Walks', consent: 'yes', siblings: '2', gone: 'x' }, [['Locker', 'B14']])
    expect(buildCustomPatch(initial, current, fields)).toBeUndefined()
  })
})

describe('a new student', () => {
  it('sends whatever was filled in', () => {
    expect(buildCustomPatch(emptyCustomForm, form({ bus: 'Walks', consent: 'no' }, [['Locker', 'B14']]), fields)).toEqual({
      values: { bus: 'Walks', consent: false },
      notes: [{ label: 'Locker', value: 'B14' }],
    })
  })

  it('sends nothing for an untouched form', () => {
    expect(buildCustomPatch(emptyCustomForm, emptyCustomForm, fields)).toBeUndefined()
    expect(buildCustomPatch(emptyCustomForm, form({ bus: '' }, [['', '']]), fields)).toBeUndefined()
  })
})

describe('customFormError', () => {
  const initial = form({ bus: 'Helicopter' })

  it('names the field that is wrong', () => {
    expect(customFormError(emptyCustomForm, form({ siblings: 'two' }), fields)).toBe('Siblings: enter a number, like 3 or 2.5')
  })

  it('leaves alone a stored value the person did not touch, even if it would no longer pass', () => {
    expect(customFormError(initial, form({ bus: 'Helicopter', locker: 'B14' }), fields)).toBeNull()
    expect(buildCustomPatch(initial, form({ bus: 'Helicopter', locker: 'B14' }), fields)).toEqual({ values: { locker: 'B14' } })
  })

  it('asks for a label on a note that has a value', () => {
    expect(customFormError(emptyCustomForm, form({}, [['', 'B14']]), fields)).toBe('Give each note a label')
    expect(customFormError(emptyCustomForm, form({}, [['Locker', '']]), fields)).toBeNull()
  })

  it('caps the number of notes', () => {
    const many = Array.from({ length: 21 }, (_, i): [string, string] => [`Note ${i}`, 'x'])
    expect(customFormError(emptyCustomForm, form({}, many), fields)).toBe('A student can have at most 20 notes')
  })
})

describe('showing values', () => {
  it('writes yes/no in words', () => {
    expect(formatCustomValue(consent, true)).toBe('Yes')
    expect(formatCustomValue(consent, false)).toBe('No')
    expect(formatCustomValue(siblings, 0)).toBe('0')
    expect(formatCustomValue(bus, null)).toBe('')
  })

  it("lists a student's filled fields in the school's order, counting No and 0 as answers", () => {
    const filled = filledCustomFields({ values: { locker: 'B14', consent: false, siblings: 0, gone: 'x', bus: '' }, notes: [] }, fields)
    expect(filled.map((f) => [f.field.label, f.value])).toEqual([['Photo consent', false], ['Siblings', 0], ['Locker', 'B14']])
    expect(filledCustomFields(undefined, fields)).toEqual([])
  })

  it('spots a dropdown value whose choice was removed', () => {
    expect(isRetiredOption(bus, 'Helicopter')).toBe(true)
    expect(isRetiredOption(bus, 'Walks')).toBe(false)
    expect(isRetiredOption(bus, '')).toBe(false)
    expect(isRetiredOption(locker, 'anything')).toBe(false)
  })
})

describe('defining a field', () => {
  it('adds a choice once, trimmed', () => {
    expect(addOption(['Route 4'], '  Walks ')).toEqual(['Route 4', 'Walks'])
    expect(addOption(['Route 4'], 'route 4')).toEqual(['Route 4'])
    expect(addOption(['Route 4'], '   ')).toEqual(['Route 4'])
  })

  it('says what stops a field being saved', () => {
    expect(fieldDraftError({ label: ' ', type: 'text', options: [] })).toBe('Give the field a name')
    expect(fieldDraftError({ label: 'Bus', type: 'select', options: [] })).toBe('Add at least one choice')
    expect(fieldDraftError({ label: 'bus route', type: 'text', options: [] }, ['Bus route'])).toBe('A field called "bus route" already exists')
    expect(fieldDraftError({ label: 'x'.repeat(81), type: 'text', options: [] })).toMatch(/at most 80/)
    expect(fieldDraftError({ label: 'Bus', type: 'select', options: ['Route 4'] })).toBeNull()
  })

  it('counts a choice that was typed but never entered', () => {
    const draft = { label: 'Club', type: 'select' as const, options: ['Chess', 'Football'], pendingOption: ' Art ' }
    expect(toNewField(draft)).toEqual({ label: 'Club', type: 'select', options: ['Chess', 'Football', 'Art'] })
    expect(fieldDraftError({ label: 'Club', type: 'select', options: [], pendingOption: 'Chess' })).toBeNull()
    // A repeat of one already there adds nothing.
    expect(toNewField({ ...draft, pendingOption: 'chess' }).options).toEqual(['Chess', 'Football'])
  })

  it('sends choices only for a dropdown', () => {
    expect(toNewField({ label: '  Bus   route ', type: 'select', options: ['Route 4'] })).toEqual({ label: 'Bus route', type: 'select', options: ['Route 4'] })
    expect(toNewField({ label: 'Locker', type: 'text', options: ['left over'] })).toEqual({ label: 'Locker', type: 'text' })
  })
})

describe('nextCustomFormSession', () => {
  const stored = { values: { bus: 'Walks', consent: true }, notes: [{ label: 'Locker', value: 'B14' }] }
  const open = { isOpen: true, failed: false, stored }
  const noteText = (s: { state: CustomFormState }) => s.state.notes.map((n) => [n.label, n.value])

  it('waits, closed or loading, without making a new session', () => {
    expect(nextCustomFormSession(closedCustomFormSession, { ...open, isOpen: false, fields })).toBe(closedCustomFormSession)
    expect(nextCustomFormSession(closedCustomFormSession, { ...open, fields: null })).toBe(closedCustomFormSession)
  })

  it("opens with the student's values and notes once the school's fields arrive", () => {
    const session = nextCustomFormSession(closedCustomFormSession, { ...open, fields })
    expect(session.state.values).toEqual({ bus: 'Walks', consent: 'yes' })
    expect(session.initial).toEqual(session.state)
    expect(noteText(session)).toEqual([['Locker', 'B14']])
    expect(session.seeded).toEqual(fields.map((f) => f.fieldId))
    // Nothing more to do on the next render.
    expect(nextCustomFormSession(session, { ...open, fields })).toBe(session)
  })

  it('opens empty for a new student', () => {
    const session = nextCustomFormSession(closedCustomFormSession, { isOpen: true, failed: false, stored: undefined, fields })
    expect(session.state).toEqual({ values: {}, notes: [] })
  })

  it('takes in a field that turns up later without touching what was typed', () => {
    const first = nextCustomFormSession(closedCustomFormSession, { ...open, fields: [bus] })
    const typing = { ...first, state: { ...first.state, values: { ...first.state.values, bus: 'Route 4', consent: 'no' } } }

    const later = nextCustomFormSession(typing, { ...open, fields: [bus, consent, locker] })
    expect(later.state.values).toEqual({ bus: 'Route 4', consent: 'no' }) // typed values win
    expect(later.initial.values).toEqual({ bus: 'Walks', consent: 'yes' }) // so the change is still seen as one
    expect(later.seeded).toEqual(['bus', 'consent', 'locker'])
    expect(nextCustomFormSession(later, { ...open, fields: [bus, consent, locker] })).toBe(later)
  })

  it('does nothing when a field is merely removed from the list', () => {
    const session = nextCustomFormSession(closedCustomFormSession, { ...open, fields: [bus, consent] })
    expect(nextCustomFormSession(session, { ...open, fields: [bus] })).toBe(session)
  })

  it('shows the notes even when the fields fail to load, and keeps edits to them if a retry works', () => {
    const failed = nextCustomFormSession(closedCustomFormSession, { ...open, fields: null, failed: true })
    expect(failed.state.values).toEqual({})
    expect(noteText(failed)).toEqual([['Locker', 'B14']])
    expect(failed.seeded).toBeNull()
    expect(nextCustomFormSession(failed, { ...open, fields: null, failed: true })).toBe(failed)

    const edited = { ...failed, state: { ...failed.state, notes: [{ key: 'k', label: 'Locker', value: 'C2' }] } }
    const retried = nextCustomFormSession(edited, { ...open, fields })
    expect(retried.state.values).toEqual({ bus: 'Walks', consent: 'yes' })
    expect(noteText(retried)).toEqual([['Locker', 'C2']])
    expect(retried.initial.notes.map((n) => n.value)).toEqual(['B14'])
  })

  it('starts over when the form closes', () => {
    const session = nextCustomFormSession(closedCustomFormSession, { ...open, fields })
    expect(nextCustomFormSession(session, { ...open, isOpen: false, fields })).toBe(closedCustomFormSession)
  })
})
