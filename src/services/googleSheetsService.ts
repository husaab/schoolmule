import apiClient from './apiClient';
import type {
  SheetLinkResponse,
  ConnectionResponse,
  AuthUrlResponse,
  LinkResponse,
  MessageResponse,
  SheetTarget,
  SharesResponse,
  ShareResponse,
  RemoveShareResponse,
  ShareRole,
} from './types/googleSheets';

// ─── Connection (one Google account per school) ─────────────────────

export const getConnectionStatus = () =>
  apiClient<ConnectionResponse>('/registration/google/status');

/**
 * The consent URL to send the browser to.
 *
 * The backend returns it rather than redirecting, so that the request
 * identifying the school is authenticated — a redirect would carry no token.
 * `returnTo` is the app path Google's callback should land on; the backend
 * only honours paths on its allowlist.
 */
export const getAuthUrl = (returnTo?: string) =>
  apiClient<AuthUrlResponse>(
    `/registration/google/auth-url${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
  );

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

// ─── Sharing (Drive permissions on the linked spreadsheet) ──────────

export const listShares = (formId: string) =>
  apiClient<SharesResponse>(`/registration/forms/${formId}/sheet/shares`);

export const addShare = (formId: string, email: string, role: ShareRole) =>
  apiClient<ShareResponse>(`/registration/forms/${formId}/sheet/shares`, { method: 'POST', body: { email, role } });

export const removeShare = (formId: string, permissionId: string) =>
  apiClient<RemoveShareResponse>(`/registration/forms/${formId}/sheet/shares/${permissionId}`, { method: 'DELETE' });

/** A registration form as a target for the shared Google Sheet UI. */
export const formSheetTarget = (formId: string, formTitle: string): SheetTarget => ({
  key: `form:${formId}`,
  getLink: () => getSheetLink(formId),
  linkExisting: (spreadsheetId) => linkExistingSheet(formId, spreadsheetId),
  linkNew: () => linkNewSheet(formId, `${formTitle} — Submissions`),
  unlink: () => unlinkSheet(formId),
  syncNow: () => syncNow(formId),
  listShares: () => listShares(formId),
  addShare: (email, role) => addShare(formId, email, role),
  removeShare: (permissionId) => removeShare(formId, permissionId),
  returnTo: '/admin-panel/forms/submissions',
  copy: {
    connectPitch: 'Keep a spreadsheet up to date with these submissions, instead of exporting a CSV each time.',
    tabNote: 'This form gets its own tab, so several forms can share one spreadsheet without overwriting each other.',
    ownedNote: (state) =>
      `We keep the first ${state.ownedColumns} columns up to date. Anything you add to the right of those is yours — we never read or change it.`,
    pillTitle: 'Keep a Google Sheet up to date with these submissions',
    unlinkConfirm: 'Unlink this sheet? The spreadsheet and everything in it stays exactly as it is — we just stop updating it.',
  },
});
