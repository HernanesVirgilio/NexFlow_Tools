import { api } from './api';
import type {
  NodeTypeDef,
  ValidationIssue,
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
} from './types';

export interface WorkflowCheckResult {
  ok: boolean;
  issues: ValidationIssue[];
  runnableRef?: string;
}

export interface WorkflowInput {
  name: string;
  description?: string;
  engineRef?: string;
  isActive?: boolean;
  definition?: WorkflowDefinition | null;
}

export const workflowService = {
  list: () => api.get<Workflow[]>('/workflows'),
  get: (id: string) => api.get<Workflow>(`/workflows/${id}`),
  create: (input: WorkflowInput) => api.post<Workflow>('/workflows', input),
  update: (id: string, input: Partial<WorkflowInput>) => api.patch<Workflow>(`/workflows/${id}`, input),
  remove: (id: string) => api.del<void>(`/workflows/${id}`),
  execute: (id: string) => api.post<WorkflowExecution>(`/workflows/${id}/execute`),
  executions: (id: string) => api.get<WorkflowExecution[]>(`/workflows/${id}/executions`),
  nodeTypes: () => api.get<NodeTypeDef[]>('/workflows/node-types'),
  check: (id: string, definition: WorkflowDefinition) =>
    api.post<WorkflowCheckResult>(`/workflows/${id}/check`, { definition }),
};
