import { describe, expect, it } from 'vitest'
import type { GradingRow } from '@/services/types/grading'
import {
  GRADED_EARLIER_NOTE,
  editedGrade,
  filterGradingRows,
  gradeHint,
  gradedEarlier,
  gradedEarlierLines,
  keepDraftPatch,
  rowStatus,
  gradingCounts,
  gradingSubline,
  isToGrade,
  mergeGradeEdits,
  splitGradeEdits,
  neighbours,
  outsideAudienceMessage,
  parseGradingFilter,
  publishAllLabel,
  publishAllPrompt,
  publishOneHint,
  publishOneLabel,
  publishOutcome,
  studentShortcutFree,
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
    const linked = { linked: true, columnPublished: false, first: 'Ziad' }
    expect(gradeHint(draft, linked)).toBe('Draft, saved automatically. Only you see it until you publish.')
    expect(gradeHint(published, { ...linked, columnPublished: true, first: 'Omar' })).toBe('Published. Changes go live as they save.')
  })

  it('a draft reads as a draft even once the column is published (another student was published)', () => {
    const hint = gradeHint(draft, { linked: true, columnPublished: true, first: 'Ziad' })
    expect(hint).not.toMatch(/^Published/)
    expect(hint).toBe(
      "Draft: Ziad doesn't see it yet. The column is published, so a new score goes live as it saves; Publish Ziad's grade to show it as it is.",
    )
  })

  it('on a published column, a student with nothing yet is told a score goes live', () => {
    expect(gradeHint(turnedIn, { linked: true, columnPublished: true, first: 'Sami' })).toBe(
      'The column is published, so a score goes live for Sami as it saves.',
    )
    // A confirmed Missing that was published is published.
    expect(gradeHint(row({ publishedStatus: 'missing', publishedAt: 'x' }), { linked: true, columnPublished: true, first: 'Lina' })).toBe(
      'Published. Changes go live as they save.',
    )
  })

  it('without a gradebook column, published feedback is what is live', () => {
    const opts = { linked: false, columnPublished: false, first: 'Amal' }
    expect(gradeHint(row({ feedback: 'Nice', needsPublish: true }), opts)).toBe('Draft, saved automatically. Only you see it until you publish.')
    expect(gradeHint(row({ feedback: 'Nice', publishedAt: '2026-10-16T10:00:00.000Z' }), opts)).toBe('Published. Changes go live as they save.')
  })

  it('names a quiz as a quiz in the outside-audience guidance', () => {
    expect(outsideAudienceMessage('assignment')).toBe(
      "Publish this column in Grades first — it has grades for students this assignment isn't assigned to.",
    )
    expect(outsideAudienceMessage('quiz')).toContain('this quiz isn')
  })

  it('names the student on the one-student Publish', () => {
    expect(publishOneLabel('Amal', true)).toBe("Publish Amal's grade")
    expect(publishOneHint('Amal', true, true, true)).toBe('Publishing shows the grade and feedback to Amal and parents, and emails Amal.')
    expect(publishOneLabel('Amal', false)).toBe("Publish Amal's feedback")
    expect(publishOneHint('Amal', false, true, true)).toBe('Publishing shows the feedback to Amal and parents, and emails Amal.')
    // Smoke S5: no email promised to a student without a working login.
    expect(publishOneHint('Rami', true, false)).toBe('Publishing shows the grade and feedback to Rami and parents.')
    expect(publishOneHint('Rami', true)).toBe(
      'Publishing shows the grade and feedback to Rami and parents. Rami gets an email if they sign in to SchoolMule.',
    )
  })

  it('promises the email only as far as it is known (FE re-review N6)', () => {
    // Signing in isn't enough: the school's student-email setting and the student's own address decide.
    expect(publishOneHint('Amal', true, true)).toBe(
      'Publishing shows the grade and feedback to Amal and parents, and emails Amal if your school sends student emails.',
    )
    // The server says outright (getsEmail): it wins over signsIn.
    expect(publishOneHint('Amal', true, true, false)).toBe('Publishing shows the grade and feedback to Amal and parents.')
    expect(publishOneHint('Rami', true, false, true)).toBe('Publishing shows the grade and feedback to Rami and parents, and emails Rami.')
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
      row({ studentId: 'a', name: 'Amal Haddad', needsPublish: true, signsIn: true, getsEmail: true }),
      row({ studentId: 'b', name: 'Sami Haddad', needsPublish: true, signsIn: true, getsEmail: true }),
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

  it('never promises an email to a student without a login (smoke S5)', () => {
    const rami = row({ studentId: 'r', name: 'Rami Saleh', needsPublish: true, signsIn: false })
    const adam = row({ studentId: 'a', name: 'Adam Haddad', needsPublish: true, signsIn: true })
    expect(publishAllPrompt([rami], true).body).toBe('Rami and parents see the grade and feedback.')
    expect(publishAllPrompt([rami, adam], true).body).toBe(
      'Rami, Adam and parents see their grade and feedback, and the one who signs in gets an email if your school sends student emails.',
    )
    // The server's getsEmail, when sent, is exact.
    expect(publishAllPrompt([{ ...rami, getsEmail: false }, { ...adam, getsEmail: true }], true).body).toBe(
      'Rami, Adam and parents see their grade and feedback, and one of them gets an email.',
    )
    expect(publishAllPrompt([{ ...adam, getsEmail: false }], true).body).toBe('Adam and parents see the grade and feedback.')
    // An older server says nothing about logins: the email is promised only to those who sign in.
    const unknown = row({ studentId: 'u', name: 'Hana Saleh', needsPublish: true })
    expect(publishAllPrompt([unknown], true).body).toBe('Hana and parents see the grade and feedback. Hana gets an email if they sign in to SchoolMule.')
    expect(publishAllPrompt([unknown, adam], false).body).toBe('Hana, Adam and parents see their feedback. Students who sign in also get an email.')
  })

  it('hedges the email for students who sign in when the server does not say (FE re-review N6)', () => {
    const a = row({ studentId: 'a', name: 'Amal Haddad', needsPublish: true, signsIn: true })
    const b = row({ studentId: 'b', name: 'Sami Haddad', needsPublish: true, signsIn: true })
    expect(publishAllPrompt([a], true).body).toBe('Amal and parents see the grade and feedback, and Amal gets an email if your school sends student emails.')
    expect(publishAllPrompt([a, b], true).body).toBe(
      'Amal, Sami and parents see their grade and feedback, and each student gets an email if your school sends student emails.',
    )
    const c = row({ studentId: 'c', name: 'Rana Kareem', needsPublish: true, getsEmail: true, signsIn: true })
    const d = row({ studentId: 'd', name: 'Lina Saleh', needsPublish: true, getsEmail: false, signsIn: true })
    const e = row({ studentId: 'e', name: 'Omar Faris', needsPublish: true, getsEmail: true, signsIn: true })
    expect(publishAllPrompt([c, d, e], true).body).toBe('Rana, Lina, Omar and parents see their grade and feedback, and 2 of them get an email.')
  })

  it('shortens a long list of names', () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      row({ studentId: `x${i}`, name: `Student${i} Haddad`, needsPublish: true, signsIn: true, getsEmail: true }),
    )
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

  it('says "quiz" for a quiz that is not assigned to the student, "assignment" otherwise', () => {
    const skipped = { publishedStudentIds: [], skipped: [{ studentId: 's1', reason: 'not_in_audience' as const }], assessmentPublished: false }
    const nameOf = () => 'Amal'
    expect(publishOutcome(skipped, nameOf, true, 'quiz')).toEqual({ tone: 'info', message: "This quiz isn't for that student." })
    expect(publishOutcome(skipped, nameOf, true, 'assignment').message).toBe("This assignment isn't for that student.")
    expect(publishOutcome(skipped, nameOf, true, 'material').message).toBe("This assignment isn't for that student.")
    // No kind given (older callers): the assignment wording it always had.
    expect(publishOutcome(skipped, nameOf).message).toBe("This assignment isn't for that student.")
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

describe('Alt+arrow student switching', () => {
  it('works from anywhere in the view, including the one-line grade box', () => {
    expect(studentShortcutFree(null)).toBe(true)
    expect(studentShortcutFree({ tagName: 'BODY' })).toBe(true)
    expect(studentShortcutFree({ tagName: 'INPUT' })).toBe(true)
    expect(studentShortcutFree({ tagName: 'BUTTON' })).toBe(true)
  })

  it('leaves Option+arrows to the feedback box, where they move by paragraph', () => {
    expect(studentShortcutFree({ tagName: 'TEXTAREA' })).toBe(false)
    expect(studentShortcutFree({ tagName: 'textarea' })).toBe(false)
    expect(studentShortcutFree({ tagName: 'DIV', isContentEditable: true })).toBe(false)
  })
})

describe('splitGradeEdits (final review M1)', () => {
  it('leaves for Retry what a newer change does not replace', () => {
    const failed = { ali: { draftScore: 9, feedback: 'Neat.' }, sami: { draftScore: 4 } }
    expect(splitGradeEdits(failed, { bilal: { draftScore: 7 } })).toEqual(failed)
    expect(splitGradeEdits(failed, { ali: { draftScore: 8 } })).toEqual({ ali: { feedback: 'Neat.' }, sami: { draftScore: 4 } })
    expect(splitGradeEdits(failed, { ali: { draftScore: 8, feedback: '' }, sami: { draftStatus: 'missing' } })).toEqual({
      sami: { draftScore: 4 },
    })
    expect(splitGradeEdits({ ali: { draftScore: 9 } }, { ali: { draftScore: null } })).toBeNull()
  })
})

// Fable I1: work turned in again after the teacher's draft is back in "To grade", flagged, and left out of
// "Publish to N students" until the teacher saves the score or feedback again.
describe('graded earlier: new work came in after the draft', () => {
  const ali = row({
    studentId: 'ali',
    name: 'Ali Haddad',
    status: 'turned_in',
    turnedInAt: '2026-10-18T14:00:00.000Z',
    draftScore: 6,
    draftStatus: 'graded',
    feedback: 'Redo question 3',
    needsPublish: true,
    label: 'Graded · draft',
    draftPredatesWork: true,
    signsIn: true,
  })
  const ziad = { ...draft, signsIn: true, getsEmail: true }

  it('reads the server flag (absent on older servers: never flagged)', () => {
    expect(gradedEarlier(ali)).toBe(true)
    expect(gradedEarlier(draft)).toBe(false)
    expect(gradedEarlier(row({ draftPredatesWork: false }))).toBe(false)
  })

  it('is back in To grade, linked or not', () => {
    expect(isToGrade(ali, true)).toBe(true)
    expect(isToGrade({ ...ali, draftScore: null, draftStatus: null }, false)).toBe(true)
    // Only work that is turned in waits for grading.
    expect(isToGrade({ ...ali, turnedInAt: null }, true)).toBe(false)
    expect(filterGradingRows([ali, ziad, turnedIn], 'to-grade', true).map((r) => r.studentId)).toEqual(['ali', 's2'])
  })

  it('is counted in To grade and left out of the drafts "Publish to N" publishes', () => {
    const counts = gradingCounts([ali, ziad, turnedIn], true)
    expect(counts.toGrade).toBe(2)
    expect(counts.drafts).toBe(1)
    // A server that already leaves it out of needsPublish counts the same.
    expect(gradingCounts([{ ...ali, needsPublish: false }, ziad], true).drafts).toBe(1)
  })

  it('says so on the row, and still shows the draft score', () => {
    expect(rowStatus(ali)).toEqual({ text: GRADED_EARLIER_NOTE, ink: 'text-amber-800' })
    expect(GRADED_EARLIER_NOTE).toBe('Graded earlier — check the new work')
    expect(rowStatus(draft)).toEqual({ text: 'Graded · draft', ink: 'text-blue-700' })
    expect(rowScore(ali, true)).toEqual({ text: '6', tone: 'draft' })
    // A label this build doesn't know yet still gets an ink.
    expect(rowStatus(row({ label: 'Resubmitted · draft' as GradingRow['label'] })).ink).toBe('text-slate-600')
    expect(rowScore({ ...ali, label: 'Turned in' }, true)).toEqual({ text: '6', tone: 'draft' })
  })

  it('the confirm leaves them out and says how many, who and why', () => {
    const one = publishAllPrompt([ali, ziad], true)
    expect(one.title).toBe('Publish 1 grade?')
    expect(one.body).toBe(
      "Ziad and parents see the grade and feedback, and Ziad gets an email. Ali isn't included: the work changed after you graded it. Check it, then save the grade again to publish it.",
    )
    const sara = { ...ali, studentId: 'sara', name: 'Sara Kareem' }
    const two = publishAllPrompt([ali, sara, ziad, { ...ziad, studentId: 'z2', name: 'Huda Amin' }], true)
    expect(two.title).toBe('Publish 2 grades?')
    expect(two.body).toBe(
      "Ziad, Huda and parents see their grade and feedback, and each student gets an email. 2 students aren't included (Ali, Sara): their work changed after you graded it. Check it, then save their grades again to publish them.",
    )
    // Feedback only (no gradebook column).
    expect(publishAllPrompt([ali, ziad], false).body).toContain('Check it, then save the feedback again to publish it.')
    // Nobody flagged: the prompt is as before.
    expect(publishAllPrompt([ziad], true).body).toBe('Ziad and parents see the grade and feedback, and Ziad gets an email.')
  })

  it("the toast says who was left out, and why", () => {
    const nameOf = (id: string) => ({ ali: 'Ali', sara: 'Sara', s4: 'Ziad' })[id] ?? 'the student'
    const earlier = new Set(['ali', 'sara'])
    expect(
      publishOutcome(
        { publishedStudentIds: ['s4'], skipped: [{ studentId: 'ali', reason: 'no_draft' }], assessmentPublished: true },
        nameOf,
        true,
        'assignment',
        earlier,
      ).message,
    ).toBe("Published Ziad's grade. Ali's wasn't: the work changed after you graded it.")
    expect(
      publishOutcome(
        {
          publishedStudentIds: ['s4', 'x'],
          skipped: [
            { studentId: 'ali', reason: 'no_draft' },
            { studentId: 'sara', reason: 'no_draft' },
          ],
          assessmentPublished: true,
        },
        nameOf,
        true,
        'assignment',
        earlier,
      ).message,
    ).toBe("Published 2 grades. 2 weren't: the work changed after you graded it.")
    expect(
      publishOutcome(
        { publishedStudentIds: [], skipped: [{ studentId: 'ali', reason: 'no_draft' }], assessmentPublished: false },
        nameOf,
        true,
        'assignment',
        earlier,
      ),
    ).toEqual({ tone: 'info', message: 'Nothing published: the work changed after you graded it. Check it, then save the grade again.' })
    // The server's own reason (the grid's Publish N has no rows to look at).
    expect(
      publishOutcome(
        { publishedStudentIds: ['s4'], skipped: [{ studentId: 'ali', reason: 'draft_predates_work' }], assessmentPublished: true },
        nameOf,
      ).message,
    ).toBe("Published Ziad's grade. Ali's wasn't: the work changed after you graded it.")
    // Not flagged: the old words.
    expect(
      publishOutcome({ publishedStudentIds: [], skipped: [{ studentId: 's4', reason: 'no_draft' }], assessmentPublished: false }, nameOf, true, 'assignment', earlier)
        .message,
    ).toBe('Nothing to publish yet. Grade the work first.')
  })

  it('a student who took the work back (nothing turned in again yet) is not to grade, and says so', () => {
    const tookBack = { ...ali, turnedInAt: null, status: 'assigned' as const }
    expect(isToGrade(tookBack, true)).toBe(false)
    expect(rowStatus(tookBack)).toEqual({ text: 'Graded earlier — work taken back', ink: 'text-amber-800' })
    expect(gradedEarlierLines('Ali', true, false, false).body).toBe(
      "Ali took the work back after you graded it. Your draft grade and feedback are kept, but they won't be published until you save them again: change them, or keep them as they are.",
    )
    expect(gradedEarlierLines('Ali', true, false, false).title).toBe('Graded earlier — work taken back')
  })

  it("the panel's note, and what Keep sends", () => {
    expect(gradedEarlierLines('Ali', true, false)).toEqual({
      title: GRADED_EARLIER_NOTE,
      body: "Ali turned in new work after you graded it. Your draft grade and feedback are kept, but they won't be published until you save them again: change them, or keep them as they are.",
      keep: 'Keep this grade',
    })
    expect(gradedEarlierLines('Ali', true, true).body).toContain('The column is published, so keeping the grade shows it to Ali at once.')
    expect(gradedEarlierLines('Ali', false, false)).toEqual({
      title: GRADED_EARLIER_NOTE,
      body: "Ali turned in new work after you wrote feedback. Your draft feedback is kept, but it won't be published until you save it again: change it, or keep it as it is.",
      keep: 'Keep this feedback',
    })
    expect(keepDraftPatch({ score: 6, status: 'graded', feedback: 'Redo question 3' }, true)).toEqual({
      draftScore: 6,
      feedback: 'Redo question 3',
    })
    expect(keepDraftPatch({ score: null, status: 'excused', feedback: '' }, true)).toEqual({ draftStatus: 'excused' })
    expect(keepDraftPatch({ score: 6, status: 'graded', feedback: 'Good' }, false)).toEqual({ feedback: 'Good' })
    expect(keepDraftPatch({ score: null, status: null, feedback: '  ' }, true)).toBeNull()
  })

  it('a draft made after the newest work is not flagged and behaves as before', () => {
    expect(isToGrade(draft, true)).toBe(false)
    expect(publishOneHint('Ziad', true, true, true)).toBe('Publishing shows the grade and feedback to Ziad and parents, and emails Ziad.')
  })
})
