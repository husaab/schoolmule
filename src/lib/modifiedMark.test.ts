import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MODIFIED_LABEL,
  MODIFIED_LABEL_ERROR,
  MODIFIED_LABEL_MAX,
  gradeLevelSuggestions,
  initialModifiedLabel,
  isEffectivelyModified,
  modifiedCountLine,
  modifiedExplainer,
  modifiedLabelsOf,
  modifiedMarksLine,
  normalizeModifiedLabel,
  validateModifiedLabel,
} from './modifiedMark'

describe('label rules, the same as the server (utils/modifiedMark.js)', () => {
  it('has the agreed defaults', () => {
    expect(MODIFIED_LABEL_MAX).toBe(80)
    expect(DEFAULT_MODIFIED_LABEL).toBe('Earlier grade level skills')
    expect(MODIFIED_LABEL_ERROR).toBe('Use plain words about the test. Families read this label.')
  })

  it('normalizes', () => {
    expect(normalizeModifiedLabel('  Grade   3 level ')).toBe('Grade 3 level')
    expect(normalizeModifiedLabel('   ')).toBeNull()
    expect(normalizeModifiedLabel(null)).toBeNull()
  })

  it('allows up to the limit and no label', () => {
    expect(validateModifiedLabel('x'.repeat(80))).toBeNull()
    expect(validateModifiedLabel(null)).toBeNull()
  })

  it('refuses over the limit', () => {
    expect(validateModifiedLabel('x'.repeat(81))).toBe(MODIFIED_LABEL_ERROR)
  })

  it.each(['iep test', 'IEP', 'on an Iep plan', 'plan (IEP)'])('refuses %s', (label) => {
    expect(validateModifiedLabel(label)).toBe(MODIFIED_LABEL_ERROR)
  })

  it('only refuses the whole word', () => {
    expect(validateModifiedLabel('Recipe test')).toBeNull()
  })
})

describe('gradeLevelSuggestions', () => {
  it('offers the default and the two grades below', () => {
    expect(gradeLevelSuggestions('5')).toEqual(['Earlier grade level skills', 'Grade 4 level', 'Grade 3 level'])
  })

  it('stops at Grade 1', () => {
    expect(gradeLevelSuggestions('2')).toEqual(['Earlier grade level skills', 'Grade 1 level'])
    expect(gradeLevelSuggestions('1')).toEqual(['Earlier grade level skills'])
  })

  it('offers only the default for a grade with no number', () => {
    expect(gradeLevelSuggestions('SK')).toEqual(['Earlier grade level skills'])
    expect(gradeLevelSuggestions(null)).toEqual(['Earlier grade level skills'])
  })
})

describe('initialModifiedLabel', () => {
  it('keeps what a marked cell has, including a cleared label', () => {
    expect(initialModifiedLabel({ modified: true, current: 'B', studentLabels: ['A'] })).toBe('B')
    expect(initialModifiedLabel({ modified: true, current: null, studentLabels: ['A'] })).toBe('')
  })

  it('remembers the last label used for this student in this class', () => {
    expect(initialModifiedLabel({ modified: false, current: null, studentLabels: ['A', 'B'] })).toBe('B')
  })

  it('starts from the default', () => {
    expect(initialModifiedLabel({ modified: false, current: null, studentLabels: [] })).toBe('Earlier grade level skills')
  })
})

describe('modifiedLabelsOf', () => {
  it("lists one student's labels from the score rows", () => {
    expect(modifiedLabelsOf([
      { student_id: 's1', is_modified: true, modified_label: 'A' },
      { student_id: 's1', is_modified: true, modified_label: null },
      { student_id: 's1', is_modified: false, modified_label: null },
      { student_id: 's2', is_modified: true, modified_label: 'B' },
    ], 's1')).toEqual(['A'])
  })
})

describe('isEffectivelyModified', () => {
  it('needs a real mark; 0 is one', () => {
    expect(isEffectivelyModified({ modified: true, status: 'graded', value: 36 })).toBe(true)
    expect(isEffectivelyModified({ modified: true, status: 'graded', value: 0 })).toBe(true)
  })

  it('is off for a blank, missing or excused cell, or with no flag', () => {
    expect(isEffectivelyModified({ modified: true, status: 'graded', value: null })).toBe(false)
    expect(isEffectivelyModified({ modified: true, status: 'missing', value: null })).toBe(false)
    expect(isEffectivelyModified({ modified: true, status: 'excused', value: 40 })).toBe(false)
    expect(isEffectivelyModified({ modified: false, status: 'graded', value: 36 })).toBe(false)
  })
})

describe('copy', () => {
  it('counts assessments on a grade', () => {
    expect(modifiedCountLine(1)).toBe('This grade includes 1 modified assessment')
    expect(modifiedCountLine(2)).toBe('This grade includes 2 modified assessments')
  })

  it('names who a publish includes, once each', () => {
    expect(modifiedMarksLine([{ studentName: 'Adam' }])).toBe('Includes 1 modified mark: Adam')
    expect(modifiedMarksLine([{ studentName: 'Adam' }, { studentName: 'Adam' }, { studentName: 'Layla' }])).toBe('Includes 3 modified marks: Adam, Layla')
    expect(modifiedMarksLine([])).toBeNull()
  })

  it('explains the word in the same words as the email', () => {
    expect(modifiedExplainer('Adam')).toBe(
      "Modified means Adam wrote a different version of this assessment, set by the teacher. The mark shows how Adam did on that version, so it can't be compared directly to the class's test.",
    )
  })
})
