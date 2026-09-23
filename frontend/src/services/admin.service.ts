import { api } from './api';
import type { AdminOverview } from './types';

/** ADMIN-only. The backend re-checks the role on every request — this is UX, not security. */
export const adminService = {
  overview: () => api.get<AdminOverview>('/admin/overview'),
};
