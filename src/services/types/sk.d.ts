// src/services/types/sk.d.ts
// Types for the SK subject-based grading system

export interface SKStandard {
  standardId: string
  name: string
  description: string | null
  sortOrder: number
}

export interface SKSubject {
  subjectId: string
  documentType: 'progress_report' | 'report_card'
  name: string
  sortOrder: number
  standards: SKStandard[]
}

export interface SKSubjectsResponse {
  status: string
  data: SKSubject[]
}

export interface SKStandardAssessment {
  id: string
  studentId: string
  standardId: string
  term: string
  rating: string | null
  assessedBy: string | null
  updatedAt: string
  standardName: string
  subjectId: string
  subjectName: string
}

export interface SKAssessmentsResponse {
  status: string
  data: SKStandardAssessment[]
}

export interface SKAssessmentEntry {
  studentId: string
  standardId: string
  term: string
  rating: string | null
  school: string
  assessedBy?: string | null
}

export interface SKBulkResponse {
  status: string
  message: string
  data: { updated: number }
}

export interface SKSubjectComment {
  id: string
  studentId: string
  subjectId: string
  term: string
  comment: string | null
  subjectName: string
  updatedAt: string
}

export interface SKSubjectCommentsResponse {
  status: string
  data: SKSubjectComment[]
}

export interface SKSubjectCommentEntry {
  studentId: string
  subjectId: string
  term: string
  comment: string | null
  school: string
}

export interface SKTeacherAssistant {
  id: string
  studentId: string
  teacherAssistantName: string | null
  term: string
}

export interface SKTeacherAssistantResponse {
  status: string
  data: SKTeacherAssistant | null
}

export interface SKTeacherAssistantPayload {
  studentId: string
  teacherAssistantName: string | null
  term: string
  school: string
}

// -- Progress Report Comments (Academic Achievement / Socio-Emotional) --

export interface SKProgressReportComment {
  id: string
  studentId: string
  term: string
  sectionType: 'academic_achievement' | 'socio_emotional'
  comment: string | null
  updatedAt: string
}

export interface SKProgressReportCommentsResponse {
  status: string
  data: SKProgressReportComment[]
}

export interface SKProgressReportCommentEntry {
  studentId: string
  term: string
  sectionType: 'academic_achievement' | 'socio_emotional'
  comment: string | null
  school: string
}

// -- Subject & Standard CRUD --

export interface SKCreateSubjectPayload {
  documentType: 'progress_report' | 'report_card'
  name: string
  sortOrder: number
  school: string
}

export interface SKUpdateSubjectPayload {
  name: string
  sortOrder: number
}

export interface SKCreateStandardPayload {
  subjectId: string
  name: string
  description?: string | null
  sortOrder: number
}

export interface SKUpdateStandardPayload {
  name: string
  description?: string | null
  sortOrder: number
}

export interface SKSubjectCrudResponse {
  status: string
  data: {
    subject_id: string
    document_type: string
    name: string
    sort_order: number
    school: string
  }
}

export interface SKStandardCrudResponse {
  status: string
  data: {
    standard_id: string
    subject_id: string
    name: string
    description: string | null
    sort_order: number
  }
}
