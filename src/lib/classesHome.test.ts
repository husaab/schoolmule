import { describe, it, expect } from 'vitest'
import type { ClassCard, ComingUpRow, DraftOrScheduledRow } from '@/services/types/classroom'
import { defaultIdentity } from './classIdentity'
import {
  cardAsClassPayload,
  cardMeta,
  cardNextLine,
  classTitle,
  comingUpClassLine,
  comingUpTitle,
  dateTile,
  draftWhen,
  filterCards,
  gradeShort,
  groupCardsByGrade,
  headerMeta,
  homeSummary,
  reviewPill,
  termLabel,
  teacherLine,
  toReviewTotal,
} from './classesHome'

// Thursday, October 15 2026, 10:00 in Toronto.
const NOW = new Date('2026-10-15T14:00:00Z')

const card = (over: Partial<ClassCard> = {}): ClassCard => ({
  classId: 'c1',
  subject: 'Science',
  grade: '5',
  termId: 't1',
  termName: 'Term 1',
  teacherId: 'u1',
  teacherName: 'Amal Haddad',
  teachers: [
    { userId: 'u1', name: 'Amal Haddad', role: 'lead', avatar: null },
    { userId: 'u2', name: 'Sami Haddad', role: 'co', avatar: null },
  ],
  studentCount: 22,
  identity: defaultIdentity('Science', '5'),
  archivedAt: null,
  toReviewCount: 0,
  next: null,
  ...over,
})

describe('labels', () => {
  it('names grades the short way', () => {
    expect(gradeShort('5')).toBe('Grade 5')
    expect(gradeShort('JK')).toBe('JK')
    expect(gradeShort('SK')).toBe('SK')
  })

  it('reads a card meta line', () => {
    expect(cardMeta(card())).toBe('Grade 5 · 22 students')
    expect(cardMeta(card({ grade: 'SK', studentCount: 1 }))).toBe('SK · 1 student')
  })

  it('sums the header line', () => {
    expect(homeSummary('Term 1', [card(), card({ studentCount: 19 }), card({ studentCount: 24 }), card()])).toBe(
      'Term 1 · 4 classes · 87 students',
    )
    expect(homeSummary('Term 1', [card({ studentCount: 1 })])).toBe('Term 1 · 1 class · 1 student')
    expect(homeSummary('', [])).toBe('0 classes · 0 students')
  })

  it('titles a class the way the server labels it', () => {
    expect(classTitle('5', 'Science')).toBe('Grade 5 Science')
    expect(classTitle('JK', 'Science')).toBe('JK Science')
    expect(classTitle('SK', 'Senior Kindergarten')).toBe('Senior Kindergarten')
  })

  it('lists the lead teacher, then co-teachers', () => {
    const lead = { name: 'Amal Haddad', role: 'lead' as const }
    const co = { name: 'Sami Haddad', role: 'co' as const }
    const co2 = { name: 'Rana Kareem', role: 'co' as const }
    expect(teacherLine([lead, co, co2])).toBe('Amal Haddad, with Sami Haddad, Rana Kareem')
    expect(teacherLine([lead])).toBe('Amal Haddad')
    expect(teacherLine([co])).toBe('Sami Haddad')
    expect(teacherLine([], 'Amal Haddad')).toBe('Amal Haddad')
    expect(teacherLine([])).toBe('')
  })

  it('reads the class header meta line', () => {
    const teachers = [
      { name: 'Amal Haddad', role: 'lead' as const },
      { name: 'Sami Haddad', role: 'co' as const },
    ]
    expect(headerMeta({ grade: '5', termName: 'Term 1' }, teachers)).toBe('Grade 5 · Term 1 · Amal Haddad, with Sami Haddad')
    expect(headerMeta({ grade: 'SK', termName: null }, [])).toBe('SK')
  })

  it('names the selected term', () => {
    expect(termLabel('active', 'Term 1')).toBe('Term 1')
    expect(termLabel('active', undefined)).toBe('Active term')
    expect(termLabel('all', 'Term 1')).toBe('All terms')
    expect(termLabel('Term 2', 'Term 1')).toBe('Term 2')
  })
})

describe('cardNextLine', () => {
  it('says nothing is due when there is nothing next', () => {
    expect(cardNextLine(null, NOW)).toEqual({ when: 'Nothing due', what: 'this week' })
  })

  it('reads an in-class assessment as a test on its weekday', () => {
    const next = { itemId: null, assessmentId: 'a1', title: 'Ecosystems unit test', kind: 'assessment' as const, dueAt: null, date: '2026-10-21' }
    expect(cardNextLine(next, NOW)).toEqual({ when: 'Test Wed', what: 'Ecosystems unit test' })
  })

  it('reads a turn-in item by its Toronto due date', () => {
    // 03:59 UTC on Saturday is still Friday evening in Toronto.
    const next = { itemId: 'i1', assessmentId: null, title: 'Plant cell diagram', kind: 'assignment' as const, dueAt: '2026-10-17T03:59:00Z', date: null }
    expect(cardNextLine(next, NOW)).toEqual({ when: 'Due Fri', what: 'Plant cell diagram' })
  })

  it('says today for something due today', () => {
    const next = { itemId: null, assessmentId: 'a1', title: 'Quiz 2', kind: 'assessment' as const, dueAt: null, date: '2026-10-15' }
    expect(cardNextLine(next, NOW)).toEqual({ when: 'Test today', what: 'Quiz 2' })
  })

  it('leaves out anything more than six days away, or already past', () => {
    const later = { itemId: null, assessmentId: 'a1', title: 'Unit 3 test', kind: 'assessment' as const, dueAt: null, date: '2026-10-22' }
    const past = { ...later, date: '2026-10-14' }
    expect(cardNextLine(later, NOW)).toEqual({ when: 'Nothing due', what: 'this week' })
    expect(cardNextLine(past, NOW)).toEqual({ when: 'Nothing due', what: 'this week' })
  })
})

