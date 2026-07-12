// src/services/types/agenda.d.ts

export type AgendaStatus = 'draft' | 'generating' | 'generated' | 'failed';
export type AgendaAnchor = 'intro' | 'month' | 'closing';
export type AgendaFitMode = 'contain' | 'cover';
export type AgendaPageKind = 'custom' | 'monthOverview' | 'weekly' | 'notes' | 'evaluation';

/**
 * Agenda payload (from API response)
 */
export interface AgendaPayload {
  agendaId: string;
  school: string;
  schoolId?: string;
  academicYear: string;          // e.g. "2025-2026"
  title: string;
  startMonth: number;            // 1-12, default 9
  endMonth: number;              // 1-12, default 6
  footerText?: string | null;    // "School Name | www.website.ca"
  includeNotesPage: boolean;
  evaluationSubjects: string[];
  status: AgendaStatus;
  generatedFilePath?: string | null;
  generatedPageCount?: number | null;
  generatedAt?: string | null;
  generationError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaMonthPayload {
  agendaMonthId: string;
  agendaId: string;
  month: number;                 // 1-12
  quotes: string[];              // rotating weekly header quotes
  updatedAt: string;
}

export interface AgendaCustomPagePayload {
  pageId: string;
  agendaId: string;
  anchor: AgendaAnchor;
  anchorMonth?: number | null;
  sortOrder: number;
  title?: string | null;
  filePath: string;
  fileType: 'pdf' | 'image';
  mimeType?: string | null;
  pageCount: number;
  fitMode: AgendaFitMode;        // image placement baseline: fit whole page vs fill/crop
  zoom: number;                  // horizontal scale multiplier (1 = exact fit, 0.2-4)
  zoomY: number | null;          // vertical scale; null = uniform (follows zoom)
  offsetX: number;               // shift from center, fraction of page width (+right)
  offsetY: number;               // shift from center, fraction of page height (+down)
  createdAt: string;
  sizeWarning?: string | null;   // present on upload responses
}

/**
 * Full agenda detail (GET /agendas/:agendaId)
 */
export interface AgendaDetailPayload extends AgendaPayload {
  months: AgendaMonthPayload[];
  customPages: AgendaCustomPagePayload[];
}

/**
 * One output page in the computed sequence (GET /agendas/:agendaId/manifest)
 */
export interface AgendaManifestItem {
  seq: number;                   // 1-based global page position
  kind: AgendaPageKind;
  pageNumber: number;
  numbered: boolean;             // custom pages carry no printed number
  month?: number;
  year?: number;
  weekIndex?: number;
  mondayIso?: string;
  pageId?: string;               // custom pages only
  title?: string | null;
  fileType?: 'pdf' | 'image';
  fitMode?: AgendaFitMode;
  zoom?: number;
  zoomY?: number | null;
  offsetX?: number;
  offsetY?: number;
  sourcePageIndex?: number;
  sourcePageCount?: number;
  anchor?: AgendaAnchor;
  anchorMonth?: number | null;
}

export interface AgendaManifestPayload {
  totalPages: number;
  items: AgendaManifestItem[];
}

/**
 * Rendered generated page (GET /agendas/:agendaId/render/month/:month)
 */
export interface AgendaRenderedPage {
  seq: number;
  kind: AgendaPageKind;
  pageNumber: number;
  html: string;                  // standalone document for iframe srcdoc
}

export interface AgendaReorderUpdate {
  pageId: string;
  anchor: AgendaAnchor;
  anchorMonth?: number | null;
  sortOrder: number;
}

// ---- Response envelopes ----

export interface AgendasResponse { status: string; data: AgendaPayload[] }
export interface AgendaResponse { status: string; data: AgendaPayload }
export interface AgendaDetailResponse { status: string; data: AgendaDetailPayload }
export interface AgendaMonthResponse { status: string; data: AgendaMonthPayload }
export interface AgendaCustomPageResponse { status: string; data: AgendaCustomPagePayload }
export interface AgendaCustomPagesResponse { status: string; data: AgendaCustomPagePayload[] }
export interface AgendaManifestResponse { status: string; data: AgendaManifestPayload }
export interface AgendaRenderedPagesResponse { status: string; data: AgendaRenderedPage[] }
export interface AgendaCloneResponse {
  status: string;
  data: AgendaPayload & { calendarEventCount: number };
}
