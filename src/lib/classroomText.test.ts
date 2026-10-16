import { describe, it, expect } from 'vitest'
import {
  cardLines,
  childSubline,
  classDetailLine,
  classNote,
  classPageMeta,
  dueLine,
  dueWhen,
  duePill,
  firstNameOf,
  formatMark,
  gradeLinkLabel,
  gradeMeta,
  greetingFor,
  joinNames,
  lensBannerText,
  missingSubline,
  needsYouMissingSubline,
  noMarksNote,
  notSigningNote,
  pctText,
  pickClass,
  postedAtLabel,
  recentDayLabel,
  recentPostMeta,
  scoreText,
  statTiles,
  upcomingLabel,
  wasDue,
} from './classroomText'

// Thursday, Oct 15 2026, 2:10 pm in Toronto (EDT, UTC-4).
const NOW = new Date('2026-10-15T18:10:00Z')

describe('names', () => {
  it('takes the first name', () => {
    expect(firstNameOf('Amal Haddad')).toBe('Amal')
    expect(firstNameOf('  Sami  ')).toBe('Sami')
    expect(firstNameOf(null)).toBe('')
  })

  it('joins names with "and"', () => {
    expect(joinNames([])).toBe('')
    expect(joinNames(['Ms. Amal'])).toBe('Ms. Amal')
    expect(joinNames(['Ms. Amal', 'Mr. Sami'])).toBe('Ms. Amal and Mr. Sami')
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B and C')
  })

  it('writes the class meta line', () => {
    expect(classPageMeta('5', [{ name: 'Amal Haddad' }, { name: 'Sami Kareem' }])).toBe('Grade 5 · Amal Haddad and Sami Kareem')
    expect(classPageMeta('SK', [{ name: 'Lina Farouk' }])).toBe('SK · Lina Farouk')
    expect(classPageMeta('3', [])).toBe('Grade 3')
  })
})

describe('greeting', () => {
  it('follows the Toronto hour', () => {
    expect(greetingFor(new Date('2026-10-15T12:00:00Z'))).toBe('Good morning') // 8:00
    expect(greetingFor(new Date('2026-10-15T16:00:00Z'))).toBe('Good afternoon') // 12:00
    expect(greetingFor(new Date('2026-10-15T21:59:00Z'))).toBe('Good afternoon') // 17:59
    expect(greetingFor(new Date('2026-10-15T22:00:00Z'))).toBe('Good evening') // 18:00
    expect(greetingFor(new Date('2026-10-16T04:30:00Z'))).toBe('Good morning') // 0:30
  })
})

describe('dates', () => {
  it('labels a post by its Toronto day', () => {
    expect(postedAtLabel('2026-10-15T18:10:00Z', NOW)).toBe('Today, 2:10 pm')
    expect(postedAtLabel('2026-10-10T15:00:00Z', NOW)).toBe('Oct 10')
    // 11 pm Toronto on the 14th is already the 15th in UTC, but it is yesterday here.
    expect(postedAtLabel('2026-10-15T03:00:00Z', NOW)).toBe('Oct 14')
  })

  it('names the day of a recent post', () => {
    expect(recentDayLabel('2026-10-15T15:00:00Z', NOW)).toBe('today')
    expect(recentDayLabel('2026-10-14T15:00:00Z', NOW)).toBe('yesterday')
    expect(recentDayLabel('2026-10-12T15:00:00Z', NOW)).toBe('Monday')
    expect(recentDayLabel('2026-10-01T15:00:00Z', NOW)).toBe('Oct 1')
  })

  it('says when work falls', () => {
    expect(dueWhen({ dueAt: '2026-10-15T20:00:00Z', date: null }, NOW)).toBe('today')
    expect(dueWhen({ dueAt: '2026-10-16T19:30:00Z', date: null }, NOW)).toBe('tomorrow')
    expect(dueWhen({ dueAt: '2026-10-19T19:30:00Z', date: null }, NOW)).toBe('Mon')
    expect(dueWhen({ dueAt: '2026-10-23T19:30:00Z', date: null }, NOW)).toBe('Fri, Oct 23')
    expect(dueWhen({ dueAt: null, date: '2026-10-23' }, NOW)).toBe('Fri, Oct 23')
    expect(dueWhen({ dueAt: null, date: null }, NOW)).toBe('')
  })

  it('writes the due line of a posted item with its time', () => {
    expect(dueLine('2026-10-16T19:30:00Z', NOW)).toBe('due tomorrow, 3:30 pm')
    expect(dueLine('2026-10-19T19:30:00Z', NOW)).toBe('due Mon, 3:30 pm')
    expect(dueLine('2026-10-23T19:30:00Z', NOW)).toBe('due Fri, Oct 23, 3:30 pm')
  })

  it('says when missing work was due', () => {
    expect(wasDue({ dueAt: '2026-10-14T19:30:00Z', date: null }, NOW)).toBe('was due yesterday')
    expect(wasDue({ dueAt: '2026-10-13T19:30:00Z', date: null }, NOW)).toBe('was due Tuesday')
    expect(wasDue({ dueAt: '2026-10-09T19:30:00Z', date: null }, NOW)).toBe('was due Friday')
    expect(wasDue({ dueAt: '2026-10-08T19:30:00Z', date: null }, NOW)).toBe('was due Oct 8')
    expect(wasDue({ dueAt: null, date: '2026-10-12' }, NOW)).toBe('was due Monday')
  })

  it('writes the Missing line under a Due soon row', () => {
    expect(missingSubline({ subject: 'English', dueAt: '2026-10-13T19:30:00Z', date: null }, NOW)).toBe('Missing · English · was due Tuesday')
  })
})

