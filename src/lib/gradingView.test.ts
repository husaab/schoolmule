import { describe, expect, it } from 'vitest'
import type { GradingRow } from '@/services/types/grading'
import {
  editedGrade,
  filterGradingRows,
  gradeHint,
  gradingCounts,
  gradingSubline,
  isToGrade,
  mergeGradeEdits,
  neighbours,
  parseGradingFilter,
  publishAllLabel,
  publishAllPrompt,
  publishOneHint,
  publishOneLabel,
  publishOutcome,
  rowScore,
  turnedInLine,
} from './gradingView'

const row = (over: Partial<GradingRow> = {}): GradingRow => ({
  studentId: 's1',
  name: 'Amal Haddad',
  avatar: null,
  status: 'assigned',
  isLate: false,
  turnedInAt: null,
  draftScore: null,
  draftStatus: null,
  publishedScore: null,
  publishedStatus: null,
  publishedAt: null,
  feedback: null,
  needsPublish: false,
  hasThread: false,
  label: 'Not turned in yet',
  ...over,
})

const turnedIn = row({ studentId: 's2', name: 'Sami Haddad', status: 'turned_in', turnedInAt: '2026-10-15T22:42:00.000Z', label: 'Turned in' })
const late = row({
  studentId: 's3',
  name: 'Rana Kareem',
  status: 'turned_in',
  turnedInAt: '2026-10-17T13:05:00.000Z',
  isLate: true,
  label: 'Turned in · late',
})
const draft = row({
  studentId: 's4',
  name: 'Ziad Nasser',
  status: 'turned_in',
  turnedInAt: '2026-10-15T20:00:00.000Z',
  draftScore: 8,
  draftStatus: 'graded',
  needsPublish: true,
  label: 'Graded · draft',
})
const missing = row({ studentId: 's5', name: 'Lina Saleh', status: 'missing', label: 'Missing' })
const published = row({
  studentId: 's6',
  name: 'Omar Faris',
  status: 'graded',
  turnedInAt: '2026-10-14T18:00:00.000Z',
  draftScore: 9,
  draftStatus: 'graded',
  publishedScore: 9,
  publishedStatus: 'graded',
  publishedAt: '2026-10-16T15:00:00.000Z',
  label: 'Published',
})
const notYet = row({ studentId: 's7', name: 'Huda Amin' })
const rows = [turnedIn, late, draft, missing, published, notYet]

describe('filters', () => {
  it('reads the URL filter, defaulting to All', () => {
    expect(parseGradingFilter('to-grade')).toBe('to-grade')
    expect(parseGradingFilter('missing')).toBe('missing')
    expect(parseGradingFilter(null)).toBe('all')
    expect(parseGradingFilter('nope')).toBe('all')
  })

  it('To grade is turned in, no draft yet and nothing published', () => {
    expect(isToGrade(turnedIn, true)).toBe(true)
    expect(isToGrade(late, true)).toBe(true)
    expect(isToGrade(draft, true)).toBe(false)
    expect(isToGrade(published, true)).toBe(false)
    expect(isToGrade(notYet, true)).toBe(false)
    // Without a gradebook column, published feedback is what grades the work.
    expect(isToGrade(row({ turnedInAt: '2026-10-15T20:00:00.000Z' }), false)).toBe(true)
    expect(isToGrade(row({ turnedInAt: '2026-10-15T20:00:00.000Z', publishedAt: '2026-10-16T10:00:00.000Z' }), false)).toBe(false)
  })

  it('filters the list and counts it the server way', () => {
    expect(filterGradingRows(rows, 'all', true)).toHaveLength(6)
    expect(filterGradingRows(rows, 'to-grade', true).map((r) => r.studentId)).toEqual(['s2', 's3'])
    expect(filterGradingRows(rows, 'missing', true).map((r) => r.studentId)).toEqual(['s5'])
    expect(gradingCounts(rows, true)).toEqual({ all: 6, turnedIn: 4, toGrade: 2, missing: 1, drafts: 1, published: 1 })
  })
})

