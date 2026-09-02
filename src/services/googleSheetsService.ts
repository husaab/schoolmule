import apiClient from './apiClient';
import type {
  SheetLinkResponse,
  ConnectionResponse,
  AuthUrlResponse,
  LinkResponse,
  MessageResponse,
} from './types/googleSheets';

// ─── Connection (one Google account per school) ─────────────────────

export const getConnectionStatus = () =>
  apiClient<ConnectionResponse>('/registration/google/status');

/**
 * The consent URL to send the browser to.
 *
 * The backend returns it rather than redirecting, so that the request
 * identifying the school is authenticated — a redirect would carry no token.
 */
export const getAuthUrl = () =>
  apiClient<AuthUrlResponse>('/registration/google/auth-url');

export const disconnectGoogle = () =>
  apiClient<MessageResponse>('/registration/google/connection', { method: 'DELETE' });

// ─── Form ↔ sheet link ──────────────────────────────────────────────

export const getSheetLink = (formId: string) =>
  apiClient<SheetLinkResponse>(`/registration/forms/${formId}/sheet`);

/** Links a spreadsheet chosen through the Picker. */
export const linkExistingSheet = (formId: string, spreadsheetId: string) =>
  apiClient<LinkResponse>(`/registration/forms/${formId}/sheet`, {
    method: 'PUT',
    body: { spreadsheetId },
  });

/** Creates a spreadsheet in the connected account and links it. */
export const linkNewSheet = (formId: string, title?: string) =>
  apiClient<LinkResponse>(`/registration/forms/${formId}/sheet`, {
    method: 'PUT',
    body: { createNew: true, title },
  });

/** Forgets the link. The spreadsheet itself is left untouched. */
export const unlinkSheet = (formId: string) =>
  apiClient<MessageResponse>(`/registration/forms/${formId}/sheet`, { method: 'DELETE' });

export const syncNow = (formId: string) =>
  apiClient<MessageResponse>(`/registration/forms/${formId}/sheet/sync`, { method: 'POST' });
