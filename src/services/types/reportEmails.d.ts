// src/services/types/reportEmails.d.ts

export interface ReportEmailRecord {
  id: string;
  reportType: 'progress_report' | 'report_card';
  studentId: string;
  term: string;
  sentBy?: string;
  emailAddresses: string[];
  customHeader?: string;
  customMessage?: string;
  filePath?: string;
  sentAt: string;
  ccAddresses?: string[];
  school?: string;
  studentName?: string; // From joined queries
  sentByUsername?: string; // From joined queries
}

export interface SendReportEmailPayload {
  reportType: 'progress_report' | 'report_card';
  studentId: string;
  term: string;
  emailAddresses: string[];
  ccAddresses?: string[];
  customHeader?: string;
  customMessage?: string;
}

export interface SendBulkReportEmailPayload {
  reportType: 'progress_report' | 'report_card';
  studentIds: string[];
  term: string;
  emailConfig: {
    emailAddresses: string[];
    ccAddresses?: string[];
    customHeader?: string;
    customMessage?: string;
  };
}

export interface ReportEmailResponse {
  status: string;
  message: string;
  data?: {
    id: string;
    sentAt: string;
    emailId?: string;
  };
}

export interface BulkReportEmailResponse {
  status: 'completed';
  term: string;
  reportType: 'progress_report' | 'report_card';
  sent: {
    studentId: string;
    message: string;
    data?: {
      id: string;
      sentAt: string;
      emailId?: string;
    };
  }[];
  failed: {
    studentId: string;
    error: string;
  }[];
}

export interface ReportEmailHistoryResponse {
  status: string;
  data: ReportEmailRecord[];
  message?: string;
}

export interface StudentEmailHistoryResponse {
  status: string;
  data: ReportEmailRecord[];
  message?: string;
}