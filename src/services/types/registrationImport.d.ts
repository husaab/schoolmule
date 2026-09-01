// Types for importing registration form submissions as students.

import type { FieldFilter, SortSpec, SubmissionStatus, ImportState } from './registration';

// ─── Field mapping ──────────────────────────────────────────────────

/** A student field a form field can feed. Mirrors the backend's catalogue. */
export type StudentTargetField =
  | 'name' | 'grade' | 'oen' | 'dateOfBirth' | 'address' | 'healthCardNumber'
  | 'medicalNotes' | 'emergencyContact'
  | 'motherName' | 'motherEmail' | 'motherPhone'
  | 'fatherName' | 'fatherEmail' | 'fatherPhone';

export interface TargetFieldDef {
  targetField: StudentTargetField;
  label: string;
  dataType: 'text' | 'email' | 'phone' | 'date' | 'enum' | 'textarea';
  group: string;
  required: boolean;
  /** Allowed values for enum targets (grade), else null. */
  enumValues: string[] | null;
}

export interface FieldMapping {
  /** Null while the mapping is still only a suggestion. */
  mappingId: string | null;
  fieldId: string;
  targetField: StudentTargetField;
  /** Per-option translation for choice fields feeding an enum target. */
  valueMap: Record<string, string> | null;
}

/** The form's fields, trimmed to what the mapping editor needs. */
export interface MappableFormField {
  fieldId: string;
  fieldType: string;
  label: string;
  options: string[] | null;
  sortOrder: number;
}

export interface MappingResponse {
  status: string;
  data: {
    /** True when nothing is saved yet and these are label-derived proposals. */
    isSuggested: boolean;
    mappings: FieldMapping[];
    targetFields: TargetFieldDef[];
    fields: MappableFormField[];
  };
}

// ─── Preview / execute ──────────────────────────────────────────────

export type ImportAction = 'create' | 'update' | 'skip' | 'error';
export type ImportDecision = 'create' | 'update' | 'skip';
export type MatchTier = 'none' | 'near' | 'exact' | 'linked';

/**
 * Which submissions an import covers: an explicit checkbox selection, or
 * everything matching the submissions page's current filters.
 */
export type ImportScope =
  | { mode: 'selected'; submissionIds: string[] }
  | {
      mode: 'filtered';
      status?: SubmissionStatus;
      dateFrom?: string;
      dateTo?: string;
      fieldFilters?: FieldFilter[];
      importState?: ImportState;
      sorts?: SortSpec[];
    };

export interface DiffEntry {
  targetField: StudentTargetField;
  label: string;
  from: string | null;
  to: string;
}

export interface MatchCandidate {
  entityId: string;
  name: string;
  grade: string | null;
}

export interface ImportPreviewRow {
  submissionId: string;
  submittedAt: string;
  mappedName: string | null;
  mappedGrade: string | null;
  action: ImportAction;
  reason: string;
  matchTier: MatchTier;
  /** True for ambiguous matches the admin needs to resolve. */
  needsReview: boolean;
  /** True when the row's outcome is fixed and no override applies. */
  locked?: boolean;
  matchedEntityId: string | null;
  matchedEntityName: string | null;
  matchCandidates: MatchCandidate[];
  /** Fields a fill-blanks update would populate. Empty unless action is 'update'. */
  diff: DiffEntry[];
  errors: string[];
}

export interface ImportSummary {
  create: number;
  update: number;
  skip: number;
  error: number;
  needsReview: number;
  total: number;
}

export interface ImportPreviewResponse {
  status: string;
  data: {
    /** True when the form has no saved mapping yet — configure it first. */
    needsMapping: boolean;
    rows: ImportPreviewRow[];
    summary: ImportSummary | null;
    truncated: boolean;
    maxRows?: number;
  };
}

export interface ImportSideEffects {
  homeroomTeacherId?: string | null;
  autoEnroll?: boolean;
}

export interface ImportRequestBody {
  scope: ImportScope;
  /** Per-row admin decisions, keyed by submission id. */
  overrides?: Record<string, ImportDecision>;
  /** Which existing student an ambiguous update should target. */
  overrideMatchIds?: Record<string, string>;
  sideEffects?: ImportSideEffects;
}

export interface ImportResultRow {
  submissionId: string;
  action: ImportAction;
  reason?: string;
  studentId?: string;
  studentName?: string;
  fieldsFilled?: string[];
}

export interface ImportExecuteResponse {
  status: string;
  data: {
    ok: boolean;
    results: ImportResultRow[];
    effects: { homeroomAssigned: number; enrollments: number };
    summary: { created: number; updated: number; skipped: number; errored: number; total: number };
  };
}

// ─── Undo ───────────────────────────────────────────────────────────

export interface UndoBlocker {
  table: string;
  label: string;
}

export interface UndoInfoResponse {
  status: string;
  data: {
    ok: boolean;
    studentId: string;
    studentName: string | null;
    /** Non-empty when other records depend on the student, blocking deletion. */
    blockedBy: UndoBlocker[];
    canDelete: boolean;
  };
}

export interface UndoImportResponse {
  status: string;
  message: string;
  data: {
    unlinked: boolean;
    studentDeleted: boolean;
    blockedBy: UndoBlocker[];
    studentId: string;
    studentName: string | null;
  };
}
