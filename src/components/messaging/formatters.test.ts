import { describe, it, expect } from 'vitest'
import { bubbleKind, displayName, generalKindLabel, inboxBadgeCount, inboxBadgeLabel, isFamilyRole, lastSenderWord, othersLabel, parentsAbsent, previewPrefix, recipientsLabel, senderLabelOf, waitingOn } from './formatters'
import { toneClasses } from './tones'

describe('who is who in a thread with a student', () => {
  it('labels a student, a guardian and staff', () => {
    expect(displayName({ name: 'Amal Haddad', role: 'STUDENT', relation: 'student' })).toBe('Amal Haddad (Student)')
    expect(displayName({ name: 'Mona Haddad', role: 'PARENT', relation: 'Mother' })).toBe('Mona Haddad (Mother)')
    expect(displayName({ name: 'Mona Haddad', role: 'PARENT', relation: null })).toBe('Mona Haddad')
    expect(displayName({ name: 'Lina Farouk', role: 'TEACHER', relation: null })).toBe('Lina Farouk')
  })

  it('labels the sender under a message the same way', () => {
    expect(senderLabelOf({ senderName: 'Amal Haddad', senderRole: 'STUDENT', senderRelation: null })).toBe('Amal Haddad (Student)')
    expect(senderLabelOf({ senderName: 'Mona Haddad', senderRole: 'PARENT', senderRelation: 'Mother' })).toBe('Mona Haddad (Mother)')
    expect(senderLabelOf({ senderName: 'Lina Farouk', senderRole: 'ADMIN', senderRelation: null })).toBe('Lina Farouk')
  })

  it('names the others in a composer line by first name, students and guardians alike', () => {
    const people = [
      { userId: 'me', name: 'Lina Farouk', role: 'TEACHER' as const, relation: null, invitePending: false },
      { userId: 's', name: 'Amal Haddad', role: 'STUDENT' as const, relation: 'student', invitePending: false },
      { userId: 'p', name: 'Mona Haddad', role: 'PARENT' as const, relation: 'Mother', invitePending: false },
    ]
    expect(othersLabel(people, 'me')).toBe('Amal and Mona')
    expect(othersLabel(people.slice(0, 1), 'me')).toBe('')
  })

  it('promises an email only to the people who get one, never to the student', () => {
    const person = (userId: string, name: string, role: 'TEACHER' | 'STUDENT' | 'PARENT') => ({ userId, name, role, relation: null, invitePending: false })
    const teacher = person('me', 'Lina Farouk', 'TEACHER')
    const student = person('s', 'Amal Haddad', 'STUDENT')
    const mother = person('p', 'Mona Haddad', 'PARENT')
    // A staff member writing in a student thread: the guardian is emailed, the student sees it in SchoolMule.
    expect(recipientsLabel([teacher, student, mother], 'me')).toBe('Mona will be emailed · Amal will see it in SchoolMule')
    // No guardian account: nobody is promised an email.
    expect(recipientsLabel([teacher, student], 'me')).toBe('Amal will see it in SchoolMule')
    // Threads without a student read as before.
    expect(recipientsLabel([teacher, mother], 'me')).toBe('Mona will be emailed')
    expect(recipientsLabel([teacher], 'me')).toBe('')
    // A guardian writing: the teacher is emailed, the student sees it in SchoolMule.
    expect(recipientsLabel([teacher, student, mother], 'p')).toBe('Lina Farouk will be emailed · Amal will see it in SchoolMule')
    // A staff thread with several people still names them in full.
    expect(recipientsLabel([teacher, person('t2', 'Omar Said', 'TEACHER'), person('t3', 'Sara Noor', 'TEACHER'), mother], 'me')).toBe(
      'Omar Said, Sara Noor and 1 more will be emailed',
    )
  })

  it('knows when no parent is in a thread', () => {
    expect(parentsAbsent([{ role: 'TEACHER' }, { role: 'STUDENT' }])).toBe(true)
    expect(parentsAbsent([{ role: 'TEACHER' }, { role: 'PARENT' }])).toBe(false)
  })
})

