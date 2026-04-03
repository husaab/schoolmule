// src/services/types/jk.d.ts
// Types for the JK competency-based grading system

export interface JKSkill {
  skillId: string
  name: string
  description: string | null
  sortOrder: number
}

export interface JKDomain {
  domainId: string
  documentType: 'progress_report' | 'report_card'
  name: string
  sortOrder: number
  skills: JKSkill[]
}

export interface JKDomainsResponse {
  status: string
  data: JKDomain[]
}

export interface JKSkillAssessment {
  id: string
  studentId: string
  skillId: string
  term: string
  rating: string | null
  assessedBy: string | null
  updatedAt: string
  skillName: string
  domainId: string
  domainName: string
}

export interface JKAssessmentsResponse {
  status: string
  data: JKSkillAssessment[]
}

export interface JKAssessmentEntry {
  studentId: string
  skillId: string
  term: string
  rating: string | null
  school: string
  assessedBy?: string | null
}

export interface JKBulkResponse {
  status: string
  message: string
  data: { updated: number }
}

export interface JKLearningSkill {
  id: string
  studentId: string
  term: string
  skillName: string
  rating: string | null
  updatedAt: string
}

export interface JKLearningSkillsResponse {
  status: string
  data: JKLearningSkill[]
}

export interface JKLearningSkillEntry {
  studentId: string
  term: string
  skillName: string
  rating: string | null
  school: string
}

export interface JKDomainComment {
  id: string
  studentId: string
  domainId: string
  term: string
  comment: string | null
  domainName: string
  updatedAt: string
}

export interface JKDomainCommentsResponse {
  status: string
  data: JKDomainComment[]
}

export interface JKDomainCommentEntry {
  studentId: string
  domainId: string
  term: string
  comment: string | null
  school: string
}

export interface JKTeacherAssistant {
  id: string
  studentId: string
  teacherAssistantName: string | null
  term: string
}

export interface JKTeacherAssistantResponse {
  status: string
  data: JKTeacherAssistant | null
}

export interface JKTeacherAssistantPayload {
  studentId: string
  teacherAssistantName: string | null
  term: string
  school: string
}

// -- Progress Report Comments (Academic Achievement / Socio-Emotional) --

export interface JKProgressReportComment {
  id: string
  studentId: string
  term: string
  sectionType: 'academic_achievement' | 'socio_emotional'
  comment: string | null
  updatedAt: string
}

export interface JKProgressReportCommentsResponse {
  status: string
  data: JKProgressReportComment[]
}

export interface JKProgressReportCommentEntry {
  studentId: string
  term: string
  sectionType: 'academic_achievement' | 'socio_emotional'
  comment: string | null
  school: string
}

// -- Domain & Skill CRUD --

export interface JKCreateDomainPayload {
  documentType: 'progress_report' | 'report_card'
  name: string
  sortOrder: number
  school: string
}

export interface JKUpdateDomainPayload {
  name: string
  sortOrder: number
}

export interface JKCreateSkillPayload {
  domainId: string
  name: string
  description?: string | null
  sortOrder: number
}

export interface JKUpdateSkillPayload {
  name: string
  description?: string | null
  sortOrder: number
}

export interface JKDomainCrudResponse {
  status: string
  data: {
    domain_id: string
    document_type: string
    name: string
    sort_order: number
    school: string
  }
}

export interface JKSkillCrudResponse {
  status: string
  data: {
    skill_id: string
    domain_id: string
    name: string
    description: string | null
    sort_order: number
  }
}
