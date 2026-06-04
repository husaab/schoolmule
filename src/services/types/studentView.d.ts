// src/services/types/studentView.d.ts

export type TermScope =
  | 'active'
  | 'specific'
  | 'all'
  | 'every_listed'
  | 'any_listed';

export type AggregationMode = 'overall_avg' | 'every_class' | 'any_class';

/**
 * How to combine per-term results when termScope spans multiple terms.
 *  - 'each_term_separately' (default, backward-compat): student must clear
 *    the within-term threshold in each listed term independently.
 *  - 'cumulative_avg': average the student's per-term metric across all
 *    listed terms and compare that single number to the threshold.
 *    "≥ 90% across both terms" semantic — what most schools intuit.
 *
 * Only meaningful when termScope ∈ {every_listed, any_listed, all}. Ignored
 * for active/specific (single term).
 */
export type CrossTermAggregation = 'each_term_separately' | 'cumulative_avg';

export interface StudentViewCriteria {
  termScope: TermScope;
  termIds?: string[];
  /** Special marker used only by seeded "Both Terms" view */
  termIdsMode?: 'FIRST_TWO_TERMS';
  thresholdPercent: number;
  aggregationMode: AggregationMode;
  /** Default 'each_term_separately' if absent. Ignored for single-term scopes. */
  crossTermAggregation?: CrossTermAggregation;
  gradeLevels?: string[];
  subjects?: string[];
  attendanceMinPercent?: number | null;
}

export interface StudentViewPayload {
  viewId: string;
  school: string;
  ownerUserId: string | null;
  name: string;
  description: string;
  isShared: boolean;
  isSystem: boolean;
  criteria: StudentViewCriteria;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentViewRequest {
  name: string;
  description?: string;
  isShared?: boolean;
  /** Admin-only. When true, the view is unowned, school-wide, and undeletable. */
  isSystem?: boolean;
  criteria: StudentViewCriteria;
}

export interface UpdateStudentViewRequest {
  name?: string;
  description?: string;
  isShared?: boolean;
  /** Admin-only. true = promote to system view, false = demote to personal view. */
  isSystem?: boolean;
  criteria?: StudentViewCriteria;
}

export interface EvaluatedStudent {
  studentId: string;
  studentName: string;
  grade: string;
  homeroomTeacherId: string | null;
  perTerm: Record<string, { qualified: boolean; metric: number }>;
  qualified: boolean;
  displayMetric: number;
}

export interface StudentViewListResponse {
  status: 'success' | 'failed';
  data: StudentViewPayload[];
  message?: string;
}

export interface StudentViewResponse {
  status: 'success' | 'failed';
  data: StudentViewPayload;
  message?: string;
}

export interface EvaluateResponse {
  status: 'success' | 'failed';
  data: { view: StudentViewPayload; students: EvaluatedStudent[] };
  message?: string;
}

export interface PreviewResponse {
  status: 'success' | 'failed';
  data: { students: EvaluatedStudent[] };
  message?: string;
}

export interface CertificateEmailRequest {
  studentIds: string[];
  /** Shared subject for the whole batch (optional; per-student default used if blank). */
  customHeader?: string;
  /** Shared message block appended to every email (optional). */
  customMessage?: string;
  ccAddresses?: string[];
}

export interface CertificateEmailResult {
  studentId: string;
  studentName: string;
  status: 'success' | 'failed';
  sentTo?: string[];
  error?: string;
}

export interface CertificateEmailResponse {
  status: 'completed' | 'failed';
  viewId?: string;
  summary?: { total: number; sent: number; failed: number; duration: string };
  results?: CertificateEmailResult[];
  message?: string;
}

export interface SingleCertificateEmailRequest {
  /** Explicit recipients for this one student (e.g. a single parent). */
  emailAddresses: string[];
  customHeader?: string;
  customMessage?: string;
  ccAddresses?: string[];
}

export interface SingleCertificateEmailResponse {
  status: 'success' | 'failed';
  message?: string;
  data?: {
    id?: string;
    sentAt?: string;
    emailId?: string;
    sentTo?: string[];
  };
}