describe('row score', () => {
  it('a draft is grey italic, published solid, missing 0 in rose', () => {
    expect(rowScore(draft, true)).toEqual({ text: '8', tone: 'draft' })
    expect(rowScore(published, true)).toEqual({ text: '9', tone: 'published' })
    expect(rowScore(missing, true)).toEqual({ text: '0', tone: 'missing' })
    expect(rowScore(row({ publishedStatus: 'missing', label: 'Missing', publishedAt: 'x' }), true)).toEqual({ text: '0', tone: 'missing' })
    expect(rowScore(row({ draftStatus: 'missing', needsPublish: true, label: 'Graded · draft' }), true)).toEqual({ text: '0', tone: 'missing' })
    expect(rowScore(row({ publishedStatus: 'excused', label: 'Excused' }), true)).toEqual({ text: 'Excused', tone: 'muted' })
    expect(rowScore(turnedIn, true)).toEqual({ text: '—', tone: 'muted' })
    expect(rowScore(notYet, true)).toEqual({ text: '', tone: 'none' })
    expect(rowScore(row({ draftScore: 7.5, draftStatus: 'graded', label: 'Graded · draft' }), true).text).toBe('7.5')
  })

  it('an item with no gradebook column shows no score', () => {
    expect(rowScore(published, false)).toEqual({ text: '', tone: 'none' })
  })
})

describe('header and panel lines', () => {
  it('reads "{Grade} {Subject} · due {when} · out of {max} · {category}"', () => {
    expect(
      gradingSubline({
        grade: '5',
        subject: 'Science',
        dueAt: '2026-10-16T19:30:00.000Z',
        maxScore: 10,
        categoryName: 'Homework',
        linked: true,
      }),
    ).toBe('Grade 5 Science · due Fri, Oct 16, 3:30 pm · out of 10 · Homework')
    expect(gradingSubline({ grade: '5', subject: 'Science', dueAt: null, maxScore: 20, categoryName: null, linked: true })).toBe(
      'Grade 5 Science · out of 20 · counts on its own',
    )
    expect(gradingSubline({ grade: '5', subject: 'Science', dueAt: null, maxScore: null, categoryName: null, linked: false })).toBe(
      'Grade 5 Science · feedback only',
    )
  })

  it('says when the work came in, on time or late', () => {
    expect(turnedInLine(turnedIn)).toEqual({ text: 'Turned in Thu, Oct 15 at 6:42 pm · on time', tone: 'ok' })
    expect(turnedInLine(late)).toEqual({ text: 'Turned in Sat, Oct 17 at 9:05 am · late', tone: 'late' })
    expect(turnedInLine(missing)).toEqual({ text: 'Missing · nothing turned in', tone: 'missing' })
    expect(turnedInLine(notYet)).toEqual({ text: 'Not turned in yet', tone: 'muted' })
    expect(turnedInLine(row({ status: 'graded' }))).toEqual({ text: 'Nothing turned in online', tone: 'muted' })
  })

  it('the grade hint says whether a change is a draft or goes live', () => {
    expect(gradeHint(false)).toBe('Draft, saved automatically. Only you see it until you publish.')
    expect(gradeHint(true)).toBe('Published. Changes go live as they save.')
  })

  it('names the student on the one-student Publish', () => {
    expect(publishOneLabel('Amal', true)).toBe("Publish Amal's grade")
    expect(publishOneHint('Amal', true)).toBe('Publishing shows the grade and feedback to Amal and parents, and emails Amal.')
    expect(publishOneLabel('Amal', false)).toBe("Publish Amal's feedback")
    expect(publishOneHint('Amal', false)).toBe('Publishing shows the feedback to Amal and parents, and emails Amal.')
  })
})

