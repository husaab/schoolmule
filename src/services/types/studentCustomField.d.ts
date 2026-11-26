// The school's own student fields ("Bus route", "Photo consent") and the
// values a student holds for them. Staff only: nothing here is sent to the
// parent or student portals.

export type CustomFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean';

/** One field in the school's list. */
export interface CustomFieldDefinition {
  fieldId: string;
  label: string;
  type: CustomFieldType;
  /** The choices of a dropdown, in display order; null for every other type. */
  options: string[] | null;
  sortOrder: number;
}

/** A field an admin deleted: hidden everywhere, with its values kept until it is restored. */
export interface DeletedCustomField extends CustomFieldDefinition {
  deletedAt: string;
  deletedByName: string | null;
}

/** What a new field needs. `options` only for a dropdown. */
export interface NewCustomField {
  label: string;
  type: CustomFieldType;
  options?: string[] | null;
}

/** Text, dropdown and date (YYYY-MM-DD) are strings; number and yes/no keep their type. */
export type CustomFieldValue = string | number | boolean;

/** A one-off fact about one student that isn't a field for everyone. */
export interface StudentNote {
  label: string;
  value: string;
}

/** A student's custom data as the API returns it. A field with no value has no key. */
export interface StudentCustomFields {
  values: Record<string, CustomFieldValue>;
  notes: StudentNote[];
}

/**
 * The custom part of a student create/update body. `values` carries only the
 * fields being changed (null clears one); `notes`, when present, replaces the
 * student's notes.
 */
export interface StudentCustomFieldsPatch {
  values?: Record<string, CustomFieldValue | null>;
  notes?: StudentNote[];
}

export interface CustomFieldUsage {
  /** This year's students holding a value for the field. */
  studentCount: number;
  /** Forms whose import saves a question into the field. */
  formCount: number;
}

export interface CustomFieldListResponse {
  status: string;
  data: CustomFieldDefinition[];
}

export interface DeletedCustomFieldListResponse {
  status: string;
  data: DeletedCustomField[];
}

export interface CustomFieldResponse {
  status: string;
  message?: string;
  data: CustomFieldDefinition;
}

export interface CustomFieldUsageResponse {
  status: string;
  data: CustomFieldUsage;
}