describe('class card lines', () => {
  const next = (over = {}) => ({ itemId: 'i1', title: 'Plant cell diagram', kind: 'assignment' as const, dueAt: '2026-10-16T19:30:00Z', date: null, ...over })

  it('reads "due tomorrow" for a turn-in due tomorrow', () => {
    expect(cardLines(next(), 0, NOW)).toEqual({ missing: null, next: 'Plant cell diagram · due tomorrow' })
  })

  it('reads the weekday or the date further out', () => {
    expect(cardLines(next({ title: 'Decimals worksheet', dueAt: '2026-10-19T19:30:00Z' }), 0, NOW).next).toBe('Decimals worksheet · Mon')
    expect(cardLines(next({ title: 'Vocabulary quiz', dueAt: '2026-10-23T19:30:00Z' }), 0, NOW).next).toBe('Vocabulary quiz · Fri, Oct 23')
  })

  it('an in-class test has a date and no "due"', () => {
    expect(cardLines(next({ title: 'Unit 2 test', kind: 'assessment', dueAt: null, date: '2026-10-16' }), 0, NOW).next).toBe('Unit 2 test · tomorrow')
  })

  it('shows missing work in its own line, and "Nothing due" only when there is neither', () => {
    expect(cardLines(null, 1, NOW)).toEqual({ missing: '1 missing', next: null })
    expect(cardLines(next(), 2, NOW)).toEqual({ missing: '2 missing', next: 'Plant cell diagram · due tomorrow' })
    expect(cardLines(null, 0, NOW)).toEqual({ missing: null, next: 'Nothing due' })
  })
})

describe('coming up and due soon', () => {
  const item = (over = {}) => ({ dueAt: '2026-10-16T19:30:00Z', date: null, status: 'assigned' as const, ...over })

  it('labels Coming up rows', () => {
    expect(upcomingLabel(item(), NOW)).toEqual({ text: 'Tomorrow', soon: true })
    expect(upcomingLabel(item({ dueAt: '2026-10-15T20:00:00Z' }), NOW)).toEqual({ text: 'Today', soon: true })
    expect(upcomingLabel(item({ dueAt: '2026-10-21T19:30:00Z' }), NOW)).toEqual({ text: 'Wed, Oct 21', soon: false })
    expect(upcomingLabel(item({ dueAt: null, date: '2026-10-23', status: 'no_turn_in' }), NOW)).toEqual({ text: 'Fri, Oct 23 · in class', soon: false })
    expect(upcomingLabel(item({ dueAt: null, date: '2026-10-16', status: 'no_turn_in' }), NOW)).toEqual({ text: 'Tomorrow · in class', soon: true })
  })

  it('puts "Due tomorrow" in amber and other days as a date', () => {
    expect(duePill({ dueAt: '2026-10-16T19:30:00Z', date: null }, NOW)).toEqual({ text: 'Due tomorrow', tone: 'amber' })
    expect(duePill({ dueAt: '2026-10-15T21:00:00Z', date: null }, NOW)).toEqual({ text: 'Due today', tone: 'amber' })
    expect(duePill({ dueAt: '2026-10-19T19:30:00Z', date: null }, NOW)).toEqual({ text: 'Mon, Oct 19', tone: 'slate' })
  })
})

