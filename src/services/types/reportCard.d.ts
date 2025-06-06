// src/services/types/reportCard.ts

export type ReportCardTerm = 'First Term' | 'Second Term' | 'Midterm' | 'Final Term'

export interface ReportCardFeedbackPayload {
  studentId: string
  classId: string
  term: ReportCardTerm
  workHabits?: string
  behavior?: string
  comment?: string
  createdAt?: string
}

export interface ReportCardFeedbackResponse {
  status: string
  data: ReportCardFeedbackPayload | null
  message?: string
}

