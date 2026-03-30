// src/services/jkskService.ts
// API client for JK/SK competency-based grading system

import apiClient from "./apiClient";
import type {
  JKSKDomainsResponse,
  JKSKAssessmentsResponse,
  JKSKAssessmentEntry,
  JKSKBulkResponse,
  JKSKLearningSkillsResponse,
  JKSKLearningSkillEntry,
  JKSKDomainCommentsResponse,
  JKSKDomainCommentEntry,
  JKSKTeacherAssistantResponse,
  JKSKTeacherAssistantPayload,
  JKSKProgressReportCommentsResponse,
  JKSKProgressReportCommentEntry,
  JKSKCreateDomainPayload,
  JKSKUpdateDomainPayload,
  JKSKDomainCrudResponse,
  JKSKCreateSkillPayload,
  JKSKUpdateSkillPayload,
  JKSKSkillCrudResponse,
} from "./types/jksk";

// -- Domains & Skills --

export const getJKSKDomains = async (
  documentType: string,
  school: string
): Promise<JKSKDomainsResponse> => {
  return apiClient<JKSKDomainsResponse>(
    `/jksk/domains?documentType=${encodeURIComponent(documentType)}&school=${encodeURIComponent(school)}`
  );
};

// -- Domain CRUD --

export const createJKSKDomain = async (
  payload: JKSKCreateDomainPayload
): Promise<JKSKDomainCrudResponse> => {
  return apiClient<JKSKDomainCrudResponse>('/jksk/domains', {
    method: 'POST',
    body: payload,
  });
};

export const updateJKSKDomain = async (
  domainId: string,
  payload: JKSKUpdateDomainPayload
): Promise<JKSKDomainCrudResponse> => {
  return apiClient<JKSKDomainCrudResponse>(`/jksk/domains/${domainId}`, {
    method: 'PUT',
    body: payload,
  });
};

export const deleteJKSKDomain = async (
  domainId: string
): Promise<{ status: string; message: string }> => {
  return apiClient(`/jksk/domains/${domainId}`, { method: 'DELETE' });
};

// -- Skill CRUD --

export const createJKSKSkill = async (
  payload: JKSKCreateSkillPayload
): Promise<JKSKSkillCrudResponse> => {
  return apiClient<JKSKSkillCrudResponse>('/jksk/skills', {
    method: 'POST',
    body: payload,
  });
};

export const updateJKSKSkill = async (
  skillId: string,
  payload: JKSKUpdateSkillPayload
): Promise<JKSKSkillCrudResponse> => {
  return apiClient<JKSKSkillCrudResponse>(`/jksk/skills/${skillId}`, {
    method: 'PUT',
    body: payload,
  });
};

export const deleteJKSKSkill = async (
  skillId: string
): Promise<{ status: string; message: string }> => {
  return apiClient(`/jksk/skills/${skillId}`, { method: 'DELETE' });
};

// -- Skill Assessments --

export const getJKSKAssessments = async (
  studentId: string,
  term: string,
  documentType: string
): Promise<JKSKAssessmentsResponse> => {
  return apiClient<JKSKAssessmentsResponse>(
    `/jksk/assessments/${studentId}?term=${encodeURIComponent(term)}&documentType=${encodeURIComponent(documentType)}`
  );
};

export const bulkUpsertJKSKAssessments = async (
  entries: JKSKAssessmentEntry[]
): Promise<JKSKBulkResponse> => {
  return apiClient<JKSKBulkResponse>('/jksk/assessments/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Learning Skills --

export const getJKSKLearningSkills = async (
  studentId: string,
  term: string
): Promise<JKSKLearningSkillsResponse> => {
  return apiClient<JKSKLearningSkillsResponse>(
    `/jksk/learning-skills/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const bulkUpsertJKSKLearningSkills = async (
  entries: JKSKLearningSkillEntry[]
): Promise<JKSKBulkResponse> => {
  return apiClient<JKSKBulkResponse>('/jksk/learning-skills/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Domain Comments --

export const getJKSKDomainComments = async (
  studentId: string,
  term: string
): Promise<JKSKDomainCommentsResponse> => {
  return apiClient<JKSKDomainCommentsResponse>(
    `/jksk/domain-comments/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const bulkUpsertJKSKDomainComments = async (
  entries: JKSKDomainCommentEntry[]
): Promise<JKSKBulkResponse> => {
  return apiClient<JKSKBulkResponse>('/jksk/domain-comments/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Teacher Assistant --

export const getJKSKTeacherAssistant = async (
  studentId: string,
  term: string
): Promise<JKSKTeacherAssistantResponse> => {
  return apiClient<JKSKTeacherAssistantResponse>(
    `/jksk/teacher-assistant/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const upsertJKSKTeacherAssistant = async (
  payload: JKSKTeacherAssistantPayload
): Promise<JKSKTeacherAssistantResponse> => {
  return apiClient<JKSKTeacherAssistantResponse>('/jksk/teacher-assistant', {
    method: 'POST',
    body: payload,
  });
};

// -- Progress Report Comments --

export const getJKSKProgressReportComments = async (
  studentId: string,
  term: string
): Promise<JKSKProgressReportCommentsResponse> => {
  return apiClient<JKSKProgressReportCommentsResponse>(
    `/jksk/progress-report-comments/${studentId}?term=${encodeURIComponent(term)}`
  );
};

export const bulkUpsertJKSKProgressReportComments = async (
  entries: JKSKProgressReportCommentEntry[]
): Promise<JKSKBulkResponse> => {
  return apiClient<JKSKBulkResponse>('/jksk/progress-report-comments/bulk', {
    method: 'POST',
    body: { entries },
  });
};

// -- Report Generation --

export const generateJKSKProgressReport = async (
  studentId: string,
  term: string
): Promise<{ status: string; message: string }> => {
  return apiClient('/jksk/progress-report/generate', {
    method: 'POST',
    body: { studentId, term },
  });
};

export const generateBulkJKSKProgressReports = async (
  studentIds: string[],
  term: string
): Promise<{ status: string; generated: unknown[]; failed: unknown[] }> => {
  return apiClient('/jksk/progress-report/generate/bulk', {
    method: 'POST',
    body: { studentIds, term },
  });
};

export const generateJKSKReportCard = async (
  studentId: string,
  term: string
): Promise<{ status: string; message: string }> => {
  return apiClient('/jksk/report-card/generate', {
    method: 'POST',
    body: { studentId, term },
  });
};

export const generateBulkJKSKReportCards = async (
  studentIds: string[],
  term: string
): Promise<{ status: string; generated: unknown[]; failed: unknown[] }> => {
  return apiClient('/jksk/report-card/generate/bulk', {
    method: 'POST',
    body: { studentIds, term },
  });
};
