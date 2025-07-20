// src/services/types/reportCard.ts

export interface ReportCardFeedbackPayload {
  studentId: string
  classId: string
  term: string
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


export type ReportCardBulkGenerateRequest = {
  studentIds: string[];
  term: string;
};

export type ReportCardBulkGenerateResponse = {
  status: 'completed';
  term: string;
  generated: {
    studentId: string;
    message: string;
  }[];
  failed: {
    studentId: string;
    error: string;
  }[];
};

export type ReportCardStatusResponse = {
  status: 'success';
  data: {
    student_id: string;
    term: string;
    student_name: string;
    file_path: string;
    generated_at: string;
    grade: string;
  }[];
};