describe('grades', () => {
  const graded = { status: 'graded' as const, score: 13, maxScore: 15 }

  it('writes a score', () => {
    expect(scoreText(graded)).toBe('13/15')
    expect(scoreText({ status: 'graded', score: 8.5, maxScore: 10 })).toBe('8.5/10')
    expect(scoreText({ status: 'graded', score: 7.456, maxScore: 10 })).toBe('7.46/10')
    expect(scoreText({ status: 'graded', score: 4, maxScore: null })).toBe('4')
    expect(scoreText({ status: 'graded', score: null, maxScore: 10 })).toBe('—')
    expect(scoreText({ status: 'missing', score: null, maxScore: 10 })).toBe('Missing')
    expect(scoreText({ status: 'excused', score: null, maxScore: 10 })).toBe('Excused')
    expect(formatMark(13)).toBe('13')
  })

  it('writes the meta line', () => {
    expect(gradeMeta({ kind: 'assignment', status: 'graded', publishedAt: '2026-10-15T16:00:00Z' }, NOW)).toBe('Assignment · graded today')
    expect(gradeMeta({ kind: 'quiz', status: 'graded', publishedAt: '2026-10-06T16:00:00Z' }, NOW)).toBe('Quiz · graded Oct 6')
    expect(gradeMeta({ kind: 'assessment', status: 'missing', publishedAt: '2026-10-06T16:00:00Z' }, NOW)).toBe('Assessment · missing')
    expect(gradeMeta({ kind: 'assessment', status: 'excused', publishedAt: null }, NOW)).toBe('Assessment · excused')
    expect(gradeMeta({ kind: 'assessment', status: 'graded', publishedAt: null }, NOW)).toBe('Assessment')
  })

  it('formats a percentage', () => {
    expect(pctText(84.4)).toBe('84%')
    expect(pctText(84.5)).toBe('85%')
    expect(pctText(0)).toBe('0%')
    expect(pctText(null)).toBe('—')
  })

  it('notes each class: new today beats missing beats graded', () => {
    const cls = (over = {}) => ({ latestPublishedAt: null, missingCount: 0, gradedCount: 0, ...over })
    expect(classNote(cls({ latestPublishedAt: '2026-10-15T14:00:00Z', missingCount: 1, gradedCount: 4 }), NOW)).toEqual({ text: 'New grade today', tone: 'new' })
    expect(classNote(cls({ latestPublishedAt: '2026-10-10T14:00:00Z', missingCount: 1, gradedCount: 4 }), NOW)).toEqual({ text: '1 missing', tone: 'missing' })
    expect(classNote(cls({ latestPublishedAt: '2026-10-10T14:00:00Z', gradedCount: 5 }), NOW)).toEqual({ text: '5 graded', tone: 'plain' })
    expect(classNote(cls(), NOW)).toEqual({ text: 'No grades yet', tone: 'plain' })
  })

  it('writes the detail line without a zero missing count', () => {
    expect(classDetailLine({ teacherName: 'Amal Haddad', gradedCount: 4, missingCount: 1 })).toBe('Amal Haddad · 4 graded · 1 missing')
    expect(classDetailLine({ teacherName: 'Amal Haddad', gradedCount: 4, missingCount: 0 })).toBe('Amal Haddad · 4 graded')
    expect(classDetailLine({ teacherName: null, gradedCount: 0, missingCount: 0 })).toBe('0 graded')
  })

  it('links only what can be opened', () => {
    expect(gradeLinkLabel({ kind: 'assignment', status: 'graded', itemId: 'i1' })).toBe('See your work and comments')
    expect(gradeLinkLabel({ kind: 'assignment', status: 'missing', itemId: 'i1' })).toBe('Turn it in now')
    expect(gradeLinkLabel({ kind: 'quiz', status: 'graded', itemId: 'i1' })).toBe('See your answers')
    expect(gradeLinkLabel({ kind: 'assessment', status: 'graded', itemId: 'i1' })).toBeNull()
    expect(gradeLinkLabel({ kind: 'assignment', status: 'graded', itemId: null })).toBeNull()
    expect(gradeLinkLabel({ kind: 'assignment', status: 'excused', itemId: 'i1' })).toBeNull()
  })

  it('picks the class in the URL, else the first', () => {
    const classes = [{ classId: 'a' }, { classId: 'b' }]
    expect(pickClass(classes, 'b')).toBe(classes[1])
    expect(pickClass(classes, 'zzz')).toBe(classes[0])
    expect(pickClass(classes, null)).toBe(classes[0])
    expect(pickClass([], 'a')).toBeNull()
  })

  it('explains a JK or SK grade page with a name, never a pronoun', () => {
    expect(noMarksNote({ grade: 'SK', teacherName: 'Lina Farouk', owner: { name: 'Noor Haddad' } })).toBe(
      "SK doesn't use marks. Lina Farouk records skills (Beginning, Developing, Independent) and they appear on Noor's report card.",
    )
    expect(noMarksNote({ grade: 'JK', teacherName: null, owner: { you: true } })).toBe(
      "JK doesn't use marks. Your teacher records skills (Beginning, Developing, Independent) and they appear on your report card.",
    )
    expect(noMarksNote({ grade: 'JK', teacherName: null, owner: { name: 'Amal Haddad' } })).toContain('The teacher records skills')
  })
})

