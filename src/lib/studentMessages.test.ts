import { describe, it, expect } from 'vitest'
import type { ConversationItem, Message, Participant, StudentTargetTeacher } from '@/services/types/messaging'
import {
  BODY_MAX,
  SUBJECT_MAX,
  canChangeOwnMessage,
  composePatch,
  guardiansNote,
  isUnread,
  listWhen,
  messageWhen,
  messagesBadgeCount,
  newMessageProblem,
  orderParticipants,
  parentLabel,
  parentsBanner,
  participantLabel,
  resolveCompose,
  rowPreview,
  rowTeacher,
  senderLabel,
  teacherClassesLine,
  threadKind,
  threadSubline,
} from './studentMessages'

// Friday, Oct 16 2026, 8:32 am in Toronto (EDT, UTC-4).
const NOW = new Date('2026-10-16T12:32:00Z')
const ME = 'u-me'

const teacher = (over: Partial<StudentTargetTeacher> = {}): StudentTargetTeacher => ({
  userId: 't1',
  name: 'Lina Farouk',
  avatar: null,
  classes: [{ classId: 'c-sci', subject: 'Science' }],
  ...over,
})

describe('times', () => {
  it('says when a message was sent', () => {
    expect(messageWhen('2026-10-16T12:10:00Z', NOW)).toBe('Today 8:10 am')
    expect(messageWhen('2026-10-15T22:40:00Z', NOW)).toBe('Yesterday 6:40 pm')
    expect(messageWhen('2026-10-13T20:55:00Z', NOW)).toBe('Tue 4:55 pm')
    expect(messageWhen('2026-10-08T12:00:00Z', NOW)).toBe('Oct 8, 8:00 am')
    expect(messageWhen('2025-12-08T17:00:00Z', NOW)).toBe('Dec 8, 2025, 12:00 pm')
  })

  it('says it by the Toronto day, not the UTC one', () => {
    // 11:30 pm Toronto on Oct 15 is already Oct 16 in UTC.
    expect(messageWhen('2026-10-16T03:30:00Z', NOW)).toBe('Yesterday 11:30 pm')
  })

  it('writes the stamp on a list row', () => {
    expect(listWhen('2026-10-16T12:10:00Z', NOW)).toBe('8:10 am')
    expect(listWhen('2026-10-15T22:40:00Z', NOW)).toBe('Yesterday')
    expect(listWhen('2026-10-14T20:00:00Z', NOW)).toBe('Wed')
    expect(listWhen('2026-10-09T20:00:00Z', NOW)).toBe('Oct 9')
  })
})

describe('own messages', () => {
  const sent = (minutesAgo: number, over: Partial<Message> = {}): Message => ({
    messageId: 'm1',
    senderId: ME,
    senderName: 'Amal Haddad',
    senderRole: 'STUDENT',
    senderRelation: null,
    kind: 'message',
    body: 'Hi',
    createdAt: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString(),
    editedAt: null,
    deletedAt: null,
    attachments: [],
    ...over,
  })

  it('can be changed for 15 minutes', () => {
    expect(canChangeOwnMessage(sent(14), ME, NOW)).toBe(true)
    expect(canChangeOwnMessage(sent(16), ME, NOW)).toBe(false)
  })

  it('is never changed when it is not yours, removed, or a system line', () => {
    expect(canChangeOwnMessage(sent(1, { senderId: 'someone' }), ME, NOW)).toBe(false)
    expect(canChangeOwnMessage(sent(1, { deletedAt: NOW.toISOString() }), ME, NOW)).toBe(false)
    expect(canChangeOwnMessage(sent(1, { kind: 'system' }), ME, NOW)).toBe(false)
  })
})

