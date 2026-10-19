// src/lib/studentMessages.ts
// The words and rules of the student's Messages page (Student-Messages board):
// how a time reads in a thread and in the list, who each person is called, the
// "your parents are in every conversation" line, what a new message needs, and
// which teacher and class a "Message {teacher}" link points at. Pure, so it is
// unit-tested (studentMessages.test.ts); the components only render what these
// decide. Times are the school's (Toronto). Copy names people, never "he/she".

import { daysFromToday, firstNameOf, joinNames, timeText, weekday } from '@/lib/classroomText'
import { shortDate, torontoDateKey } from '@/lib/studentAccounts'
import type {
  ConversationItem,
  Message,
  Participant,
  StudentMessageTargets,
  StudentTargetTeacher,
} from '@/services/types/messaging'

/** A student may change or take back their own message for this long (the server's window). */
export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000

export const SUBJECT_MAX = 120
export const BODY_MAX = 5000

/** True while a message can still be edited or deleted by the student who wrote it. */
export const canChangeOwnMessage = (m: Pick<Message, 'senderId' | 'kind' | 'deletedAt' | 'createdAt'>, userId: string, now: Date = new Date()): boolean =>
  m.kind === 'message' && !m.deletedAt && m.senderId === userId && now.getTime() - Date.parse(m.createdAt) < MESSAGE_EDIT_WINDOW_MS

// ---------------------------------------------------------------------------
// Times

/** In a thread, under a bubble: "Today 6:40 pm", "Yesterday 6:40 pm", "Thu 6:40 pm", "Oct 8, 6:40 pm". */
export function messageWhen(iso: string, now: Date = new Date()): string {
  const key = torontoDateKey(new Date(iso))
  const days = daysFromToday(key, now)
  const time = timeText(iso)
  if (days === 0) return `Today ${time}`
  if (days === -1) return `Yesterday ${time}`
  if (days < 0 && days > -7) return `${weekday(key, 'short')} ${time}`
  return `${shortDate(iso, now)}, ${time}`
}

/** On a list row: the time today, "Yesterday", the weekday this past week, otherwise "Oct 9". */
export function listWhen(iso: string, now: Date = new Date()): string {
  const key = torontoDateKey(new Date(iso))
  const days = daysFromToday(key, now)
  if (days === 0) return timeText(iso)
  if (days === -1) return 'Yesterday'
  if (days < 0 && days > -7) return weekday(key, 'short')
  return shortDate(iso, now)
}

// ---------------------------------------------------------------------------
// People

const lower = (s: string | null | undefined): string => (s ?? '').trim().toLowerCase()

/** "Mona Haddad · mother" for a guardian with a relation, else the plain name. */
export const parentLabel = (name: string, relation: string | null | undefined): string =>
  lower(relation) && lower(relation) !== 'student' ? `${name} · ${lower(relation)}` : name

/** Who a message is from, as written under the bubble: "You", "Lina Farouk", "Mona Haddad · mother". */
export function senderLabel(m: Pick<Message, 'senderId' | 'senderName' | 'senderRole' | 'senderRelation'>, userId: string): string {
  if (m.senderId && m.senderId === userId) return 'You'
  if (m.senderRole === 'PARENT') return parentLabel(m.senderName, m.senderRelation)
  return m.senderName
}

/**
 * One chip of the participants strip: "Lina Farouk · teacher", "You",
 * "Mona Haddad · mother". An admin is a teacher when they are who the thread
 * was written to; any other staff member who stepped in is "school staff".
 */
export function participantLabel(p: Pick<Participant, 'userId' | 'name' | 'role' | 'relation'>, userId: string, teacherId: string | null): string {
  if (p.userId === userId) return 'You'
  if (p.role === 'PARENT') return parentLabel(p.name, p.relation)
  if (p.role === 'TEACHER' || (p.role === 'ADMIN' && p.userId === teacherId)) return `${p.name} · teacher`
  if (p.role === 'ADMIN') return `${p.name} · school staff`
  return p.name
}

/** The strip's order: the teachers, then You, then the parents. */
export function orderParticipants<T extends Pick<Participant, 'userId' | 'role'>>(people: T[], userId: string): T[] {
  const rank = (p: T): number => (p.userId === userId ? 1 : p.role === 'PARENT' ? 2 : p.role === 'STUDENT' ? 3 : 0)
  return people.map((p, i) => ({ p, i })).sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i).map((x) => x.p)
}

// ---------------------------------------------------------------------------
// A thread

/** Under the title: "about an assignment" for a thread on one piece of work, else "general". */
export const threadKind = (classworkItemId: string | null | undefined): string => (classworkItemId ? 'about an assignment' : 'general')

/** The line under a thread's title: "Science · about an assignment". */
export const threadSubline = (item: Pick<ConversationItem, 'classSubject' | 'classworkItemId'>): string =>
  `${item.classSubject || 'Homeroom'} · ${threadKind(item.classworkItemId)}`

/**
 * The line in the indigo banner. Parents are in every thread, so it says so
 * plainly; it never claims it when no parent is in the thread (a school can keep
 * messages about work from parents, and a parent may not have an account yet).
 */
export function parentsBanner(participants: Pick<Participant, 'role'>[], classworkItemId: string | null | undefined): string {
  if (participants.some((p) => p.role === 'PARENT')) {
    return 'Your parents are in every conversation with your teachers. They can read and reply.'
  }
  if (classworkItemId) return 'This conversation is between you and your teachers.'
  return "Your parents aren't on SchoolMule yet. When their accounts are linked, they will be in every conversation with your teachers."
}

