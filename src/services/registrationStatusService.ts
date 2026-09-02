import apiClient from './apiClient';
import type {
  StatusesResponse,
  StatusResponse,
  StatusUsageResponse,
  DeleteStatusResponse,
  StatusColor,
} from './types/registrationStatus';

/**
 * The school's submission statuses, ordered. Shared by every form, so this is
 * not scoped to a form id.
 */
export const getStatuses = () =>
  apiClient<StatusesResponse>('/registration/statuses');

export const createStatus = (label: string, color: StatusColor) =>
  apiClient<StatusResponse>('/registration/statuses', { method: 'POST', body: { label, color } });

/** Only label and colour are editable — the key is immutable once submissions use it. */
export const updateStatus = (statusId: string, label: string, color: StatusColor) =>
  apiClient<StatusResponse>(`/registration/statuses/${statusId}`, { method: 'PUT', body: { label, color } });

/** How many submissions use this status, so the delete dialog can warn first. */
export const getStatusUsage = (statusId: string) =>
  apiClient<StatusUsageResponse>(`/registration/statuses/${statusId}/usage`);

/**
 * Deletes a custom status. `reassignTo` (a status key) is required when the
 * status is still in use; without it the request is refused with 409.
 */
export const deleteStatus = (statusId: string, reassignTo?: string) =>
  apiClient<DeleteStatusResponse>(`/registration/statuses/${statusId}`, {
    method: 'DELETE',
    body: { reassignTo },
  });

export const reorderStatuses = (statusIds: string[]) =>
  apiClient<StatusesResponse>('/registration/statuses-order', { method: 'PUT', body: { statusIds } });
