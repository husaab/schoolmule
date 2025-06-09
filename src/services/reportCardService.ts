// File: src/services/reportCardService.ts

import apiClient from './apiClient';
import type {
  ReportCardFeedbackPayload,
  ReportCardFeedbackResponse,
  ReportCardTerm,
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
  term: ReportCardTerm
): Promise<ReportCardFeedbackResponse> => {
  return apiClient<ReportCardFeedbackResponse>(
    `/report-cards/feedback?studentId=${encodeURIComponent(studentId)}&classId=${encodeURIComponent(classId)}&term=${encodeURIComponent(term)}`
  );
};

/**
 * POST /report-cards/feedback
 * → Insert or update a student’s report card feedback for a specific class and term
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
 * GET /report-cards/view?term=...
 * → Get all generated report cards for a specific term
 */
export const getGeneratedReportCards = async (
  term: string
): Promise<ReportCardStatusResponse> => {
  return apiClient<ReportCardStatusResponse>(
    `/report-cards/view?term=${encodeURIComponent(term)}`
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