describe('the parent Classes page', () => {
  const child = { grade: '5' as const, classCount: 8, signsIn: true, homeroomTeacherName: 'Amal Haddad' }

  it('sublines a child', () => {
    expect(childSubline(child)).toBe('Grade 5 · 8 classes')
    expect(childSubline({ ...child, classCount: 1 })).toBe('Grade 5 · 1 class')
    expect(childSubline({ ...child, grade: 'SK', signsIn: false, homeroomTeacherName: 'Lina Farouk' })).toBe('SK · Lina Farouk')
    expect(childSubline({ ...child, grade: 'SK', signsIn: false, homeroomTeacherName: null })).toBe('SK')
  })

  it("explains a child who doesn't sign in", () => {
    expect(notSigningNote('Noor Haddad', 'Lina Farouk')).toBe("Noor doesn't sign in. Lina Farouk's posts show here and in your Friday email.")
    expect(notSigningNote('Noor Haddad', null)).toBe("Noor doesn't sign in. Posts from Noor's teachers show here and in your Friday email.")
  })

  it('builds the three tiles', () => {
    expect(statTiles({ dueThisWeek: 3, missingCount: 1, newGradeCount: 2 })).toEqual([
      { key: 'due', value: 3, label: 'due this week' },
      { key: 'missing', value: 1, label: 'missing' },
      { key: 'grades', value: 2, label: 'new grades' },
    ])
    expect(statTiles({ dueThisWeek: 0, missingCount: 0, newGradeCount: 1 })[2].label).toBe('new grade')
  })

  it('sublines a missing row', () => {
    const item = {
      kind: 'missing' as const, itemId: 'i1', assessmentId: null, title: 'Spelling list 4', classId: 'c1', classSubject: 'English',
      teacher: { userId: 't1', name: 'Rana Kareem', avatar: null }, studentId: 's1', dueAt: '2026-10-13T19:30:00Z', date: null,
    }
    expect(needsYouMissingSubline(item, NOW)).toBe('English · Rana Kareem · was due Tuesday')
    expect(needsYouMissingSubline({ ...item, teacher: null }, NOW)).toBe('English · was due Tuesday')
  })

  it('writes the recent post meta', () => {
    const post = { author: { userId: 't1', name: 'Lina Farouk', avatar: null }, publishedAt: '2026-10-14T15:00:00Z' }
    expect(recentPostMeta(post, NOW)).toBe('Lina Farouk · yesterday')
  })

  it('names the child in the lens banner', () => {
    expect(lensBannerText('Amal Haddad')).toEqual({ lead: "You're seeing ", name: "Amal's", tail: ' classes, the way Amal sees them.' })
  })
})
