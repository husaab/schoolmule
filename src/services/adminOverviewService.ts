import apiClient from './apiClient';
import type { AdminOverviewResponse } from './types/adminOverview';

// The admin panel's live facts. The backend leaves out every block the caller
// can't open, and scopes year-bound blocks to the X-School-Year header.

/** GET /admin/overview — one cheap read per admin area, each fails on its own */
export const getAdminOverview = () => apiClient<AdminOverviewResponse>('/admin/overview');
