import { describe, it, expect } from 'vitest'
import {
  closedNote,
  fileKindLabel,
  gradeBlockCopy,
  gradedLine,
  itemDueLine,
  itemStatusOf,
  lateNote,
  lensClassworkNote,
  parentCommentsLine,
  pointsText,
  postedLine,
  turnInHint,
  turnInLabel,
  turnedInNote,
  workHeading,
  workMessagesSubtitle,
  workSavedLabel,
} from './itemPageText'
import type { StudentItem } from '@/services/types/studentPortal'

// Thursday, Oct 15 2026, 2:10 pm in Toronto (EDT, UTC-4).
const NOW = new Date('2026-10-15T18:10:00Z')

describe('the item header lines', () => {
  it('writes who posted it and when', () => {
    expect(postedLine('Lina Farouk', '2026-10-13T14:00:00Z', NOW)).toBe('Lina Farouk · posted Oct 13')
    expect(postedLine(null, '2026-10-13T14:00:00Z', NOW)).toBe('Posted Oct 13')
    expect(postedLine('Lina Farouk', null, NOW)).toBe('Lina Farouk')
    expect(postedLine(null, null, NOW)).toBe('')
  })

  it('writes the points', () => {
    expect(pointsText(10)).toBe('10 points')
    expect(pointsText(1)).toBe('1 point')
    expect(pointsText(12.5)).toBe('12.5 points')
    expect(pointsText(null)).toBeNull()
    expect(pointsText(0)).toBeNull()
  })
})

describe('itemDueLine', () => {
  it('reads tomorrow and today in amber', () => {
    expect(itemDueLine({ dueAt: '2026-10-16T19:30:00Z', date: null }, 'assigned', NOW)).toEqual({ text: 'Due tomorrow, 3:30 pm', tone: 'amber' })
    expect(itemDueLine({ dueAt: '2026-10-15T21:00:00Z', date: null }, 'assigned', NOW)).toEqual({ text: 'Due today, 5:00 pm', tone: 'amber' })
  })

  it('reads a later date in slate', () => {
    expect(itemDueLine({ dueAt: '2026-10-19T19:30:00Z', date: null }, 'assigned', NOW)).toEqual({ text: 'Due Mon, 3:30 pm', tone: 'slate' })
    expect(itemDueLine({ dueAt: '2026-10-23T19:30:00Z', date: null }, 'assigned', NOW)).toEqual({ text: 'Due Fri, Oct 23, 3:30 pm', tone: 'slate' })
  })

  it('says it was due, in rose, when the work is not in', () => {
    expect(itemDueLine({ dueAt: '2026-10-13T19:30:00Z', date: null }, 'missing', NOW)).toEqual({ text: 'Was due Tuesday, 3:30 pm', tone: 'rose' })
    expect(itemDueLine({ dueAt: '2026-10-13T19:30:00Z', date: null }, 'assigned', NOW)).toEqual({ text: 'Was due Tuesday, 3:30 pm', tone: 'rose' })
  })

  it('says it was due, quietly, when the work is in', () => {
    expect(itemDueLine({ dueAt: '2026-10-13T19:30:00Z', date: null }, 'turned_in', NOW)).toEqual({ text: 'Was due Tuesday, 3:30 pm', tone: 'slate' })
    expect(itemDueLine({ dueAt: '2026-10-13T19:30:00Z', date: null }, 'graded', NOW)).toEqual({ text: 'Was due Tuesday, 3:30 pm', tone: 'slate' })
  })

  it('writes a dated in-class test as its date', () => {
    expect(itemDueLine({ dueAt: null, date: '2026-10-23' }, 'no_turn_in', NOW)).toEqual({ text: 'Fri, Oct 23 · in class', tone: 'slate' })
  })

  it('has nothing to say for work with no date', () => {
    expect(itemDueLine({ dueAt: null, date: null }, 'assigned', NOW)).toBeNull()
  })
})

