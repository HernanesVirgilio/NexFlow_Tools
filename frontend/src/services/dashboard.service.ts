import { api } from './api';
import type { DashboardSummary } from './types';

export const dashboardService = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary'),
};
