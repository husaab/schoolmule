// Types for the Google Sheets sync integration.

/** A school connects one Google account; every form in the school uses it. */
export interface GoogleConnection {
  connected: boolean;
  googleEmail: string | null;
  /** 'needs_reconnect' means the grant was revoked and a human must reconnect. */
  status: 'active' | 'needs_reconnect' | null;
  connectedAt: string | null;
}

export interface FormSheetLink {
  linked: boolean;
  spreadsheetId?: string;
  spreadsheetName?: string | null;
  sheetTabId?: number;
  sheetTabName?: string;
  /** How many leading columns belong to us; everything right of it is theirs. */
  ownedColumns?: number;
  lastSyncedAt?: string | null;
  lastError?: string | null;
}

export interface SheetLinkState extends FormSheetLink {
  connection: GoogleConnection;
  /** A sync is queued or running. */
  pendingSync: boolean;
  /** Set when the queued sync gave up; null while it is still retrying. */
  jobError: string | null;
}

export interface SheetLinkResponse { status: string; data: SheetLinkState }
export interface ConnectionResponse { status: string; data: GoogleConnection }
export interface AuthUrlResponse { status: string; data: { url: string } }
export interface LinkResponse { status: string; data: FormSheetLink }
export interface MessageResponse { status: string; message: string }

/** What the Google Picker hands back once a spreadsheet is chosen. */
export interface PickedSpreadsheet {
  spreadsheetId: string;
  name: string;
}

/**
 * What the shared Google Sheet UI (LinkSheetModal, SheetSyncStatus) needs to
 * know about the thing being linked — a registration form's tab or the
 * school's staff-hours spreadsheet. The components never see an endpoint.
 */
export interface SheetTarget {
  /** Stable identity for memoisation and effect deps, e.g. 'form:<id>'. */
  key: string;
  getLink: () => Promise<SheetLinkResponse>;
  /** Link a spreadsheet chosen through the Picker. */
  linkExisting: (spreadsheetId: string) => Promise<LinkResponse>;
  /** Create a spreadsheet in the connected account and link it. */
  linkNew: () => Promise<LinkResponse>;
  unlink: () => Promise<MessageResponse>;
  syncNow: () => Promise<MessageResponse>;
  /** App path the OAuth round-trip returns to (must be on the backend's allowlist). */
  returnTo: string;
  copy: {
    /** Why connect: shown before a Google account is connected. */
    connectPitch: string;
    /** What gets created in the spreadsheet, shown when choosing one. */
    tabNote: string;
    /** Which part of the sheet is ours, shown once linked. */
    ownedNote: (state: SheetLinkState) => string;
    /** Tooltip on the "Link a Sheet" entry point. */
    pillTitle: string;
    /** Confirmation copy when unlinking. */
    unlinkConfirm: string;
  };
}