describe('people', () => {
  it('writes a parent as name and relation', () => {
    expect(parentLabel('Mona Haddad', 'Mother')).toBe('Mona Haddad · mother')
    expect(parentLabel('Mona Haddad', null)).toBe('Mona Haddad')
    expect(parentLabel('Mona Haddad', '  ')).toBe('Mona Haddad')
  })

  it('labels who sent a message', () => {
    const base = { senderId: 's1', senderName: 'Lina Farouk', senderRole: 'TEACHER' as const, senderRelation: null }
    expect(senderLabel(base, ME)).toBe('Lina Farouk')
    expect(senderLabel({ ...base, senderId: ME }, ME)).toBe('You')
    expect(senderLabel({ ...base, senderRole: 'PARENT', senderName: 'Mona Haddad', senderRelation: 'Mother' }, ME)).toBe('Mona Haddad · mother')
  })

  it('labels the people in the strip', () => {
    const p = (over: Partial<Participant>): Participant => ({
      userId: 'x', name: 'Lina Farouk', role: 'TEACHER', relation: null, invitePending: false, ...over,
    })
    expect(participantLabel(p({}), ME, 't1')).toBe('Lina Farouk · teacher')
    expect(participantLabel(p({ userId: ME, role: 'STUDENT', name: 'Amal Haddad', relation: 'student' }), ME, 't1')).toBe('You')
    expect(participantLabel(p({ role: 'PARENT', name: 'Mona Haddad', relation: 'Mother' }), ME, 't1')).toBe('Mona Haddad · mother')
    // An admin the thread was written to is a teacher; one who stepped in is school staff.
    expect(participantLabel(p({ userId: 't1', role: 'ADMIN' }), ME, 't1')).toBe('Lina Farouk · teacher')
    expect(participantLabel(p({ userId: 'other', role: 'ADMIN', name: 'Office Admin' }), ME, 't1')).toBe('Office Admin · school staff')
  })

  it('orders the strip teachers, You, parents', () => {
    const people = [
      { userId: 'p1', role: 'PARENT' as const },
      { userId: ME, role: 'STUDENT' as const },
      { userId: 't1', role: 'TEACHER' as const },
      { userId: 't2', role: 'TEACHER' as const },
    ]
    expect(orderParticipants(people, ME).map((x) => x.userId)).toEqual(['t1', 't2', ME, 'p1'])
  })
})

