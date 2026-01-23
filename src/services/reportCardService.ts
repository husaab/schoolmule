// File: src/services/reportCardService.ts

import apiClient from './apiClient';
import type {
  ReportCardFeedbackPayload,
  ReportCardFeedbackResponse,
  ClassFeedbackResponse,
  BulkFeedbackResponse,
  ReportCardBulkGenerateRequest,
  ReportCardBulkGenerateResponse,
  ReportCardStatusResponse
} from './types/reportCard';

/**
 * GET /report-cards/feedback?studentId=...&classId=...&term=...
 * → Fetch existing feedback for a given student-class-term
 */
export const getReportCardFeedback = async (
  studentId: string,
  classId: string,
  term: string
): Promise<ReportCardFeedbackResponse> => {
  return apiClient<ReportCardFeedbackResponse>(
    `/report-cards/feedback?studentId=${encodeURIComponent(studentId)}&classId=${encodeURIComponent(classId)}&term=${encodeURIComponent(term)}`
  );
};

/**
 * POST /report-cards/feedback
 * → Insert or update a student's report card feedback for a specific class and term
 */
export const upsertReportCardFeedback = async (
  payload: ReportCardFeedbackPayload
): Promise<{ status: string; message?: string }> => {
  return apiClient<{ status: string; message?: string }>(
    `/report-cards/feedback`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }
  );
};

/**
 * GET /report-cards/feedback/class/:classId?term=...
 * → Fetch all feedback for students in a class for a specific term
 */
export const getClassReportCardFeedback = async (
  classId: string,
  term: string
): Promise<ClassFeedbackResponse> => {
  return apiClient<ClassFeedbackResponse>(
    `/report-cards/feedback/class/${encodeURIComponent(classId)}?term=${encodeURIComponent(term)}`
  );
};

/**
 * POST /report-cards/feedback/bulk
 * → Insert or update feedback for multiple students at once
 */
export const upsertBulkReportCardFeedback = async (
  feedbackEntries: ReportCardFeedbackPayload[]
): Promise<BulkFeedbackResponse> => {
  return apiClient<BulkFeedbackResponse>(
    `/report-cards/feedback/bulk`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { feedbackEntries },
    }
  );
};

/**
 * POST /report-cards/generate/bulk
 * → Generate report cards for multiple students for a given term
 */
export const generateBulkReportCards = async (
  payload: ReportCardBulkGenerateRequest
): Promise<ReportCardBulkGenerateResponse> => {
  return apiClient<ReportCardBulkGenerateResponse>(
    `/report-cards/generate/bulk`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }
  );
};

/**
 * GET /report-cards/view?term=...&school=...
 * → Get all generated report cards for a specific term and school
 */
export const getGeneratedReportCards = async (
  term: string,
  school: string
): Promise<ReportCardStatusResponse> => {
  return apiClient<ReportCardStatusResponse>(
    `/report-cards/view?term=${encodeURIComponent(term)}&school=${encodeURIComponent(school)}`
  );
};

/**
 * GET /report-cards/view/student?studentId=...&term=...&school=...
 * → Get all generated report cards for a specific student, term, and school
 */
export const getGeneratedReportCardsByStudentId = async (
  studentId: string,
  term: string,
  school: string
): Promise<ReportCardStatusResponse> => {
  return apiClient<ReportCardStatusResponse>(
    `/report-cards/view/student?studentId=${encodeURIComponent(studentId)}&term=${encodeURIComponent(term)}&school=${encodeURIComponent(school)}`
  );
};

export const getSignedReportCardUrl = async (filePath: string): Promise<string | null> => {
  const response = await apiClient<{ url: string }>(`/report-cards/signed-url?path=${encodeURIComponent(filePath)}`);
  return response.url || null;
};

export const deleteReportCard = async (filePath: string): Promise<{ status: string }> => {
  return apiClient<{ status: string }>(`/report-cards/delete?filePath=${encodeURIComponent(filePath)}`, {
    method: 'DELETE',
  });
};