describe('itemStatusOf', () => {
  const base = { kind: 'assignment', submission: null, grade: null } as Pick<StudentItem, 'kind' | 'submission' | 'grade'>
  const submission = (status: 'assigned' | 'turned_in' | 'graded' | 'missing' | 'excused') =>
    ({ status, isLate: false, turnedInAt: null, textAnswer: null, textSavedAt: null, files: [], canEdit: false, canTurnIn: false, canUnsubmit: false, closed: false })

  it('is the submission status when there is something to turn in', () => {
    expect(itemStatusOf({ ...base, submission: submission('turned_in') })).toBe('turned_in')
    expect(itemStatusOf({ ...base, submission: submission('missing') })).toBe('missing')
  })

  it('is read from the grade when there is nothing to turn in', () => {
    expect(itemStatusOf({ ...base, kind: 'assessment', grade: { score: 8, maxScore: 10, status: 'graded', feedback: null, publishedAt: null } })).toBe('graded')
    expect(itemStatusOf({ ...base, kind: 'assessment', grade: { score: null, maxScore: 10, status: 'missing', feedback: null, publishedAt: null } })).toBe('missing')
    expect(itemStatusOf({ ...base, kind: 'assessment', grade: { score: null, maxScore: 10, status: 'excused', feedback: null, publishedAt: null } })).toBe('excused')
  })

  it('is to read for a material and has no turn-in otherwise', () => {
    expect(itemStatusOf({ ...base, kind: 'material' })).toBe('material')
    expect(itemStatusOf({ ...base, kind: 'assessment' })).toBe('no_turn_in')
    expect(itemStatusOf(base)).toBe('no_turn_in')
  })
})

