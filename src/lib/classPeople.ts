// src/lib/classPeople.ts
// The words, filters and menu rules of the class People tab (the Teacher-People
// board). Pure, so it is unit-tested (classPeople.test.ts); the components
// only render what these decide.

import { gradeShort } from '@/lib/classesHome'
import type { ClassPageTeacher, PeopleParent, PeopleStudent } from '@/services/types/classroom'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// ---------------------------------------------------------------------------
// Teachers

/** "Lead teacher · homeroom Grade 5", "Lead teacher", "Co-teacher". */
export function teacherRoleLine(teacher: Pick<ClassPageTeacher, 'role' | 'homeroomGrade'>): string {
  const role = teacher.role === 'lead' ? 'Lead teacher' : 'Co-teacher'
  return teacher.homeroomGrade ? `${role} · homeroom ${gradeShort(teacher.homeroomGrade)}` : role
}

// ---------------------------------------------------------------------------
// Students

/** "Farah Khan", "Tariq Hussain and Samira Hussain", "A, B and C"; empty when none are on file. */
export function parentsText(parents: Pick<PeopleParent, 'name'>[]): string {
  const names = parents.map((p) => p.name).filter(Boolean)
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** The chip filter (?filter=): everyone, students who have not signed in yet, or students with missing work. */
export type PeopleFilter = '' | 'not-signed-in' | 'missing'

export const PEOPLE_FILTERS: readonly PeopleFilter[] = ['', 'not-signed-in', 'missing']

/** The filter a ?filter= value names; anything else is All. */
export const parsePeopleFilter = (value: string | null | undefined): PeopleFilter =>
  value === 'not-signed-in' || value === 'missing' ? value : ''

/** Invited or not yet invited: the student has not got into SchoolMule yet. */
export const isNotSignedIn = (student: Pick<PeopleStudent, 'account'>): boolean =>
  student.account.status === 'not_invited' || student.account.status === 'invited'

/** Students matching a chip and a search of student or parent names (case-insensitive). */
export function filterPeople(students: PeopleStudent[], { filter, q }: { filter: PeopleFilter; q: string }): PeopleStudent[] {
  const term = q.trim().toLowerCase()
  return students.filter((s) => {
    if (filter === 'not-signed-in' && !isNotSignedIn(s)) return false
    if (filter === 'missing' && s.missingCount <= 0) return false
    if (!term) return true
    return s.name.toLowerCase().includes(term) || s.parents.some((p) => p.name.toLowerCase().includes(term))
  })
}

export interface PeopleChipCounts {
  all: number
  notSignedIn: number
  missing: number
}

export const chipCounts = (students: PeopleStudent[]): PeopleChipCounts => ({
  all: students.length,
  notSignedIn: students.filter(isNotSignedIn).length,
  missing: students.filter((s) => s.missingCount > 0).length,
})

/** The students "Invite N students" is about: eligible and not invited yet. */
export const inviteCandidates = (students: PeopleStudent[]): PeopleStudent[] =>
  students.filter((s) => s.account.status === 'not_invited')

// ---------------------------------------------------------------------------
// The row menu

export type StudentMenuAction = 'view' | 'message' | 'resend_invite' | 'reset_password' | 'print_qr' | 'change_avatar'

export const STUDENT_MENU_LABELS: Record<StudentMenuAction, string> = {
  view: 'View student',
  message: 'Message parents',
  resend_invite: 'Resend invite',
  reset_password: 'Reset password',
  print_qr: 'Print QR card',
  change_avatar: 'Change avatar',
}

/**
 * The actions a student's ⋮ offers, in menu order: view and message for
 * everyone; resend while an invite is open; reset once the login is active;
 * a QR card when the grade and login allow one; and an avatar the teacher
 * picks for a child who has not got a working login to pick their own with.
 * On a class that is read-only (a teacher looking at a past school year's class,
 * `canEdit` false) the account actions are left out; viewing and messaging stay.
 */
export function studentMenuActions(student: Pick<PeopleStudent, 'account'>, canEdit = true): StudentMenuAction[] {
  const { status, qrEligible, signInMethod } = student.account
  const actions: StudentMenuAction[] = ['view', 'message']
  if (!canEdit) return actions
  // A student who only signs in with the QR card has no password yet: the invite is how they set one up.
  const cardOnly = status === 'active' && signInMethod === 'card'
  if (status === 'invited' || cardOnly) actions.push('resend_invite')
  if (status === 'active' && !cardOnly) actions.push('reset_password')
  if (qrEligible) actions.push('print_qr')
  if (status !== 'active') actions.push('change_avatar')
  return actions
}

/** The toast after printing one student's QR card. */
export function qrPrintedMessage(skipped: number): string {
  return skipped > 0
    ? "This student has no card to print: they need an invited or active login in a QR grade."
    : 'QR card printed. Older cards for this student no longer work.'
}

/** "Invite 3 students" */
export const inviteButtonText = (count: number): string => `Invite ${plural(count, 'student', 'students')}`

/** The line under the avatar picker's title: who picks, and until when this is the one everyone sees. */
export function avatarPickerSubtitle(student: Pick<PeopleStudent, 'name' | 'account'>): string {
  const first = student.name.trim().split(/\s+/)[0] || student.name
  return student.account.status === 'not_eligible'
    ? `${first} is in a grade that does not sign in, so you choose the avatar everyone sees.`
    : `Until ${first} signs in and picks one, this is the avatar everyone sees.`
}