describe('a thread', () => {
  it('says what the thread is about', () => {
    expect(threadKind('item-1')).toBe('about an assignment')
    expect(threadKind(null)).toBe('general')
    expect(threadSubline({ classSubject: 'Science', classworkItemId: 'i1' })).toBe('Science · about an assignment')
    expect(threadSubline({ classSubject: '', classworkItemId: null })).toBe('Homeroom · general')
  })

  it('tells the student their parents are in it, only when they are', () => {
    expect(parentsBanner([{ role: 'TEACHER' }, { role: 'PARENT' }], null)).toBe(
      'Your parents are in every conversation with your teachers. They can read and reply.',
    )
    expect(parentsBanner([{ role: 'TEACHER' }, { role: 'STUDENT' }], 'i1')).toBe('This conversation is between you and your teachers.')
    expect(parentsBanner([{ role: 'TEACHER' }], null)).toMatch(/aren't on SchoolMule yet/)
  })

  it('previews the last message', () => {
    const last = (over: object) => ({
      lastMessage: { senderId: 's1', senderName: 'Lina Farouk', senderRole: 'TEACHER' as const, kind: 'message' as const, body: 'Yes, thicker is right.', deleted: false, createdAt: '2026-10-16T12:00:00Z', ...over },
    })
    expect(rowPreview(last({}), ME)).toBe('Lina Farouk: Yes, thicker is right.')
    expect(rowPreview(last({ senderId: ME }), ME)).toBe('You: Yes, thicker is right.')
    expect(rowPreview(last({ senderRole: 'PARENT', senderName: 'Mona Haddad' }), ME)).toBe('Mona: Yes, thicker is right.')
    expect(rowPreview(last({ deleted: true, body: null }), ME)).toBe('Message removed')
    expect(rowPreview(last({ kind: 'system', body: 'Office Admin joined the conversation' }), ME)).toBe('Office Admin joined the conversation')
    expect(rowPreview({ lastMessage: null }, ME)).toBe('')
  })

  it('knows what is unread', () => {
    expect(isUnread({ unreadCount: 2 })).toBe(true)
    expect(isUnread({ unreadCount: 0 })).toBe(false)
  })

  it('shows the person the thread was written to, else the class lead', () => {
    const item: Pick<ConversationItem, 'teacherId' | 'leadTeacherName' | 'leadTeacherAvatar'> = {
      teacherId: 't2', leadTeacherName: 'Lina Farouk', leadTeacherAvatar: null,
    }
    expect(rowTeacher(item, [teacher(), teacher({ userId: 't2', name: 'Sami Kareem' })]).name).toBe('Sami Kareem')
    expect(rowTeacher(item, [teacher()]).name).toBe('Lina Farouk')
    expect(rowTeacher(item, null).name).toBe('Lina Farouk')
    expect(rowTeacher({ ...item, leadTeacherName: null }, null).name).toBe('Your teacher')
  })

  it('counts the badge in conversations', () => {
    expect(messagesBadgeCount({ unreadConversations: 3 })).toBe(3)
    expect(messagesBadgeCount({})).toBe(0)
    expect(messagesBadgeCount(null)).toBe(0)
  })
})

describe('a new message', () => {
  const targets = {
    teachers: [
      teacher(),
      teacher({ userId: 't2', name: 'Sami Kareem', classes: [{ classId: 'c-math', subject: 'Math' }, { classId: 'c-cs', subject: 'Computer Studies' }] }),
      teacher({ userId: 't3', name: 'Homeroom Teacher', classes: [] }),
    ],
  }

  it('lists the classes under a teacher', () => {
    expect(teacherClassesLine(targets.teachers[1])).toBe('Math · Computer Studies')
    expect(teacherClassesLine(targets.teachers[2])).toBe('Homeroom')
    expect(teacherClassesLine({ classes: [{ classId: 'a', subject: 'Math' }, { classId: 'b', subject: 'Math' }] })).toBe('Math')
  })

  it('opens on the teacher and class the link names', () => {
    expect(resolveCompose(targets, 't2', 'c-cs')).toEqual({ teacher: targets.teachers[1], classId: 'c-cs' })
  })

  it('uses the teacher\'s first class when none (or a wrong one) is named', () => {
    expect(resolveCompose(targets, 't2', null).classId).toBe('c-math')
    expect(resolveCompose(targets, 't2', 'c-sci').classId).toBe('c-math')
    expect(resolveCompose(targets, 't3', 'c-sci')).toEqual({ teacher: targets.teachers[2], classId: null })
  })

  it('finds the teacher of a class when only the class is named', () => {
    expect(resolveCompose(targets, null, 'c-cs').teacher?.userId).toBe('t2')
  })

  it('picks nobody for a teacher who is not the student\'s', () => {
    expect(resolveCompose(targets, 'someone-else', 'c-sci')).toEqual({ teacher: null, classId: null })
    expect(resolveCompose(null, 't1', null)).toEqual({ teacher: null, classId: null })
    expect(resolveCompose(targets, null, null)).toEqual({ teacher: null, classId: null })
  })

  it('opens the form on the URL: compose on, thread off, teacher and class as named', () => {
    expect(composePatch()).toEqual({ compose: '1', thread: null, teacher: null, class: null })
    expect(composePatch({ teacherId: 't1', classId: 'c1' })).toEqual({ compose: '1', thread: null, teacher: 't1', class: 'c1' })
  })

  it('says who will be in the conversation too', () => {
    expect(guardiansNote([{ name: 'Mona Haddad' }, { name: 'Sami Haddad' }])).toBe(
      'Mona Haddad and Sami Haddad (your parents) will be in this conversation too.',
    )
    expect(guardiansNote([{ name: 'Mona Haddad' }])).toBe('Mona Haddad (your parent) will be in this conversation too.')
    expect(guardiansNote([])).toMatch(/aren't on SchoolMule yet/)
  })

  it('asks for what is missing, in order', () => {
    const ok = { teacherId: 't1', subject: 'Plant cells', body: 'Is the wall thicker?' }
    expect(newMessageProblem(ok)).toBeNull()
    expect(newMessageProblem({ ...ok, teacherId: null })).toBe('Pick who to write to.')
    expect(newMessageProblem({ ...ok, subject: '  ' })).toBe('Say what it is about.')
    expect(newMessageProblem({ ...ok, body: ' ' })).toBe('Write your message.')
    expect(newMessageProblem({ ...ok, subject: 'x'.repeat(SUBJECT_MAX + 1) })).toMatch(/Keep what it is about/)
    expect(newMessageProblem({ ...ok, body: 'x'.repeat(BODY_MAX + 1) })).toMatch(/Keep your message/)
    expect(newMessageProblem({ ...ok, subject: 'x'.repeat(SUBJECT_MAX), body: 'x'.repeat(BODY_MAX) })).toBeNull()
  })
})
