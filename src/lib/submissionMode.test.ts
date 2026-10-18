import { describe, it, expect } from 'vitest'
import { inferSubmissionMode } from './submissionMode'
import type { StudentItem } from '@/services/types/studentPortal'

const submission = (over: Partial<NonNullable<StudentItem['submission']>> = {}): NonNullable<StudentItem['submission']> => ({
  status: 'assigned',
  isLate: false,
  turnedInAt: null,
  textAnswer: null,
  textSavedAt: null,
  files: [],
  canEdit: true,
  canTurnIn: false,
  canUnsubmit: false,
  closed: false,
  ...over,
})

const item = (over: Partial<Pick<StudentItem, 'kind' | 'submission' | 'submissionMode'>> = {}) => ({
  kind: 'assignment' as const,
  submission: submission(),
  ...over,
})

describe('inferSubmissionMode', () => {
  it('uses the mode the server sends', () => {
    expect(inferSubmissionMode(item({ submissionMode: 'done' }))).toBe('done')
    expect(inferSubmissionMode(item({ submissionMode: 'text' }))).toBe('text')
    expect(inferSubmissionMode(item({ submissionMode: 'none', submission: null }))).toBe('none')
  })

  it('trusts a server null as nothing to turn in', () => {
    expect(inferSubmissionMode(item({ submissionMode: null }))).toBeNull()
  })

  it('has nothing to turn in when there is no submission', () => {
    expect(inferSubmissionMode(item({ submission: null }))).toBeNull()
    expect(inferSubmissionMode(item({ kind: 'assessment', submission: null }))).toBeNull()
  })

  it('leaves a quiz to the quiz page', () => {
    expect(inferSubmissionMode(item({ kind: 'quiz' }))).toBeNull()
  })

  it('reads a file assignment from the files already added', () => {
    const files = [{ fileId: 'f1', fileName: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 10 }]
    expect(inferSubmissionMode(item({ submission: submission({ files }) }))).toBe('file')
  })

  it('reads a typed assignment from the saved answer', () => {
    expect(inferSubmissionMode(item({ submission: submission({ textAnswer: 'My answer' }) }))).toBe('text')
  })

  it('trusts the list the student came from over what the work holds', () => {
    // A teacher switched the assignment to a typed answer after the student had uploaded a file.
    const files = [{ fileId: 'f1', fileName: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 10 }]
    expect(inferSubmissionMode(item({ submission: submission({ files }) }), 'text')).toBe('text')
    expect(inferSubmissionMode(item({ submission: submission({ textAnswer: 'Words' }) }), 'file')).toBe('file')
  })

  it("still prefers the server's own field over the list", () => {
    expect(inferSubmissionMode(item({ submissionMode: 'done' }), 'file')).toBe('done')
  })

  it('has nothing to turn in for a quiz or a missing submission whatever the list said', () => {
    expect(inferSubmissionMode(item({ kind: 'quiz' }), 'file')).toBeNull()
    expect(inferSubmissionMode(item({ submission: null }), 'file')).toBeNull()
  })

  it("falls back to the work's contents when no list was seen", () => {
    const files = [{ fileId: 'f1', fileName: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 10 }]
    expect(inferSubmissionMode(item({ submission: submission({ files }) }), undefined)).toBe('file')
  })

  it('cannot tell when nothing has been added yet', () => {
    expect(inferSubmissionMode(item())).toBeUndefined()
    expect(inferSubmissionMode(item({ submission: submission({ textAnswer: '' }) }))).toBeUndefined()
  })
})
