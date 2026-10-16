import { describe, expect, it } from 'vitest'
import {
  buildFeed,
  dayKeyLabel,
  dayLabel,
  emailAudienceKind,
  emailCheckboxText,
  emailedLabel,
  noticeHeadline,
  noticeMeta,
  postByline,
  resolveAuthor,
  seenChips,
  upcomingLabel,
} from './classStream'
import type { AnnouncementItem } from '@/services/types/announcement'
import type { StreamNotice } from '@/services/types/classroom'

const post = (id: string, publishedAt: string, extra: Partial<AnnouncementItem> = {}): AnnouncementItem => ({
  announcementId: id,
  scope: 'class',
  classId: 'c1',
  classSubject: 'Science',
  classGrade: '5',
  grade: null,
  scopeLabel: 'Gr 5 Science',
  title: `Post ${id}`,
  body: 'Body',
  authorId: 'u1',
  authorName: 'Amal Haddad',
  authorRole: 'TEACHER',
  publishedAt,
  pinnedUntil: null,
  isPinned: false,
  editedAt: null,
  attachmentCount: 0,
  read: true,
  canEdit: true,
  ackRequested: false,
  acked: false,
  ackedAt: null,
  ...extra,
})

const notice = (id: string, postedAt: string, extra: Partial<StreamNotice> = {}): StreamNotice => ({
  itemId: id,
  kind: 'assignment',
  title: `Item ${id}`,
  postedAt,
  dueAt: null,
  ...extra,
})

describe('buildFeed', () => {
  it('interleaves posts and notices newest first', () => {
    const feed = buildFeed(
      [post('p1', '2026-10-12T15:00:00Z'), post('p2', '2026-10-08T15:00:00Z')],
      [notice('n1', '2026-10-13T15:00:00Z'), notice('n2', '2026-10-10T15:00:00Z')],
    )
    expect(feed.map((e) => e.key)).toEqual(['notice:n1', 'post:p1', 'notice:n2', 'post:p2'])
  })

  it('keeps pinned posts first, whatever their age, newest first among them', () => {
    const feed = buildFeed(
      [
        post('old-pin', '2026-09-01T15:00:00Z', { isPinned: true }),
        post('p1', '2026-10-12T15:00:00Z'),
        post('new-pin', '2026-09-20T15:00:00Z', { isPinned: true }),
      ],
      [notice('n1', '2026-10-13T15:00:00Z')],
    )
    expect(feed.map((e) => e.key)).toEqual(['post:new-pin', 'post:old-pin', 'notice:n1', 'post:p1'])
  })

  it('puts a post before a notice posted at the same moment', () => {
    const feed = buildFeed([post('p1', '2026-10-12T15:00:00Z')], [notice('n1', '2026-10-12T15:00:00Z')])
    expect(feed.map((e) => e.key)).toEqual(['post:p1', 'notice:n1'])
  })

  it('is empty with nothing to show, and works without notices', () => {
    expect(buildFeed([], [])).toEqual([])
    expect(buildFeed([post('p1', '2026-10-12T15:00:00Z')], []).map((e) => e.key)).toEqual(['post:p1'])
  })

  it('does not reorder its input', () => {
    const posts = [post('a', '2026-10-01T15:00:00Z'), post('b', '2026-10-05T15:00:00Z')]
    buildFeed(posts, [])
    expect(posts.map((p) => p.announcementId)).toEqual(['a', 'b'])
  })
})

describe('emailedLabel', () => {
  it('says not emailed for a post made without email, whoever is in the class', () => {
    expect(emailedLabel(false, { students: 22, guardians: 31 })).toBe('not emailed')
  })
  it('names who the class can be emailed today', () => {
    expect(emailedLabel(true, { students: 22, guardians: 31 })).toBe('emailed to students and parents')
    expect(emailedLabel(undefined, { students: 22, guardians: 31 })).toBe('emailed to students and parents')
    expect(emailedLabel(true, { students: 0, guardians: 31 })).toBe('emailed to parents')
    expect(emailedLabel(true, { students: 22, guardians: 0 })).toBe('emailed to students')
    expect(emailedLabel(true, { students: 0, guardians: 0 })).toBe('emailed')
  })
})

describe('postByline', () => {
  it('reads "date · emailed to …", plus edited once the words changed', () => {
    const audience = { students: 22, guardians: 31 }
    expect(postByline(post('p', '2026-10-12T16:00:00Z'), audience)).toBe('Oct 12 · emailed to students and parents')
    expect(postByline(post('p', '2026-10-12T16:00:00Z', { editedAt: '2026-10-13T16:00:00Z' }), audience)).toBe(
      'Oct 12 · emailed to students and parents · edited',
    )
    expect(postByline(post('p', '2026-10-12T16:00:00Z', { sendEmail: false }), audience)).toBe('Oct 12 · not emailed')
  })
})

