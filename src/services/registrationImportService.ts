import apiClient from './apiClient';
import type {
  MappingResponse,
  FieldMapping,
  ImportPreviewResponse,
  ImportExecuteResponse,
  ImportRequestBody,
  UndoInfoResponse,
  UndoImportResponse,
} from './types/registrationImport';

// ─── Field mapping ──────────────────────────────────────────────────

/**
 * The form's saved student-field mapping. When nothing is saved yet the
 * backend returns a label-derived suggestion with `isSuggested: true`.
 */
export const getMapping = (formId: string) =>
  apiClient<MappingResponse>(`/registration/forms/${formId}/import/mapping`);

/** Replaces the form's whole mapping. */
export const saveMapping = (formId: string, mappings: Pick<FieldMapping, 'fieldId' | 'targetField' | 'valueMap'>[]) =>
  apiClient<MappingResponse>(`/registration/forms/${formId}/import/mapping`, {
    method: 'PUT',
    body: { mappings },
  });

// ─── Preview / execute ──────────────────────────────────────────────

/** Dry run: classifies the scope into create/update/skip. Writes nothing. */
export const previewImport = (formId: string, body: ImportRequestBody) =>
  apiClient<ImportPreviewResponse>(`/registration/forms/${formId}/import/preview`, {
    method: 'POST',
    body,
  });

/**
 * Runs the import. The server re-derives the classification from current data,
 * so only the admin's decisions travel from the preview to here.
 */
export const executeImport = (formId: string, body: ImportRequestBody) =>
  apiClient<ImportExecuteResponse>(`/registration/forms/${formId}/import/execute`, {
    method: 'POST',
    body,
  });

// ─── Undo ───────────────────────────────────────────────────────────

/** What undoing would do, including whether deleting the student is safe. */
export const getUndoInfo = (submissionId: string) =>
  apiClient<UndoInfoResponse>(`/registration/submissions/${submissionId}/import/undo`);

export const undoImport = (submissionId: string, deleteStudent: boolean) =>
  apiClient<UndoImportResponse>(`/registration/submissions/${submissionId}/import/undo`, {
    method: 'POST',
    body: { deleteStudent },
  });
