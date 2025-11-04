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
    email_sent?: boolean;
    email_sent_at?: string;
    email_sent_by?: string;
  }[];
};

export interface ReportEmailPayload {
  reportType: 'progress_report' | 'report_card';
  studentId: string;
  term: string;
  emailAddresses: string[];
  ccAddresses?: string[];
  customHeader?: string;
  customMessage?: string;
}

export interface ReportEmailResponse {
  status: string;
  message: string;
  data?: {
    id: string;
    sentAt: string;
  };
}