describe('bubbles', () => {
  it('colours by who wrote it', () => {
    expect(bubbleKind({ senderRole: 'STUDENT' })).toBe('student')
    expect(bubbleKind({ senderRole: 'PARENT' })).toBe('parent')
    expect(bubbleKind({ senderRole: 'TEACHER' })).toBe('other')
    expect(bubbleKind({ senderRole: 'ADMIN' })).toBe('other')
  })

  it('shows the student indigo to staff and parents', () => {
    expect(toneClasses('staff').bubbleStudent).toBe('bg-indigo-50 border border-indigo-100 text-slate-900')
    expect(toneClasses('parent').bubbleStudent).toBe('bg-indigo-50 border border-indigo-100 text-slate-900')
  })

  it('has a student look: own indigo, teachers white, parents amber', () => {
    const t = toneClasses('student')
    expect(t.bubbleMine).toBe('bg-indigo-50 border border-indigo-100 text-slate-900')
    expect(t.bubbleTheirs).toBe('bg-white border border-slate-200 text-slate-900')
    expect(t.bubbleParent).toBe('bg-amber-50 border border-amber-200 text-slate-900')
    expect(t.primary).toContain('bg-indigo-600')
  })

  it('leaves the staff and parent looks as they were for everyone else', () => {
    expect(toneClasses('staff').bubbleTheirs).toBe('bg-slate-50 border border-slate-200 text-slate-900')
    expect(toneClasses('parent').bubbleTheirs).toBe('bg-white border border-stone-200 text-slate-900')
    expect(toneClasses('staff').bubbleParent).toBe(toneClasses('staff').bubbleTheirs)
    expect(toneClasses('parent').bubbleParent).toBe(toneClasses('parent').bubbleTheirs)
  })
})

describe('list rows', () => {
  it('says what a general thread is', () => {
    expect(generalKindLabel({ classworkItemId: 'i1', includesStudent: true })).toBe('About an assignment')
    expect(generalKindLabel({ classworkItemId: null, includesStudent: true })).toBe('Student message')
    expect(generalKindLabel({ classworkItemId: null, includesStudent: false })).toBe('General')
    expect(generalKindLabel({})).toBe('General')
  })

  it('prefixes a preview: "You" for staff, the first name for a student', () => {
    expect(previewPrefix({ senderRole: 'TEACHER', senderName: 'Lina Farouk' }, 'TEACHER')).toBe('You: ')
    expect(previewPrefix({ senderRole: 'PARENT', senderName: 'Mona Haddad' }, 'PARENT')).toBe('')
    expect(previewPrefix({ senderRole: 'PARENT', senderName: 'Mona Haddad' }, 'TEACHER')).toBe('')
    expect(previewPrefix({ senderRole: 'STUDENT', senderName: 'Amal Haddad' }, 'TEACHER')).toBe('Amal: ')
    expect(previewPrefix({ senderRole: 'STUDENT', senderName: 'Amal Haddad' }, 'PARENT')).toBe('Amal: ')
    expect(previewPrefix({ senderRole: 'STUDENT', senderName: 'Amal Haddad' }, 'STUDENT')).toBe('You: ')
  })
})

describe('the admin\'s table', () => {
  it('names who wrote last', () => {
    expect(lastSenderWord('PARENT')).toBe('Parent')
    expect(lastSenderWord('STUDENT')).toBe('Student')
    expect(lastSenderWord('TEACHER')).toBe('Staff')
    expect(lastSenderWord('ADMIN')).toBe('Staff')
  })

  it('counts a student as the family side', () => {
    expect(isFamilyRole('STUDENT')).toBe(true)
    expect(isFamilyRole('PARENT')).toBe(true)
    expect(isFamilyRole('TEACHER')).toBe(false)
    expect(isFamilyRole(null)).toBe(false)
  })

  it('says whose turn it is', () => {
    expect(waitingOn({ senderRole: 'STUDENT' }, true)).toBe('teacher')
    expect(waitingOn({ senderRole: 'PARENT' }, false)).toBe('teacher')
    expect(waitingOn({ senderRole: 'TEACHER' }, false)).toBe('parent')
    expect(waitingOn({ senderRole: 'TEACHER' }, true)).toBe('student')
    expect(waitingOn(null, true)).toBeNull()
  })
})

describe('the Messages badge', () => {
  const summary = { unreadConversations: 1, unreadMessages: 4, needsReply: 2, attentionConversations: 2, unreadAnnouncements: 1 }

  it('counts threads waiting on you plus new announcements', () => {
    expect(inboxBadgeCount(summary)).toBe(3)
    expect(inboxBadgeCount({ ...summary, attentionConversations: 0, unreadAnnouncements: 0 })).toBe(0)
  })

  it('says what the number is made of, and never asks a guardian for a reply', () => {
    expect(inboxBadgeLabel(summary, false)).toBe('1 unread · 2 need your reply · 1 new announcement')
    expect(inboxBadgeLabel({ ...summary, needsReply: 1, unreadAnnouncements: 2 }, false)).toBe('1 unread · 1 needs your reply · 2 new announcements')
    expect(inboxBadgeLabel(summary, true)).toBe('1 unread · 1 new announcement')
    expect(inboxBadgeLabel({ ...summary, unreadConversations: 0, needsReply: 0, unreadAnnouncements: 0 }, false)).toBe('')
  })
})
