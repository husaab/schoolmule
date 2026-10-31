// Report Template Designer API shapes (backend: routes/reportTemplates.routes.js).

import type { DocType, ExtraFieldDef, ReportData, TemplateDoc } from '@/reportkit/types';

export interface PublishedVersionRef {
  versionId: string;
  versionNo: number;
  publishedAt: string;
}

export interface ReportTemplateSummary {
  templateId: string;
  name: string;
  docType: DocType;
  baseKey: string | null;
  draftRev: number;
  updatedAt: string;
  hasUnpublishedChanges: boolean;
  published: PublishedVersionRef | null;
  assignedCount: number;
}

export interface DefaultTemplateSummary {
  key: string;
  name: string;
  description: string;
  docType: DocType;
  grades: string[];
}

export interface ReportTemplateListResponse {
  templates: ReportTemplateSummary[];
  defaults: DefaultTemplateSummary[];
}

export interface ReportTemplateDetail {
  template: ReportTemplateSummary;
  draft: TemplateDoc;
  draftRev: number;
  publishedDoc: TemplateDoc | null;
}

export interface CreateReportTemplatePayload {
  name: string;
  docType: DocType;
  fromDefault?: string;
  fromTemplateId?: string;
}

export interface ReportTemplateVersion {
  versionId: string;
  versionNo: number;
  note: string | null;
  publishedAt: string;
  publishedBy: string | null;
  engineVersion: number | null;
}

export interface PublishResult {
  versionId: string;
  versionNo: number;
  publishedAt: string;
  pageCount: number;
  warnings: Array<{ code: string; message: string }>;
}

export interface TemplateAssignment {
  assignmentId: string;
  docType: DocType;
  templateId: string | null;
  defaultKey: string | null;
  /** Name of the template or built-in default it points at. */
  name: string;
  grades: string[] | null;
  terms: string[] | null;
  priority: number;
}

export interface AssignmentPayload {
  docType: DocType;
  templateId?: string | null;
  defaultKey?: string | null;
  grades: string[] | null;
  terms: string[] | null;
  priority: number;
}

export interface CoverageCell {
  grade: string;
  term: string;
  source: 'assignment' | 'default' | 'legacy';
  name: string;
  templateId?: string | null;
  defaultKey?: string | null;
}

export interface CoverageResponse {
  terms: string[];
  grades: string[];
  cells: CoverageCell[];
}

export interface PreviewStudent {
  studentId: string;
  name: string;
  grade: string;
}

export interface FieldValuesResponse {
  template: { source: string; name: string } | null;
  fields: ExtraFieldDef[];
  students: Array<{ studentId: string; name: string; values: Record<string, string> }>;
}

export interface PreviewPdfResult {
  url: string;
  pageCount: number | null;
  warnings: Array<{ code: string; message: string }>;
}

export type { ReportData, TemplateDoc };