describe('reviewPill', () => {
  it('counts work to review, else all caught up', () => {
    expect(reviewPill(12)).toEqual({ label: '12 to review', tone: 'review' })
    expect(reviewPill(0)).toEqual({ label: 'All caught up', tone: 'calm' })
  })

  it('totals the To review rail', () => {
    const row = { itemId: 'i', classId: 'c', classLabel: 'Grade 5 Science', iconUrl: '', title: 'T', turnedInCount: 12 }
    expect(toReviewTotal([row, { ...row, turnedInCount: 3 }])).toBe(15)
    expect(toReviewTotal([])).toBe(0)
  })
})

describe('Coming up', () => {
  const row: ComingUpRow = {
    itemId: null,
    assessmentId: 'a1',
    classId: 'c1',
    classLabel: 'Grade 5 Science',
    title: 'Ecosystems unit test',
    kind: 'assessment',
    date: '2026-10-16',
    dueAt: null,
    inClass: true,
    stillToTurnIn: null,
  }

  it('shows the date as a weekday tile', () => {
    expect(dateTile('2026-10-16')).toEqual({ dow: 'Fri', day: '16' })
    expect(dateTile('2026-11-02')).toEqual({ dow: 'Mon', day: '2' })
  })

  it('marks in-class work', () => {
    expect(comingUpTitle(row)).toBe('Ecosystems unit test (in class)')
    expect(comingUpTitle({ ...row, inClass: false })).toBe('Ecosystems unit test')
  })

  it('adds how many still have to turn it in', () => {
    expect(comingUpClassLine(row)).toBe('Grade 5 Science')
    expect(comingUpClassLine({ ...row, stillToTurnIn: 10 }, 22)).toBe('Grade 5 Science · 10 of 22 still to turn in')
    expect(comingUpClassLine({ ...row, stillToTurnIn: 10 })).toBe('Grade 5 Science · 10 still to turn in')
  })
})

describe('draftWhen', () => {
  const draft: DraftOrScheduledRow = { itemId: 'i', classId: 'c', classLabel: 'Grade 5 Science', title: 'Cells quiz', status: 'draft', publishAt: null }

  it('reads a draft as Draft', () => {
    expect(draftWhen(draft, NOW)).toBe('Draft')
  })

  it('reads a scheduled post as its Toronto weekday and time', () => {
    // Monday Oct 19, 11:30 UTC = 7:30 am in Toronto.
    expect(draftWhen({ ...draft, status: 'scheduled', publishAt: '2026-10-19T11:30:00Z' }, NOW)).toBe('Mon 7:30 am')
    expect(draftWhen({ ...draft, status: 'scheduled', publishAt: '2026-11-02T18:05:00Z' }, NOW)).toBe('Nov 2, 1:05 pm')
  })
})

describe('filters and grouping', () => {
  const cards = [
    card({ classId: 'jk', grade: 'JK', subject: 'Junior Kindergarten', teachers: [], teacherId: 'u3', teacherName: 'Rana Kareem' }),
    card({ classId: 'g5s', subject: 'Science' }),
    card({ classId: 'g5m', subject: 'Math', termName: 'Term 2' }),
    card({ classId: 'g8s', grade: '8', subject: 'Science' }),
  ]

  it('adapts a card to the class payload the modals and filters use', () => {
    const payload = cardAsClassPayload(card({ termId: null, teacherId: null, teacherName: null }), 'PLAYGROUND')
    expect(payload).toMatchObject({ classId: 'c1', school: 'PLAYGROUND', subject: 'Science', grade: '5', termId: '', teacherId: '', teacherName: '' })
    expect(payload.additionalTeachers).toEqual([{ teacherId: 'u2', fullName: 'Sami Haddad', email: '', addedAt: '' }])
  })

  it('filters cards with the Classes filters, keeping the server order', () => {
    const base = { subject: '', teacher: '', grade: '', term: 'all' }
    expect(filterCards(cards, { ...base, subject: 'Science' }, { isAdmin: true }).map((c) => c.classId)).toEqual(['g5s', 'g8s'])
    expect(filterCards(cards, { ...base, grade: '5' }, { isAdmin: true }).map((c) => c.classId)).toEqual(['g5s', 'g5m'])
    expect(filterCards(cards, { ...base, teacher: 'u2' }, { isAdmin: true }).map((c) => c.classId)).toEqual(['g5s', 'g5m', 'g8s'])
    expect(filterCards(cards, { ...base, term: 'active' }, { isAdmin: false, activeTermName: 'Term 1' }).map((c) => c.classId)).toEqual(['jk', 'g5s', 'g8s'])
  })

  it('groups cards by grade in the order the server sent them', () => {
    const groups = groupCardsByGrade(cards)
    expect(groups.map((g) => [g.grade, g.label, g.cards.map((c) => c.classId)])).toEqual([
      ['JK', 'Junior Kindergarten', ['jk']],
      ['5', 'Grade 5', ['g5s', 'g5m']],
      ['8', 'Grade 8', ['g8s']],
    ])
  })
})
