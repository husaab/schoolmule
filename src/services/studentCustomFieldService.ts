import apiClient from './apiClient';
import type {
  CustomFieldListResponse,
  CustomFieldResponse,
  CustomFieldUsageResponse,
  DeletedCustomFieldListResponse,
  NewCustomField,
} from './types/studentCustomField';

// The school's own student fields. Anyone who edits students can add one;
// renaming, reordering, deleting and restoring are school setup.

const BASE = '/student-custom-fields';

/** The fields in use, in the school's order. */
export const getCustomFields = () => apiClient<CustomFieldListResponse>(BASE);

export const createCustomField = (field: NewCustomField) =>
  apiClient<CustomFieldResponse>(BASE, { method: 'POST', body: field });

/** Rename a field or change a dropdown's choices. A field's type never changes. */
export const updateCustomField = (fieldId: string, change: { label?: string; options?: string[] }) =>
  apiClient<CustomFieldResponse>(`${BASE}/${fieldId}`, { method: 'PATCH', body: change });

/** `order` is every field's id, in the new order. */
export const reorderCustomFields = (order: string[]) =>
  apiClient<CustomFieldListResponse>(`${BASE}/order`, { method: 'PUT', body: { order } });

/** How many students and forms use a field, to say what deleting it would hide. */
export const getCustomFieldUsage = (fieldId: string) =>
  apiClient<CustomFieldUsageResponse>(`${BASE}/${fieldId}/usage`);

/** Hides the field everywhere. Its values stay on the students until it is restored. */
export const deleteCustomField = (fieldId: string) =>
  apiClient<CustomFieldResponse>(`${BASE}/${fieldId}`, { method: 'DELETE' });

export const getDeletedCustomFields = () => apiClient<DeletedCustomFieldListResponse>(`${BASE}/deleted`);

export const restoreCustomField = (fieldId: string) =>
  apiClient<CustomFieldResponse>(`${BASE}/${fieldId}/restore`, { method: 'POST' });