describe('resolveAuthor', () => {
  const teachers = [
    { userId: 'u1', role: 'lead' as const, avatar: { style: 'hijab' as const, skin: 1 as const, bg: 2 as const }, photoUrl: null },
    { userId: 'u2', role: 'co' as const, avatar: null, photoUrl: 'https://example.com/u2.jpg' },
  ]
  it('reads the lead teacher without a tag', () => {
    expect(resolveAuthor('u1', teachers)).toEqual({ avatar: teachers[0].avatar, photoUrl: null, coTeacher: false })
  })
  it('tags a co-teacher and carries their photo', () => {
    expect(resolveAuthor('u2', teachers)).toEqual({ avatar: null, photoUrl: 'https://example.com/u2.jpg', coTeacher: true })
  })
  it('gives anyone else (an admin, a removed author) the neutral avatar', () => {
    expect(resolveAuthor('u9', teachers)).toEqual({ avatar: null, photoUrl: null, coTeacher: false })
    expect(resolveAuthor(null, teachers)).toEqual({ avatar: null, photoUrl: null, coTeacher: false })
  })
})

describe('seenChips', () => {
  it('shows parents, students and Got it, each saying whom', () => {
    const chips = seenChips(
      post('p', '2026-10-12T16:00:00Z', {
        seenCount: 26,
        audienceCount: 31,
        studentSeenCount: 18,
        studentAudienceCount: 22,
        ackRequested: true,
        ackCount: 21,
      }),
    )
    expect(chips).toEqual([
      { kind: 'parents', text: 'Seen by 26 of 31 parents' },
      { kind: 'students', text: 'Seen by 18 of 22 students' },
      { kind: 'ack', text: 'Got it · 21' },
    ])
  })
  it('leaves out the student chip when no student login can read the post, and Got it when not asked for', () => {
    const chips = seenChips(post('p', '2026-10-12T16:00:00Z', { seenCount: 0, audienceCount: 1, studentAudienceCount: 0 }))
    expect(chips).toEqual([{ kind: 'parents', text: 'Seen by 0 of 1 parent' }])
  })
  it('is empty when nobody can read the post', () => {
    expect(seenChips(post('p', '2026-10-12T16:00:00Z'))).toEqual([])
  })
})

describe('notices', () => {
  it('headlines each kind of classwork', () => {
    expect(noticeHeadline('assignment')).toBe('New assignment')
    expect(noticeHeadline('quiz')).toBe('New quiz')
    expect(noticeHeadline('material')).toBe('New material')
    expect(noticeHeadline('assessment')).toBe('New assessment')
  })
  it('reads "date · due … · n of total turned in"', () => {
    expect(
      noticeMeta(notice('n', '2026-10-13T16:00:00Z', { dueAt: '2026-10-16T14:00:00Z', turnedInCount: 12, total: 22 })),
    ).toBe('Oct 13 · due Fri, Oct 16 · 12 of 22 turned in')
  })
  it('drops what the work does not have', () => {
    expect(noticeMeta(notice('n', '2026-10-13T16:00:00Z', { turnedInCount: 0, total: 22 }))).toBe('Oct 13 · 0 of 22 turned in')
    expect(noticeMeta(notice('n', '2026-10-13T16:00:00Z', { dueAt: '2026-10-16T14:00:00Z' }))).toBe('Oct 13 · due Fri, Oct 16')
    expect(noticeMeta(notice('n', '2026-10-13T16:00:00Z', { kind: 'material', turnedInCount: 0, total: 22 }))).toBe('Oct 13')
  })
  it('reads a late-evening due time on the Toronto calendar', () => {
    // 11:59 pm Toronto on Oct 16 is Oct 17 in UTC.
    expect(dayLabel('2026-10-17T03:59:00Z')).toBe('Fri, Oct 16')
  })
})

describe('upcomingLabel', () => {
  it('marks due work, in-class dates and plain dates', () => {
    expect(upcomingLabel({ date: '2026-10-16', dueAt: '2026-10-16T14:00:00Z', inClass: false })).toBe('Due Fri, Oct 16')
    expect(upcomingLabel({ date: '2026-10-23', dueAt: null, inClass: true })).toBe('Fri, Oct 23 · in class')
    expect(upcomingLabel({ date: '2026-10-21', dueAt: null, inClass: false })).toBe('Wed, Oct 21')
  })
  it('formats a calendar date without a time zone shift', () => {
    expect(dayKeyLabel('2026-01-01')).toBe('Thu, Jan 1')
  })
})

describe('who gets emails', () => {
  it('classifies the audience', () => {
    expect(emailAudienceKind({ students: 22, guardians: 31 })).toBe('both')
    expect(emailAudienceKind({ students: 0, guardians: 31 })).toBe('parents')
    expect(emailAudienceKind({ students: 22, guardians: 0 })).toBe('students')
    expect(emailAudienceKind({ students: 0, guardians: 0 })).toBe('none')
  })
  it('words the composer checkbox for each case', () => {
    expect(emailCheckboxText({ students: 22, guardians: 31 })).toBe('Email students and parents · 22 students, 31 parents')
    expect(emailCheckboxText({ students: 1, guardians: 1 })).toBe('Email students and parents · 1 student, 1 parent')
    expect(emailCheckboxText({ students: 0, guardians: 31 })).toBe('Email parents · 31 parents')
    expect(emailCheckboxText({ students: 22, guardians: 0 })).toBe('Email students · 22 students')
    expect(emailCheckboxText({ students: 0, guardians: 0 })).toBe('Email students and parents · no one has an email on file yet')
  })
})
