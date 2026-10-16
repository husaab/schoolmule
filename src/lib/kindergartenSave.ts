// src/lib/kindergartenSave.ts
// JK/SK competency grading autosaves (D17, controller ruling for T9). Each
// student's progress report or report card is saved as a whole document,
// exactly as the JK/SK Save button did: the same service calls, in the same
// order, with the same payloads (empty ratings and blank comments skipped,
// the teacher assistant always sent on the report card). Only the timing
// changed. When the page is going away (keepalive) every call is sent at
// once, so none is left waiting behind another.

import type {
  JKAssessmentEntry,
  JKDomainCommentEntry,
  JKLearningSkillEntry,
  JKProgressReportCommentEntry,
  JKTeacherAssistantPayload,
} from '@/services/types/jk'
import type {
  SKAssessmentEntry,
  SKProgressReportCommentEntry,
  SKSubjectCommentEntry,
  SKTeacherAssistantPayload,
} from '@/services/types/sk'

export type KindergartenDoc = 'progress_report' | 'report_card'

/** One student's open document, as the page holds it. */
export interface KindergartenSnapshot {
  studentId: string
  term: string
  doc: KindergartenDoc
  school: string
  assessedBy: string | null
  /** skillId (JK) or standardId (SK) → rating ('' = not rated). */
  ratings: Record<string, string>
  /** domainId (JK) or subjectId (SK) → comment. */
  comments: Record<string, string>
  /** JK report card only: skill name → rating. */
  learningSkills: Record<string, string>
  teacherAssistant: string
  /** academic_achievement / socio_emotional → comment. */
  progressComments: Record<string, string>
}

type SaveOpts = { keepalive?: boolean }
type Call = () => Promise<unknown>

export const kindergartenKey = (studentId: string, doc: KindergartenDoc) => `${studentId}|${doc}`

const filled = (value: string | undefined) => !!value && value.trim() !== ''
type Section = JKProgressReportCommentEntry['sectionType']

// Sequential, as the Save button awaited them; all at once when leaving.
async function run(calls: Call[], opts: SaveOpts) {
  if (opts.keepalive) {
    await Promise.all(calls.map((call) => call()))
    return
  }
  for (const call of calls) await call()
}

export interface JKSaveApi {
  assessments: (entries: JKAssessmentEntry[], opts: SaveOpts) => Promise<unknown>
  progressComments: (entries: JKProgressReportCommentEntry[], opts: SaveOpts) => Promise<unknown>
  domainComments: (entries: JKDomainCommentEntry[], opts: SaveOpts) => Promise<unknown>
  learningSkills: (entries: JKLearningSkillEntry[], opts: SaveOpts) => Promise<unknown>
  teacherAssistant: (payload: JKTeacherAssistantPayload, opts: SaveOpts) => Promise<unknown>
}

export function saveJKDocument(s: KindergartenSnapshot, api: JKSaveApi, opts: SaveOpts = {}): Promise<void> {
  const calls: Call[] = []
  const assessments = Object.entries(s.ratings)
    .filter(([, val]) => val !== '')
    .map(([skillId, rating]) => ({ studentId: s.studentId, skillId, term: s.term, rating, school: s.school, assessedBy: s.assessedBy }))
  if (assessments.length > 0) calls.push(() => api.assessments(assessments, opts))

  if (s.doc === 'progress_report') {
    const prComments = Object.entries(s.progressComments)
      .filter(([, val]) => filled(val))
      .map(([sectionType, comment]) => ({ studentId: s.studentId, term: s.term, sectionType: sectionType as Section, comment, school: s.school }))
    if (prComments.length > 0) calls.push(() => api.progressComments(prComments, opts))
  }

  if (s.doc === 'report_card') {
    const domainComments = Object.entries(s.comments)
      .filter(([, val]) => filled(val))
      .map(([domainId, comment]) => ({ studentId: s.studentId, domainId, term: s.term, comment, school: s.school }))
    if (domainComments.length > 0) calls.push(() => api.domainComments(domainComments, opts))

    const learningSkills = Object.entries(s.learningSkills)
      .filter(([, val]) => val !== '')
      .map(([skillName, rating]) => ({ studentId: s.studentId, term: s.term, skillName, rating, school: s.school }))
    if (learningSkills.length > 0) calls.push(() => api.learningSkills(learningSkills, opts))

    const ta = { studentId: s.studentId, teacherAssistantName: s.teacherAssistant || null, term: s.term, school: s.school }
    calls.push(() => api.teacherAssistant(ta, opts))
  }
  return run(calls, opts)
}

export interface SKSaveApi {
  assessments: (entries: SKAssessmentEntry[], opts: SaveOpts) => Promise<unknown>
  subjectComments: (entries: SKSubjectCommentEntry[], opts: SaveOpts) => Promise<unknown>
  progressComments: (entries: SKProgressReportCommentEntry[], opts: SaveOpts) => Promise<unknown>
  teacherAssistant: (payload: SKTeacherAssistantPayload, opts: SaveOpts) => Promise<unknown>
}

export function saveSKDocument(s: KindergartenSnapshot, api: SKSaveApi, opts: SaveOpts = {}): Promise<void> {
  const calls: Call[] = []
  const assessments = Object.entries(s.ratings)
    .filter(([, val]) => val !== '')
    .map(([standardId, rating]) => ({ studentId: s.studentId, standardId, term: s.term, rating, school: s.school, assessedBy: s.assessedBy }))
  if (assessments.length > 0) calls.push(() => api.assessments(assessments, opts))

  // Both documents carry per-subject comments.
  const subjectComments = Object.entries(s.comments)
    .filter(([, val]) => filled(val))
    .map(([subjectId, comment]) => ({ studentId: s.studentId, subjectId, term: s.term, comment, school: s.school }))
  if (subjectComments.length > 0) calls.push(() => api.subjectComments(subjectComments, opts))

  if (s.doc === 'progress_report') {
    const prComments = Object.entries(s.progressComments)
      .filter(([, val]) => filled(val))
      .map(([sectionType, comment]) => ({ studentId: s.studentId, term: s.term, sectionType: sectionType as Section, comment, school: s.school }))
    if (prComments.length > 0) calls.push(() => api.progressComments(prComments, opts))
  }

  if (s.doc === 'report_card') {
    const ta = { studentId: s.studentId, teacherAssistantName: s.teacherAssistant || null, term: s.term, school: s.school }
    calls.push(() => api.teacherAssistant(ta, opts))
  }
  return run(calls, opts)
}
