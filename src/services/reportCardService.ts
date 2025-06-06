// File: src/services/reportCardService.ts

import apiClient from './apiClient';
import type {
  ReportCardFeedbackPayload,
  ReportCardFeedbackResponse,
  ReportCardTerm
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
