// Per-school submission status vocabulary.

/** Palette tokens the UI knows how to render. Mirrors ALLOWED_COLORS on the backend. */
export type StatusColor = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'slate';

export interface SubmissionStatusDef {
  statusId: string;
  /** Stored on submissions. Immutable once created. */
  key: string;
  label: string;
  color: StatusColor;
  sortOrder: number;
  /** Ships with the product: label and colour editable, but cannot be deleted. */
  isBuiltin: boolean;
  /** What a freshly received submission gets. Exactly one per school. */
  isDefault: boolean;
}

export interface StatusesResponse {
  status: string;
  data: SubmissionStatusDef[];
}

export interface StatusResponse {
  status: string;
  data: SubmissionStatusDef;
}

export interface StatusUsageResponse {
  status: string;
  data: SubmissionStatusDef & { submissionCount: number };
}

export interface DeleteStatusResponse {
  status: string;
  message: string;
  data: { reassigned: number };
}