describe('your work: files', () => {
  it('describes a file by kind and size', () => {
    expect(fileKindLabel({ fileName: 'plant-cell.jpg', mimeType: 'image/jpeg', sizeBytes: 2.1 * 1024 * 1024 })).toBe('Photo · 2.1 MB')
    expect(fileKindLabel({ fileName: 'notes.pdf', mimeType: 'application/pdf', sizeBytes: 120 * 1024 })).toBe('PDF · 120 KB')
    expect(fileKindLabel({ fileName: 'essay.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 40 * 1024 })).toBe('Word file · 40 KB')
    expect(fileKindLabel({ fileName: 'slides.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', sizeBytes: 3 * 1024 * 1024 })).toBe('PowerPoint · 3 MB')
    expect(fileKindLabel({ fileName: 'mystery.bin', mimeType: 'application/octet-stream', sizeBytes: 900 })).toBe('File · 900 B')
  })

  it('reads a photo from its name when the type is missing', () => {
    expect(fileKindLabel({ fileName: 'IMG_0412.HEIC', mimeType: '', sizeBytes: 2048 })).toBe('Photo · 2 KB')
  })
})

describe('the Turn in bar', () => {
  it('labels the button by how the work is handed in', () => {
    expect(turnInLabel('file')).toBe('Turn in')
    expect(turnInLabel('text')).toBe('Turn in')
    expect(turnInLabel('done')).toBe('Mark as done')
    expect(turnInLabel(null)).toBe('Turn in')
  })

  it('tells what is missing while Turn in is off', () => {
    expect(turnInHint({ mode: 'file', canTurnIn: false, teacher: 'Lina Farouk' })).toBe('Add a photo or file first.')
    expect(turnInHint({ mode: 'text', canTurnIn: false, teacher: 'Lina Farouk' })).toBe('Write your answer first.')
  })

  it('says the teacher sees it right away once it is on', () => {
    expect(turnInHint({ mode: 'file', canTurnIn: true, teacher: 'Lina Farouk' })).toBe('Lina Farouk sees it right away.')
    expect(turnInHint({ mode: 'done', canTurnIn: true, teacher: null })).toBe('Your teacher sees it right away.')
  })

  it('explains a turned-in item', () => {
    expect(turnedInNote({ teacher: 'Lina Farouk', canUnsubmit: true, closed: false })).toBe('Lina Farouk will grade it. You can unsubmit to change it until then.')
    expect(turnedInNote({ teacher: 'Lina Farouk', canUnsubmit: false, closed: true })).toBe("Lina Farouk will grade it. It can't be changed after the due date.")
    expect(turnedInNote({ teacher: null, canUnsubmit: false, closed: false })).toBe('Your teacher will grade it.')
  })

  it('says a closed item is closed', () => {
    expect(closedNote('assignment')).toBe('This assignment is closed. Ask your teacher.')
    expect(closedNote('quiz')).toBe('This quiz is closed. Ask your teacher.')
  })

  it('warns that late work is seen as late', () => {
    expect(lateNote({ dueAt: '2026-10-13T19:30:00Z', date: null }, 'Lina Farouk', NOW)).toBe("This was due Tuesday. If you turn it in now, Lina Farouk will see it's late.")
    expect(lateNote({ dueAt: '2026-10-14T19:30:00Z', date: null }, null, NOW)).toBe("This was due yesterday. If you turn it in now, your teacher will see it's late.")
  })
})

describe('the grade', () => {
  it('shows a score, the comment and who graded it', () => {
    expect(gradeBlockCopy({ score: 8, maxScore: 10, status: 'graded', feedback: 'Great labels.', publishedAt: '2026-10-15T15:00:00Z' }, 'Lina Farouk', { you: true }, NOW)).toEqual({
      tone: 'graded',
      label: 'Your grade',
      score: { value: '8', max: '/10' },
      message: null,
      quote: 'Great labels.',
      line: 'Lina Farouk · graded today',
    })
  })

  it('names the child for a parent', () => {
    const copy = gradeBlockCopy({ score: 13.5, maxScore: 15, status: 'graded', feedback: null, publishedAt: '2026-10-09T15:00:00Z' }, 'Lina Farouk', { name: 'Amal Haddad' }, NOW)
    expect(copy.label).toBe("Amal's grade")
    expect(copy.score).toEqual({ value: '13.5', max: '/15' })
    expect(copy.quote).toBeNull()
    expect(copy.line).toBe('Lina Farouk · graded Oct 9')
  })

  it('shows feedback with no score as feedback', () => {
    const copy = gradeBlockCopy({ score: null, maxScore: null, status: 'graded', feedback: 'Nice work.', publishedAt: null }, 'Lina Farouk', { you: true }, NOW)
    expect(copy.label).toBe('Feedback')
    expect(copy.score).toBeNull()
    expect(copy.quote).toBe('Nice work.')
    expect(copy.line).toBe('Lina Farouk')
  })

  it('says missing and excused plainly', () => {
    expect(gradeBlockCopy({ score: null, maxScore: 10, status: 'missing', feedback: null, publishedAt: null }, 'Lina Farouk', { you: true }, NOW)).toMatchObject({
      tone: 'missing',
      label: 'Missing',
      message: 'Lina Farouk marked this missing. It counts as 0 until it is graded.',
    })
    expect(gradeBlockCopy({ score: null, maxScore: 10, status: 'excused', feedback: null, publishedAt: null }, 'Lina Farouk', { you: true }, NOW)).toMatchObject({
      tone: 'excused',
      label: 'Excused',
      message: "This one doesn't count toward your grade.",
    })
    expect(gradeBlockCopy({ score: null, maxScore: 10, status: 'excused', feedback: null, publishedAt: null }, null, { name: 'Amal Haddad' }, NOW).message).toBe(
      "This one doesn't count toward Amal's grade.",
    )
  })

  it('writes the graded line without a teacher or a date', () => {
    expect(gradedLine('Lina Farouk', '2026-10-15T15:00:00Z', NOW)).toBe('Lina Farouk · graded today')
    expect(gradedLine(null, '2026-10-15T15:00:00Z', NOW)).toBe('Graded today')
    expect(gradedLine('Lina Farouk', null, NOW)).toBe('Lina Farouk')
    expect(gradedLine(null, null, NOW)).toBeNull()
  })
})

describe('whose work it is', () => {
  it('headings the card for the student and for a parent', () => {
    expect(workHeading({ you: true })).toBe('Your work')
    expect(workHeading({ name: 'Amal Haddad' })).toBe("Amal's work")
  })

  it('names the teacher and the parents in the messages heading', () => {
    expect(workMessagesSubtitle('Lina Farouk')).toBe('Lina Farouk and your parents')
    expect(workMessagesSubtitle(null)).toBe('your teacher and your parents')
  })

  it('says the parents can read the messages', () => {
    expect(workMessagesSubtitle('Lina Farouk')).toContain('your parents')
  })

  it('words the saved state of a typed answer', () => {
    expect(workSavedLabel('saved')).toBe('Saved')
    expect(workSavedLabel('saving')).toBe('Saving…')
    expect(workSavedLabel('error')).toBe("Couldn't save")
  })
})

describe('the parent side', () => {
  it('notes who can turn work in, by name and with the teacher to ask', () => {
    expect(lensClassworkNote('Amal Haddad', 'Lina Farouk')).toBe(
      'Only Amal can turn work in. You see the same status Amal does. Questions? Use "Message Lina Farouk" at the top.',
    )
    expect(lensClassworkNote('Amal Haddad', null)).toBe('Only Amal can turn work in. You see the same status Amal does.')
  })

  it('counts the private comments', () => {
    expect(parentCommentsLine('Amal Haddad', 'Lina Farouk', 2)).toBe('Private comments between Amal and Lina Farouk: 2')
    expect(parentCommentsLine('Amal Haddad', null, 1)).toBe('Private comments between Amal and the teacher: 1')
  })
})
