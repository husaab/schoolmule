// src/services/classroomService.ts
// The teacher's classroom API (/api/classroom). Staff only; every class route
// checks that the caller teaches the class (or is an admin of its school).

import apiClient from './apiClient'
import apiUpload from './apiUpload'
import { postForPdf } from '@/lib/pdfDownload'
import { readSkipped } from '@/lib/studentAccounts'
import type { AvatarSpec } from './types/profile'
import type {
  ClassArchiveResult,
  ClassCardsData,
  ClassIdentityPatch,
  ClassIdentityResult,
  ClassOptions,
  ClassOptionsResult,
  ClassPageData,
  ClassPeopleData,
  ClassStreamData,
  ClassroomEnvelope,
  StudentAvatarResult,
} from './types/classroom'

const classPath = (classId: string) => `/classroom/classes/${encodeURIComponent(classId)}`

/**
 * GET classes: the caller's class cards for the selected year (a teacher's
 * own classes, every class for an admin) with To review, Coming up and Drafts
 * & scheduled. Archived classes are left out unless `archived` is true.
 */
export const getClassCards = ({ archived = false }: { archived?: boolean } = {}) =>
  apiClient<ClassroomEnvelope<ClassCardsData>>(`/classroom/classes${archived ? '?archived=1' : ''}`)

/** GET one class: the header card with options, teachers, permissions and school settings. Archived classes open too. */
export const getClassPage = (classId: string) => apiClient<ClassroomEnvelope<ClassPageData>>(classPath(classId))

/**
 * PATCH identity: a field left out is untouched, a field set to null goes
 * back to the subject default, and any bannerKey (null included) drops an
 * uploaded banner.
 */
export const updateClassIdentity = (classId: string, patch: ClassIdentityPatch) =>
  apiClient<ClassroomEnvelope<ClassIdentityResult>, ClassIdentityPatch>(`${classPath(classId)}/identity`, {
    method: 'PATCH',
    body: patch,
  })

/** POST banner (multipart "banner"; JPEG, PNG or WebP, 3 MB at most). Replaces any library pick. */
export const uploadClassBanner = (classId: string, banner: Blob, fileName = 'banner.jpg') => {
  const form = new FormData()
  form.append('banner', banner, fileName)
  return apiUpload<ClassroomEnvelope<ClassIdentityResult>>(`${classPath(classId)}/banner`, form)
}

/** DELETE banner: back to the subject's banner. */
export const removeClassBanner = (classId: string) =>
  apiClient<ClassroomEnvelope<ClassIdentityResult>>(`${classPath(classId)}/banner`, { method: 'DELETE' })

/** POST identity/reset: banner, icon and color all back to the subject default. */
export const resetClassIdentity = (classId: string) =>
  apiClient<ClassroomEnvelope<ClassIdentityResult>>(`${classPath(classId)}/identity/reset`, { method: 'POST' })

/** PATCH options: only the options sent change. */
export const updateClassOptions = (classId: string, options: Partial<ClassOptions>) =>
  apiClient<ClassroomEnvelope<ClassOptionsResult>, Partial<ClassOptions>>(`${classPath(classId)}/options`, {
    method: 'PATCH',
    body: options,
  })

export const archiveClass = (classId: string) =>
  apiClient<ClassroomEnvelope<ClassArchiveResult>>(`${classPath(classId)}/archive`, { method: 'POST' })

export const unarchiveClass = (classId: string) =>
  apiClient<ClassroomEnvelope<ClassArchiveResult>>(`${classPath(classId)}/unarchive`, { method: 'POST' })

/** PUT a student's avatar for a child with no login to pick with (null = neutral). */
export const setStudentAvatar = (classId: string, studentId: string, avatar: AvatarSpec | null) =>
  apiClient<ClassroomEnvelope<StudentAvatarResult>, { avatar: AvatarSpec | null }>(
    `${classPath(classId)}/students/${encodeURIComponent(studentId)}/avatar`,
    { method: 'PUT', body: { avatar } },
  )

/**
 * GET stream: the class's own announcements (with guardian and student seen
 * counts), live classwork notices, what is coming up and how many students
 * and guardians a new post would email.
 */
export const getClassStream = (classId: string) => apiClient<ClassroomEnvelope<ClassStreamData>>(`${classPath(classId)}/stream`)

/** GET people: the class's teachers and students with login status, parents, missing work and last active. */
export const getClassPeople = (classId: string) => apiClient<ClassroomEnvelope<ClassPeopleData>>(`${classPath(classId)}/people`)

const studentPath = (classId: string, studentId: string) => `${classPath(classId)}/students/${encodeURIComponent(studentId)}`

/** POST resend-invite: the invite email again, for a student on the class roster whose invite is still open. */
export const resendStudentInvite = (classId: string, studentId: string) =>
  apiClient<ClassroomEnvelope<{ sent: true }>>(`${studentPath(classId, studentId)}/resend-invite`, { method: 'POST' })

/** POST reset-password: a fresh 7-day password link to the student's own email; older links stop working. */
export const resetStudentPassword = (classId: string, studentId: string) =>
  apiClient<ClassroomEnvelope<{ sent: true }>>(`${studentPath(classId, studentId)}/reset-password`, { method: 'POST' })

/**
 * POST qr-cards.pdf for students on the class roster and save the PDF.
 * Printing always reissues: each printed card voids that student's older one.
 * Resolves to how many students got no card (and, for a short list, which).
 */
export const printClassQrCards = async (classId: string, studentIds: string[], filename = 'student-cards.pdf') => {
  const headers = await postForPdf(`${classPath(classId)}/qr-cards.pdf`, { studentIds }, filename)
  return readSkipped(headers)
}
