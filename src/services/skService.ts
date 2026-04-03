// src/services/skService.ts
// API client for SK subject-based grading system

import apiClient from "./apiClient";
import type {
  SKSubjectsResponse,
  SKAssessmentsResponse,
  SKAssessmentEntry,
  SKBulkResponse,
  SKSubjectCommentsResponse,
  SKSubjectCommentEntry,
  SKTeacherAssistantResponse,
  SKTeacherAssistantPayload,
  SKProgressReportCommentsResponse,
  SKProgressReportCommentEntry,
  SKCreateSubjectPayload,
  SKUpdateSubjectPayload,
  SKSubjectCrudResponse,
  SKCreateStandardPayload,
  SKUpdateStandardPayload,
  SKStandardCrudResponse,
} from "./types/sk";

// -- Subjects & Standards --

export const getSKSubjects = async (
  documentType: string,
  school: string
): Promise<SKSubjectsResponse> => {
  return apiClient<SKSubjectsResponse>(
    `/sk/subjects?documentType=${encodeURIComponent(documentType)}&school=${encodeURIComponent(school)}`
  );
};

// -- Subject CRUD --

export const createSKSubject = async (
  payload: SKCreateSubjectPayload
): Promise<SKSubjectCrudResponse> => {
  return apiClient<SKSubjectCrudResponse>('/sk/subjects', {
    method: 'POST',
    body: payload,
  });
};

export const updateSKSubject = async (
  subjectId: string,
  payload: SKUpdateSubjectPayload
): Promise<SKSubjectCrudResponse> => {
  return apiClient<SKSubjectCrudResponse>(`/sk/subjects/${subjectId}`, {
    method: 'PUT',
    body: payload,
  });
};

export const deleteSKSubject = async (
  subjectId: string
): Promise<{ status: string; message: string }> => {
  return apiClient(`/sk/subjects/${subjectId}`, { method: 'DELETE' });
};

// -- Standard CRUD --

export const createSKStandard = async (
  payload: SKCreateStandardPayload
): Promise<SKStandardCrudResponse> => {
  return apiClient<SKStandardCrudResponse>('/sk/standards', {
    method: 'POST',
    body: payload,
  });
};

export const updateSKStandard = async (
  standardId: string,
  payload: SKUpdateStandardPayload
): Promise<SKStandardCrudResponse> => {
  return apiClient<SKStandardCrudResponse>(`/sk/standards/${standardId}`, {
    method: 'PUT',
    body: payload,
  });
};

export const deleteSKStandard = async (
  standardId: string
): Promise<{ status: string; message: string }> => {
  return apiClient(`/sk/standards/${standardId}`, { method: 'DELETE' });
};

// -- Standard Assessments --

export const getSKAssessments = async (
  studentId: string,
  term: string,
  documentType: string
): Promise<SKAssessmentsResponse> => {
  return apiClient<SKAssessmentsResponse>(
    `/sk/assessments/${studentId}?term=${encodeURIComponent(term)}&documentType=${encodeURIComponent(documentType)}`
  );
};

export const bulkUpsertSKAssessments = async (
  entries: SKAssessmentEntry[]
): Promise<SKBulkResponse> => {
  return apiClient<SKBulkResponse>('/sk/assessments/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Subject Comments --

export const getSKSubjectComments = async (
  studentId: string,
  term: string
): Promise<SKSubjectCommentsResponse> => {
  return apiClient<SKSubjectCommentsResponse>(
    `/sk/subject-comments/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const bulkUpsertSKSubjectComments = async (
  entries: SKSubjectCommentEntry[]
): Promise<SKBulkResponse> => {
  return apiClient<SKBulkResponse>('/sk/subject-comments/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Teacher Assistant --

export const getSKTeacherAssistant = async (
  studentId: string,
  term: string
): Promise<SKTeacherAssistantResponse> => {
  return apiClient<SKTeacherAssistantResponse>(
    `/sk/teacher-assistant/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const upsertSKTeacherAssistant = async (
  payload: SKTeacherAssistantPayload
): Promise<SKTeacherAssistantResponse> => {
  return apiClient<SKTeacherAssistantResponse>('/sk/teacher-assistant', {
    method: 'POST',
    body: payload,
  });
};

// -- Progress Report Comments --

export const getSKProgressReportComments = async (
  studentId: string,
  term: string
): Promise<SKProgressReportCommentsResponse> => {
  return apiClient<SKProgressReportCommentsResponse>(
    `/sk/progress-report-comments/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const bulkUpsertSKProgressReportComments = async (
  entries: SKProgressReportCommentEntry[]
): Promise<SKBulkResponse> => {
  return apiClient<SKBulkResponse>('/sk/progress-report-comments/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Report Generation --

export const generateSKProgressReport = async (
  studentId: string,
  term: string
): Promise<{ status: string; message: string }> => {
  return apiClient('/sk/progress-report/generate', {
    method: 'POST',
    body: { studentId, term },
  });
};

export const generateBulkSKProgressReports = async (
  studentIds: string[],
  term: string
): Promise<{ status: string; generated: unknown[]; failed: unknown[] }> => {
  return apiClient('/sk/progress-report/generate/bulk', {
    method: 'POST',
    body: { studentIds, term },
  });
};

export const generateSKReportCard = async (
  studentId: string,
  term: string
): Promise<{ status: string; message: string }> => {
  return apiClient('/sk/report-card/generate', {
    method: 'POST',
    body: { studentId, term },
  });
};

export const generateBulkSKReportCards = async (
  studentIds: string[],
  term: string
): Promise<{ status: string; generated: unknown[]; failed: unknown[] }> => {
  return apiClient('/sk/report-card/generate/bulk', {
    method: 'POST',
    body: { studentIds, term },
  });
};
