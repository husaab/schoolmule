import { describe, it, expect } from 'vitest'
import { buildStreamFeed, noticeLead } from './streamFeed'
import type { ClassNotice, StudentAnnouncement } from '@/services/types/studentPortal'

const post = (id: string, publishedAt: string, isPinned = false): StudentAnnouncement => ({
  announcementId: id,
  scope: 'class',
  classId: 'c1',
  classSubject: 'Science',
  title: id,
  body: '',
  author: { userId: 't1', name: 'Amal Haddad', avatar: null },
  publishedAt,
  editedAt: null,
  isPinned,
  attachments: [],
  read: true,
  ackRequested: false,
  ackedAt: null,
})

const notice = (itemId: string, postedAt: string): ClassNotice => ({ itemId, kind: 'assignment', title: itemId, postedAt, dueAt: null })

describe('buildStreamFeed', () => {
  it('runs posts and notices together, newest first', () => {
    const feed = buildStreamFeed(
      [post('p-old', '2026-10-10T12:00:00Z'), post('p-new', '2026-10-15T12:00:00Z')],
      [notice('n-mid', '2026-10-13T12:00:00Z')],
    )
    expect(feed.map((e) => e.key)).toEqual(['post:p-new', 'notice:n-mid', 'post:p-old'])
  })

  it('keeps pinned posts on top, newest first among them', () => {
    const feed = buildStreamFeed(
      [post('p-pin-old', '2026-09-01T12:00:00Z', true), post('p-new', '2026-10-15T12:00:00Z'), post('p-pin-new', '2026-09-20T12:00:00Z', true)],
      [notice('n1', '2026-10-14T12:00:00Z')],
    )
    expect(feed.map((e) => e.key)).toEqual(['post:p-pin-new', 'post:p-pin-old', 'post:p-new', 'notice:n1'])
  })

  it('puts a post before a notice at the same moment', () => {
    const feed = buildStreamFeed([post('p', '2026-10-13T12:00:00Z')], [notice('n', '2026-10-13T12:00:00Z')])
    expect(feed.map((e) => e.type)).toEqual(['post', 'notice'])
  })

  it('handles an empty class', () => {
    expect(buildStreamFeed([], [])).toEqual([])
  })
})

describe('noticeLead', () => {
  it('names the kind', () => {
    expect(noticeLead('assignment')).toBe('New assignment')
    expect(noticeLead('quiz')).toBe('New quiz')
    expect(noticeLead('material')).toBe('New material')
  })
})