describe('Publish to N students', () => {
  it('labels the button by the drafts waiting', () => {
    expect(publishAllLabel(5)).toBe('Publish to 5 students')
    expect(publishAllLabel(1)).toBe('Publish to 1 student')
    expect(publishAllLabel(0)).toBe('Publish to 0 students')
  })

  it('asks first, naming who sees it', () => {
    const waiting = [
      row({ studentId: 'a', name: 'Amal Haddad', needsPublish: true }),
      row({ studentId: 'b', name: 'Sami Haddad', needsPublish: true }),
      row({ studentId: 'c', name: 'Rana Kareem', needsPublish: false }),
    ]
    expect(publishAllPrompt(waiting, true)).toEqual({
      title: 'Publish 2 grades?',
      body: 'Amal, Sami and parents see their grade and feedback, and each student gets an email.',
    })
    expect(publishAllPrompt(waiting.slice(0, 1), true)).toEqual({
      title: 'Publish 1 grade?',
      body: 'Amal and parents see the grade and feedback, and Amal gets an email.',
    })
  })

  it('shortens a long list of names', () => {
    const many = Array.from({ length: 9 }, (_, i) => row({ studentId: `x${i}`, name: `Student${i} Haddad`, needsPublish: true }))
    expect(publishAllPrompt(many, true).body).toBe(
      'Student0, Student1, Student2, Student3, Student4, Student5, 3 more and parents see their grade and feedback, and each student gets an email.',
    )
  })

  it('reports what happened', () => {
    const nameOf = (id: string) => ({ s1: 'Amal', s2: 'Sami' })[id] ?? 'the student'
    expect(publishOutcome({ publishedStudentIds: ['s1'], skipped: [], assessmentPublished: true }, nameOf)).toEqual({
      tone: 'success',
      message: "Published Amal's grade.",
    })
    expect(publishOutcome({ publishedStudentIds: ['s1', 's2'], skipped: [], assessmentPublished: false }, nameOf).message).toBe(
      'Published 2 grades.',
    )
    expect(
      publishOutcome({ publishedStudentIds: [], skipped: [{ studentId: 's1', reason: 'unchanged' }], assessmentPublished: false }, nameOf),
    ).toEqual({ tone: 'info', message: "Amal's grade is already published, and nothing changed since." })
    expect(
      publishOutcome({ publishedStudentIds: [], skipped: [{ studentId: 's1', reason: 'no_draft' }], assessmentPublished: false }, nameOf),
    ).toEqual({ tone: 'info', message: 'Nothing to publish yet. Grade the work first.' })
    expect(
      publishOutcome(
        {
          publishedStudentIds: ['s1'],
          skipped: [],
          assessmentPublished: false,
          emailSummary: { attempted: 2, sent: 1, failed: 1, skippedNoEmail: 0 },
        },
        nameOf,
      ).message,
    ).toBe("Published Amal's grade. 1 email didn't send.")
  })

  it('an item with no gradebook column publishes feedback', () => {
    const nameOf = () => 'Amal'
    expect(publishOutcome({ publishedStudentIds: ['s1'], skipped: [], assessmentPublished: false }, nameOf, false).message).toBe(
      "Published Amal's feedback.",
    )
    expect(publishOutcome({ publishedStudentIds: ['a', 'b'], skipped: [], assessmentPublished: false }, nameOf, false).message).toBe(
      'Published feedback for 2 students.',
    )
  })
})

describe('the open student', () => {
  it('moves through the list in order', () => {
    expect(neighbours(rows, 's3')).toEqual({ prev: 's2', next: 's4' })
    expect(neighbours(rows, 's2')).toEqual({ prev: null, next: 's3' })
    expect(neighbours(rows, 's7')).toEqual({ prev: 's6', next: null })
    expect(neighbours(rows, 'gone')).toEqual({ prev: null, next: 's2' })
  })

  it('merges edits per student, newest key wins', () => {
    expect(mergeGradeEdits({ a: { draftScore: 5 } }, { a: { feedback: 'Good' }, b: { draftScore: 3 } })).toEqual({
      a: { draftScore: 5, feedback: 'Good' },
      b: { draftScore: 3 },
    })
    expect(mergeGradeEdits({ a: { draftScore: 5 } }, { a: { draftScore: 6 } })).toEqual({ a: { draftScore: 6 } })
  })

  it('shows the saved grade with any unsaved edit over it', () => {
    expect(editedGrade(draft)).toEqual({ score: 8, status: 'graded', feedback: '' })
    expect(editedGrade(published)).toEqual({ score: 9, status: 'graded', feedback: '' })
    expect(editedGrade(row({ publishedStatus: 'excused', publishedScore: null, feedback: 'Away' }))).toEqual({
      score: null,
      status: 'excused',
      feedback: 'Away',
    })
    // A typed score clears missing; feedback typed and not saved yet shows.
    expect(editedGrade(row({ draftStatus: 'missing' }), { draftScore: 7, feedback: 'Late but good' })).toEqual({
      score: 7,
      status: 'graded',
      feedback: 'Late but good',
    })
    expect(editedGrade(draft, { draftStatus: null })).toEqual({ score: 8, status: null, feedback: '' })
  })
})
