// ─── Enums ──────────────────────────────────────────────────────────

export type FormStatus = 'draft' | 'published' | 'closed';
export type FieldType = 'text' | 'email' | 'phone' | 'date' | 'select' | 'radio' | 'textarea';
export type SubmissionStatus = 'new' | 'reviewed' | 'archived';

// ─── Form ───────────────────────────────────────────────────────────

export interface RegistrationForm {
  formId: string;
  school: string;
  title: string;
  slug: string;
  description: string | null;
  bannerImagePath: string | null;
  status: FormStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  closedAt: string | null;
  newSubmissionsCount: number;
}

export interface FormField {
  fieldId: string;
  fieldType: FieldType;
  label: string;
  placeholder: string | null;
  isRequired: boolean;
  options: string[] | null;
  sortOrder: number;
}

export interface RegistrationFormWithFields extends RegistrationForm {
  fields: FormField[];
}

// ─── Submissions ────────────────────────────────────────────────────

export interface FormSubmission {
  submissionId: string;
  formId: string;
  school: string;
  answers: Record<string, string>;
  submittedAt: string;
  ipAddress: string | null;
  status: SubmissionStatus;
}

export interface SubmissionPagination {
  total: number;
  page: number;
  limit: number;
}

// ─── API Responses ──────────────────────────────────────────────────

export interface FormsListResponse {
  status: string;
  data: RegistrationForm[];
}

export interface FormResponse {
  status: string;
  data: RegistrationFormWithFields;
}

export interface FieldsResponse {
  status: string;
  data: FormField[];
}

export interface SubmissionsListResponse {
  status: string;
  data: FormSubmission[];
  pagination: SubmissionPagination;
}

export interface SubmissionResponse {
  status: string;
  data: FormSubmission;
}

export interface NewCountResponse {
  status: string;
  data: { count: number };
}

// ─── Public Form Response ───────────────────────────────────────────

export interface PublicFormData extends RegistrationFormWithFields {
  bannerImageUrl: string | null;
  schoolName: string;
  schoolSlug: string;
}

export interface PublicFormResponse {
  status: string;
  data: PublicFormData;
}

export interface PublicSubmitResponse {
  status: string;
  message: string;
  data: { submissionId: string };
}

// ─── Request Bodies ─────────────────────────────────────────────────

export interface CreateFormBody {
  title: string;
  description?: string;
}

export interface UpdateFormBody {
  title: string;
  slug?: string;
  description?: string;
}

export interface UpsertFieldsBody {
  fields: Omit<FormField, 'fieldId' | 'sortOrder'>[];
}

export interface SubmissionFilters {
  status?: SubmissionStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  // Sort by a field UUID, or the special string 'submittedAt'
  sortFieldId?: string;
  sortDir?: 'asc' | 'desc';
}
