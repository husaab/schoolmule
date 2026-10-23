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

import type { DeliveryStudent, DeliveryStatus } from './assessmentPublication';

/**
 * What a send (one student or many) answers: it is queued, and its emails go
 * out from the server's queue at once; follow it with getReportEmailRun.
 */
export interface ReportEmailQueuedResponse {
  status: 'queued';
  runId: string;
  reportType: 'progress_report' | 'report_card';
  term: string;
  message?: string;
  /** Students: queued (at least one email waiting), skipped (no report, no address, already being sent). */
  summary: { total: number; queued: number; skipped: number };
}

/** A server from before the email queue: sent inside the request. */
export interface ReportEmailSentResponse {
  status: string;
  message: string;
  data?: {
    id: string;
    sentAt: string;
    emailId?: string;
  };
}

export type ReportEmailResponse = ReportEmailQueuedResponse | ReportEmailSentResponse;

/** One send, student by student (the same shape as a publish's emails). */
export interface ReportEmailRun {
  runId: string;
  reportType: 'progress_report' | 'report_card';
  term: string;
  /** 'guardians': the parents on file; 'chosen': the addresses typed (one student). */
  recipients: 'guardians' | 'chosen';
  studentCount: number;
  createdAt: string;
  /** Per student. */
  counts: Record<DeliveryStatus, number>;
  students: DeliveryStudent[];
}

export interface ReportEmailRunSummary {
  runId: string;
  reportType: 'progress_report' | 'report_card';
  term: string;
  recipients: 'guardians' | 'chosen';
  studentCount: number;
  createdAt: string;
  createdByName: string | null;
  counts: Record<DeliveryStatus, number>;
}

export interface ReportEmailRunResponse {
  status: string;
  data?: ReportEmailRun;
  message?: string;
}

export interface ReportEmailRunsResponse {
  status: string;
  data?: ReportEmailRunSummary[];
  message?: string;
}

export interface BulkReportEmailResult {
  studentId: string;
  studentName: string;
  status: 'success' | 'failed';
  sentTo?: string[];
  error?: string;
}

/** A server from before the email queue: the whole send ran inside the request. */
export interface BulkReportEmailSentResponse {
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

export type BulkReportEmailResponse = ReportEmailQueuedResponse | BulkReportEmailSentResponse;

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