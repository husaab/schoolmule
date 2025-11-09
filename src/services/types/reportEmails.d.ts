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
  bulkConfig?: {
    customHeader?: string;
    customMessage?: string;
    ccAddresses?: string[];
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

export interface BulkReportEmailResult {
  studentId: string;
  studentName: string;
  status: 'success' | 'failed';
  sentTo?: string[];
  error?: string;
}

export interface BulkReportEmailResponse {
  status: 'completed';
  term: string;
  reportType: 'progress_report' | 'report_card';
  summary: {
    total: number;
    sent: number;
    failed: number;
    duration: string;
  };
  results: BulkReportEmailResult[];
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