import apiClient from "./apiClient";
import {
  SendReportEmailPayload,
  SendBulkReportEmailPayload,
  ReportEmailResponse,
  BulkReportEmailResponse,
  ReportEmailHistoryResponse,
  StudentEmailHistoryResponse
} from "./types/reportEmails";

/**
 * Send a single report email (progress report or report card)
 * POST /api/report-emails/send
 */
export const sendReportEmail = async (
  payload: SendReportEmailPayload
): Promise<ReportEmailResponse> => {
  return apiClient<ReportEmailResponse>('/report-emails/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
};

/**
 * Send bulk report emails to multiple students
 * POST /api/report-emails/send/bulk
 */
export const sendBulkReportEmails = async (
  payload: SendBulkReportEmailPayload
): Promise<BulkReportEmailResponse> => {
  return apiClient<BulkReportEmailResponse>('/report-emails/send/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
};

/**
 * Get email history for a specific student
 * GET /api/report-emails/history/student/:studentId
 */
export const getStudentEmailHistory = async (
  studentId: string
): Promise<StudentEmailHistoryResponse> => {
  return apiClient<StudentEmailHistoryResponse>(
    `/report-emails/history/student/${encodeURIComponent(studentId)}`
  );
};

/**
 * Get email history by term and school
 * GET /api/report-emails/history/term/:term/school/:school
 */
export const getEmailHistoryByTermAndSchool = async (
  term: string,
  school: string
): Promise<ReportEmailHistoryResponse> => {
  return apiClient<ReportEmailHistoryResponse>(
    `/report-emails/history/term/${encodeURIComponent(term)}/school/${encodeURIComponent(school)}`
  );
};

/**
 * Helper function to extract parent emails from student data
 * Utility to get parent email addresses from student object
 */
export const extractParentEmails = (student: { mother_email?: string; father_email?: string }): string[] => {
  const emails: string[] = [];
  
  if (student.mother_email && student.mother_email.trim()) {
    emails.push(student.mother_email.trim());
  }
  
  if (student.father_email && student.father_email.trim()) {
    emails.push(student.father_email.trim());
  }
  
  // Remove duplicates and filter out invalid emails
  return [...new Set(emails)].filter(email => 
    email.includes('@') && email.includes('.')
  );
};

/**
 * Helper function to validate email addresses
 */
export const validateEmailAddresses = (emails: string[]): { valid: string[]; invalid: string[] } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid: string[] = [];
  const invalid: string[] = [];
  
  emails.forEach(email => {
    const trimmedEmail = email.trim();
    if (emailRegex.test(trimmedEmail)) {
      valid.push(trimmedEmail);
    } else {
      invalid.push(trimmedEmail);
    }
  });
  
  return { valid, invalid };
};

/**
 * Helper function to generate default email subject
 */
export const generateDefaultSubject = (
  studentName: string,
  reportType: 'progress_report' | 'report_card',
  term: string
): string => {
  const reportLabel = reportType === 'progress_report' ? 'Progress Report' : 'Report Card';
  return `${studentName} - ${reportLabel} (${term})`;
};