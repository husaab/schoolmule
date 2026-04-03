// src/services/jkService.ts
// API client for JK competency-based grading system

import apiClient from "./apiClient";
import type {
  JKDomainsResponse,
  JKAssessmentsResponse,
  JKAssessmentEntry,
  JKBulkResponse,
  JKLearningSkillsResponse,
  JKLearningSkillEntry,
  JKDomainCommentsResponse,
  JKDomainCommentEntry,
  JKTeacherAssistantResponse,
  JKTeacherAssistantPayload,
  JKProgressReportCommentsResponse,
  JKProgressReportCommentEntry,
  JKCreateDomainPayload,
  JKUpdateDomainPayload,
  JKDomainCrudResponse,
  JKCreateSkillPayload,
  JKUpdateSkillPayload,
  JKSkillCrudResponse,
} from "./types/jk";

// -- Domains & Skills --

export const getJKDomains = async (
  documentType: string,
  school: string
): Promise<JKDomainsResponse> => {
  return apiClient<JKDomainsResponse>(
    `/jk/domains?documentType=${encodeURIComponent(documentType)}&school=${encodeURIComponent(school)}`
  );
};

// -- Domain CRUD --

export const createJKDomain = async (
  payload: JKCreateDomainPayload
): Promise<JKDomainCrudResponse> => {
  return apiClient<JKDomainCrudResponse>('/jk/domains', {
    method: 'POST',
    body: payload,
  });
};

export const updateJKDomain = async (
  domainId: string,
  payload: JKUpdateDomainPayload
): Promise<JKDomainCrudResponse> => {
  return apiClient<JKDomainCrudResponse>(`/jk/domains/${domainId}`, {
    method: 'PUT',
    body: payload,
  });
};

export const deleteJKDomain = async (
  domainId: string
): Promise<{ status: string; message: string }> => {
  return apiClient(`/jk/domains/${domainId}`, { method: 'DELETE' });
};

// -- Skill CRUD --

export const createJKSkill = async (
  payload: JKCreateSkillPayload
): Promise<JKSkillCrudResponse> => {
  return apiClient<JKSkillCrudResponse>('/jk/skills', {
    method: 'POST',
    body: payload,
  });
};

export const updateJKSkill = async (
  skillId: string,
  payload: JKUpdateSkillPayload
): Promise<JKSkillCrudResponse> => {
  return apiClient<JKSkillCrudResponse>(`/jk/skills/${skillId}`, {
    method: 'PUT',
    body: payload,
  });
};

export const deleteJKSkill = async (
  skillId: string
): Promise<{ status: string; message: string }> => {
  return apiClient(`/jk/skills/${skillId}`, { method: 'DELETE' });
};

// -- Skill Assessments --

export const getJKAssessments = async (
  studentId: string,
  term: string,
  documentType: string
): Promise<JKAssessmentsResponse> => {
  return apiClient<JKAssessmentsResponse>(
    `/jk/assessments/${studentId}?term=${encodeURIComponent(term)}&documentType=${encodeURIComponent(documentType)}`
  );
};

export const bulkUpsertJKAssessments = async (
  entries: JKAssessmentEntry[]
): Promise<JKBulkResponse> => {
  return apiClient<JKBulkResponse>('/jk/assessments/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Learning Skills --

export const getJKLearningSkills = async (
  studentId: string,
  term: string
): Promise<JKLearningSkillsResponse> => {
  return apiClient<JKLearningSkillsResponse>(
    `/jk/learning-skills/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const bulkUpsertJKLearningSkills = async (
  entries: JKLearningSkillEntry[]
): Promise<JKBulkResponse> => {
  return apiClient<JKBulkResponse>('/jk/learning-skills/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Domain Comments --

export const getJKDomainComments = async (
  studentId: string,
  term: string
): Promise<JKDomainCommentsResponse> => {
  return apiClient<JKDomainCommentsResponse>(
    `/jk/domain-comments/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const bulkUpsertJKDomainComments = async (
  entries: JKDomainCommentEntry[]
): Promise<JKBulkResponse> => {
  return apiClient<JKBulkResponse>('/jk/domain-comments/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Teacher Assistant --

export const getJKTeacherAssistant = async (
  studentId: string,
  term: string
): Promise<JKTeacherAssistantResponse> => {
  return apiClient<JKTeacherAssistantResponse>(
    `/jk/teacher-assistant/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const upsertJKTeacherAssistant = async (
  payload: JKTeacherAssistantPayload
): Promise<JKTeacherAssistantResponse> => {
  return apiClient<JKTeacherAssistantResponse>('/jk/teacher-assistant', {
    method: 'POST',
    body: payload,
  });
};

// -- Progress Report Comments --

export const getJKProgressReportComments = async (
  studentId: string,
  term: string
): Promise<JKProgressReportCommentsResponse> => {
  return apiClient<JKProgressReportCommentsResponse>(
    `/jk/progress-report-comments/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const bulkUpsertJKProgressReportComments = async (
  entries: JKProgressReportCommentEntry[]
): Promise<JKBulkResponse> => {
  return apiClient<JKBulkResponse>('/jk/progress-report-comments/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Report Generation --

export const generateJKProgressReport = async (
  studentId: string,
  term: string
): Promise<{ status: string; message: string }> => {
  return apiClient('/jk/progress-report/generate', {
    method: 'POST',
    body: { studentId, term },
  });
};

export const generateBulkJKProgressReports = async (
  studentIds: string[],
  term: string
): Promise<{ status: string; generated: unknown[]; failed: unknown[] }> => {
  return apiClient('/jk/progress-report/generate/bulk', {
    method: 'POST',
    body: { studentIds, term },
  });
};

export const generateJKReportCard = async (
  studentId: string,
  term: string
): Promise<{ status: string; message: string }> => {
  return apiClient('/jk/report-card/generate', {
    method: 'POST',
    body: { studentId, term },
  });
};

export const generateBulkJKReportCards = async (
  studentIds: string[],
  term: string
): Promise<{ status: string; generated: unknown[]; failed: unknown[] }> => {
  return apiClient('/jk/report-card/generate/bulk', {
    method: 'POST',
    body: { studentIds, term },
  });
};
