import { api } from './api';
import type { WorkflowExecution } from './types';

export const executionService = {
  list: (limit = 50) => api.get<WorkflowExecution[]>(`/executions?limit=${limit}`),
  get: (id: string) => api.get<WorkflowExecution>(`/executions/${id}`),
};
