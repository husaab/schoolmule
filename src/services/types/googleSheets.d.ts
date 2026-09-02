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
