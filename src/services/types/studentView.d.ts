// src/services/types/studentView.d.ts

export type TermScope =
  | 'active'
  | 'specific'
  | 'all'
  | 'every_listed'
  | 'any_listed';

export type AggregationMode = 'overall_avg' | 'every_class' | 'any_class';

export interface StudentViewCriteria {
  termScope: TermScope;
  termIds?: string[];
  /** Special marker used only by seeded "Both Terms" view */
  termIdsMode?: 'FIRST_TWO_TERMS';
  thresholdPercent: number;
  aggregationMode: AggregationMode;
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
