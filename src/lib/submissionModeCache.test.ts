import { describe, it, expect, beforeEach } from 'vitest'
import { forgetSubmissionModes, recallSubmissionMode, rememberSubmissionModes } from './submissionModeCache'

beforeEach(() => forgetSubmissionModes())

describe('submissionModeCache', () => {
  it('remembers how each listed item is handed in', () => {
    rememberSubmissionModes([
      { itemId: 'a', submissionMode: 'file' },
      { itemId: 'b', submissionMode: 'text' },
      { itemId: 'c', submissionMode: 'done' },
    ])
    expect(recallSubmissionMode('a')).toBe('file')
    expect(recallSubmissionMode('b')).toBe('text')
    expect(recallSubmissionMode('c')).toBe('done')
  })

  it('remembers that an item has nothing to turn in online', () => {
    rememberSubmissionModes([{ itemId: 'q', submissionMode: null }, { itemId: 'n', submissionMode: 'none' }])
    expect(recallSubmissionMode('q')).toBeNull()
    expect(recallSubmissionMode('n')).toBe('none')
  })

  it('does not know an item it was never told about', () => {
    expect(recallSubmissionMode('missing')).toBeUndefined()
  })

  it('takes the newest word for an item', () => {
    rememberSubmissionModes([{ itemId: 'a', submissionMode: 'file' }])
    rememberSubmissionModes([{ itemId: 'a', submissionMode: 'text' }])
    expect(recallSubmissionMode('a')).toBe('text')
  })

  it('forgets everything on request', () => {
    rememberSubmissionModes([{ itemId: 'a', submissionMode: 'file' }])
    forgetSubmissionModes()
    expect(recallSubmissionMode('a')).toBeUndefined()
  })
})
