import type { LastMessage, Message, Participant, SenderRole } from '@/services/types/messaging'

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** "2:14 PM" */
export const formatTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })
}

/** "Today" / "Yesterday" / "Oct 3" / "Oct 3, 2025" */
export const formatDayLabel = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (sameDay(d, now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

/** Compact stamp for list rows: time today, weekday this week, else a date. */
export const formatListStamp = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (sameDay(d, now)) return formatTime(iso)
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays < 7) return d.toLocaleDateString('en-CA', { weekday: 'short' })
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

/** "1.2 MB" */
export const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** "Layla Test (Mother)" for guardians, "Amal Haddad (Student)" for a student, plain name for staff. */
export const displayName = (p: { name: string; role: SenderRole; relation?: string | null }) =>
  p.role === 'STUDENT' ? `${p.name} (Student)` : p.role === 'PARENT' && p.relation ? `${p.name} (${p.relation})` : p.name

/** Who a message is from, as written under it: the same labels as displayName. */
export const senderLabelOf = (m: Pick<Message, 'senderName' | 'senderRole' | 'senderRelation'>): string =>
  displayName({ name: m.senderName, role: m.senderRole, relation: m.senderRelation })

/** Which bubble colour a message from someone else gets: the student's, a parent's, or the plain one. */
export const bubbleKind = (m: Pick<Message, 'senderRole'>): 'student' | 'parent' | 'other' =>
  m.senderRole === 'STUDENT' ? 'student' : m.senderRole === 'PARENT' ? 'parent' : 'other'

const firstNameOrFull = (p: Pick<Participant, 'role' | 'name'>) =>
  p.role === 'PARENT' || p.role === 'STUDENT' ? p.name.split(' ')[0] : p.name

/** "Amal and Mona", "Amal, Mona and 2 more": guardians and students by first name, staff in full. */
const namesOf = (people: Pick<Participant, 'role' | 'name'>[]): string => {
  const names = people.map(firstNameOrFull)
  if (names.length <= 2) return names.join(' and ')
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
}

/** One line naming who else is in the thread, for headers and the composer. */
export const othersLabel = (participants: Participant[], myId: string | null) =>
  namesOf(participants.filter((p) => p.userId !== myId))

/**
 * The composer's line about where a message goes. Only the others who get the
 * email digest are "emailed": a student is not named there, because a student
 * is emailed only when the school's student-email setting covers their grade
 * and a thread does not say so. The student is told instead that they will see
 * it in SchoolMule (which is always true: they are in the thread).
 */
export const recipientsLabel = (participants: Participant[], myId: string | null): string => {
  const others = participants.filter((p) => p.userId !== myId)
  const emailed = others.filter((p) => p.role !== 'STUDENT')
  const students = others.filter((p) => p.role === 'STUDENT')
  const parts: string[] = []
  if (emailed.length > 0) parts.push(`${namesOf(emailed)} will be emailed`)
  if (students.length > 0) parts.push(`${namesOf(students)} will see it in SchoolMule`)
  return parts.join(' · ')
}

/** True when the family side of a thread is the student alone (no guardian account is in it). */
export const parentsAbsent = (participants: Pick<Participant, 'role'>[]): boolean =>
  !participants.some((p) => p.role === 'PARENT')

/**
 * What a list row's second line says about the thread: the class for an
 * assessment thread; for a general one, who it is with and what it is about
 * ("General", "About an assignment", or the student's own message).
 */
export const generalKindLabel = (item: { classworkItemId?: string | null; includesStudent?: boolean }): string =>
  item.classworkItemId ? 'About an assignment' : item.includesStudent ? 'Student message' : 'General'

/**
 * The words before a list row's preview: "You: " for the viewer's own side
 * (staff), "Amal: " when the student wrote (staff and parents read whose it
 * is), nothing otherwise.
 */
export const previewPrefix = (last: Pick<LastMessage, 'senderRole' | 'senderName'>, viewerRole: SenderRole): string => {
  if (last.senderRole === 'STUDENT') return viewerRole === 'STUDENT' ? 'You: ' : `${last.senderName.split(' ')[0]}: `
  return last.senderRole === viewerRole && last.senderRole !== 'PARENT' ? 'You: ' : ''
}

export const isImage = (mimeType: string) => mimeType.startsWith('image/')

/** Mirrors the backend allow-list so a rejected file never leaves the browser. */
export const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}
export const ACCEPT_ATTR = Object.keys(ALLOWED_EXTENSIONS).join(',')
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_FILES = 5
export const MAX_BODY = 5000

/** Returns a human reason when a file must be refused, else null. */
export const fileProblem = (file: File): string | null => {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  const allowed = ALLOWED_EXTENSIONS[ext]
  if (!allowed || (file.type && !allowed.includes(file.type))) {
    return `${file.name}: only images, PDF and Word documents are allowed`
  }
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 10 MB`
  return null
}

/** The family side of a thread: a guardian or the student. */
export const isFamilyRole = (role: SenderRole | null | undefined): boolean => role === 'PARENT' || role === 'STUDENT'

/** Who wrote last, in one word for the admin's table: "Parent", "Student" or "Staff". */
export const lastSenderWord = (role: SenderRole): 'Parent' | 'Student' | 'Staff' =>
  role === 'PARENT' ? 'Parent' : role === 'STUDENT' ? 'Student' : 'Staff'

/**
 * Whose turn it is in an open thread, for the admin's table: a family
 * member (parent or student) wrote last, so the school owes an answer
 * ("teacher"); staff wrote last, so the family does ("student" when the
 * student is in the thread, else "parent").
 */
export const waitingOn = (last: Pick<LastMessage, 'senderRole'> | null, withStudent: boolean): 'teacher' | 'parent' | 'student' | null =>
  !last ? null : isFamilyRole(last.senderRole) ? 'teacher' : withStudent ? 'student' : 'parent'