/** A list row's preview: "You: …", "Mona: …", "Lina Farouk: …". */
export function rowPreview(item: Pick<ConversationItem, 'lastMessage'>, userId: string): string {
  const last = item.lastMessage
  if (!last) return ''
  if (last.deleted) return 'Message removed'
  const body = last.body ?? ''
  if (last.kind === 'system') return body
  if (last.senderId && last.senderId === userId) return `You: ${body}`
  const who = last.senderRole === 'PARENT' ? firstNameOf(last.senderName) : last.senderName
  return who ? `${who}: ${body}` : body
}

/** Whether a thread has something the student has not read. */
export const isUnread = (item: Pick<ConversationItem, 'unreadCount'>): boolean => item.unreadCount > 0

/**
 * The teacher a list row is about: the person the thread was written to when the
 * student's teachers include them, else the class's lead (whose name the row carries).
 */
export function rowTeacher(
  item: Pick<ConversationItem, 'teacherId' | 'leadTeacherName' | 'leadTeacherAvatar'>,
  teachers: StudentTargetTeacher[] | null,
): { name: string; avatar: StudentTargetTeacher['avatar'] } {
  const chosen = item.teacherId ? teachers?.find((t) => t.userId === item.teacherId) : undefined
  if (chosen) return { name: chosen.name, avatar: chosen.avatar }
  return { name: item.leadTeacherName ?? 'Your teacher', avatar: item.leadTeacherAvatar ?? null }
}

// ---------------------------------------------------------------------------
// A new message

/** "Science · Computer Studies" under a teacher's name; "Homeroom" for a teacher with no class. */
export function teacherClassesLine(teacher: Pick<StudentTargetTeacher, 'classes'>): string {
  const subjects = [...new Set(teacher.classes.map((c) => c.subject).filter(Boolean))]
  return subjects.length > 0 ? subjects.join(' · ') : 'Homeroom'
}

export interface ComposeChoice {
  teacher: StudentTargetTeacher | null
  /** The class the message is about; null when the teacher has none (a homeroom teacher) or none is chosen yet. */
  classId: string | null
}

/**
 * Who a new message is for, from the link's `teacher` and `class`. A class that
 * is not one of that teacher's is ignored; a class with no teacher picks the
 * first teacher of it. A teacher with one class gets it; a teacher of several
 * of the student's classes gets none until the student chooses (smoke S7: a
 * Science question was filed under Math, the first class).
 */
export function resolveCompose(targets: Pick<StudentMessageTargets, 'teachers'> | null, teacherId: string | null, classId: string | null): ComposeChoice {
  const teachers = targets?.teachers ?? []
  const teacher =
    (teacherId ? teachers.find((t) => t.userId === teacherId) : undefined) ??
    (classId && !teacherId ? teachers.find((t) => t.classes.some((c) => c.classId === classId)) : undefined) ??
    null
  if (!teacher) return { teacher: null, classId: null }
  const wanted = classId && teacher.classes.some((c) => c.classId === classId) ? classId : null
  return { teacher, classId: wanted ?? (teacher.classes.length === 1 ? teacher.classes[0].classId : null) }
}

/** The student still has to say which of this teacher's classes the message is about. */
export const needsClassChoice = (choice: ComposeChoice): boolean => Boolean(choice.teacher && choice.teacher.classes.length > 1 && !choice.classId)

/** The note above Send: who else will be in the conversation. */
export function guardiansNote(guardians: { name: string }[]): string {
  const names = joinNames(guardians.map((g) => g.name).filter(Boolean))
  if (!names) return "Your parents aren't on SchoolMule yet, so only your teacher will see this. They'll be in your conversations once their accounts are linked."
  return `${names} (${guardians.length === 1 ? 'your parent' : 'your parents'}) will be in this conversation too.`
}

export interface NewMessageDraft {
  teacherId: string | null
  /** The teacher teaches several of the student's classes and none is chosen yet. */
  needsClass?: boolean
  subject: string
  body: string
}

/** Why a new message cannot be sent yet, or null when it can. */
export function newMessageProblem(draft: NewMessageDraft): string | null {
  if (!draft.teacherId) return 'Pick who to write to.'
  if (draft.needsClass) return 'Pick which class it is about.'
  const subject = draft.subject.trim()
  if (!subject) return 'Say what it is about.'
  if (subject.length > SUBJECT_MAX) return `Keep what it is about to ${SUBJECT_MAX} letters.`
  const body = draft.body.trim()
  if (!body) return 'Write your message.'
  if (body.length > BODY_MAX) return `Keep your message to ${BODY_MAX} letters.`
  return null
}

/**
 * The URL change that opens the new-message form (and closes any open thread),
 * optionally on a teacher and class. `compose`, `teacher` and `class` are the
 * page's momentary params.
 */
export const composePatch = (opts: { teacherId?: string | null; classId?: string | null } = {}): Record<string, string | null> => ({
  compose: '1',
  thread: null,
  teacher: opts.teacherId ?? null,
  class: opts.classId ?? null,
})

/** The student's own number for the Messages badge: how many conversations have something unread. */
export const messagesBadgeCount = (summary: { unreadConversations?: number } | null | undefined): number =>
  Math.max(0, Math.floor(summary?.unreadConversations ?? 0))
