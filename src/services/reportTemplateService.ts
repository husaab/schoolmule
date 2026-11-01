// File: src/services/reportTemplateService.ts
// Report Template Designer (admin, desktop). Backend: /api/report-templates.

import apiClient, { ApiError, handleSessionFailure } from './apiClient';
import type {
  AssignmentPayload,
  CoverageResponse,
  CreateReportTemplatePayload,
  FieldValuesResponse,
  PreviewPdfResult,
  PreviewStudent,
  PublishResult,
  ReportTemplateDetail,
  ReportTemplateListResponse,
  ReportTemplateSummary,
  ReportTemplateVersion,
  TemplateAssignment,
} from './types/reportTemplate';
import type { DocType, ReportData, TemplateDoc } from '@/reportkit/types';

const BASE = '/report-templates';
const id = (v: string) => encodeURIComponent(v);
const qs = (params: Record<string, string | number | null | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') s.set(k, String(v));
  });
  const out = s.toString();
  return out ? `?${out}` : '';
};

export const listReportTemplates = () => apiClient<ReportTemplateListResponse>(BASE);

export const createReportTemplate = (payload: CreateReportTemplatePayload) =>
  apiClient<ReportTemplateDetail, CreateReportTemplatePayload>(BASE, { method: 'POST', body: payload });

export const getReportTemplate = (templateId: string) => apiClient<ReportTemplateDetail>(`${BASE}/${id(templateId)}`);

export const saveReportTemplateDraft = (templateId: string, doc: TemplateDoc, rev: number) =>
  apiClient<{ draftRev: number }, { doc: TemplateDoc; rev: number }>(`${BASE}/${id(templateId)}/draft`, {
    method: 'PUT',
    body: { doc, rev },
  });

export const renameReportTemplate = (templateId: string, name: string) =>
  apiClient<ReportTemplateSummary, { name: string }>(`${BASE}/${id(templateId)}`, { method: 'PATCH', body: { name } });

export const deleteReportTemplate = (templateId: string) =>
  apiClient<{ archived: boolean }>(`${BASE}/${id(templateId)}`, { method: 'DELETE' });

export const publishReportTemplate = (templateId: string, note?: string) =>
  apiClient<PublishResult, { note?: string }>(`${BASE}/${id(templateId)}/publish`, { method: 'POST', body: { note } });

export const listReportTemplateVersions = (templateId: string) =>
  apiClient<{ versions: ReportTemplateVersion[] }>(`${BASE}/${id(templateId)}/versions`);

export const restoreReportTemplateVersion = (templateId: string, versionId: string) =>
  apiClient<{ draftRev: number; draft: TemplateDoc }>(`${BASE}/${id(templateId)}/versions/${id(versionId)}/restore`, {
    method: 'POST',
  });

export const discardReportTemplateDraft = (templateId: string) =>
  apiClient<{ draftRev: number; draft: TemplateDoc }>(`${BASE}/${id(templateId)}/discard-draft`, { method: 'POST' });

// ── which template prints ──

export const listTemplateAssignments = (docType?: DocType) =>
  apiClient<{ assignments: TemplateAssignment[] }>(`${BASE}/assignments${qs({ docType })}`);

export const createTemplateAssignment = (payload: AssignmentPayload) =>
  apiClient<TemplateAssignment, AssignmentPayload>(`${BASE}/assignments`, { method: 'POST', body: payload });

export const updateTemplateAssignment = (assignmentId: string, payload: Partial<AssignmentPayload>) =>
  apiClient<TemplateAssignment, Partial<AssignmentPayload>>(`${BASE}/assignments/${id(assignmentId)}`, {
    method: 'PATCH',
    body: payload,
  });

export const deleteTemplateAssignment = (assignmentId: string) =>
  apiClient<{ deleted: boolean }>(`${BASE}/assignments/${id(assignmentId)}`, { method: 'DELETE' });

export const getTemplateCoverage = (docType: DocType) => apiClient<CoverageResponse>(`${BASE}/coverage${qs({ docType })}`);

// ── previews ──

export const searchPreviewStudents = (grade?: string, q?: string) =>
  apiClient<{ students: PreviewStudent[] }>(`${BASE}/preview/students${qs({ grade, q })}`);

export const getPreviewData = (studentId: string, docType: DocType, term?: string) =>
  apiClient<ReportData>(`${BASE}/preview/data${qs({ studentId, docType, term })}`);

/** The server's own PDF of a draft, for checking the print matches the editor. */
export const fetchPreviewPdf = async (payload: {
  doc: TemplateDoc;
  docType: DocType;
  studentId?: string;
  sample?: string;
  term?: string;
}): Promise<PreviewPdfResult> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${BASE}/preview/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    await handleSessionFailure(response.status, body, token);
    throw new ApiError(body.message || 'Could not make the PDF', { status: response.status, data: body });
  }
  const pages = Number(response.headers.get('X-Report-Pages'));
  let warnings: PreviewPdfResult['warnings'] = [];
  try {
    warnings = JSON.parse(decodeURIComponent(response.headers.get('X-Report-Warnings') || '[]'));
  } catch {
    warnings = [];
  }
  const blob = await response.blob();
  return { url: URL.createObjectURL(blob), pageCount: Number.isFinite(pages) && pages > 0 ? pages : null, warnings };
};

// ── extra field values ──

export const getFieldValues = (docType: DocType, term: string, grade: string) =>
  apiClient<FieldValuesResponse>(`${BASE}/field-values${qs({ docType, term, grade })}`);

export const saveFieldValues = (payload: { docType: DocType; term: string; studentId: string; values: Record<string, string | null> }) =>
  apiClient<{ values: Record<string, string> }, typeof payload>(`${BASE}/field-values`, { method: 'PUT', body: payload });

/** Synthetic students with the school's own name and logo, for previews. */
export const getSampleData = (key: string, docType: DocType) =>
  apiClient<ReportData>(`${BASE}/preview/sample${qs({ key, docType })}`);
