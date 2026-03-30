// src/services/types/jksk.d.ts
// Types for the JK/SK competency-based grading system

export interface JKSKSkill {
  skillId: string
  name: string
  description: string | null
  sortOrder: number
}

export interface JKSKDomain {
  domainId: string
  documentType: 'progress_report' | 'report_card'
  name: string
  sortOrder: number
  skills: JKSKSkill[]
}

export interface JKSKDomainsResponse {
  status: string
  data: JKSKDomain[]
}

export interface JKSKSkillAssessment {
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

export interface JKSKAssessmentsResponse {
  status: string
  data: JKSKSkillAssessment[]
}

export interface JKSKAssessmentEntry {
  studentId: string
  skillId: string
  term: string
  rating: string | null
  school: string
  assessedBy?: string | null
}

export interface JKSKBulkResponse {
  status: string
  message: string
  data: { updated: number }
}

export interface JKSKLearningSkill {
  id: string
  studentId: string
  term: string
  skillName: string
  rating: string | null
  updatedAt: string
}

export interface JKSKLearningSkillsResponse {
  status: string
  data: JKSKLearningSkill[]
}

export interface JKSKLearningSkillEntry {
  studentId: string
  term: string
  skillName: string
  rating: string | null
  school: string
}

export interface JKSKDomainComment {
  id: string
  studentId: string
  domainId: string
  term: string
  comment: string | null
  domainName: string
  updatedAt: string
}

export interface JKSKDomainCommentsResponse {
  status: string
  data: JKSKDomainComment[]
}

export interface JKSKDomainCommentEntry {
  studentId: string
  domainId: string
  term: string
  comment: string | null
  school: string
}

export interface JKSKTeacherAssistant {
  id: string
  studentId: string
  teacherAssistantName: string | null
  term: string
}

export interface JKSKTeacherAssistantResponse {
  status: string
  data: JKSKTeacherAssistant | null
}

export interface JKSKTeacherAssistantPayload {
  studentId: string
  teacherAssistantName: string | null
  term: string
  school: string
}

// -- Progress Report Comments (Academic Achievement / Socio-Emotional) --

export interface JKSKProgressReportComment {
  id: string
  studentId: string
  term: string
  sectionType: 'academic_achievement' | 'socio_emotional'
  comment: string | null
  updatedAt: string
}

export interface JKSKProgressReportCommentsResponse {
  status: string
  data: JKSKProgressReportComment[]
}

export interface JKSKProgressReportCommentEntry {
  studentId: string
  term: string
  sectionType: 'academic_achievement' | 'socio_emotional'
  comment: string | null
  school: string
}

// -- Domain & Skill CRUD --

export interface JKSKCreateDomainPayload {
  documentType: 'progress_report' | 'report_card'
  name: string
  sortOrder: number
  school: string
}

export interface JKSKUpdateDomainPayload {
  name: string
  sortOrder: number
}

export interface JKSKCreateSkillPayload {
  domainId: string
  name: string
  description?: string | null
  sortOrder: number
}

export interface JKSKUpdateSkillPayload {
  name: string
  description?: string | null
  sortOrder: number
}

export interface JKSKDomainCrudResponse {
  status: string
  data: {
    domain_id: string
    document_type: string
    name: string
    sort_order: number
    school: string
  }
}

export interface JKSKSkillCrudResponse {
  status: string
  data: {
    skill_id: string
    domain_id: string
    name: string
    description: string | null
    sort_order: number
  }
}
