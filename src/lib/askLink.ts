// "Ask <teacher> about this" in parent emails (the backend's
// utils/parentLinks.parentAskLink): /parent/messages?tab=conversations
// &ask=<studentId>&askClass=<classId>[&askAssessment=<id>][&askAbout=<title>].
// Parent Messages reads it once, opens New message already set up for that
// child, and drops the keys. Namespaced like the student profile's keys (not
// ?class=, a filter on other pages) so every one is transient in filter
// memory (lib/filterMemory) and a remembered query never reopens it. Pure
// functions only; the React side is components/messaging/useAskLink.

import type { ParentTargets } from '@/services/types/messaging'

export const ASK_LINK_PARAMS = {
  studentId: 'ask',
  classId: 'askClass',
  assessmentId: 'askAssessment',
  about: 'askAbout',
} as const

/** A setParams patch that drops the link from the address. */
export const CLEAR_ASK_LINK: Record<string, null> = Object.fromEntries(Object.values(ASK_LINK_PARAMS).map((key) => [key, null]))

export interface AskLink {
  studentId: string
  classId: string
  assessmentId: string | null
  /** The item's name, for a General message when it can't anchor one. */
  about: string | null
}

/** New message's preset: about the shared assessment, or a General message to the class teacher. */
export interface AskPreset {
  studentId: string
  mode: 'assessment' | 'general'
  assessmentId?: string
  teacherId?: string
  classId?: string
  title?: string
}

export type AskOutcome = { kind: 'compose'; preset: AskPreset } | { kind: 'unavailable'; message: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_TITLE = 120
const MAX_ABOUT = 100

/** The link in the address, or null when there is none or it is malformed. */
export function parseAskLink(get: (key: string) => string): AskLink | null {
  const studentId = get(ASK_LINK_PARAMS.studentId)
  const classId = get(ASK_LINK_PARAMS.classId)
  const assessmentId = get(ASK_LINK_PARAMS.assessmentId) || null
  if (!UUID.test(studentId) || !UUID.test(classId) || (assessmentId !== null && !UUID.test(assessmentId))) return null
  const about = get(ASK_LINK_PARAMS.about).replace(/\s+/g, ' ').trim().slice(0, MAX_ABOUT) || null
  return { studentId, classId, assessmentId, about }
}

export const ASK_LINK_STALE =
  "This class isn't open for new messages any more, so the link can't start one. Your conversations are below."
export const ASK_LINK_SELF = 'You teach this class, so there is no one to message about it.'

/**
 * What the link opens, from what the parent may write about now (the
 * conversation targets, current-term classes only): the assessment when it
 * has been shared with parents (an existing conversation about it takes the
 * message), otherwise a General message to the class teacher titled after
 * the item. A class that is no longer offered (past term, a class change)
 * can't start anything.
 */
export function resolveAskLink(link: AskLink, targets: ParentTargets, viewerId?: string | null): AskOutcome {
  const cls = targets.classes.find((c) => c.classId === link.classId)
  if (!cls) return { kind: 'unavailable', message: ASK_LINK_STALE }
  // A teacher in parent view never writes to themself (the API refuses it).
  if (cls.teacherId && cls.teacherId === viewerId) return { kind: 'unavailable', message: ASK_LINK_SELF }
  if (link.assessmentId && cls.assessments.some((a) => a.assessmentId === link.assessmentId)) {
    return { kind: 'compose', preset: { studentId: link.studentId, mode: 'assessment', assessmentId: link.assessmentId } }
  }
  const teacher = targets.teachers.find((t) => t.userId === cls.teacherId)
  if (!teacher) return { kind: 'unavailable', message: ASK_LINK_STALE }
  const title = (link.about ? `About ${link.about}` : `Question about ${cls.subject || 'this class'}`).slice(0, MAX_TITLE)
  return { kind: 'compose', preset: { studentId: link.studentId, mode: 'general', teacherId: teacher.userId, classId: cls.classId, title } }
}
